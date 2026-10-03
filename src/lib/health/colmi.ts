import type { HistorySample } from "../ble/colmi-history.ts";
import type { LiveReading } from "../ble/halo-protocol.ts";
import { UNITS, validateMeasurement, type Measurement } from "./model.ts";

/** Stable IDs let repeated imports update the same device/metric/time slot. */
export function colmiMeasurements(
  deviceId: string,
  samples: HistorySample[],
  receivedAt = new Date(),
): Measurement[] {
  return samples.map((sample) => {
    const measurement: Measurement = {
      id: JSON.stringify(["colmi", deviceId, sample.metric, sample.recordedAt]),
      ...sample,
      unit: UNITS[sample.metric],
      receivedAt: receivedAt.toISOString(),
      day: sample.recordedAt.slice(0, 10),
      timeZone: "UTC",
      source: "ble",
      deviceId,
    };
    validateMeasurement(measurement);
    return measurement;
  });
}
export function colmiLiveMeasurement(
  deviceId: string,
  reading: LiveReading,
  now = new Date(),
): Measurement {
  const recordedAt = now.toISOString();
  const measurement: Measurement = {
    id: JSON.stringify(["colmi-live", deviceId, reading.metric, recordedAt]),
    ...reading,
    unit: UNITS[reading.metric],
    recordedAt,
    receivedAt: recordedAt,
    day: recordedAt.slice(0, 10),
    timeZone: "UTC",
    source: "ble",
    deviceId,
  };
  validateMeasurement(measurement);
  return measurement;
}
