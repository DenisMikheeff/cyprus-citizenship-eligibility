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

/** Total "years" figure shown to users, e.g. "4 years total (3 + 1)". */
export function getRouteTotalYearsLabel(route: Route, greekLevel?: GreekLevel): string {
  const req = getRouteRequirement(route, greekLevel);
  if (route === "marriage") return "3 years married + 2 years cumulative residence";
  return `${(req.cumulativeYears ?? 0) + 1} years total (${req.cumulativeYears} + 1)`;
}
