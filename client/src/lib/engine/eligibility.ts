// Top-level orchestration — ties presence, anniversary-year, cumulative and
// route-requirement logic together into a single eligibility verdict.
// ENGINE_SPEC.md §2, §3, §6.

import { addDays, differenceInCalendarDays, isAfter, isBefore, subYears } from "date-fns";
import type { EligibilityResult, EngineInput } from "./types";
import { buildAbsenceIntervals, isPresentOn, toDate, toISO } from "./presence";
import { findAnniversaryYear } from "./anniversary";
import { computeCumulativePresence, requiredCumulativeDays } from "./cumulative";
import { getRouteRequirement } from "./routes";

export function getCountStartDate(arcDateISO: string, includeArcDate: boolean): Date {
  const arcDate = toDate(arcDateISO);
  return includeArcDate ? arcDate : addDays(arcDate, 1);
}

export function evaluateEligibility(input: EngineInput): EligibilityResult {
  const countStartDate = getCountStartDate(input.arcDate, input.includeArcDate);
  const boundary = toDate(input.applicationDate);
  const absenceIntervals = buildAbsenceIntervals(input.events, boundary);
  const requirement = getRouteRequirement(input.route, input.greekLevel);
  const reasons: string[] = [];

  if (input.route === "marriage") {
    if (!input.marriageDate) {
      return {
        route: input.route,
        applicationDate: input.applicationDate,
        eligible: false,
        reasons: ["marriage-date-missing"],
      };
    }
    const marriageDate = toDate(input.marriageDate);
    const appDate = toDate(input.applicationDate);
    const yearsMarried = differenceInCalendarDays(appDate, marriageDate) / 365.25;
    const yearsMarriedMet = yearsMarried >= (requirement.marriageYearsRequired ?? 3);

    const windowStart = isBefore(marriageDate, countStartDate) ? countStartDate : marriageDate;
    const windowEndDate = addDays(appDate, -1);
    let cumulativeResidenceDays = 0;
    if (!isAfter(windowStart, windowEndDate)) {
      let cursor = windowStart;
      while (!isAfter(cursor, windowEndDate)) {
        if (isPresentOn(cursor, absenceIntervals)) cumulativeResidenceDays++;
        cursor = addDays(cursor, 1);
      }
    }
    const requiredResidenceDays = requiredCumulativeDays(
      requirement.marriageCumulativeResidenceYears ?? 2,
      toISO(windowEndDate)
    );
    const residenceMet = cumulativeResidenceDays >= requiredResidenceDays;

    const eligible = yearsMarriedMet && residenceMet;
    if (!yearsMarriedMet) reasons.push("marriage-years-not-met");
    if (!residenceMet) reasons.push("marriage-residence-not-met");
    if (eligible) reasons.push("eligible");
    reasons.push("marriage-final-period-unconfirmed"); // always surfaced, see ENGINE_SPEC.md §6

    return {
      route: input.route,
      applicationDate: input.applicationDate,
      eligible,
      marriage: {
        yearsMarried,
        yearsMarriedMet,
        cumulativeResidenceDays,
        requiredResidenceDays,
        residenceMet,
      },
      reasons,
    };
  }

  // fast-track / standard
  if (!input.greekLevel) {
    return {
      route: input.route,
      applicationDate: input.applicationDate,
      eligible: false,
      reasons: ["greek-level-missing"],
    };
  }

  const anniversary = findAnniversaryYear(
    input.applicationDate,
    absenceIntervals,
    countStartDate,
    requirement.anniversaryToleranceDays ?? 90
  );

  if (!anniversary.found) {
    if (anniversary.toleranceExceeded) reasons.push("anniversary-tolerance-exceeded");
    if (anniversary.insufficientHistory) reasons.push("anniversary-insufficient-history");
    return {
      route: input.route,
      applicationDate: input.applicationDate,
      eligible: false,
      anniversary,
      reasons,
    };
  }

  const cumulativeWindowEnd = addDays(toDate(anniversary.anniversaryStart!), -1);
  const cumulative = computeCumulativePresence(
    toISO(cumulativeWindowEnd),
    requirement.cumulativeYears ?? 3,
    absenceIntervals,
    countStartDate,
    input.bcsYearSettings,
    input.route,
    input.bcsAnchorDate ? toDate(input.bcsAnchorDate) : undefined
  );

  const eligible = cumulative.met;
  if (!cumulative.met) reasons.push("cumulative-shortfall");
  if (eligible) reasons.push("eligible");

  return {
    route: input.route,
    applicationDate: input.applicationDate,
    eligible,
    anniversary,
    cumulative,
    reasons,
  };
}
