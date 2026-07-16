// Cyprus Citizenship Eligibility — core types.
// See /ENGINE_SPEC.md (repo root, one level above client/) for the authoritative
// legal/algorithmic spec these types and functions implement.

export type ISODate = string; // "YYYY-MM-DD"

export type EventType = "departure" | "arrival";

export interface TravelEvent {
  id: string;
  date: ISODate;
  type: EventType;
  passportPage?: string;
}

export type Route = "fast-track" | "standard" | "marriage";

/** Greek language certificate level. "exempt" = May-2024 exemption (Greek-taught
 * school-leaving certificate or degree) — fast-track only. */
export type GreekLevel = "A2" | "B1" | "exempt";

/** Per-calendar-year BCS status + concession toggle. Only meaningful for the
 * fast-track route. */
export interface BcsYearSetting {
  year: number;
  heldBcsStatus: boolean;
  concessionOn: boolean;
}

export interface EngineInput {
  route: Route;
  /** Required for fast-track and standard. Ignored for marriage. */
  greekLevel?: GreekLevel;
  arcDate: ISODate;
  includeArcDate: boolean;
  events: TravelEvent[];
  applicationDate: ISODate;
  bcsYearSettings: BcsYearSetting[];
  /** Anchor date for BCS concession rolling-365-day periods; defaults to
   * calendar-year buckets when omitted. */
  bcsAnchorDate?: ISODate;
  /** Marriage route only. */
  marriageDate?: ISODate;
  /** Boundary for "today" — presence after the last logged event and before
   * this date is assumed continuous (no further travel) unless later events
   * exist. Defaults to the system date if omitted. */
  today?: ISODate;
}

export interface RouteRequirement {
  route: Route;
  /** Cumulative years required within the rolling window (fast-track/standard). */
  cumulativeYears?: number;
  /** Whether the final continuous "anniversary year" (§3) applies. */
  hasAnniversaryYear: boolean;
  /** Absence tolerance (days) inside the anniversary year window. */
  anniversaryToleranceDays?: number;
  /** Marriage route only. */
  marriageYearsRequired?: number;
  marriageCumulativeResidenceYears?: number;
}

export interface AnniversaryYearResult {
  found: boolean;
  anniversaryStart?: ISODate;
  windowEnd?: ISODate; // applicationDate - 1 day
  presentDaysInWindow?: number; // always 365 when found
  absentDaysInWindow?: number;
  /** True once absences exceeded tolerance during the scan (found=false). */
  toleranceExceeded?: boolean;
  /** True if presence history runs out before 365 present days are found. */
  insufficientHistory?: boolean;
}

export interface CumulativeResult {
  requiredDays: number;
  actualDays: number;
  windowStart: ISODate;
  windowEnd: ISODate;
  met: boolean;
  shortfallDays: number;
  /** Calendar date the cumulative day requirement was first satisfied,
   * scanning forward from the count-start date. Null if not yet reached
   * or if it falls outside a ~20-year forward scan horizon. Distinct from
   * AnniversaryYearResult.anniversaryStart — see cumulative.ts docs. */
  thresholdReachedDate: ISODate | null;
}

export interface EligibilityResult {
  route: Route;
  applicationDate: ISODate;
  eligible: boolean;
  anniversary?: AnniversaryYearResult;
  cumulative?: CumulativeResult;
  /** Marriage-only simple check. */
  marriage?: {
    yearsMarried: number;
    yearsMarriedMet: boolean;
    cumulativeResidenceDays: number;
    requiredResidenceDays: number;
    residenceMet: boolean;
  };
  reasons: string[]; // machine-readable reason codes, translated in UI
}

export interface ImprovementSuggestion {
  kind: "include-arc-date" | "bcs-concession";
  year?: number;
  /** Estimated number of days the nearest eligible date would move earlier. */
  estimatedImprovementDays: number;
}
