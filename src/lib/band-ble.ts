import { parseHeartRate } from "./health/heart-rate";
import { localDay } from "./health/model";
import { saveMeasurement } from "./health/storage";

/**
 * Web Bluetooth wrapper for the BAND wearable.
 * Browser-only: every function must be called from an event handler or effect.
 */

export type BandConnection = {
  id: string;
  name: string;
  heartRate: number | null;
  batteryLevel: number | null;
  disconnect: () => void;
};

const HEART_RATE_SERVICE = "heart_rate";
const HEART_RATE_MEASUREMENT = "heart_rate_measurement";
const BATTERY_SERVICE = "battery_service";
const BATTERY_LEVEL = "battery_level";

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export async function connectBand(handlers: {
  onHeartRate?: (bpm: number) => void;
  onBattery?: (level: number) => void;
  onDisconnect?: () => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}): Promise<BandConnection> {
  if (!isBluetoothSupported()) {
    throw new Error(
      "Bluetooth não está disponível neste navegador. Use o Chrome no Android ou desktop.",
    );
  }

  handlers.signal?.throwIfAborted();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bluetooth = (navigator as any).bluetooth;

  const device = await bluetooth.requestDevice({
    filters: [{ services: [HEART_RATE_SERVICE] }],
    optionalServices: [BATTERY_SERVICE],
  });

  handlers.signal?.throwIfAborted();
  let removeNotificationListener = () => {};
  const disconnected = () => {
    removeNotificationListener();
    device.removeEventListener("gattserverdisconnected", disconnected);
    handlers.signal?.removeEventListener("abort", disconnect);
    handlers.onDisconnect?.();
  };
  device.addEventListener("gattserverdisconnected", disconnected);
  const disconnect = () => {
    removeNotificationListener();
    device.removeEventListener("gattserverdisconnected", disconnected);
    handlers.signal?.removeEventListener("abort", disconnect);
    device.gatt?.disconnect();
  };

  handlers.signal?.addEventListener("abort", disconnect, { once: true });
  let heartRate: number | null = null;
  let batteryLevel: number | null = null;
  try {
    const server = await device.gatt.connect();
    handlers.signal?.throwIfAborted();
    const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
    const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);
    const receive = (event: Event) => {
      if (handlers.signal?.aborted) return;
      try {
        const value = (event.target as EventTarget & { value: DataView }).value;
        const bpm = parseHeartRate(value);
        heartRate = bpm;
        handlers.onHeartRate?.(bpm);
        const now = new Date();
        void saveMeasurement({
          id: crypto.randomUUID(),
          metric: "heartRate",
          value: bpm,
          unit: "bpm",
          recordedAt: now.toISOString(),
          receivedAt: now.toISOString(),
          day: localDay(now),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: "ble",
          deviceId: device.id,
        }).catch(() =>
          handlers.onError?.("Leitura recebida, mas não foi possível salvá-la neste navegador."),
        );
      } catch (error) {
        handlers.onError?.(error instanceof Error ? error.message : "Leitura inválida.");
      }
    };
    handlers.signal?.throwIfAborted();
    hrChar.addEventListener("characteristicvaluechanged", receive);
    removeNotificationListener = () =>
      hrChar.removeEventListener("characteristicvaluechanged", receive);
    await hrChar.startNotifications();

    try {
      const batteryService = await server.getPrimaryService(BATTERY_SERVICE);
      const batteryChar = await batteryService.getCharacteristic(BATTERY_LEVEL);
      const value = await batteryChar.readValue();
      const level: number = value.getUint8(0);
      if (level <= 100) {
        batteryLevel = level;
        handlers.onBattery?.(level);
      }
    } catch {
      // Battery is optional; HR notifications are required for this experiment.
    }
    handlers.signal?.throwIfAborted();
    if (!device.gatt.connected) throw new Error("A pulseira desconectou durante a conexão.");
    return { id: device.id, name: device.name ?? "BAND", heartRate, batteryLevel, disconnect };
  } catch (error) {
    disconnect();
    throw error;
  }
}
