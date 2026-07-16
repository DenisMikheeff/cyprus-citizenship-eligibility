// Presence-day primitives: turns a travel-event log into absence intervals
// and answers "was the person present on date X" queries.
// See ENGINE_SPEC.md §1.

import { addDays, subDays, isAfter, isBefore, parseISO, formatISO } from "date-fns";
import type { TravelEvent, ISODate } from "./types";

export interface DateInterval {
  start: Date; // first ABSENT day (inclusive)
  end: Date; // last ABSENT day (inclusive)
}

export function toDate(iso: ISODate): Date {
  return parseISO(iso);
}

export function toISO(d: Date): ISODate {
  return formatISO(d, { representation: "date" });
}

/**
 * Builds absence intervals from a travel-event log.
 *
 * Convention (verified against Denis's own confirmed annual totals via
 * day-by-day simulation): the DEPARTURE day itself is EXCLUDED from
 * presence (counted absent — the day you leave), while the ARRIVAL day is
 * INCLUDED (counted present — the day you return). This mirrors the ARC
 * day convention (ARC day itself excluded, day after is the first countable
 * present day).
 *
 * `boundaryDate` closes any trailing unmatched departure (currently abroad)
 * at that date — i.e. the person is treated as absent through boundaryDate
 * if they have not logged a return by then.
 */
export function buildAbsenceIntervals(
  events: TravelEvent[],
  boundaryDate: Date
): DateInterval[] {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const intervals: DateInterval[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].type !== "departure") continue;
    const departure = toDate(sorted[i].date);
    const next = sorted[i + 1];

    let arrival: Date | null = null;
    if (next && next.type === "arrival") {
      arrival = toDate(next.date);
      i++; // consume the paired arrival
    }

    const start = departure; // departure day itself is absent
    const end = arrival ? subDays(arrival, 1) : boundaryDate; // arrival day itself is present

    if (!isAfter(start, end)) {
      intervals.push({ start, end });
    }
  }

  return intervals;
}

/** True if `date` falls inside any absence interval (i.e. person was abroad). */
export function isAbsentOn(date: Date, absenceIntervals: DateInterval[]): boolean {
  return absenceIntervals.some(
    (iv) => !isBefore(date, iv.start) && !isAfter(date, iv.end)
  );
}

export function isPresentOn(date: Date, absenceIntervals: DateInterval[]): boolean {
  return !isAbsentOn(date, absenceIntervals);
}
