// Route requirement matrix — ENGINE_SPEC.md §2. Do not edit without updating
// ENGINE_SPEC.md and re-confirming with the user; these numbers are legally
// load-bearing.

import type { GreekLevel, Route, RouteRequirement } from "./types";

const ANNIVERSARY_TOLERANCE_DAYS = 90;

export function getRouteRequirement(
  route: Route,
  greekLevel?: GreekLevel
): RouteRequirement {
  if (route === "fast-track") {
    const cumulativeYears = greekLevel === "A2" ? 4 : 3; // B1 and "exempt" both use the 3-year (B1) tier
    return {
      route,
      cumulativeYears,
      hasAnniversaryYear: true,
      anniversaryToleranceDays: ANNIVERSARY_TOLERANCE_DAYS,
    };
  }

  if (route === "standard") {
    return {
      route,
      cumulativeYears: 7,
      hasAnniversaryYear: true,
      anniversaryToleranceDays: ANNIVERSARY_TOLERANCE_DAYS,
    };
  }

  // marriage
  return {
    route,
    hasAnniversaryYear: false,
    marriageYearsRequired: 3,
    marriageCumulativeResidenceYears: 2,
  };
}

/**
 * Structured "total years" breakdown for a route, for the UI to translate and
 * format itself (do NOT bake an English string here — see StepRoute.tsx).
 */
export type RouteYearsBreakdown =
  | { kind: "cumulative-plus-anniversary"; cumulativeYears: number; totalYears: number }
  | { kind: "marriage"; marriageYears: number; residenceYears: number };

export function getRouteYearsBreakdown(route: Route, greekLevel?: GreekLevel): RouteYearsBreakdown {
  const req = getRouteRequirement(route, greekLevel);
  if (route === "marriage") {
    return {
      kind: "marriage",
      marriageYears: req.marriageYearsRequired ?? 3,
      residenceYears: req.marriageCumulativeResidenceYears ?? 2,
    };
  }
  const cumulativeYears = req.cumulativeYears ?? 0;
  return { kind: "cumulative-plus-anniversary", cumulativeYears, totalYears: cumulativeYears + 1 };
}
