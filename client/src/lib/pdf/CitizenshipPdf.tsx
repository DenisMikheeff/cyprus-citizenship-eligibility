// PDF document mirroring build_pdfs.py / render_pdfs.py's visual style:
// same palette, same section structure (chronological record, annual
// summary, reference dates, trips-after-threshold, eligibility summary),
// same font logic (DM Sans Bold headings for EN, Inter-Bold headings for GR).
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AppState } from "@/lib/state/types";
import type { EligibilityResult, GreekLevel, Route, TravelEvent } from "@/lib/engine";
import {
  buildAbsenceIntervals,
  computeAnnualBreakdown,
  getCountStartDate,
  getRouteRequirement,
  toDate,
  toISO,
} from "@/lib/engine";
import { formatISODisplay } from "@/lib/state/engineHelpers";
import { displayFontFamily } from "@/lib/pdf/fonts";
import { addDays } from "date-fns";

const TEAL = "#01696F";
const DARKTEAL = "#0C4E54";
const TEXT = "#28251D";
const MUTED = "#5A5957";
const BORDER = "#D4D1CA";
const SURFACE = "#F7F6F2";
const GOOD = "#2E6B3E";
const GOODBG = "#EAF3EA";
const MILESTONE_BG = "#EAF3EA";
const APPDATE_BG = "#FFF3D6";
const TOTAL_BG = "#DCEFEA";
const WHITE = "#FFFFFF";

function styles(lang: "en" | "gr") {
  const display = displayFontFamily(lang);
  return StyleSheet.create({
    page: {
      padding: 32,
      fontFamily: "Inter",
      fontSize: 9.7,
      color: TEXT,
    },
    title: { fontFamily: display, fontSize: 19, color: DARKTEAL, marginBottom: 2, lineHeight: 1.2 },
    subtitle: { fontFamily: "Inter", fontStyle: "italic", fontSize: 10.5, color: MUTED, marginBottom: 8 },
    metaRow: { flexDirection: "row", marginBottom: 2 },
    // GR labels (e.g. "Προβλεπόμενη ημερομηνία αίτησης:") are noticeably longer than
    // their EN counterparts -- a fixed 130pt width causes them to wrap, which then
    // squeezes the value text against the wrapped second line. Widen for GR.
    metaLabel: {
      fontFamily: "Inter",
      fontWeight: "bold",
      fontSize: 9.5,
      width: lang === "gr" ? 185 : 130,
      paddingRight: 6,
      color: TEXT,
    },
    metaValue: { fontFamily: "Inter", fontSize: 9.5, color: TEXT, flex: 1 },
    // Item 4: when a personal-details field is left blank, render an empty
    // underlined box of the same height instead of a bare dash, so the
    // printed page keeps a consistent, hand-writable layout regardless of
    // how many fields were filled in digitally.
    metaBlankLine: {
      flex: 1,
      height: 10,
      borderBottomWidth: 0.75,
      borderBottomColor: BORDER,
    },
    hr: { borderBottomWidth: 1.1, borderBottomColor: TEAL, marginVertical: 6 },
    h2: { fontFamily: display, fontSize: 13, color: DARKTEAL, marginTop: 10, marginBottom: 5 },
    table: { borderWidth: 0.4, borderColor: BORDER },
    trHead: { flexDirection: "row", backgroundColor: TEAL },
    thead: {
      fontFamily: display,
      fontSize: 8.8,
      color: WHITE,
      textAlign: "center",
      padding: 4.5,
      borderRightWidth: 0.4,
      borderRightColor: BORDER,
    },
    tr: { flexDirection: "row", borderTopWidth: 0.4, borderTopColor: BORDER },
    td: {
      fontFamily: "Inter",
      fontSize: 8.8,
      color: TEXT,
      padding: 4.5,
      borderRightWidth: 0.4,
      borderRightColor: BORDER,
    },
    tdCenter: { textAlign: "center" },
    note: { fontFamily: "Inter", fontStyle: "italic", fontSize: 8.6, color: MUTED, marginTop: 4 },
    kvTable: { borderWidth: 0.4, borderColor: BORDER, marginTop: 4 },
    kvRow: { flexDirection: "row", borderTopWidth: 0.4, borderTopColor: BORDER },
    kvKey: {
      fontFamily: "Inter",
      fontWeight: "bold",
      fontSize: 8.8,
      color: TEXT,
      backgroundColor: SURFACE,
      padding: 6,
      width: "45%",
      borderRightWidth: 0.4,
      borderRightColor: BORDER,
    },
    kvVal: { fontFamily: "Inter", fontSize: 8.8, color: TEXT, padding: 6, flex: 1 },
    footer: {
      position: "absolute",
      bottom: 18,
      left: 32,
      right: 32,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 0.6,
      borderTopColor: BORDER,
      paddingTop: 4,
      fontSize: 7.6,
      color: MUTED,
    },
  });
}

