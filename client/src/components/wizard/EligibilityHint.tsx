import { useTranslation } from "react-i18next";
import type { EligibilityResult } from "@/lib/engine";
import { formatISODisplay } from "@/lib/state/engineHelpers";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Persistent live eligibility summary card — recomputed by the caller on
 * every state change and passed in as `result`. Pure/presentational. */
export function EligibilityHint({ result }: { result: EligibilityResult | null }) {
  const { t, i18n } = useTranslation();

  if (!result) {
    return (
      <div className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground" data-testid="text-eligibility-pending">
        {t("eligibility.needMoreData")}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border p-4 flex flex-col gap-2",
        result.eligible ? "border-good/30 bg-good-bg" : "border-error/30 bg-error/5"
      )}
      data-testid="card-eligibility-hint"
    >
      <div className="flex items-center gap-2">
        {result.eligible ? (
          <CheckCircle2 className="h-5 w-5 text-good shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-error shrink-0" />
        )}
        <p
          className={cn("font-display font-bold text-sm", result.eligible ? "text-good" : "text-error")}
          data-testid="text-eligibility-verdict"
        >
          {result.eligible ? t("eligibility.eligible") : t("eligibility.notEligible")}
        </p>
      </div>

      <ul className="text-xs text-muted-foreground flex flex-col gap-1 pl-1">
        {result.reasons.map((reason) => (
          <li key={reason} data-testid={`text-reason-${reason}`}>
            • {t(`common.reasons.${reason}`, reason)}
          </li>
        ))}
      </ul>

      {result.anniversary?.found && (
        <p className="text-xs text-muted-foreground" data-testid="text-anniversary-start">
          {t("eligibility.anniversaryStart", {
            date: formatISODisplay(result.anniversary.anniversaryStart!, i18n.language),
          })}
        </p>
      )}

      {result.cumulative && (
        <p className="text-xs text-muted-foreground" data-testid="text-cumulative-summary">
          {t("eligibility.cumulativeSummary", {
            actual: result.cumulative.actualDays,
            required: result.cumulative.requiredDays,
            shortfall: result.cumulative.shortfallDays,
          })}
        </p>
      )}

      {result.marriage && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p data-testid="text-marriage-years">
            {t("eligibility.marriageYears", {
              years: result.marriage.yearsMarried.toFixed(2),
              met: result.marriage.yearsMarriedMet ? t("common.yes") : t("common.no"),
            })}
          </p>
          <p data-testid="text-marriage-residence">
            {t("eligibility.marriageResidence", {
              actual: result.marriage.cumulativeResidenceDays,
              required: result.marriage.requiredResidenceDays,
            })}
          </p>
        </div>
      )}

      {result.reasons.includes("marriage-final-period-unconfirmed") && (
        <p className="text-xs text-warning font-medium" data-testid="text-marriage-unconfirmed-hint">
          {t("eligibility.marriageUnconfirmedNotice")}
        </p>
      )}
    </div>
  );
}
