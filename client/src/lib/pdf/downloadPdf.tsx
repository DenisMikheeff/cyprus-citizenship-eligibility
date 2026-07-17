// Shared PDF-generation logic used by both the Export step's download
// buttons and the floating download button available on every other step.
// Extracted from StepExport.tsx so the two entry points stay in sync.
import { pdf } from "@react-pdf/renderer";
import type { i18n as I18nInstance } from "i18next";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { CitizenshipPdf, buildPdfLabels } from "@/lib/pdf/CitizenshipPdf";
import type { AppState, ExportSectionToggles } from "@/lib/state/types";
import type { EligibilityResult } from "@/lib/engine";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface PdfGenerationContext {
  i18n: I18nInstance;
  state: AppState;
  result: EligibilityResult | null;
  sections: ExportSectionToggles;
}

export async function generateCitizenshipPdf(lang: "en" | "gr", ctx: PdfGenerationContext) {
  registerPdfFonts();
  const localeCode = lang === "en" ? "en-GB" : "el-GR";
  const labels = buildPdfLabels(lang, (key: string, opts?: Record<string, unknown>) => {
    // Use the current i18n instance but force the target language's
    // resource bundle so EN/GR downloads are independent of the UI language.
    const targetLang = lang === "en" ? "en" : "el";
    return ctx.i18n.getFixedT(targetLang)(key, opts) as string;
  });
  const doc = (
    <CitizenshipPdf
      lang={lang}
      labels={labels}
      state={ctx.state}
      result={ctx.result}
      sections={ctx.sections}
      customNote={ctx.state.exportCustomNote}
      customNoteHeader={ctx.state.exportCustomNoteHeader}
      locale={localeCode}
    />
  );
  const blob = await pdf(doc).toBlob();
  const filename = `cyprus-citizenship-record-${lang === "en" ? "EN" : "GR"}.pdf`;
  downloadBlob(blob, filename);
}

export async function downloadCitizenshipPdf(
  target: "en" | "gr" | "both",
  ctx: PdfGenerationContext
) {
  if (target === "both") {
    await generateCitizenshipPdf("en", ctx);
    await generateCitizenshipPdf("gr", ctx);
  } else {
    await generateCitizenshipPdf(target, ctx);
  }
}