interface PdfLabels {
  title: string;
  subtitle: string;
  applicantLabel: string;
  passportLabel: string;
  arcLabel: string;
  appDateLabel: string;
  eventsHeading: string;
  eventsCols: [string, string, string];
  annualHeading: string;
  annualCols: [string, string, string];
  annualTotalLabel: string;
  referenceHeading: string;
  tripsHeading: string;
  tripsCols: [string, string, string, string];
  tripsTotalLabel: string;
  dash: string;
  eligibleLabel: string;
  notEligibleLabel: string;
  marriageUnconfirmedNotice: string;
  // Added for full-content export (see CitizenshipPdf below)
  departureEvent: string;
  arrivalEvent: string;
  arcObtainedOnly: string;
  arcObtainedWithReceipt: string;
  arcObtainedWithBcsReceipt: string;
  applicationDateEvent: (form: string) => string;
  thresholdReachedEvent: (years: number, days: number) => string;
  referenceDatesHeading: string;
  referenceDatesNote: string;
  firstReceiptRowLabel: string;
  firstBcsReceiptRowLabel: string;
  referenceDateFallbackLabel: string;
  resultLabel: string;
  thresholdReachedLabel: string;
  marginLabel: string;
  formM127: string;
  formM125: string;
  routeLabel: string;
  routeShort: (route: Route) => string;
  greekLevelLabel: string;
  greekLevelShort: (level: GreekLevel) => string;
  anniversaryStartLabel: string;
  cumulativeTitle: string;
  cumulativeRequired: string;
  cumulativeActual: string;
  cumulativeShortfall: string;
  yearsMarried: string;
  residenceDays: string;
}

export function buildPdfLabels(lang: "en" | "gr", t: (k: string, opts?: Record<string, unknown>) => string): PdfLabels {
  return {
    title: t("export.pdf.title"),
    subtitle: t("export.pdf.subtitle"),
    applicantLabel: t("personal.fullName"),
    passportLabel: t("personal.passportNumber"),
    arcLabel: t("personal.arcNumber"),
    appDateLabel: t("personal.applicationDate"),
    eventsHeading: t("export.pdf.eventsHeading"),
    eventsCols: [t("travel.date"), t("travel.type"), t("travel.passportPage")],
    annualHeading: t("export.pdf.annualHeading"),
    annualCols: [t("export.pdf.year"), t("export.pdf.presentDays"), t("export.pdf.notes")],
    annualTotalLabel: t("export.pdf.total"),
    referenceHeading: t("export.pdf.referenceHeading"),
    tripsHeading: t("trips.title"),
    tripsCols: [t("trips.departure"), t("trips.return"), t("trips.daysAbsent"), t("trips.tripTo")],
    tripsTotalLabel: t("export.pdf.total"),
    dash: "—",
    eligibleLabel: t("eligibility.eligible"),
    notEligibleLabel: t("eligibility.notEligible"),
    marriageUnconfirmedNotice: t("eligibility.marriageUnconfirmedNotice"),
    departureEvent: t("export.pdf.departureEvent"),
    arrivalEvent: t("export.pdf.arrivalEvent"),
    arcObtainedOnly: t("export.pdf.arcObtainedOnly"),
    arcObtainedWithReceipt: t("export.pdf.arcObtainedWithReceipt"),
    arcObtainedWithBcsReceipt: t("export.pdf.arcObtainedWithBcsReceipt"),
    applicationDateEvent: (form) => t("export.pdf.applicationDateEvent", { form }),
    thresholdReachedEvent: (years, days) => t("export.pdf.thresholdReachedEvent", { years, days }),
    referenceDatesHeading: t("export.pdf.referenceDatesHeading"),
    referenceDatesNote: t("export.pdf.referenceDatesNote"),
    firstReceiptRowLabel: t("export.pdf.firstReceiptRowLabel"),
    firstBcsReceiptRowLabel: t("export.pdf.firstBcsReceiptRowLabel"),
    referenceDateFallbackLabel: t("export.pdf.referenceDateFallbackLabel"),
    resultLabel: t("export.pdf.resultLabel"),
    thresholdReachedLabel: t("export.pdf.thresholdReachedLabel"),
    marginLabel: t("export.pdf.marginLabel"),
    formM127: t("export.pdf.formM127"),
    formM125: t("export.pdf.formM125"),
    routeLabel: t("route.routeLabel"),
    routeShort: (route) =>
      route === "fast-track" ? t("route.fastTrackShort") : route === "standard" ? t("route.standardShort") : t("route.marriageShort"),
    greekLevelLabel: t("route.greekLevelLabel"),
    greekLevelShort: (level) => (level === "A2" ? t("route.greekA2") : level === "exempt" ? t("route.greekExempt") : t("route.greekB1")),
    anniversaryStartLabel: t("eligibility.anniversaryStart"),
    cumulativeTitle: t("eligibility.cumulativeTitle"),
    cumulativeRequired: t("eligibility.cumulativeRequired"),
    cumulativeActual: t("eligibility.cumulativeActual"),
    cumulativeShortfall: t("eligibility.cumulativeShortfall"),
    yearsMarried: t("eligibility.yearsMarried"),
    residenceDays: t("eligibility.residenceDays"),
  };
}

