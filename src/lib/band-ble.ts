import { HALO_CHANNELS, makePrimaryCommand, parseColmiBattery } from "./ble/halo-protocol.ts";

export type BatteryInfo = { level: number; charging: boolean };
export type BandConnection = {
  id: string;
  name: string;
  readBattery: () => Promise<BatteryInfo>;
  disconnect: () => void;
};

// Minimal structural types keep the browser adapter independent of a BLE library.
interface Characteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<unknown>;
  writeValueWithoutResponse(value: Uint8Array): Promise<void>;
}
interface BandDevice extends EventTarget {
  id: string;
  name?: string;
  gatt: {
    connected: boolean;
    connect(): Promise<{
      getPrimaryService(uuid: string): Promise<{
        getCharacteristic(uuid: string): Promise<Characteristic>;
      }>;
    }>;
    disconnect(): void;
  };
}
interface Bluetooth {
  requestDevice(options: {
    filters: ({ services: string[] } | { namePrefix: string })[];
    optionalServices: string[];
  }): Promise<BandDevice>;
}

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export async function connectBand(handlers: {
  onDisconnect?: () => void;
  signal?: AbortSignal;
}): Promise<BandConnection> {
  if (!isBluetoothSupported()) {
    throw new Error("Bluetooth indisponível. Abra no Chrome para Android usando HTTPS.");
  }
  handlers.signal?.throwIfAborted();
  const bluetooth = (navigator as unknown as { bluetooth: Bluetooth }).bluetooth;
  const channel = HALO_CHANNELS.primary;
  const device = await bluetooth.requestDevice({
    filters: [{ services: [channel.service] }, { namePrefix: "Y25" }],
    optionalServices: [channel.service],
  });
  handlers.signal?.throwIfAborted();
  let closed = false;
  let notify: Characteristic | undefined;
  let pending: { resolve: (battery: BatteryInfo) => void; reject: (error: Error) => void } | null =
    null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finishRequest = () => {
    clearTimeout(timer);
    pending = null;
  };
  const cleanup = () => {
    closed = true;
    notify?.removeEventListener("characteristicvaluechanged", receive);
    device.removeEventListener("gattserverdisconnected", disconnected);
    handlers.signal?.removeEventListener("abort", disconnect);
    pending?.reject(new Error("A pulseira desconectou durante a consulta."));
    finishRequest();
  };
  const disconnected = () => {
    cleanup();
    handlers.onDisconnect?.();
  };
  const disconnect = () => {
    cleanup();
    device.gatt.disconnect();
  };
  const ensureActive = () => {
    handlers.signal?.throwIfAborted();
    if (closed || !device.gatt.connected) throw new Error("A pulseira está desconectada.");
  };
  const receive = () => {
    if (closed || !pending || !notify?.value) return;
    const value = notify.value;
    const battery = parseColmiBattery(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    );
    if (!battery) return;
    pending.resolve(battery);
    finishRequest();
  };
  device.addEventListener("gattserverdisconnected", disconnected);
  handlers.signal?.addEventListener("abort", disconnect, { once: true });
  try {
    const server = await device.gatt.connect();
    ensureActive();
    const service = await server.getPrimaryService(channel.service);
    ensureActive();
    const write = await service.getCharacteristic(channel.write);
    ensureActive();
    notify = await service.getCharacteristic(channel.notify);
    ensureActive();
    notify.addEventListener("characteristicvaluechanged", receive);
    await notify.startNotifications();
    ensureActive();
    return {
      id: device.id,
      name: device.name ?? "HALO BAND",
      disconnect,
      readBattery() {
        ensureActive();
        if (pending) return Promise.reject(new Error("Uma consulta já está em andamento."));
        return new Promise<BatteryInfo>((resolve, reject) => {
          const request = { resolve, reject };
          pending = request;
          timer = setTimeout(() => {
            if (pending !== request) return;
            finishRequest();
            reject(new Error("Sem resposta de bateria após 10 segundos. Tente novamente."));
          }, 10_000);
          // Install the response handler before writing: notifications may arrive immediately.
          void write.writeValueWithoutResponse(makePrimaryCommand(0x03)).catch((error: unknown) => {
            if (pending !== request) return;
            finishRequest();
            reject(error instanceof Error ? error : new Error("Falha ao consultar bateria."));
          });
        });
      },
    };
  } catch (error) {
    disconnect();
    throw error;
  }
}
