import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/state/AppStateContext";
import { SectionCard, Field } from "@/components/wizard/Field";
import { Input } from "@/components/ui/input";

export function StepPersonal() {
  const { t } = useTranslation();
  const { state, update } = useAppState();

  return (
    <SectionCard title={t("personal.title")} description={t("personal.description")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("personal.fullName")} htmlFor="fullName">
          <Input
            id="fullName"
            data-testid="input-full-name"
            placeholder={t("personal.fullNamePlaceholder")}
            value={state.personal.fullName}
            onChange={(e) => update("personal", { ...state.personal, fullName: e.target.value })}
          />
        </Field>
        <Field label={t("personal.passportNumber")} htmlFor="passportNumber">
          <Input
            id="passportNumber"
            data-testid="input-passport-number"
            placeholder={t("personal.passportNumberPlaceholder")}
            value={state.personal.passportNumber}
            onChange={(e) =>
              update("personal", { ...state.personal, passportNumber: e.target.value })
            }
          />
        </Field>
        <Field label={t("personal.arcNumber")} htmlFor="arcNumber">
          <Input
            id="arcNumber"
            data-testid="input-arc-number"
            placeholder={t("personal.arcNumberPlaceholder")}
            value={state.personal.arcNumber}
            onChange={(e) => update("personal", { ...state.personal, arcNumber: e.target.value })}
          />
        </Field>
        <Field
          label={t("personal.applicationDate")}
          description={t("personal.applicationDateDescription")}
          htmlFor="applicationDate"
        >
          <Input
            id="applicationDate"
            type="date"
            data-testid="input-application-date"
            value={state.personal.applicationDate}
            onChange={(e) =>
              update("personal", { ...state.personal, applicationDate: e.target.value })
            }
          />
        </Field>
      </div>

      {state.route === "marriage" && (
        <Field label={t("route.marriage")} htmlFor="marriageDate" className="pt-2 border-t border-border">
          <Input
            id="marriageDate"
            type="date"
            data-testid="input-marriage-date"
            value={state.marriageDate}
            onChange={(e) => update("marriageDate", e.target.value)}
          />
        </Field>
      )}
    </SectionCard>
  );
}
