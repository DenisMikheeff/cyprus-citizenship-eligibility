import { useTranslation } from "react-i18next";
import { SectionCard } from "@/components/wizard/Field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface SourceEntry {
  label: string;
  url: string;
}

export function StepEducation() {
  const { t } = useTranslation();

  const sources = t("education.sources", { returnObjects: true }) as SourceEntry[];
  const routeRows: string[][] = [
    t("education.routeFastTrackB1", { returnObjects: true }) as string[],
    t("education.routeFastTrackA2", { returnObjects: true }) as string[],
    t("education.routeStandard", { returnObjects: true }) as string[],
    t("education.routeMarriage", { returnObjects: true }) as string[],
  ];
  const routeHeaders = t("education.routeTableHeader", { returnObjects: true }) as string[];

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t("steps.education")} description={t("app.disclaimer")}>
        <div>
          <h3 className="font-display font-bold text-sm text-darkteal mb-1">
            {t("education.anniversaryHeading")}
          </h3>
          <p className="text-sm text-foreground/90 whitespace-pre-line">{t("education.anniversaryBody")}</p>
        </div>

        <div className="rounded-md border border-card-border bg-surface p-3">
          <h4 className="font-medium text-sm mb-1">{t("education.anniversaryExampleHeading")}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line" data-testid="text-anniversary-example">
            {t("education.anniversaryExample")}
          </p>
        </div>
      </SectionCard>

      <SectionCard title={t("education.cumulativeHeading")}>
        <p className="text-sm text-foreground/90 whitespace-pre-line">{t("education.cumulativeBody")}</p>

        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-bg p-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-warning">
              {t("education.cumulativeInterpretationHeading")}
            </p>
            <p className="text-xs text-warning mt-1 whitespace-pre-line">
              {t("education.cumulativeInterpretationBody")}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("education.routeHeading")}>
        <div className="overflow-x-auto">
          <Table data-testid="table-route-comparison">
            <TableHeader>
              <TableRow>
                {routeHeaders.map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {routeRows.map((row, i) => (
                <TableRow key={i} data-testid={`row-route-comparison-${i}`}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard title={t("education.togglesHeading")}>
        <p className="text-sm text-foreground/90 whitespace-pre-line">{t("education.togglesBody")}</p>
      </SectionCard>

      <SectionCard
        title={t("education.amendmentHeading")}
        badge={<Badge variant="outline">Dec 2023</Badge>}
      >
        <p className="text-sm text-foreground/90 whitespace-pre-line">{t("education.amendmentBody")}</p>
      </SectionCard>

      <SectionCard title={t("education.sourcesHeading")}>
        <ul className="flex flex-col gap-1.5" data-testid="list-education-sources">
          {sources.map((s, i) => (
            <li key={i} className="text-sm">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-800 underline hover:text-teal-900"
                data-testid={`link-source-${i}`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
