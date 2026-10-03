import { useState } from "react";
import type { Period } from "./detail";
export function useDetailPeriod() {
  // Stable fixture date avoids server/client timezone differences for demo data.
  const [day, setDay] = useState("2026-10-01");
  const [period, setPeriod] = useState<Period>("day");
  return { day, setDay, period, setPeriod };
}
