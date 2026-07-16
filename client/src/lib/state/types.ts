// App-level state shapes that wrap the engine's EngineInput contract with
// UI-only, reference-only, and export-only data. Nothing here is ever passed
// into the engine except via the `toEngineInput()` selector.

import type { BcsYearSetting, GreekLevel, Route, TravelEvent } from "@/lib/engine";

export interface ResidencePermitReference {
  id: string;
  rpType: string; // e.g. "VIS", "BCS"
  date: string; // ISO date, printing date
}

export interface PersonalDetails {
  fullName: string;
  passportNumber: string;
  arcNumber: string;
  applicationDate: string; // ISO
}

export interface ArcReceiptDetails {
  arcDate: string; // ISO
  includeArcDate: boolean;
  firstReceiptDate: string; // ISO
  firstReceiptSameAsArc: boolean;
  firstBcsReceiptDate: string; // ISO
  firstReceiptWasBcs: boolean;
}

export interface ExportSectionToggles {
  header: boolean;
  travel: boolean;
  trips: boolean;
  eligibility: boolean;
  education: boolean;
}

// A manually-entered trip (as opposed to one auto-derived from the travel
// event log) for the "trips after cumulative threshold" reference table.
export interface ManualTrip {
  id: string;
  departureDate: string; // ISO
  arrivalDate: string; // ISO
  destination: string;
}

export interface AppState {
  route: Route;
  greekLevel: GreekLevel;
  marriageDate: string; // ISO, marriage route only

  // Fast-track only: confirms the applicant meets the 2-consecutive-year
  // BCS employment / no-visa-gap requirement described in the fast-track
  // warning. Gates progression past the route step.
  fastTrackConfirmed: boolean;

  personal: PersonalDetails;
  arc: ArcReceiptDetails;

  events: TravelEvent[];
  referencePermits: ResidencePermitReference[];

  bcsYearSettings: BcsYearSetting[];

  // Manually-entered trips for the trips-after-threshold table, in addition
  // to those auto-derived from the travel event log.
  manualTrips: ManualTrip[];

  // Destination/country label per travel-event id, keyed by the departure
  // event's id, for the trips-after-threshold reference table.
  tripDestinations: Record<string, string>;

  // Dismissed improvement-suggestion keys so we don't re-nag after the user
  // closes a prompt (kept in memory only, resets on reload — no storage).
  dismissedSuggestions: string[];

  exportSections: ExportSectionToggles;
  exportCustomNote: string;
  exportFooterText: string;
}

export const DEFAULT_APP_STATE: AppState = {
  route: "fast-track",
  greekLevel: "B1",
  marriageDate: "",
  fastTrackConfirmed: false,

  personal: {
    fullName: "",
    passportNumber: "",
    arcNumber: "",
    applicationDate: "",
  },
  arc: {
    arcDate: "",
    includeArcDate: false,
    firstReceiptDate: "",
    firstReceiptSameAsArc: true,
    firstBcsReceiptDate: "",
    firstReceiptWasBcs: false,
  },

  events: [],
  referencePermits: [],

  bcsYearSettings: [],
  manualTrips: [],
  tripDestinations: {},

  dismissedSuggestions: [],

  exportSections: {
    header: true,
    travel: true,
    trips: true,
    eligibility: true,
    education: true,
  },
  exportCustomNote: "",
  exportFooterText: "",
};
