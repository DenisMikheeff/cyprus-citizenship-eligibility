// Cumulative-years requirement — ENGINE_SPEC.md §2, §4.
//
// IMPORTANT: the legal requirement is "N years of accumulated physical
// presence WITHIN a rolling 10-year window ending at (anniversaryStart - 1
// day)" — i.e. total presence anywhere inside that 10-year window must sum
// to at least N years' worth of days. It is NOT a requirement that presence
// fill a fixed, exact N-year sub-window immediately preceding the window
// end. This matches how the original spreadsheet's forward "milestone"
// method worked (cumulative count of ALL present days since day 1 until the
// 1,096th/1,461st/2,556th day is reached) and produces the same eligibility
// conclusion for Denis's verified case (margin of ~1 day at the real
// application date).

import { addDays, subYears, differenceInCalendarDays, getYear, isAfter, isBefore } from "date-fns";
import type { BcsYearSetting, CumulativeResult, ISODate, Route } from "./types";
import { toDate, toISO, isPresentOn, type DateInterval } from "./presence";

const BCS_CONCESSION_CAP_DAYS = 90;
const ROLLING_WINDOW_YEARS = 10;
const MAX_FORWARD_SCAN_DAYS = 20 * 365; // safety cap (~20 years)

/** Buckets a date into a BCS concession "year" — either a rolling 365-day
 * period counted from `anchorDate` (the applicant's first BCS status date),
 * or (when no anchor is supplied) the plain calendar year, preserved for
 * backward compatibility. */
function getBcsBucket(date: Date, anchorDate?: Date): number {
  if (!anchorDate) return getYear(date);
  return Math.floor(differenceInCalendarDays(date, anchorDate) / 365);
}

/** Exact calendar length of `years` years ending at windowEnd (leap-year accurate). */
export function requiredCumulativeDays(years: number, windowEndISO: string): number {
  const windowEnd = toDate(windowEndISO);
  const windowStartExclusive = subYears(windowEnd, years);
  return differenceInCalendarDays(windowEnd, windowStartExclusive);
}

/**
 * Computes actual accumulated presence within the rolling 10-year window
 * ending at `windowEndISO` (or since `countStartDate` if the applicant's
 * history is shorter than 10 years), applying BCS concession forgiveness
 * (up to 90 absence days per calendar year, only for years flagged as
 * BCS-status + concession-on) when `route` is "fast-track". Compares the
 * total against the `requiredYears`-year day threshold.
 */
export function computeCumulativePresence(
  windowEndISO: string,
  requiredYears: number,
  absenceIntervals: DateInterval[],
  countStartDate: Date,
  bcsYearSettings: BcsYearSetting[],
  route: Route,
  bcsAnchorDate?: Date,
  rollingWindowYears: number = ROLLING_WINDOW_YEARS
): CumulativeResult {
  const windowEnd = toDate(windowEndISO);
  const rollingWindowStartExclusive = subYears(windowEnd, rollingWindowYears);
  const rollingWindowStart = addDays(rollingWindowStartExclusive, 1);
  const effectiveStart = isBefore(rollingWindowStart, countStartDate)
    ? countStartDate
    : rollingWindowStart;

  const concessionByYear = new Map<number, boolean>();
  if (route === "fast-track") {
    for (const setting of bcsYearSettings) {
      concessionByYear.set(setting.year, setting.heldBcsStatus && setting.concessionOn);
    }
  }

  let presentDays = 0;
  const absentByYear = new Map<number, number>();

  if (!isAfter(effectiveStart, windowEnd)) {
    let cursor = effectiveStart;
    while (!isAfter(cursor, windowEnd)) {
      if (isPresentOn(cursor, absenceIntervals)) {
        presentDays++;
      } else {
        const y = getBcsBucket(cursor, bcsAnchorDate);
        absentByYear.set(y, (absentByYear.get(y) ?? 0) + 1);
      }
      cursor = addDays(cursor, 1);
    }
  }

  let forgivenDays = 0;
  absentByYear.forEach((absentCount, year) => {
    if (concessionByYear.get(year)) {
      forgivenDays += Math.min(absentCount, BCS_CONCESSION_CAP_DAYS);
    }
  });

  const actualDays = presentDays + forgivenDays;
  const requiredDays = requiredCumulativeDays(requiredYears, windowEndISO);

  const thresholdReachedDate = findCumulativeThresholdDate(
    requiredDays,
    absenceIntervals,
    effectiveStart,
    bcsYearSettings,
    route,
    bcsAnchorDate
  );

  return {
    requiredDays,
    actualDays,
    windowStart: toISO(effectiveStart),
    windowEnd: windowEndISO,
    met: actualDays >= requiredDays,
    shortfallDays: Math.max(0, requiredDays - actualDays),
    thresholdReachedDate,
  };
}

