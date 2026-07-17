import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppState, deriveCandidateYears } from "@/lib/state/AppStateContext";
import { SectionCard } from "@/components/wizard/Field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EligibilityHint } from "@/components/wizard/EligibilityHint";
import {
  evaluateEligibility,
  findNearestEligibleDate,
  suggestArcDateInclusion,
  suggestBcsConcessionForYear,
} from "@/lib/engine";
import { bcsPeriodRangeLabel, formatISODisplay } from "@/lib/state/engineHelpers";
import { X, Lightbulb, Search } from "lucide-react";

export function StepToggles() {
  const { t, i18n } = useTranslation();
  const { state, update, engineInput } = useAppState();

  // Item 11: BCS concession buckets are rolling 365-day windows from the
  // first BCS receipt date, not calendar years. Once that date is known,
  // show the actual date range instead of a bare year number.
  const bcsAnchor = state.arc.firstBcsReceiptDate;
  const bcsBucketLabel = (year: number) =>
    bcsAnchor ? bcsPeriodRangeLabel(bcsAnchor, year, i18n.language) : t("toggles.bcsYearLabel", { year });
  const [nearestResult, setNearestResult] = useState<
    ReturnType<typeof findNearestEligibleDate> | null
  >(null);

  const result = useMemo(() => {
    try {
      return evaluateEligibility(engineInput, { skipThresholdDate: true });
    } catch {
      return null;
    }
  }, [engineInput]);

  const candidateYears = useMemo(() => deriveCandidateYears(state), [state]);

  // Ensure bcsYearSettings has an entry for every candidate year (fast-track only).
  const ensureYearSettings = () => {
    if (state.route !== "fast-track") return;
    const existingYears = new Set(state.bcsYearSettings.map((s) => s.year));
    const missing = candidateYears.filter((y) => !existingYears.has(y));
    if (missing.length > 0) {
      update("bcsYearSettings", [
        ...state.bcsYearSettings,
        ...missing.map((y) => ({ year: y, heldBcsStatus: false, concessionOn: false })),
      ]);
    }
  };

  const searchFrom = state.personal.applicationDate || state.arc.arcDate || "2000-01-01";

  const arcSuggestion = useMemo(() => {
    try {
      return suggestArcDateInclusion(engineInput, searchFrom);
    } catch {
      return null;
    }
  }, [engineInput, searchFrom]);

  const bcsSuggestions = useMemo(() => {
    if (state.route !== "fast-track") return [];
    return state.bcsYearSettings
      .map((s) => {
        try {
          return { year: s.year, suggestion: suggestBcsConcessionForYear(engineInput, s.year, searchFrom) };
        } catch {
          return { year: s.year, suggestion: null };
        }
      })
      .filter((x) => x.suggestion !== null);
  }, [engineInput, searchFrom, state.bcsYearSettings, state.route]);

  const dismiss = (key: string) => {
    update("dismissedSuggestions", [...state.dismissedSuggestions, key]);
  };

  const runNearestSearch = () => {
    try {
      setNearestResult(findNearestEligibleDate(engineInput, searchFrom));
    } catch {
      setNearestResult(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {state.route === "fast-track" && (
        <SectionCard title={t("toggles.bcsTitle")} description={t("toggles.bcsDescription")}>
          <div className="flex items-center justify-end">
            <Button type="button" variant="outline" size="sm" onClick={ensureYearSettings} data-testid="button-populate-bcs-years">
              {t("toggles.populateYears")}
            </Button>
          </div>
          {state.bcsYearSettings.length > 0 && (
            <div className="flex flex-col gap-2">
              {state.bcsYearSettings.map((setting) => (
                <div
                  key={setting.year}
                  className="flex flex-wrap items-center gap-4 rounded-md border border-card-border p-2.5"
                  data-testid={`row-bcs-year-${setting.year}`}
                >
                  <span className="text-sm font-medium min-w-[9rem]">
                    {bcsBucketLabel(setting.year)}
                  </span>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={setting.heldBcsStatus}
                      data-testid={`switch-bcs-held-${setting.year}`}
                      onCheckedChange={(v) =>
                        update(
                          "bcsYearSettings",
                          state.bcsYearSettings.map((s) =>
                            s.year === setting.year ? { ...s, heldBcsStatus: v } : s
                          )
                        )
                      }
                    />
                    {t("toggles.heldBcsStatus")}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={setting.concessionOn}
                      disabled={!setting.heldBcsStatus}
                      data-testid={`switch-bcs-concession-${setting.year}`}
                      onCheckedChange={(v) =>
                        update(
                          "bcsYearSettings",
                          state.bcsYearSettings.map((s) =>
                            s.year === setting.year ? { ...s, concessionOn: v } : s
                          )
                        )
                      }
                    />
                    {t("toggles.concessionOn")}
                  </label>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard title={t("eligibility.title", "Live eligibility")}>
        <EligibilityHint result={result} />

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={runNearestSearch} data-testid="button-find-nearest-date">
            <Search className="h-4 w-4" />
            {t("eligibility.nearestEligibleTitle")}
          </Button>
        </div>

        {nearestResult && (
          <div className="rounded-md border border-teal-800/20 bg-surface p-3 text-sm" data-testid="text-nearest-result">
            {nearestResult.found ? (
              <p>
                {t("eligibility.nearestEligibleFound", {
                  date: formatISODisplay(nearestResult.date!, i18n.language),
                })}
              </p>
            ) : (
              <p>{t("eligibility.nearestEligibleNotFound")}</p>
            )}
          </div>
        )}

        {arcSuggestion && !state.dismissedSuggestions.includes("include-arc-date") && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-warning/30 bg-warning-bg p-3" data-testid="card-suggestion-arc">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning">
                {t("eligibility.improvementArc", { days: arcSuggestion.estimatedImprovementDays })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => update("arc", { ...state.arc, includeArcDate: true })}
                data-testid="button-apply-suggestion-arc"
              >
                {t("eligibility.applyToggle")}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => dismiss("include-arc-date")}
                data-testid="button-dismiss-suggestion-arc"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {bcsSuggestions.map(({ year, suggestion }) =>
          suggestion && !state.dismissedSuggestions.includes(`bcs-${year}`) ? (
            <div
              key={year}
              className="flex items-start justify-between gap-3 rounded-md border border-warning/30 bg-warning-bg p-3"
              data-testid={`card-suggestion-bcs-${year}`}
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-warning">
                  {t("eligibility.improvementBcs", {
                    period: bcsBucketLabel(year),
                    days: suggestion.estimatedImprovementDays,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    update(
                      "bcsYearSettings",
                      state.bcsYearSettings.map((s) => (s.year === year ? { ...s, concessionOn: true } : s))
                    )
                  }
                  data-testid={`button-apply-suggestion-bcs-${year}`}
                >
                  {t("eligibility.applyToggle")}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => dismiss(`bcs-${year}`)}
                  data-testid={`button-dismiss-suggestion-bcs-${year}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null
        )}
      </SectionCard>
    </div>
  );
}
