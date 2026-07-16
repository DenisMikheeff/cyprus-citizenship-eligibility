import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard } from "@/components/wizard/Field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { evaluateEligibility } from "@/lib/engine";
import { formatISODisplay } from "@/lib/state/engineHelpers";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { AlertCircle } from "lucide-react";

interface TripRow {
  id: string;
  departure: string;
  arrival: string;
  days: number;
  destination: string;
}

export function StepTrips() {
  const { t, i18n } = useTranslation();
  const { state, update, engineInput } = useAppState();
  const destinations = state.tripDestinations;
  const setDestination = (id: string, value: string) =>
    update("tripDestinations", { ...destinations, [id]: value });

  const result = useMemo(() => {
    try {
      return evaluateEligibility(engineInput);
    } catch {
      return null;
    }
  }, [engineInput]);

  // The "trips after threshold" table tracks travel AFTER the cumulative
  // day requirement (e.g. 1,096/1,461/2,556 days) was first satisfied —
  // this is thresholdReachedDate, NOT the anniversary-year window start
  // (which is a different, later-computed date for the final continuous
  // residence check). See cumulative.ts docs.
  const thresholdReachedDate = result?.cumulative?.thresholdReachedDate ?? undefined;

  const trips: TripRow[] = useMemo(() => {
    if (!thresholdReachedDate) return [];
    const sorted = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
    const rows: TripRow[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const ev = sorted[i];
      if (ev.type !== "departure") continue;
      if (ev.date < thresholdReachedDate) continue;
      const next = sorted[i + 1];
      const arrival = next && next.type === "arrival" ? next : null;
      const days = arrival
        ? differenceInCalendarDays(parseISO(arrival.date), parseISO(ev.date)) + 1
        : 0;
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
  }, [state.events, thresholdReachedDate, destinations]);

  return (
    <SectionCard title={t("trips.title")} description={t("trips.description")}>
      {!thresholdReachedDate ? (
        <p className="text-sm text-muted-foreground" data-testid="text-trips-no-anniversary">
          {t("trips.noThresholdYet")}
        </p>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-md border border-teal-800/20 bg-surface p-3">
            <AlertCircle className="h-4 w-4 text-teal-800 mt-0.5 shrink-0" />
            <p className="text-xs text-teal-900" data-testid="text-threshold-reached-on">
              {t("trips.thresholdReachedOn", {
                date: formatISODisplay(thresholdReachedDate, i18n.language),
              })}
            </p>
          </div>

          {trips.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-trips">
              {t("trips.noThresholdYet")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-trips-after-threshold">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("trips.departure")}</TableHead>
                    <TableHead>{t("trips.return")}</TableHead>
                    <TableHead>{t("trips.daysAbsent")}</TableHead>
                    <TableHead>{t("trips.tripTo")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                      <TableCell>{formatISODisplay(trip.departure, i18n.language)}</TableCell>
                      <TableCell>
                        {trip.arrival ? formatISODisplay(trip.arrival, i18n.language) : "—"}
                      </TableCell>
                      <TableCell>{trip.days || "—"}</TableCell>
                      <TableCell>
                        <Input
                          value={destinations[trip.id] ?? ""}
                          placeholder={t("trips.tripTo")}
                          data-testid={`input-trip-destination-${trip.id}`}
                          onChange={(e) => setDestination(trip.id, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
