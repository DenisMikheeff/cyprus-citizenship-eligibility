import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppStateProvider, useAppState } from "@/lib/state/AppStateContext";
import { WizardShell, STEP_KEYS } from "@/components/wizard/WizardShell";
import { StepRoute } from "@/components/wizard/StepRoute";
import { StepPersonal } from "@/components/wizard/StepPersonal";
import { StepArc } from "@/components/wizard/StepArc";
import { StepTravel } from "@/components/wizard/StepTravel";
import { StepTrips } from "@/components/wizard/StepTrips";
import { StepToggles } from "@/components/wizard/StepToggles";
import { StepEducation } from "@/components/wizard/StepEducation";
import { StepExport } from "@/components/wizard/StepExport";
import { DownloadButton } from "@/components/wizard/FloatingDownloadButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { Globe, AlertTriangle } from "lucide-react";

const STEP_COMPONENTS = [
  StepRoute,
  StepPersonal,
  StepArc,
  StepTravel,
  StepTrips,
  StepToggles,
  StepEducation,
  StepExport,
];

function WizardContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const { t, i18n } = useTranslation();
  const { state } = useAppState();

  const StepComponent = STEP_COMPONENTS[currentStep];
  const isFastTrackBlocked = state.route === "fast-track" && !state.fastTrackConfirmed;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-lg text-darkteal" data-testid="text-app-title">
              {t("app.title")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("app.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select
              value={i18n.language}
              onValueChange={(v) => i18n.changeLanguage(v)}
            >
              <SelectTrigger className="w-32" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} data-testid={`option-language-${lang.code}`}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {currentStep === 0 ? (
          <div
            className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 p-3 mb-4"
            data-testid="text-app-disclaimer"
          >
            <AlertTriangle className="h-4 w-4 text-error mt-0.5 shrink-0" />
            <p className="text-xs text-error">
              {t("app.disclaimer")} {t("app.visaGapWarning")}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-4 rounded-md border border-border bg-surface p-3" data-testid="text-app-disclaimer">
            {t("app.disclaimer")}
          </p>
        )}

        <WizardShell
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
          onNext={() => setCurrentStep((s) => Math.min(STEP_KEYS.length - 1, s + 1))}
          canGoNext={currentStep === 0 ? !isFastTrackBlocked : true}
          downloadButton={<DownloadButton />}
        >
          <StepComponent />
        </WizardShell>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppStateProvider>
      <WizardContent />
    </AppStateProvider>
  );
}