/**
 * Finds the exact calendar date on which the cumulative day requirement
 * (`requiredYears`-years-worth of days) is first satisfied, scanning forward
 * day-by-day from `countStartDate`. This mirrors the "Trips after N-year
 * threshold reached" table in the original spreadsheet/PDF (ENGINE_SPEC.md
 * S2) and the ground-truth day-by-day verification script (verify3.py) --
 * it is a DIFFERENT date from the anniversary-year window start
 * (AnniversaryYearResult.anniversaryStart), which is computed by scanning
 * BACKWARD from the application date for the final 1-year continuous
 * residence requirement (S3). Do not conflate the two.
 *
 * BCS concession handling (fast-track only, years flagged
 * heldBcsStatus + concessionOn): if a calendar year's TOTAL absence days
 * are <= 90, every day in that year counts toward the cumulative total
 * (forgiven). If a concession year's total absence exceeds 90, only the
 * first min(absentCount, 90) absence days encountered while scanning
 * forward are forgiven (an explicit, documented tie-breaking choice for
 * this edge case -- the underlying law only specifies the 90-day cap, not
 * which specific days are forgiven when the cap binds).
 *
 * Returns null if the requirement is never reached within a ~20-year
 * forward scan (should not happen for any realistic input).
 */
export function findCumulativeThresholdDate(
  requiredDays: number,
  absenceIntervals: DateInterval[],
  countStartDate: Date,
  bcsYearSettings: BcsYearSetting[],
  route: Route,
  bcsAnchorDate?: Date
): ISODate | null {
  const concessionByYear = new Map<number, boolean>();
  if (route === "fast-track") {
    for (const setting of bcsYearSettings) {
      concessionByYear.set(setting.year, setting.heldBcsStatus && setting.concessionOn);
    }
  }

  const horizon = addDays(countStartDate, MAX_FORWARD_SCAN_DAYS);
  const totalAbsentByYear = new Map<number, number>();
  {
    let cursor = countStartDate;
    while (!isAfter(cursor, horizon)) {
      if (!isPresentOn(cursor, absenceIntervals)) {
        const y = getBcsBucket(cursor, bcsAnchorDate);
        totalAbsentByYear.set(y, (totalAbsentByYear.get(y) ?? 0) + 1);
      }
      cursor = addDays(cursor, 1);
    }
  }

  const forgivenUsedByYear = new Map<number, number>();
  let counted = 0;
  let cursor = countStartDate;
  while (!isAfter(cursor, horizon)) {
    const present = isPresentOn(cursor, absenceIntervals);
    if (present) {
      counted++;
    } else {
      const y = getBcsBucket(cursor, bcsAnchorDate);
      const yearHasConcession = concessionByYear.get(y) === true;
      const yearCap = Math.min(totalAbsentByYear.get(y) ?? 0, BCS_CONCESSION_CAP_DAYS);
      const usedSoFar = forgivenUsedByYear.get(y) ?? 0;
      if (yearHasConcession && usedSoFar < yearCap) {
        forgivenUsedByYear.set(y, usedSoFar + 1);
        counted++;
      }
    }
    if (counted >= requiredDays) {
      return toISO(cursor);
    }
    cursor = addDays(cursor, 1);
  }

  return null;
}
