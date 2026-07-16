import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard } from "@/components/wizard/Field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getRouteYearsBreakdown, type GreekLevel, type Route } from "@/lib/engine";
import { AlertTriangle } from "lucide-react";

export function StepRoute() {
  const { t } = useTranslation();
  const { state, update } = useAppState();

  const routes: { value: Route; title: string; desc: string }[] = [
    { value: "fast-track", title: t("route.fastTrack"), desc: t("route.fastTrackDesc") },
    { value: "standard", title: t("route.standard"), desc: t("route.standardDesc") },
    { value: "marriage", title: t("route.marriage"), desc: t("route.marriageDesc") },
  ];

  return (
    <SectionCard title={t("route.title")} description={t("route.description")}>
      <RadioGroup
        value={state.route}
        onValueChange={(v) => update("route", v as Route)}
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
      </RadioGroup>

      {state.route !== "marriage" && (
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
              ...(state.route === "fast-track"
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

      {state.route === "marriage" && (
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
