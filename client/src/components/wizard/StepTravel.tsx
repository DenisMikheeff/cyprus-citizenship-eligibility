import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard, Field } from "@/components/wizard/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import type { EventType, TravelEvent } from "@/lib/engine";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function StepTravel() {
  const { t } = useTranslation();
  const { state, update } = useAppState();

  const addEvent = () => {
    const newEvent: TravelEvent = { id: uid(), date: "", type: "departure" };
    update("events", [...state.events, newEvent]);
  };
  const updateEvent = (id: string, patch: Partial<TravelEvent>) => {
    update(
      "events",
      state.events.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };
  const removeEvent = (id: string) => {
    update("events", state.events.filter((e) => e.id !== id));
  };

  const sortedEvents = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
  const orderIssue = sortedEvents.some((e, i) => i > 0 && sortedEvents[i - 1].type === e.type);

  const addReferencePermit = () => {
    update("referencePermits", [
      ...state.referencePermits,
      { id: uid(), rpType: "", date: "" },
    ]);
  };
  const updateReferencePermit = (id: string, patch: Partial<{ rpType: string; date: string }>) => {
    update(
      "referencePermits",
      state.referencePermits.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };
  const removeReferencePermit = (id: string) => {
    update("referencePermits", state.referencePermits.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("travel.title")} description={t("travel.description")}>
        {state.events.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-events">
            {t("travel.noEvents")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table data-testid="table-travel-events">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">{t("travel.date")}</TableHead>
                  <TableHead className="min-w-[130px]">{t("travel.type")}</TableHead>
                  <TableHead className="min-w-[100px]">{t("travel.passportPage")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.events.map((ev) => (
                  <TableRow key={ev.id} data-testid={`row-event-${ev.id}`}>
                    <TableCell className="w-[150px]">
                      <Input
                        type="date"
                        value={ev.date}
                        data-testid={`input-event-date-${ev.id}`}
                        onChange={(e) => updateEvent(ev.id, { date: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="min-w-[130px]">
                      <Select
                        value={ev.type}
                        onValueChange={(v) => updateEvent(ev.id, { type: v as EventType })}
                      >
                        <SelectTrigger data-testid={`select-event-type-${ev.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="departure">{t("travel.departure")}</SelectItem>
                          <SelectItem value="arrival">{t("travel.arrival")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="min-w-[100px]">
                      <Input
                        placeholder={t("travel.passportPagePlaceholder")}
                        value={ev.passportPage ?? ""}
                        data-testid={`input-event-page-${ev.id}`}
                        onChange={(e) => updateEvent(ev.id, { passportPage: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEvent(ev.id)}
                        data-testid={`button-remove-event-${ev.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {orderIssue && (
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-bg p-3">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-warning" data-testid="text-order-warning">
              {t("travel.orderWarning")}
            </p>
          </div>
        )}

        <Button type="button" variant="outline" onClick={addEvent} data-testid="button-add-event">
          <Plus className="h-4 w-4" />
          {t("travel.addEvent")}
        </Button>
      </SectionCard>

      <SectionCard title={t("travel.presetTitle")} description={t("travel.presetDescription")}>
        {state.referencePermits.length > 0 && (
          <div className="overflow-x-auto">
            <Table data-testid="table-reference-permits">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">{t("travel.referenceNote")}</TableHead>
                  <TableHead className="w-[150px]">{t("travel.referenceDate")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.referencePermits.map((rp) => (
                  <TableRow key={rp.id} data-testid={`row-reference-permit-${rp.id}`}>
                    <TableCell className="min-w-[160px]">
                      <Input
                        placeholder={t("travel.referenceNotePlaceholder")}
                        value={rp.rpType}
                        data-testid={`input-rp-type-${rp.id}`}
                        onChange={(e) => updateReferencePermit(rp.id, { rpType: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <Input
                        type="date"
                        value={rp.date}
                        data-testid={`input-rp-date-${rp.id}`}
                        onChange={(e) => updateReferencePermit(rp.id, { date: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReferencePermit(rp.id)}
                        data-testid={`button-remove-rp-${rp.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-md border border-teal-800/20 bg-surface p-3">
          <Info className="h-4 w-4 text-teal-800 mt-0.5 shrink-0" />
          <p className="text-xs text-teal-900" data-testid="text-reference-note-tooltip">
            {t("travel.referenceNoteTooltip")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addReferencePermit}
          data-testid="button-add-reference-permit"
        >
          <Plus className="h-4 w-4" />
          {t("travel.addReferenceDate")}
        </Button>
      </SectionCard>
    </div>
  );
}
