import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard } from "@/components/wizard/Field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { evaluateEligibility } from "@/lib/engine";
import { pdf } from "@react-pdf/renderer";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { CitizenshipPdf, buildPdfLabels } from "@/lib/pdf/CitizenshipPdf";
import { Download, AlertTriangle, Loader2 } from "lucide-react";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function StepExport() {
  const { t, i18n } = useTranslation();
  const { state, update, engineInput } = useAppState();
  const [generating, setGenerating] = useState<string | null>(null);

  const result = useMemo(() => {
    try {
      return evaluateEligibility(engineInput);
    } catch {
      return null;
    }
  }, [engineInput]);

  const sections = state.exportSections;
  const setSection = (key: keyof typeof sections, value: boolean) =>
    update("exportSections", { ...sections, [key]: value });

  const showMarriageNotice =
    state.route === "marriage" && sections.eligibility;

  const generatePdf = async (lang: "en" | "gr") => {
    registerPdfFonts();
    const localeCode = lang === "en" ? "en-GB" : "el-GR";
    const labels = buildPdfLabels(lang, (key: string) => {
      // Use the current i18n instance but force the target language's
      // resource bundle so EN/GR downloads are independent of the UI language.
      const targetLang = lang === "en" ? "en" : "el";
      return i18n.getFixedT(targetLang)(key) as string;
    });
    const doc = (
      <CitizenshipPdf
        lang={lang}
        labels={labels}
        state={state}
        result={result}
        sections={sections}
        customNote={state.exportCustomNote}
        locale={localeCode}
      />
    );
    const blob = await pdf(doc).toBlob();
    const filename = `cyprus-citizenship-record-${lang === "en" ? "EN" : "GR"}.pdf`;
    downloadBlob(blob, filename);
  };

  const handleDownload = async (target: "en" | "gr" | "both") => {
    setGenerating(target);
    try {
      if (target === "both") {
        await generatePdf("en");
        await generatePdf("gr");
      } else {
        await generatePdf(target);
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("export.sectionsHeading")} description={t("export.description")}>
        {(
          [
            ["header", t("export.sectionHeader")],
            ["travel", t("export.sectionTravel")],
            ["trips", t("export.sectionTrips")],
            ["eligibility", t("export.sectionEligibility")],
            ["education", t("export.sectionEducation")],
          ] as [keyof typeof sections, string][]
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={`section-${key}`}
              checked={sections[key]}
              onCheckedChange={(v) => setSection(key, Boolean(v))}
              data-testid={`checkbox-section-${key}`}
            />
            <Label htmlFor={`section-${key}`} className="cursor-pointer text-sm">
              {label}
            </Label>
          </div>
        ))}
      </SectionCard>

      <SectionCard title={t("export.editableNote")}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customNote">{t("export.customNoteLabel")}</Label>
          <Textarea
            id="customNote"
            data-testid="textarea-custom-note"
            value={state.exportCustomNote}
            onChange={(e) => update("exportCustomNote", e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="footerText">{t("export.footerLabel")}</Label>
          <Input
            id="footerText"
            data-testid="input-footer-text"
            value={state.exportFooterText}
            onChange={(e) => update("exportFooterText", e.target.value)}
          />
        </div>
      </SectionCard>

      {showMarriageNotice && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-bg p-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-warning" data-testid="text-marriage-notice-export">
            {t("export.marriageNoticeExport")}
          </p>
        </div>
      )}

      <SectionCard title={t("steps.export")}>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => handleDownload("en")}
            disabled={generating !== null}
            data-testid="button-download-en"
          >
            {generating === "en" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("export.downloadEn")}
          </Button>
          <Button
            type="button"
            onClick={() => handleDownload("gr")}
            disabled={generating !== null}
            data-testid="button-download-gr"
          >
            {generating === "gr" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("export.downloadGr")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDownload("both")}
            disabled={generating !== null}
            data-testid="button-download-both"
          >
            {generating === "both" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("export.downloadBoth")}
          </Button>
        </div>
        {generating && (
          <p className="text-xs text-muted-foreground" data-testid="text-generating">
            {t("export.generating")}
          </p>
        )}
      </SectionCard>
    </div>
  );
}
