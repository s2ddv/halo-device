import { HALO_CHANNELS, inspectPrimaryFrame } from "./halo-protocol.ts";

export type LogNotification = { time: string; characteristic: string; bytes: Uint8Array };
/** Parse only the canonical notification line, not its duplicate rendered value. */
export function parseNrfNotifications(log: string): LogNotification[] {
  const pattern =
    /^I\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+Notification received from ([a-f\d-]{36}), value: \(0x\) ([a-f\d]{2}(?:-[a-f\d]{2})*)\s*$/gim;
  return [...log.matchAll(pattern)].map((match) => ({
    time: match[1]!,
    characteristic: match[2]!.toLowerCase(),
    bytes: Uint8Array.from(match[3]!.split("-").map((byte) => Number.parseInt(byte, 16))),
  }));
}

/** Aggregate only; excludes addresses, raw values and timestamps from output. */
export function summarizeNrfLog(log: string) {
  const notifications = parseNrfNotifications(log);
  const channels = new Map<
    string,
    {
      count: number;
      lengths: Record<number, number>;
      validPrimaryFrames: number;
      invalidPrimaryFrames: number;
      types: Record<string, number>;
    }
  >();
  for (const notification of notifications) {
    const summary = channels.get(notification.characteristic) ?? {
      count: 0,
      lengths: {},
      validPrimaryFrames: 0,
      invalidPrimaryFrames: 0,
      types: {},
    };
    summary.count++;
    summary.lengths[notification.bytes.length] =
      (summary.lengths[notification.bytes.length] ?? 0) + 1;
    if (notification.characteristic === HALO_CHANNELS.primary.notify) {
      const frame = inspectPrimaryFrame(notification.bytes);
      if (frame.valid) {
        summary.validPrimaryFrames++;
        const type = frame.type.toString(16).padStart(2, "0");
        summary.types[type] = (summary.types[type] ?? 0) + 1;
      } else summary.invalidPrimaryFrames++;
    }
    channels.set(notification.characteristic, summary);
  }
  return { notifications: notifications.length, channels: Object.fromEntries(channels) };
}
