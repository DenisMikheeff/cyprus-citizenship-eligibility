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
import type { BcsYearSetting, CumulativeResult, Route } from "./types";
import { toDate, toISO, isPresentOn, type DateInterval } from "./presence";

const BCS_CONCESSION_CAP_DAYS = 90;
const ROLLING_WINDOW_YEARS = 10;

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
        const y = getYear(cursor);
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

  return {
    requiredDays,
    actualDays,
    windowStart: toISO(effectiveStart),
    windowEnd: windowEndISO,
    met: actualDays >= requiredDays,
    shortfallDays: Math.max(0, requiredDays - actualDays),
  };
}
