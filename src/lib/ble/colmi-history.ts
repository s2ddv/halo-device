/** Adapted from tahnok/colmi_r02_client (MIT), see public/licenses/colmi-r02-client.txt. */
import { inspectPrimaryFrame, makePrimaryCommand } from "./halo-protocol.ts";
import { validDay } from "../health/model.ts";

export type HistorySample = { metric: "heartRate" | "steps"; value: number; recordedAt: string };
export function historyDay(day: string): number {
  if (!validDay(day)) throw new Error("Data inválida.");
  return Date.parse(`${day}T00:00:00Z`);
}
export function heartRateRequest(day: string): Uint8Array {
  const seconds = historyDay(day) / 1000;
  if (seconds < 0 || seconds > 0xffffffff) throw new Error("Data fora do protocolo.");
  const payload = new Uint8Array(4);
  new DataView(payload.buffer).setUint32(0, seconds, true);
  return makePrimaryCommand(0x15, payload);
}
export function stepsRequest(day: string, now = new Date()): Uint8Array {
  const offset = (historyDay(now.toISOString().slice(0, 10)) - historyDay(day)) / 86400000;
  if (offset < 0 || offset > 6) throw new Error("Escolha um dos últimos sete dias (UTC).");
  return makePrimaryCommand(0x43, new Uint8Array([offset, 15, 0, 95, 1]));
}
function frame(bytes: Uint8Array, command: number): boolean {
  const result = inspectPrimaryFrame(bytes);
  if (!result.valid) return false;
  if (result.type === (command | 0x80)) throw new Error("Consulta rejeitada pelo dispositivo.");
  return result.type === command;
}

/** A parser belongs to one request. Missing/reordered packets never become stored data. */
export function heartRateParser(day: string, now = new Date()) {
  const start = historyDay(day);
  let count = 0;
  let next = 0;
  let values: number[] = [];
  return (bytes: Uint8Array): HistorySample[] | null => {
    if (!frame(bytes, 0x15)) return null;
    const subtype = bytes[1]!;
    if (subtype === 255) return [];
    if (subtype === 0) {
      if (next !== 0 || bytes[2]! < 3 || bytes[2]! > 24 || bytes[3] !== 5)
        throw new Error("Formato de histórico cardíaco não suportado.");
      count = bytes[2]!;
      next = 1;
      return null;
    }
    if (!count || subtype !== next)
      throw new Error("Histórico cardíaco incompleto ou fora de ordem.");
    if (subtype === 1) {
      const timestamp =
        new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(2, true) * 1000;
      if (new Date(timestamp).toISOString().slice(0, 10) !== day)
        throw new Error("A data recebida não corresponde à consulta.");
      values = [...bytes.slice(6, 15)];
    } else {
      values.push(...bytes.slice(2, 15));
    }
    next++;
    if (subtype !== count - 1) return null;
    return values.slice(0, 288).flatMap((value, index) => {
      const time = start + index * 300000;
      return value > 0 && time < now.getTime() - (now.getTime() % 300000)
        ? [{ metric: "heartRate" as const, value, recordedAt: new Date(time).toISOString() }]
        : [];
    });
  };
}
function bcd(value: number): number {
  if ((value & 15) > 9 || value >> 4 > 9) throw new Error("Data BCD inválida.");
  return (value >> 4) * 10 + (value & 15);
}
export function stepsParser(day: string, now = new Date()) {
  historyDay(day);
  let count: number | undefined;
  const samples: HistorySample[] = [];
  const slots = new Set<number>();
  return (bytes: Uint8Array): HistorySample[] | null => {
    if (!frame(bytes, 0x43)) return null;
    if (bytes[1] === 255 && samples.length === 0) return [];
    if (bytes[1] === 240) {
      if (count !== undefined || !bytes[2] || bytes[2] > 96)
        throw new Error("Cabeçalho de passos inválido.");
      count = bytes[2];
      return null;
    }
    const date = `${2000 + bcd(bytes[1]!)}-${String(bcd(bytes[2]!)).padStart(2, "0")}-${String(bcd(bytes[3]!)).padStart(2, "0")}`;
    const slot = bytes[4]!;
    count ??= bytes[6]!;
    if (
      date !== day ||
      !count ||
      count > 96 ||
      bytes[6] !== count ||
      bytes[5] !== samples.length ||
      slot > 95 ||
      slots.has(slot)
    )
      throw new Error("Histórico de passos inválido, incompleto ou fora de ordem.");
    slots.add(slot);
    const time = historyDay(day) + slot * 900000;
    if (time > now.getTime())
      throw new Error("Histórico com horário futuro; confira o relógio da pulseira.");
    samples.push({
      metric: "steps",
      value: bytes[9]! | (bytes[10]! << 8),
      recordedAt: new Date(time).toISOString(),
    });
    return samples.length === count ? samples : null;
  };
}
