// Nearest-eligible-date search and "could you improve this" suggestions.
// ENGINE_SPEC.md §8.

import { addDays, differenceInCalendarDays } from "date-fns";
import type { EligibilityResult, EngineInput, ImprovementSuggestion } from "./types";
import { evaluateEligibility } from "./eligibility";
import { toDate, toISO } from "./presence";

export interface NearestEligibleDateResult {
  found: boolean;
  date?: string;
  result?: EligibilityResult;
  daysSearched: number;
}

/**
 * Linear day-by-day search starting at `searchFromISO`. Capped at
 * `maxDaysToSearch` (default ~5 years) — a real search UI should show a
 * "no eligible date found in the next N years, please check your data"
 * message if this returns found=false.
 */
export function findNearestEligibleDate(
  input: EngineInput,
  searchFromISO: string,
  maxDaysToSearch = 1825
): NearestEligibleDateResult {
  let cursor = toDate(searchFromISO);
  for (let i = 0; i <= maxDaysToSearch; i++) {
    const candidateISO = toISO(cursor);
    const result = evaluateEligibility({ ...input, applicationDate: candidateISO });
    if (result.eligible) {
      return { found: true, date: candidateISO, result, daysSearched: i };
    }
    cursor = addDays(cursor, 1);
  }
  return { found: false, daysSearched: maxDaysToSearch };
}

/**
 * Checks whether turning ON the ARC-date-inclusion toggle would move the
 * nearest eligible date earlier (or make the currently selected application
 * date eligible when it currently is not).
 */
export function suggestArcDateInclusion(
  input: EngineInput,
  searchFromISO: string,
  maxDaysToSearch = 1825
): ImprovementSuggestion | null {
  if (input.includeArcDate) return null; // already on
  const withoutToggle = findNearestEligibleDate(input, searchFromISO, maxDaysToSearch);
  const withToggle = findNearestEligibleDate(
    { ...input, includeArcDate: true },
    searchFromISO,
    maxDaysToSearch
  );
  if (!withToggle.found) return null;
  if (!withoutToggle.found) {
    return { kind: "include-arc-date", estimatedImprovementDays: maxDaysToSearch };
  }
  const improvementDays = differenceInCalendarDays(
    toDate(withoutToggle.date!),
    toDate(withToggle.date!)
  );
  return improvementDays > 0
    ? { kind: "include-arc-date", estimatedImprovementDays: improvementDays }
    : null;
}

/**
 * Checks whether turning ON the BCS concession for a specific held-BCS year
 * (currently off) would move the nearest eligible date earlier.
 */
export function suggestBcsConcessionForYear(
  input: EngineInput,
  year: number,
  searchFromISO: string,
  maxDaysToSearch = 1825
): ImprovementSuggestion | null {
  if (input.route !== "fast-track") return null;
  const setting = input.bcsYearSettings.find((s) => s.year === year);
  if (!setting || !setting.heldBcsStatus || setting.concessionOn) return null;

  const without = findNearestEligibleDate(input, searchFromISO, maxDaysToSearch);
  const toggledSettings = input.bcsYearSettings.map((s) =>
    s.year === year ? { ...s, concessionOn: true } : s
  );
  const withToggle = findNearestEligibleDate(
    { ...input, bcsYearSettings: toggledSettings },
    searchFromISO,
    maxDaysToSearch
  );
  if (!withToggle.found) return null;
  if (!without.found) {
    return { kind: "bcs-concession", year, estimatedImprovementDays: maxDaysToSearch };
  }
  const improvementDays = differenceInCalendarDays(
    toDate(without.date!),
    toDate(withToggle.date!)
  );
  return improvementDays > 0
    ? { kind: "bcs-concession", year, estimatedImprovementDays: improvementDays }
    : null;
}
