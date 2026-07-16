import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard, Field } from "@/components/wizard/Field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function StepArc() {
  const { t } = useTranslation();
  const { state, update } = useAppState();
  const arc = state.arc;

  const setArc = (patch: Partial<typeof arc>) => update("arc", { ...arc, ...patch });

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
        {!arc.firstReceiptSameAsArc && (
          <Field label={t("arc.firstReceiptDate")} htmlFor="firstReceiptDate">
            <Input
              id="firstReceiptDate"
              type="date"
              data-testid="input-first-receipt-date"
              value={arc.firstReceiptDate}
              onChange={(e) => setArc({ firstReceiptDate: e.target.value })}
            />
          </Field>
        )}
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
        <Field label={t("arc.firstBcsReceiptDate")} htmlFor="firstBcsReceiptDate">
          <Input
            id="firstBcsReceiptDate"
            type="date"
            data-testid="input-first-bcs-receipt-date"
            value={arc.firstBcsReceiptDate}
            onChange={(e) => setArc({ firstBcsReceiptDate: e.target.value })}
          />
        </Field>
      </div>

      <p className="text-xs text-muted-foreground italic" data-testid="text-arc-reference-note">
        {t("arc.referenceOnlyNote")}
      </p>
    </SectionCard>
  );
}
