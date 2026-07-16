// The "anniversary year" backward-scan algorithm — ENGINE_SPEC.md §3.
// User-confirmed mechanic (verbatim from the confirming answer):
// "you don't have to stay for 12 continuous months without leaving for a
// single day, instead those days of absence are added to the expected
// period (e.g. if you leave for 30 days – we are looking at 395 days
// instead of 365)... if an applicant has been absent for more than 90 days
// the application date should shift to the future until the moment there
// are less than 90 days of absence in the preceding 12 months."

import { subDays, isBefore } from "date-fns";
import type { AnniversaryYearResult } from "./types";
import { toDate, toISO, isPresentOn, type DateInterval } from "./presence";

const PRESENT_DAYS_TARGET = 365;

/**
 * Scans backward day-by-day from (applicationDate - 1) counting present
 * days until 365 are found. Absences encountered during the scan extend
 * the window but must not total more than `toleranceDays` (default 90).
 *
 * `countStartDate` is the earliest day that may ever be counted (ARC date
 * or ARC date + 1, depending on the includeArcDate toggle) — scanning
 * never goes earlier than this.
 */
export function findAnniversaryYear(
  applicationDateISO: string,
  absenceIntervals: DateInterval[],
  countStartDate: Date,
  toleranceDays = 90
): AnniversaryYearResult {
  const applicationDate = toDate(applicationDateISO);
  const windowEnd = subDays(applicationDate, 1);

  let presentDays = 0;
  let absentDays = 0;
  let cursor = windowEnd;

  while (!isBefore(cursor, countStartDate)) {
    if (isPresentOn(cursor, absenceIntervals)) {
      presentDays++;
      if (presentDays === PRESENT_DAYS_TARGET) {
        if (absentDays > toleranceDays) {
          return {
            found: false,
            toleranceExceeded: true,
            windowEnd: toISO(windowEnd),
          };
        }
        return {
          found: true,
          anniversaryStart: toISO(cursor),
          windowEnd: toISO(windowEnd),
          presentDaysInWindow: presentDays,
          absentDaysInWindow: absentDays,
        };
      }
    } else {
      absentDays++;
      if (absentDays > toleranceDays) {
        return {
          found: false,
          toleranceExceeded: true,
          windowEnd: toISO(windowEnd),
        };
      }
    }
    cursor = subDays(cursor, 1);
  }

  // Ran out of countable history before reaching 365 present days.
  return {
    found: false,
    insufficientHistory: true,
    windowEnd: toISO(windowEnd),
  };
}