export interface CitizenshipPdfProps {
  lang: "en" | "gr";
  labels: PdfLabels;
  state: AppState;
  result: EligibilityResult | null;
  sections: {
    header: boolean;
    travel: boolean;
    trips: boolean;
    eligibility: boolean;
    education: boolean;
  };
  customNote?: string;
  customNoteHeader?: string;
  locale: string;
}

interface EventRow {
  date: string;
  label: string;
  passportPage: string;
  highlight?: "milestone" | "appdate";
}

export function CitizenshipPdf({ lang, labels, state, result, sections, customNote, customNoteHeader, locale }: CitizenshipPdfProps) {
  const s = styles(lang);
  const sortedEvents = [...state.events].sort((a, b) => a.date.localeCompare(b.date));

  const requirement = getRouteRequirement(state.route, state.greekLevel);
  const formLabel = state.route === "marriage" ? labels.formM125 : labels.formM127;

  // --- Build the combined chronological record: real travel events plus
  // synthetic milestone rows (ARC/first receipt, cumulative threshold
  // reached, application date), matching the reference PDF's structure. ---
  const eventRows: EventRow[] = [];
  if (state.arc.arcDate) {
    let arcLabel = labels.arcObtainedOnly;
    if (state.arc.firstReceiptSameAsArc) {
      arcLabel = state.arc.firstReceiptWasBcs ? labels.arcObtainedWithBcsReceipt : labels.arcObtainedWithReceipt;
    }
    eventRows.push({ date: state.arc.arcDate, label: arcLabel, passportPage: labels.dash });
  }
  if (
    state.arc.firstReceiptDate &&
    !state.arc.firstReceiptSameAsArc &&
    state.arc.firstReceiptDate !== state.arc.arcDate
  ) {
    eventRows.push({ date: state.arc.firstReceiptDate, label: labels.firstReceiptRowLabel, passportPage: labels.dash });
  }
  for (const ev of sortedEvents) {
    eventRows.push({
      date: ev.date,
      label: ev.type === "departure" ? labels.departureEvent : labels.arrivalEvent,
      passportPage: ev.passportPage || labels.dash,
    });
  }
  if (result?.cumulative?.thresholdReachedDate) {
    eventRows.push({
      date: result.cumulative.thresholdReachedDate,
      label: labels.thresholdReachedEvent(requirement.cumulativeYears ?? 0, result.cumulative.requiredDays),
      passportPage: labels.dash,
      highlight: "milestone",
    });
  }
  if (state.personal.applicationDate) {
    eventRows.push({
      date: state.personal.applicationDate,
      label: labels.applicationDateEvent(formLabel),
      passportPage: labels.dash,
      highlight: "appdate",
    });
  }
  eventRows.sort((a, b) => a.date.localeCompare(b.date));

  // --- Annual presence breakdown (section 2) ---
  let annual: { rows: { year: number; presentDays: number }[]; totalDays: number } | null = null;
  if (state.arc.arcDate && state.personal.applicationDate) {
    const countStart = getCountStartDate(state.arc.arcDate, state.arc.includeArcDate);
    const appDate = toDate(state.personal.applicationDate);
    const windowEnd = addDays(appDate, -1);
    const boundary = appDate;
    const absenceIntervals = buildAbsenceIntervals(state.events, boundary);
    annual = computeAnnualBreakdown(absenceIntervals, countStart, windowEnd);
  }

  // --- Reference dates (section 3): first BCS receipt (if a distinct date)
  // and any "residence permit printed" reference entries. ---
  const referenceRows: { label: string; date: string }[] = [];
  if (state.arc.firstBcsReceiptDate && !state.arc.firstReceiptWasBcs) {
    referenceRows.push({ label: labels.firstBcsReceiptRowLabel, date: state.arc.firstBcsReceiptDate });
  }
  for (const rp of state.referencePermits) {
    if (!rp.date) continue;
    referenceRows.push({ label: rp.rpType?.trim() || labels.referenceDateFallbackLabel, date: rp.date });
  }

  const trips = buildTrips(sortedEvents, result, state.tripDestinations);

  const footerText = `${labels.title.split("\n")[0]} — ${state.personal.fullName || labels.dash} — ${formLabel}`;

  return (
    <Document title={labels.title}>
      <Page size="A4" style={s.page} wrap>
        {sections.header && (
          <View>
            <Text style={s.title}>{labels.title}</Text>
            <Text style={s.subtitle}>{labels.subtitle}</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.applicantLabel}:</Text>
              {state.personal.fullName ? (
                <Text style={s.metaValue}>{state.personal.fullName}</Text>
              ) : (
                <View style={s.metaBlankLine} />
              )}
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.passportLabel}:</Text>
              {state.personal.passportNumber ? (
                <Text style={s.metaValue}>{state.personal.passportNumber}</Text>
              ) : (
                <View style={s.metaBlankLine} />
              )}
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.arcLabel}:</Text>
              {state.personal.arcNumber ? (
                <Text style={s.metaValue}>{state.personal.arcNumber}</Text>
              ) : (
                <View style={s.metaBlankLine} />
              )}
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.appDateLabel}:</Text>
              {state.personal.applicationDate ? (
                <Text style={s.metaValue}>
                  {formatISODisplay(state.personal.applicationDate, locale)}
                </Text>
              ) : (
                <View style={s.metaBlankLine} />
              )}
            </View>
            <View style={s.hr} />
          </View>
        )}

        {sections.travel && eventRows.length > 0 && (
          <View>
            <Text style={s.h2}>1. {labels.eventsHeading}</Text>
            <View style={s.table}>
              <View style={s.trHead}>
                <Text style={[s.thead, { width: "28%" }]}>{labels.eventsCols[0]}</Text>
                <Text style={[s.thead, { width: "40%" }]}>{labels.eventsCols[1]}</Text>
                <Text style={[s.thead, { width: "32%", borderRightWidth: 0 }]}>{labels.eventsCols[2]}</Text>
              </View>
              {eventRows.map((row, i) => (
                <View
                  style={[
                    s.tr,
                    row.highlight === "milestone" ? { backgroundColor: MILESTONE_BG } : {},
                    row.highlight === "appdate" ? { backgroundColor: APPDATE_BG } : {},
                  ]}
                  key={`${row.date}-${i}`}
                  wrap={false}
                >
                  <Text style={[s.td, s.tdCenter, { width: "28%" }]}>{formatISODisplay(row.date, locale)}</Text>
                  <Text style={[s.td, { width: "40%" }]}>{row.label}</Text>
                  <Text style={[s.td, s.tdCenter, { width: "32%", borderRightWidth: 0 }]}>{row.passportPage}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {sections.travel && annual && annual.rows.length > 0 && (
          <View>
            <Text style={s.h2}>2. {labels.annualHeading}</Text>
            <View style={s.table}>
              <View style={s.trHead}>
                <Text style={[s.thead, { width: "20%" }]}>{labels.annualCols[0]}</Text>
                <Text style={[s.thead, { width: "25%" }]}>{labels.annualCols[1]}</Text>
                <Text style={[s.thead, { width: "55%", borderRightWidth: 0 }]}>{labels.annualCols[2]}</Text>
              </View>
              {annual.rows.map((row) => {
                const note =
                  result?.cumulative?.thresholdReachedDate &&
                  new Date(result.cumulative.thresholdReachedDate).getFullYear() === row.year
                    ? labels.thresholdReachedLabel + ": " + formatISODisplay(result.cumulative.thresholdReachedDate, locale)
                    : "";
                return (
                  <View style={s.tr} key={row.year} wrap={false}>
                    <Text style={[s.td, s.tdCenter, { width: "20%" }]}>{row.year}</Text>
                    <Text style={[s.td, s.tdCenter, { width: "25%" }]}>{row.presentDays}</Text>
                    <Text style={[s.td, { width: "55%", borderRightWidth: 0 }]}>{note || labels.dash}</Text>
                  </View>
                );
              })}
              <View style={[s.tr, { backgroundColor: TOTAL_BG }]} wrap={false}>
                <Text style={[s.td, s.tdCenter, { width: "20%", fontWeight: "bold" }]}>{labels.annualTotalLabel}</Text>
                <Text style={[s.td, s.tdCenter, { width: "25%", fontWeight: "bold" }]}>{annual.totalDays}</Text>
                <Text style={[s.td, { width: "55%", borderRightWidth: 0 }]} />
              </View>
            </View>
          </View>
        )}

        {sections.travel && referenceRows.length > 0 && (
          <View>
            <Text style={s.h2}>3. {labels.referenceDatesHeading}</Text>
            <View style={s.kvTable}>
              {referenceRows.map((row, i) => (
                <View style={s.kvRow} key={i}>
                  <Text style={s.kvKey}>{row.label}</Text>
                  <Text style={s.kvVal}>{formatISODisplay(row.date, locale)}</Text>
                </View>
              ))}
            </View>
            <Text style={s.note}>{labels.referenceDatesNote}</Text>
          </View>
        )}

        {sections.trips && trips.length > 0 && (
          <View>
            <Text style={s.h2}>4. {labels.tripsHeading}</Text>
            <View style={s.table}>
              <View style={s.trHead}>
                <Text style={[s.thead, { width: "22%" }]}>{labels.tripsCols[0]}</Text>
                <Text style={[s.thead, { width: "22%" }]}>{labels.tripsCols[1]}</Text>
                <Text style={[s.thead, { width: "16%" }]}>{labels.tripsCols[2]}</Text>
                <Text style={[s.thead, { width: "40%", borderRightWidth: 0 }]}>{labels.tripsCols[3]}</Text>
              </View>
              {trips.map((trip) => (
                <View style={s.tr} key={trip.id} wrap={false}>
                  <Text style={[s.td, s.tdCenter, { width: "22%" }]}>
                    {formatISODisplay(trip.departure, locale)}
                  </Text>
                  <Text style={[s.td, s.tdCenter, { width: "22%" }]}>
                    {trip.arrival ? formatISODisplay(trip.arrival, locale) : labels.dash}
                  </Text>
                  <Text style={[s.td, s.tdCenter, { width: "16%" }]}>{trip.days || labels.dash}</Text>
                  <Text style={[s.td, { width: "40%", borderRightWidth: 0 }]}>
                    {trip.destination || labels.dash}
                  </Text>
                </View>
              ))}
              <View style={[s.tr, { backgroundColor: TOTAL_BG }]} wrap={false}>
                <Text style={[s.td, s.tdCenter, { width: "22%", fontWeight: "bold" }]}>
                  {labels.tripsTotalLabel}
                </Text>
                <Text style={[s.td, { width: "22%" }]} />
                <Text style={[s.td, s.tdCenter, { width: "16%", fontWeight: "bold" }]}>
                  {trips.reduce((sum, t) => sum + (t.days || 0), 0)}
                </Text>
                <Text style={[s.td, { width: "40%", borderRightWidth: 0 }]} />
              </View>
            </View>
          </View>
        )}

        {sections.eligibility && result && (
          <View>
            <Text style={s.h2}>5. {labels.referenceHeading}</Text>
            <View style={s.kvTable}>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>{labels.resultLabel}</Text>
                <Text
                  style={[
                    s.kvVal,
                    { color: result.eligible ? GOOD : TEXT, backgroundColor: result.eligible ? GOODBG : WHITE, fontWeight: "bold" },
                  ]}
                >
                  {result.eligible ? labels.eligibleLabel : labels.notEligibleLabel}
                </Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>{labels.routeLabel}</Text>
                <Text style={s.kvVal}>{labels.routeShort(state.route)}</Text>
              </View>
              {state.route !== "marriage" && state.greekLevel && (
                <View style={s.kvRow}>
                  <Text style={s.kvKey}>{labels.greekLevelLabel}</Text>
                  <Text style={s.kvVal}>{labels.greekLevelShort(state.greekLevel)}</Text>
                </View>
              )}
              {result.cumulative && (
                <>
                  <View style={s.kvRow}>
                    <Text style={s.kvKey}>{labels.cumulativeTitle}</Text>
                    <Text style={s.kvVal}>
                      {labels.cumulativeActual}: {result.cumulative.actualDays} / {labels.cumulativeRequired}: {result.cumulative.requiredDays}
                    </Text>
                  </View>
                  {result.cumulative.thresholdReachedDate && (
                    <View style={s.kvRow}>
                      <Text style={s.kvKey}>{labels.thresholdReachedLabel}</Text>
                      <Text style={s.kvVal}>{formatISODisplay(result.cumulative.thresholdReachedDate, locale)}</Text>
                    </View>
                  )}
                  {result.anniversary?.anniversaryStart && (
                    <View style={s.kvRow}>
                      <Text style={s.kvKey}>{labels.anniversaryStartLabel}</Text>
                      <Text style={s.kvVal}>{formatISODisplay(result.anniversary.anniversaryStart, locale)}</Text>
                    </View>
                  )}
                  <View style={s.kvRow}>
                    <Text style={s.kvKey}>
                      {result.cumulative.met ? labels.marginLabel : labels.cumulativeShortfall}
                    </Text>
                    <Text style={s.kvVal}>
                      {result.cumulative.met
                        ? result.cumulative.actualDays - result.cumulative.requiredDays
                        : result.cumulative.shortfallDays}
                    </Text>
                  </View>
                </>
              )}
              {result.marriage && (
                <>
                  <View style={s.kvRow}>
                    <Text style={s.kvKey}>{labels.yearsMarried}</Text>
                    <Text style={s.kvVal}>{result.marriage.yearsMarried.toFixed(2)}</Text>
                  </View>
                  <View style={s.kvRow}>
                    <Text style={s.kvKey}>{labels.residenceDays}</Text>
                    <Text style={s.kvVal}>
                      {result.marriage.cumulativeResidenceDays} / {result.marriage.requiredResidenceDays}
                    </Text>
                  </View>
                </>
              )}
            </View>
            {result.reasons.includes("marriage-final-period-unconfirmed") && (
              <Text style={s.note}>{labels.marriageUnconfirmedNotice}</Text>
            )}
          </View>
        )}

        {customNote && (
          <View>
            {customNoteHeader?.trim() && <Text style={s.h2}>{customNoteHeader}</Text>}
            <Text style={{ fontFamily: "Inter", fontSize: 9.4, color: TEXT }}>{customNote}</Text>
          </View>
        )}

        <View style={s.footer}>
          <Text>{footerText}</Text>
          <Text
            render={({ pageNumber }) => `Page ${pageNumber}`}
          />
        </View>
      </Page>
    </Document>
  );
}

function buildTrips(
  sortedEvents: TravelEvent[],
  result: EligibilityResult | null,
  destinations: Record<string, string>
) {
  // Uses thresholdReachedDate (the date the cumulative day requirement was
  // first satisfied), NOT anniversaryStart -- these are distinct concepts,
  // see cumulative.ts docs and StepTrips.tsx for the identical UI logic.
  const thresholdReachedDate = result?.cumulative?.thresholdReachedDate;
  if (!thresholdReachedDate) return [] as { id: string; departure: string; arrival: string; days: number; destination: string }[];
  const rows: { id: string; departure: string; arrival: string; days: number; destination: string }[] = [];
  for (let i = 0; i < sortedEvents.length; i++) {
    const ev = sortedEvents[i];
    if (ev.type !== "departure") continue;
    if (ev.date < thresholdReachedDate) continue;
    const next = sortedEvents[i + 1];
    const arrival = next && next.type === "arrival" ? next : null;
    let days = 0;
    if (arrival) {
      // Per the verified engine convention (presence.ts): the departure day
      // itself is absent, the arrival day is present. Days absent = arrival
      // date minus departure date, with NO +1.
      const d1 = new Date(ev.date);
      const d2 = new Date(arrival.date);
      days = Math.round((d2.getTime() - d1.getTime()) / 86400000);
    }
    rows.push({
      id: ev.id,
      departure: ev.date,
      arrival: arrival?.date ?? "",
      days,
      destination: destinations[ev.id] ?? "",
    });
    if (arrival) i++;
  }
  return rows;
}
