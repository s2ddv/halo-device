/**
 * Web Bluetooth wrapper for the BAND wearable.
 * Browser-only: every function must be called from an event handler or effect.
 */

export type BandConnection = {
  id: string;
  name: string;
  heartRate: number | null;
  batteryLevel: number | null;
};

const HEART_RATE_SERVICE = "heart_rate";
const HEART_RATE_MEASUREMENT = "heart_rate_measurement";
const BATTERY_SERVICE = "battery_service";
const BATTERY_LEVEL = "battery_level";

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

function parseHeartRate(view: DataView): number {
  const flags = view.getUint8(0);
  return flags & 0x01 ? view.getUint16(1, true) : view.getUint8(1);
}

export async function connectBand(handlers: {
  onHeartRate?: (bpm: number) => void;
  onBattery?: (level: number) => void;
  onDisconnect?: () => void;
}): Promise<BandConnection> {
  if (!isBluetoothSupported()) {
    throw new Error(
      "Bluetooth não está disponível neste navegador. Use o Chrome no Android ou desktop.",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bluetooth = (navigator as any).bluetooth;

  const device = await bluetooth.requestDevice({
    filters: [{ services: [HEART_RATE_SERVICE] }],
    optionalServices: [BATTERY_SERVICE],
  });

  device.addEventListener("gattserverdisconnected", () => handlers.onDisconnect?.());

  const server = await device.gatt.connect();

  let heartRate: number | null = null;
  try {
    const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
    const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);
    hrChar.addEventListener("characteristicvaluechanged", (event: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (event.target as any).value as DataView;
      const bpm = parseHeartRate(value);
      heartRate = bpm;
      handlers.onHeartRate?.(bpm);
    });
    await hrChar.startNotifications();
  } catch {
    // device without heart-rate notifications
  }

  let batteryLevel: number | null = null;
  try {
    const batteryService = await server.getPrimaryService(BATTERY_SERVICE);
    const batteryChar = await batteryService.getCharacteristic(BATTERY_LEVEL);
    const value = await batteryChar.readValue();
    const level: number = value.getUint8(0);
    batteryLevel = level;
    handlers.onBattery?.(level);
  } catch {
    // battery service unavailable
  }

  return {
    id: device.id ?? "band",
    name: device.name ?? "BAND",
    heartRate,
    batteryLevel,
  };
}
