import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";

export function M126Panel() {
  const { t } = useTranslation();
  const documents = t("m126.documents", { returnObjects: true }) as string[];

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border" data-testid="panel-m126">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="font-medium text-sm">{t("m126.title")}</p>
        <Badge variant="outline" className="self-start sm:self-auto shrink-0" data-testid="badge-m126-informational">{t("m126.badge")}</Badge>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-teal-800/20 bg-surface p-3">
        <Info className="h-4 w-4 text-teal-800 mt-0.5 shrink-0" />
        <p className="text-xs text-teal-900" data-testid="text-m126-not-calculator">
          {t("m126.description")}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">{t("m126.whereFiled")}</p>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">{t("m126.documentsHeading")}</h4>
        <ul className="flex flex-col gap-1.5" data-testid="list-m126-documents">
          {documents.map((doc, i) => (
            <li key={i} className="text-sm text-foreground/90 flex gap-2">
              <span className="text-teal-800">•</span>
              {doc}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 p-3">
        <AlertTriangle className="h-4 w-4 text-error mt-0.5 shrink-0" />
        <p className="text-xs text-error" data-testid="text-m126-age-cutoff-warning">
          {t("m126.ageCutoffWarning")}
        </p>
      </div>

      <div className="pt-2 border-t border-border flex flex-col gap-2">
        <p className="text-xs text-muted-foreground" data-testid="text-m126-counsel-note">
          {t("m126.counselNote")}
        </p>
        <a
          href={t("m126.sourceLink")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-teal-800 underline"
          data-testid="link-m126-source"
        >
          {t("m126.sourceLabel")}
        </a>
      </div>
    </div>
  );
}
