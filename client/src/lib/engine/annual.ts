// Per-calendar-year presence breakdown, for the "Annual summary of days
// present in Cyprus" table in the exported record (mirrors the original
// build_pdfs.py / spreadsheet section 2). This is a pure reporting helper —
// it does NOT feed into any eligibility calculation. It reports the actual,
// unadjusted physical-presence day count per year (no BCS forgiveness
// applied), matching how Denis's own verified annual totals (189/362/359/
// 354/198, see ENGINE_SPEC.md §1) were derived by verify3.py.

import { addDays, getYear, isAfter } from "date-fns";
import type { ISODate } from "./types";
import { isPresentOn, toISO, type DateInterval } from "./presence";

export interface AnnualBreakdownRow {
  year: number;
  presentDays: number;
}

export interface AnnualBreakdownResult {
  rows: AnnualBreakdownRow[];
  totalDays: number;
  startDate: ISODate;
  endDate: ISODate;
}

/**
 * Counts present days per calendar year from `countStartDate` (inclusive)
 * through `endDate` (inclusive) — the same range used for the cumulative
 * requirement's `countStartDate` and the exported record's last logged
 * period (application date - 1 day).
 */
export function computeAnnualBreakdown(
  absenceIntervals: DateInterval[],
  countStartDate: Date,
  endDate: Date
): AnnualBreakdownResult {
  const byYear = new Map<number, number>();
  let total = 0;

  if (!isAfter(countStartDate, endDate)) {
    let cursor = countStartDate;
    while (!isAfter(cursor, endDate)) {
      if (isPresentOn(cursor, absenceIntervals)) {
        const y = getYear(cursor);
        byYear.set(y, (byYear.get(y) ?? 0) + 1);
        total++;
      }
      cursor = addDays(cursor, 1);
    }
  }

  const rows = Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, presentDays]) => ({ year, presentDays }));

  return {
    rows,
    totalDays: total,
    startDate: toISO(countStartDate),
    endDate: toISO(endDate),
  };
}
