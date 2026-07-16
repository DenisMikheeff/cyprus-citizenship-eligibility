// PDF document mirroring build_pdfs.py / render_pdfs.py's visual style:
// same palette, same section structure (chronological record, annual
// summary, reference dates, trips-after-threshold), same font logic
// (DM Sans Bold headings for EN, Inter-Bold headings for GR).
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AppState } from "@/lib/state/types";
import type { EligibilityResult, TravelEvent } from "@/lib/engine";
import { formatISODisplay } from "@/lib/state/engineHelpers";
import { displayFontFamily } from "@/lib/pdf/fonts";

const TEAL = "#01696F";
const DARKTEAL = "#0C4E54";
const TEXT = "#28251D";
const MUTED = "#5A5957";
const BORDER = "#D4D1CA";
const SURFACE = "#F7F6F2";
const GOOD = "#2E6B3E";
const GOODBG = "#EAF3EA";
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
    metaLabel: { fontFamily: "Inter", fontWeight: "bold", fontSize: 9.5, width: 130, color: TEXT },
    metaValue: { fontFamily: "Inter", fontSize: 9.5, color: TEXT, flex: 1 },
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
  footer: string;
  dash: string;
  eligibleLabel: string;
  notEligibleLabel: string;
  marriageUnconfirmedNotice: string;
}

export function buildPdfLabels(lang: "en" | "gr", t: (k: string) => string): PdfLabels {
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
    footer: t("export.footerLabel"),
    dash: "—",
    eligibleLabel: t("eligibility.eligible"),
    notEligibleLabel: t("eligibility.notEligible"),
    marriageUnconfirmedNotice: t("eligibility.marriageUnconfirmedNotice"),
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
  locale: string;
}

export function CitizenshipPdf({ lang, labels, state, result, sections, customNote, locale }: CitizenshipPdfProps) {
  const s = styles(lang);
  const sortedEvents = [...state.events].sort((a, b) => a.date.localeCompare(b.date));

  const trips = buildTrips(sortedEvents, result, state.tripDestinations);

  return (
    <Document title={labels.title}>
      <Page size="A4" style={s.page} wrap>
        {sections.header && (
          <View>
            <Text style={s.title}>{labels.title}</Text>
            <Text style={s.subtitle}>{labels.subtitle}</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.applicantLabel}:</Text>
              <Text style={s.metaValue}>{state.personal.fullName || labels.dash}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.passportLabel}:</Text>
              <Text style={s.metaValue}>{state.personal.passportNumber || labels.dash}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.arcLabel}:</Text>
              <Text style={s.metaValue}>{state.personal.arcNumber || labels.dash}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.appDateLabel}:</Text>
              <Text style={s.metaValue}>
                {state.personal.applicationDate
                  ? formatISODisplay(state.personal.applicationDate, locale)
                  : labels.dash}
              </Text>
            </View>
            <View style={s.hr} />
          </View>
        )}

        {sections.travel && sortedEvents.length > 0 && (
          <View>
            <Text style={s.h2}>{labels.eventsHeading}</Text>
            <View style={s.table}>
              <View style={s.trHead}>
                <Text style={[s.thead, { width: "28%" }]}>{labels.eventsCols[0]}</Text>
                <Text style={[s.thead, { width: "40%" }]}>{labels.eventsCols[1]}</Text>
                <Text style={[s.thead, { width: "32%", borderRightWidth: 0 }]}>{labels.eventsCols[2]}</Text>
              </View>
              {sortedEvents.map((ev, i) => (
                <View style={s.tr} key={ev.id} wrap={false}>
                  <Text style={[s.td, s.tdCenter, { width: "28%" }]}>
                    {formatISODisplay(ev.date, locale)}
                  </Text>
                  <Text style={[s.td, { width: "40%" }]}>
                    {ev.type === "departure" ? labels.eventsCols[1] + ": " : labels.eventsCols[1] + ": "}
                    {ev.type}
                  </Text>
                  <Text style={[s.td, s.tdCenter, { width: "32%", borderRightWidth: 0 }]}>
                    {ev.passportPage || labels.dash}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {sections.trips && trips.length > 0 && (
          <View>
            <Text style={s.h2}>{labels.tripsHeading}</Text>
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
            <Text style={s.h2}>{labels.referenceHeading}</Text>
            <View style={s.kvTable}>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>{labels.eligibleLabel}</Text>
                <Text
                  style={[
                    s.kvVal,
                    { color: result.eligible ? GOOD : TEXT, backgroundColor: result.eligible ? GOODBG : WHITE, fontWeight: "bold" },
                  ]}
                >
                  {result.eligible ? labels.eligibleLabel : labels.notEligibleLabel}
                </Text>
              </View>
              {result.cumulative && (
                <View style={s.kvRow}>
                  <Text style={s.kvKey}>{labels.annualHeading}</Text>
                  <Text style={s.kvVal}>
                    {result.cumulative.actualDays} / {result.cumulative.requiredDays}
                  </Text>
                </View>
              )}
            </View>
            {result.reasons.includes("marriage-final-period-unconfirmed") && (
              <Text style={s.note}>{labels.marriageUnconfirmedNotice}</Text>
            )}
          </View>
        )}

        {customNote && (
          <View>
            <Text style={s.h2}>{" "}</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 9.4, color: TEXT }}>{customNote}</Text>
          </View>
        )}

        <View style={s.footer}>
          <Text>{labels.footer}</Text>
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
  const anniversaryStart = result?.anniversary?.anniversaryStart;
  if (!anniversaryStart) return [] as { id: string; departure: string; arrival: string; days: number; destination: string }[];
  const rows: { id: string; departure: string; arrival: string; days: number; destination: string }[] = [];
  for (let i = 0; i < sortedEvents.length; i++) {
    const ev = sortedEvents[i];
    if (ev.type !== "departure") continue;
    if (ev.date < anniversaryStart) continue;
    const next = sortedEvents[i + 1];
    const arrival = next && next.type === "arrival" ? next : null;
    let days = 0;
    if (arrival) {
      const d1 = new Date(ev.date);
      const d2 = new Date(arrival.date);
      days = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
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
