// Download button shown inline next to the Continue button on every step
// except Export, so users can generate a PDF at any point in the flow --
// reinforcing that every field is optional and a record can be produced
// with as little (or as much) data as the user has entered so far.
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { evaluateEligibility } from "@/lib/engine";
import { downloadCitizenshipPdf } from "@/lib/pdf/downloadPdf";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2 } from "lucide-react";

export function DownloadButton() {
  const { t, i18n } = useTranslation();
  const { state, engineInput } = useAppState();
  const [generating, setGenerating] = useState<string | null>(null);

  const result = useMemo(() => {
    try {
      return evaluateEligibility(engineInput);
    } catch {
      return null;
    }
  }, [engineInput]);

  const handleDownload = async (target: "en" | "gr" | "both") => {
    setGenerating(target);
    try {
      await downloadCitizenshipPdf(target, {
        i18n,
        state,
        result,
        sections: state.exportSections,
      });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={generating !== null}
          data-testid="button-floating-download"
          title={t("export.floatingDownloadTooltip")}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t("export.floatingDownloadLabel")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleDownload("en")}
          data-testid="menuitem-floating-download-en"
        >
          {t("export.downloadEn")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDownload("gr")}
          data-testid="menuitem-floating-download-gr"
        >
          {t("export.downloadGr")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDownload("both")}
          data-testid="menuitem-floating-download-both"
        >
          {t("export.downloadBoth")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
