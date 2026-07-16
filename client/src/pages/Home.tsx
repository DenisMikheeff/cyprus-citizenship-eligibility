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
import { FloatingDownloadButton } from "@/components/wizard/FloatingDownloadButton";
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
  const isExportStep = currentStep === STEP_KEYS.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <div
        className="border-b border-warning/40 bg-warning-bg"
        data-testid="banner-visa-gap-warning"
      >
        <div className="mx-auto max-w-3xl px-4 py-2.5 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-warning">{t("app.visaGapWarning")}</p>
        </div>
      </div>
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
        <p className="text-xs text-muted-foreground mb-4 rounded-md border border-border bg-surface p-3" data-testid="text-app-disclaimer">
          {t("app.disclaimer")}
        </p>

        <WizardShell
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
          onNext={() => setCurrentStep((s) => Math.min(STEP_KEYS.length - 1, s + 1))}
          canGoNext={currentStep === 0 ? !isFastTrackBlocked : true}
        >
          <StepComponent />
        </WizardShell>
      </main>

      {!isExportStep && <FloatingDownloadButton />}
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
