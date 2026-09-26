import { readFile } from "node:fs/promises";
import { summarizeNrfLog } from "../src/lib/ble/nrf-log.ts";

const path = process.argv[2];
if (!path) {
  console.error("Usage: npm run ble:inspect -- /path/to/nrf-log.txt");
  process.exitCode = 1;
} else {
  try {
    const summary = summarizeNrfLog(await readFile(path, "utf8"));
    console.log(JSON.stringify(summary, null, 2));
    if (summary.notifications === 0) {
      console.error("No recognizable notification records found; verify the export format.");
      process.exitCode = 2;
    }
  } catch {
    console.error("Unable to read the supplied log file.");
    process.exitCode = 1;
  }
}
