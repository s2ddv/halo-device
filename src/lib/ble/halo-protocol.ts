/** UUIDs observed in the owner's GATT discovery, not a claim of metric support. */
export const HALO_CHANNELS = {
  primary: {
    service: "6e40fff0-b5a3-f393-e0a9-e50e24dcca9e",
    write: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
    notify: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
  },
  secondary: {
    service: "de5bf728-d711-4e47-af26-65e3012a5dc7",
    write: "de5bf72a-d711-4e47-af26-65e3012a5dc7",
    notify: "de5bf729-d711-4e47-af26-65e3012a5dc7",
  },
} as const;

export type FrameInspection =
  | { valid: true; type: number; payload: Uint8Array }
  | { valid: false; reason: "length" | "checksum" };

/**
 * Observed primary-channel envelope: 16 bytes, last byte = sum(first 15) mod 256.
 * Validates framing only. Type and payload have no established health semantics.
 * Must not be applied to the secondary channel or to standard HR measurements.
 */
export function inspectPrimaryFrame(bytes: Uint8Array): FrameInspection {
  if (bytes.length !== 16) return { valid: false, reason: "length" };
  const checksum = bytes.subarray(0, 15).reduce((sum, byte) => sum + byte, 0) & 0xff;
  if (checksum !== bytes[15]) return { valid: false, reason: "checksum" };
  return { valid: true, type: bytes[0]!, payload: bytes.slice(1, 15) };
}

/** Colmi/QRing command envelope; compatibility with RS25 is assumed, not verified. */
export function makePrimaryCommand(command: number, payload = new Uint8Array()): Uint8Array {
  if (!Number.isInteger(command) || command < 0 || command > 255 || payload.length > 14) {
    throw new RangeError("Invalid primary command or payload length.");
  }
  const packet = new Uint8Array(16);
  packet[0] = command;
  packet.set(payload, 1);
  packet[15] = packet.subarray(0, 15).reduce((sum, byte) => sum + byte, 0) & 255;
  return packet;
}

/** Battery semantics from colmi_r02_client/battery.py; unrelated packets stay opaque. */
export function parseColmiBattery(bytes: Uint8Array): { level: number; charging: boolean } | null {
  const frame = inspectPrimaryFrame(bytes);
  if (!frame.valid || frame.type !== 0x03 || frame.payload[0]! > 100) return null;
  return { level: frame.payload[0]!, charging: frame.payload[1] !== 0 };
}
