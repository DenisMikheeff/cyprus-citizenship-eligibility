import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard, Field } from "@/components/wizard/Field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { evaluateEligibility, findNearestEligibleDate } from "@/lib/engine";
import { formatISODisplay } from "@/lib/state/engineHelpers";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export function StepArc() {
  const { t, i18n } = useTranslation();
  const { state, update, engineInput } = useAppState();
  const arc = state.arc;

  const setArc = (patch: Partial<typeof arc>) => update("arc", { ...arc, ...patch });

  // Item 5: keep the date pickers always visible for both checkboxes, but
  // auto-copy the relevant date whenever the source checkbox is checked, so
  // the copied value stays transparent and editable rather than hidden.
  useEffect(() => {
    if (arc.firstReceiptSameAsArc && arc.firstReceiptDate !== arc.arcDate) {
      setArc({ firstReceiptDate: arc.arcDate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arc.firstReceiptSameAsArc, arc.arcDate]);

  useEffect(() => {
    if (arc.firstReceiptWasBcs && arc.firstBcsReceiptDate !== arc.firstReceiptDate) {
      setArc({ firstBcsReceiptDate: arc.firstReceiptDate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arc.firstReceiptWasBcs, arc.firstReceiptDate]);

  // Item 3: nearest valid application date, recomputed live as ARC/receipt
  // data changes, plus a validity check for a previously-chosen application
  // date (entered on the Personal details step).
  const nearestEligible = useMemo(() => {
    if (!arc.arcDate) return null;
    try {
      return findNearestEligibleDate(engineInput, arc.arcDate);
    } catch {
      return null;
    }
  }, [engineInput, arc.arcDate]);

  const selectedDateCheck = useMemo(() => {
    if (!arc.arcDate || !state.personal.applicationDate) return null;
    try {
      return evaluateEligibility(
        { ...engineInput, applicationDate: state.personal.applicationDate },
        { skipThresholdDate: true }
      );
    } catch {
      return null;
    }
  }, [engineInput, arc.arcDate, state.personal.applicationDate]);

  return (
    <SectionCard title={t("arc.title")} description={t("arc.description")}>
      <Field
        label={t("arc.arcDate")}
        description={t("arc.arcDateDescription")}
        htmlFor="arcDate"
      >
        <Input
          id="arcDate"
          type="date"
          data-testid="input-arc-date"
          value={arc.arcDate}
          onChange={(e) => setArc({ arcDate: e.target.value })}
        />
      </Field>

      {arc.arcDate && (
        <div className="flex flex-col gap-2 rounded-md border border-teal-800/20 bg-surface p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-teal-800 mt-0.5 shrink-0" />
            <p className="text-xs text-teal-900" data-testid="text-nearest-valid-date">
              {nearestEligible?.found
                ? t("arc.nearestValidDateLabel", {
                    date: formatISODisplay(nearestEligible.date!, i18n.language),
                  })
                : t("arc.nearestValidDateNotFound")}
            </p>
          </div>
          {state.personal.applicationDate && selectedDateCheck && (
            <div className="flex items-start gap-2">
              {selectedDateCheck.eligible ? (
                <CheckCircle2 className="h-4 w-4 text-good mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-error mt-0.5 shrink-0" />
              )}
              <p
                className={`text-xs ${selectedDateCheck.eligible ? "text-good" : "text-error"}`}
                data-testid="text-selected-date-validity"
              >
                {selectedDateCheck.eligible
                  ? t("arc.applicationDateValid")
                  : t("arc.applicationDateInvalid")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-md border border-card-border p-3">
        <Switch
          id="includeArcDate"
          checked={arc.includeArcDate}
          onCheckedChange={(v) => setArc({ includeArcDate: v })}
          data-testid="switch-include-arc-date"
        />
        <Label htmlFor="includeArcDate" className="cursor-pointer">
          {t("arc.includeArcDate")}
        </Label>
      </div>

      <div className="pt-2 border-t border-border flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="sameAsArc"
            checked={arc.firstReceiptSameAsArc}
            onCheckedChange={(v) => setArc({ firstReceiptSameAsArc: Boolean(v) })}
            data-testid="checkbox-first-receipt-same-as-arc"
          />
          <Label htmlFor="sameAsArc" className="cursor-pointer text-sm">
            {t("arc.sameAsArc")}
          </Label>
        </div>
        <Field label={t("arc.firstReceiptDate")} htmlFor="firstReceiptDate">
          <Input
            id="firstReceiptDate"
            type="date"
            data-testid="input-first-receipt-date"
            value={arc.firstReceiptDate}
            disabled={arc.firstReceiptSameAsArc}
            onChange={(e) => setArc({ firstReceiptDate: e.target.value })}
          />
        </Field>
      </div>

      <div className="pt-2 border-t border-border flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="firstReceiptWasBcs"
            checked={arc.firstReceiptWasBcs}
            onCheckedChange={(v) => setArc({ firstReceiptWasBcs: Boolean(v) })}
            data-testid="checkbox-first-receipt-was-bcs"
          />
          <Label htmlFor="firstReceiptWasBcs" className="cursor-pointer text-sm">
            {t("arc.firstReceiptWasBcs")}
          </Label>
        </div>
        <Field
          label={t("arc.firstBcsReceiptDate")}
          description={t("arc.firstBcsReceiptDateDescription")}
          htmlFor="firstBcsReceiptDate"
        >
          <Input
            id="firstBcsReceiptDate"
            type="date"
            data-testid="input-first-bcs-receipt-date"
            value={arc.firstBcsReceiptDate}
            disabled={arc.firstReceiptWasBcs}
            onChange={(e) => setArc({ firstBcsReceiptDate: e.target.value })}
          />
        </Field>
      </div>

      <p className="text-xs text-muted-foreground italic" data-testid="text-arc-reference-note">
        {t("arc.referenceOnlyNote")}
      </p>
      <p className="text-xs text-muted-foreground italic" data-testid="text-arc-bcs-assumption-note">
        {t("arc.bcsAssumptionNote")}
      </p>
    </SectionCard>
  );
}
