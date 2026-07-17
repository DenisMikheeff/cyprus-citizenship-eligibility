import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard } from "@/components/wizard/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { evaluateEligibility } from "@/lib/engine";
import { formatISODisplay } from "@/lib/state/engineHelpers";
import type { ManualTrip } from "@/lib/state/types";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { AlertCircle, AlertTriangle, Plus, Trash2 } from "lucide-react";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface TripRow {
  id: string;
  departure: string;
  arrival: string;
  days: number;
  destination: string;
  manual: boolean;
}

export function StepTrips() {
  const { t, i18n } = useTranslation();
  const { state, update, engineInput } = useAppState();
  const destinations = state.tripDestinations;
  const setDestination = (id: string, value: string) =>
    update("tripDestinations", { ...destinations, [id]: value });

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDeparture, setManualDeparture] = useState("");
  const [manualArrival, setManualArrival] = useState("");
  const [manualDestination, setManualDestination] = useState("");

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

  // This table only ever shows trips once the cumulative threshold date is
  // known — until then, we can't tell which trips count as "after the
  // threshold", so nothing is shown (see trips.noThresholdYet copy). Empty
  // (not-yet-dated) travel log entries are also always excluded.
  const autoTrips: TripRow[] = useMemo(() => {
    if (!thresholdReachedDate) return [];
    const sorted = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
    const rows: TripRow[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const ev = sorted[i];
      if (ev.type !== "departure") continue;
      if (!ev.date) continue;
      if (ev.date < thresholdReachedDate) continue;
      const next = sorted[i + 1];
      const arrival = next && next.type === "arrival" ? next : null;
      // Per the verified engine convention (presence.ts): the departure day
      // itself is absent, but the arrival day is present. So the count of
      // absent days in a trip is simply (arrival date - departure date),
      // with NO +1 -- adding 1 would double-count the arrival day as absent.
      const days = arrival
        ? differenceInCalendarDays(parseISO(arrival.date), parseISO(ev.date))
        : 0;
      rows.push({
        id: ev.id,
        departure: ev.date,
        arrival: arrival?.date ?? "",
        days,
        destination: destinations[ev.id] ?? "",
        manual: false,
      });
      if (arrival) i++;
    }
    return rows;
  }, [state.events, thresholdReachedDate, destinations]);

  const manualRows: TripRow[] = useMemo(
    () =>
      state.manualTrips.map((trip) => ({
        id: trip.id,
        departure: trip.departureDate,
        arrival: trip.arrivalDate,
        days:
          trip.departureDate && trip.arrivalDate
            ? differenceInCalendarDays(parseISO(trip.arrivalDate), parseISO(trip.departureDate))
            : 0,
        destination: trip.destination,
        manual: true,
      })),
    [state.manualTrips]
  );

  const trips: TripRow[] = useMemo(
    () => [...autoTrips, ...manualRows].sort((a, b) => a.departure.localeCompare(b.departure)),
    [autoTrips, manualRows]
  );

  const addManualTrip = () => {
    if (!manualDeparture) return;
    const newTrip: ManualTrip = {
      id: uid(),
      departureDate: manualDeparture,
      arrivalDate: manualArrival,
      destination: manualDestination,
    };
    update("manualTrips", [...state.manualTrips, newTrip]);
    setManualDeparture("");
    setManualArrival("");
    setManualDestination("");
    setShowManualForm(false);
  };

  const removeManualTrip = (id: string) => {
    update("manualTrips", state.manualTrips.filter((trip) => trip.id !== id));
  };

  return (
    <SectionCard title={t("trips.title")} description={t("trips.description")}>
      {thresholdReachedDate ? (
        <div className="flex items-start gap-2 rounded-md border border-teal-800/20 bg-surface p-3">
          <AlertCircle className="h-4 w-4 text-teal-800 mt-0.5 shrink-0" />
          <p className="text-xs text-teal-900" data-testid="text-threshold-reached-on">
            {t("trips.thresholdReachedOn", {
              date: formatISODisplay(thresholdReachedDate, i18n.language),
            })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="text-trips-no-anniversary">
          {t("trips.noThresholdYet")}
        </p>
      )}

      {trips.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="text-no-trips">
          {t("trips.noTripsYet")}
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                  <TableCell>{trip.departure ? formatISODisplay(trip.departure, i18n.language) : "—"}</TableCell>
                  <TableCell>
                    {trip.arrival ? formatISODisplay(trip.arrival, i18n.language) : "—"}
                  </TableCell>
                  <TableCell>{trip.days || "—"}</TableCell>
                  <TableCell>
                    {trip.manual ? (
                      <Input
                        value={trip.destination}
                        placeholder={t("trips.tripTo")}
                        data-testid={`input-manual-trip-destination-${trip.id}`}
                        onChange={(e) =>
                          update(
                            "manualTrips",
                            state.manualTrips.map((m) =>
                              m.id === trip.id ? { ...m, destination: e.target.value } : m
                            )
                          )
                        }
                      />
                    ) : (
                      <Input
                        value={destinations[trip.id] ?? ""}
                        placeholder={t("trips.tripTo")}
                        data-testid={`input-trip-destination-${trip.id}`}
                        onChange={(e) => setDestination(trip.id, e.target.value)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {trip.manual && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-testid={`button-remove-manual-trip-${trip.id}`}
                        onClick={() => removeManualTrip(trip.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!showManualForm ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="button-add-manual-trip"
          onClick={() => setShowManualForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("trips.addManualTrip")}
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-warning/40 bg-warning-bg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-warning" data-testid="text-manual-trip-warning">
              {t("trips.manualWarning")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              type="date"
              value={manualDeparture}
              data-testid="input-manual-trip-departure"
              onChange={(e) => setManualDeparture(e.target.value)}
            />
            <Input
              type="date"
              value={manualArrival}
              data-testid="input-manual-trip-arrival"
              onChange={(e) => setManualArrival(e.target.value)}
            />
            <Input
              value={manualDestination}
              placeholder={t("trips.tripTo")}
              data-testid="input-manual-trip-destination-new"
              onChange={(e) => setManualDestination(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="button-confirm-manual-trip"
              disabled={!manualDeparture}
              onClick={addManualTrip}
            >
              {t("trips.confirmManualTrip")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="button-cancel-manual-trip"
              onClick={() => setShowManualForm(false)}
            >
              {t("trips.cancelManualTrip")}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
