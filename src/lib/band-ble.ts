import {
  heartRateParser,
  heartRateRequest,
  stepsParser,
  stepsRequest,
  type HistorySample,
} from "./ble/colmi-history.ts";
import {
  HALO_CHANNELS,
  makePrimaryCommand,
  parseColmiBattery,
  parseColmiLive,
  LIVE_METRIC_IDS,
  type LiveMetric,
  type LiveReading,
} from "./ble/halo-protocol.ts";

export type BatteryInfo = { level: number; charging: boolean };
export type BandConnection = {
  id: string;
  name: string;
  readBattery: () => Promise<BatteryInfo>;
  measure: (metric: LiveMetric) => Promise<LiveReading>;
  readHistory: (day: string) => Promise<HistorySample[]>;
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
    throw new Error(
      "Este navegador não suporta Web Bluetooth (por exemplo, Safari no iOS). Abra no Chrome para Android usando HTTPS.",
    );
  }
  handlers.signal?.throwIfAborted();
  const bluetooth = (navigator as unknown as { bluetooth: Bluetooth }).bluetooth;
  const channel = HALO_CHANNELS.primary;
  const device = await bluetooth.requestDevice({
    filters: [
      { services: [channel.service] },
      ...["Y25", "R02", "R06", "R10"].map((namePrefix) => ({ namePrefix })),
    ],
    optionalServices: [channel.service],
  });
  handlers.signal?.throwIfAborted();
  let closed = false;
  let notify: Characteristic | undefined;
  let pending: { receive: (bytes: Uint8Array) => void; reject: (error: Error) => void } | null =
    null;
  let busy = false;
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
    pending.receive(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
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
    // Serialize GATT writes and bound a stalled browser write before any next command.
    const send = async (packet: Uint8Array) => {
      ensureActive();
      let writeTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          write.writeValueWithoutResponse(packet),
          new Promise<never>((_, reject) => {
            writeTimer = setTimeout(() => {
              disconnect();
              handlers.onDisconnect?.();
              reject(new Error("A escrita Bluetooth não terminou. Reconecte a pulseira."));
            }, 5_000);
          }),
        ]);
      } finally {
        clearTimeout(writeTimer);
      }
    };
    const request = async <T>(
      packet: Uint8Array,
      parse: (bytes: Uint8Array) => T | null,
      timeout: number,
    ): Promise<T> => {
      const response = new Promise<T>((resolve, reject) => {
        pending = {
          reject,
          receive(bytes) {
            try {
              const result = parse(bytes);
              if (result === null) return;
              finishRequest();
              resolve(result);
            } catch (error) {
              finishRequest();
              reject(error instanceof Error ? error : new Error("Resposta inválida."));
            }
          },
        };
        timer = setTimeout(() => {
          finishRequest();
          reject(new Error(`Sem resposta após ${timeout / 1000} segundos. Tente novamente.`));
        }, timeout);
      });
      // Both promises have rejection handlers immediately, including synchronous replies.
      try {
        const [result, sent] = await Promise.allSettled([
          response,
          send(packet).catch((error: unknown) => {
            pending?.reject(
              error instanceof Error ? error : new Error("Falha na escrita Bluetooth."),
            );
            throw error;
          }),
        ]);
        if (sent.status === "rejected") throw sent.reason;
        if (result.status === "rejected") throw result.reason;
        return result.value;
      } finally {
        finishRequest();
      }
    };
    const exclusive = async <T>(operation: () => Promise<T>) => {
      ensureActive();
      if (busy) throw new Error("Uma consulta já está em andamento.");
      busy = true;
      try {
        return await operation();
      } finally {
        busy = false;
      }
    };
    return {
      id: device.id,
      name: device.name ?? "HALO BAND",
      disconnect,
      readHistory: (day) =>
        exclusive(async () => {
          const now = new Date();
          const stepsPacket = stepsRequest(day, now);
          try {
            const heartRates = await request(
              heartRateRequest(day),
              heartRateParser(day, now),
              15_000,
            );
            const steps = await request(stepsPacket, stepsParser(day, now), 15_000);
            return [...heartRates, ...steps];
          } catch (error) {
            if (!closed) {
              disconnect();
              handlers.onDisconnect?.();
            }
            throw error;
          }
        }),
      readBattery: () =>
        exclusive(() => request(makePrimaryCommand(0x03), parseColmiBattery, 10_000)),
      measure: (metric) =>
        exclusive(async () => {
          const kind = LIVE_METRIC_IDS[metric];
          const outcome = await request(
            makePrimaryCommand(0x69, new Uint8Array([kind, 1])),
            (bytes) => parseColmiLive(bytes, metric),
            45_000,
          ).then(
            (value) => ({ ok: true as const, value }),
            (error: unknown) => ({ ok: false as const, error }),
          );
          // Stop after a sample, sensor error or timeout; a lost link cannot accept writes.
          if (!closed && device.gatt.connected) {
            try {
              await send(makePrimaryCommand(0x6a, new Uint8Array([kind, 0, 0])));
            } catch (error) {
              if (!closed) {
                disconnect();
                handlers.onDisconnect?.();
              }
              throw error;
            }
          }
          if (!outcome.ok) throw outcome.error;
          ensureActive();
          return outcome.value;
        }),
    };
  } catch (error) {
    disconnect();
    throw error;
  }
}
