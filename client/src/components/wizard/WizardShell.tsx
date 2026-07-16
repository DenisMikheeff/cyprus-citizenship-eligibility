import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEP_KEYS = [
  "route",
  "personal",
  "arc",
  "travel",
  "trips",
  "eligibility",
  "education",
  "export",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

interface WizardShellProps {
  currentStep: number;
  onStepChange: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  canGoNext: boolean;
  children: ReactNode;
}

export function WizardShell({
  currentStep,
  onStepChange,
  onBack,
  onNext,
  canGoNext,
  children,
}: WizardShellProps) {
  const { t } = useTranslation();
  const total = STEP_KEYS.length;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Wizard steps" className="overflow-x-auto -mx-1 px-1">
        <ol className="flex items-center gap-1 min-w-max" data-testid="wizard-steps">
          {STEP_KEYS.map((key, idx) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <li key={key} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onStepChange(idx)}
                  data-testid={`button-step-${key}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors hover-elevate",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : isDone
                      ? "bg-good-bg text-good border-good/30"
                      : "bg-card text-muted-foreground border-card-border"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                      isActive ? "bg-primary-foreground/20" : "bg-transparent"
                    )}
                  >
                    {idx + 1}
                  </span>
                  {t(`steps.${key}`)}
                </button>
                {idx < total - 1 && <span className="h-px w-3 bg-border" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <p className="text-xs text-muted-foreground" data-testid="text-step-progress">
        {t("nav.step", { current: currentStep + 1, total })}
      </p>

      <div className="min-h-[320px]">{children}</div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={currentStep === 0}
          data-testid="button-wizard-back"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("nav.back")}
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || currentStep === total - 1}
          data-testid="button-wizard-next"
        >
          {t("nav.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
