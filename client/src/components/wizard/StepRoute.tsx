import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard } from "@/components/wizard/Field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getRouteYearsBreakdown, type GreekLevel, type Route } from "@/lib/engine";
import { AlertTriangle } from "lucide-react";
import { M126Panel } from "@/components/wizard/StepM126";

type RouteSelection = Route | "m126";

export function StepRoute() {
  const { t } = useTranslation();
  const { state, update } = useAppState();
  const [selection, setSelection] = useState<RouteSelection>(state.route);

  const routes: { value: Route; title: string; desc: string }[] = [
    { value: "fast-track", title: t("route.fastTrack"), desc: t("route.fastTrackDesc") },
    { value: "standard", title: t("route.standard"), desc: t("route.standardDesc") },
    { value: "marriage", title: t("route.marriage"), desc: t("route.marriageDesc") },
  ];

  const handleSelectionChange = (v: string) => {
    const next = v as RouteSelection;
    setSelection(next);
    if (next !== "m126") {
      update("route", next as Route);
    }
  };

  return (
    <SectionCard title={t("route.title")} description={t("route.description")}>
      <RadioGroup
        value={selection}
        onValueChange={handleSelectionChange}
        data-testid="radiogroup-route"
      >
        {routes.map((r) => (
          <label
            key={r.value}
            htmlFor={`route-${r.value}`}
            className="flex items-start gap-3 rounded-md border border-card-border p-3 cursor-pointer hover-elevate"
          >
            <RadioGroupItem
              value={r.value}
              id={`route-${r.value}`}
              data-testid={`radio-route-${r.value}`}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-sm">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          </label>
        ))}
        <label
          htmlFor="route-m126"
          className="flex items-start gap-3 rounded-md border border-card-border p-3 cursor-pointer hover-elevate"
        >
          <RadioGroupItem
            value="m126"
            id="route-m126"
            data-testid="radio-route-m126"
            className="mt-1"
          />
          <div>
            <p className="font-medium text-sm">{t("m126.routeCardTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("m126.routeCardDesc")}</p>
          </div>
        </label>
      </RadioGroup>

      {selection === "m126" && <M126Panel />}

      {selection !== "m126" && state.route === "fast-track" && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-bg p-3">
          <Checkbox
            id="fast-track-confirm"
            checked={state.fastTrackConfirmed}
            onCheckedChange={(v) => update("fastTrackConfirmed", Boolean(v))}
            className="mt-0.5"
            data-testid="checkbox-fast-track-confirm"
          />
          <Label htmlFor="fast-track-confirm" className="text-xs text-warning font-normal leading-relaxed cursor-pointer">
            {t("route.fastTrackConfirmLabel")}
          </Label>
        </div>
      )}

      {selection !== "m126" && state.route !== "marriage" && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <Label>{t("route.greekLevelLabel")}</Label>
          <p className="text-xs text-muted-foreground -mt-2">{t("route.greekLevelDescription")}</p>
          <RadioGroup
            value={state.greekLevel}
            onValueChange={(v) => update("greekLevel", v as GreekLevel)}
            data-testid="radiogroup-greek-level"
          >
            {[
              { value: "B1" as GreekLevel, label: t("route.greekB1") },
              ...(state.route === "fast-track"
                ? [{ value: "A2" as GreekLevel, label: t("route.greekA2") }]
                : []),
              ...(state.route === "fast-track" || state.route === "standard"
                ? [{ value: "exempt" as GreekLevel, label: t("route.greekExempt") }]
                : []),
            ].map((opt) => (
              <label
                key={opt.value}
                htmlFor={`greek-${opt.value}`}
                className="flex items-center gap-3 rounded-md border border-card-border p-2.5 cursor-pointer hover-elevate"
              >
                <RadioGroupItem value={opt.value} id={`greek-${opt.value}`} data-testid={`radio-greek-${opt.value}`} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>

          <p className="text-sm font-medium text-teal-800 mt-1" data-testid="text-total-years">
            {(() => {
              const breakdown = getRouteYearsBreakdown(state.route, state.greekLevel);
              if (breakdown.kind !== "cumulative-plus-anniversary") return null;
              return t("route.totalYears", {
                label: t("route.totalYearsBreakdown", {
                  count: breakdown.totalYears,
                  cumulative: breakdown.cumulativeYears,
                }),
              });
            })()}
          </p>
        </div>
      )}

      {selection !== "m126" && state.route === "marriage" && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-bg p-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-warning" data-testid="text-marriage-notice-route">
            {t("route.marriageNotice")}
          </p>
        </div>
      )}
    </SectionCard>
  );
}
