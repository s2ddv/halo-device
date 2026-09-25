import { validDay, validateMeasurement, validateSummary } from "./model";
import type { Measurement, DailySummary } from "./model";

const EVENT = "halo:health-changed";
const DATABASE = "halo-health";
let database: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined")
    return Promise.reject(new Error("Armazenamento local indisponível."));
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    let abandoned = false;
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      const measurements = db.createObjectStore("measurements", { keyPath: "id" });
      measurements.createIndex("day", "day");
      db.createObjectStore("summaries", { keyPath: "day" });
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      abandoned = true;
      reject(new Error("Feche outras abas do HALO para atualizar o armazenamento."));
    };
    request.onsuccess = () => {
      const db = request.result;
      if (abandoned) {
        db.close();
        return;
      }
      db.onversionchange = () => {
        db.close();
        database = undefined;
      };
      resolve(db);
    };
  }).catch((error: unknown) => {
    database = undefined;
    throw error;
  });
  return database;
}
async function put(store: string, value: Measurement | DailySummary): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("Não foi possível salvar os dados."));
    tx.onerror = () => reject(tx.error);
  });
  window.dispatchEvent(new Event(EVENT));
}
export async function saveMeasurement(measurement: Measurement) {
  validateMeasurement(measurement);
  await put("measurements", measurement);
}
export async function saveDailySummary(summary: DailySummary) {
  validateSummary(summary);
  await put("summaries", summary);
}
export type HealthOverview = {
  measurementCount: number;
  observedDays: string[];
  summaries: DailySummary[];
};
/** Read only counts and distinct dates; never load all raw samples for a status card. */
export async function readHealthOverview(): Promise<HealthOverview> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["measurements", "summaries"], "readonly");
    const store = tx.objectStore("measurements");
    const count = store.count();
    const dates = store.index("day").openKeyCursor(null, "nextunique");
    const observedDays: string[] = [];
    dates.onsuccess = () => {
      const cursor = dates.result;
      if (cursor) {
        observedDays.push(String(cursor.key));
        cursor.continue();
      }
    };
    const summaries = tx.objectStore("summaries").getAll();
    tx.oncomplete = () => {
      try {
        if (observedDays.some((day) => !validDay(day)))
          throw new Error("Data inválida no histórico local.");
        summaries.result.forEach(validateSummary);
        resolve({ measurementCount: count.result, observedDays, summaries: summaries.result });
      } catch (error) {
        reject(error);
      }
    };
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}
/** Bounded raw history for future charts and baseline aggregation. */
export async function readMeasurements(start: string, end: string): Promise<Measurement[]> {
  if (!validDay(start) || !validDay(end) || start > end) throw new Error("Período inválido.");
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("measurements", "readonly");
    const request = tx
      .objectStore("measurements")
      .index("day")
      .getAll(IDBKeyRange.bound(start, end));
    tx.oncomplete = () => {
      try {
        request.result.forEach(validateMeasurement);
        resolve(
          (request.result as Measurement[]).sort(
            (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
          ),
        );
      } catch (error) {
        reject(error);
      }
    };
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}
export function subscribeHealth(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("focus", listener);
  };
}
