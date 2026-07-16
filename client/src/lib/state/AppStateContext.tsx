import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AppState, DEFAULT_APP_STATE } from "./types";
import type { EngineInput, TravelEvent } from "@/lib/engine";
import { evaluateEligibility, getYear } from "@/lib/state/engineHelpers";

interface AppStateContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  engineInput: EngineInput;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);

  const update = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const engineInput: EngineInput = useMemo(() => {
    const arcDate = state.arc.arcDate || state.personal.applicationDate || "2000-01-01";
    return {
      route: state.route,
      greekLevel: state.route === "marriage" ? undefined : state.greekLevel,
      arcDate,
      includeArcDate: state.arc.includeArcDate,
      events: state.events,
      applicationDate: state.personal.applicationDate || arcDate,
      bcsYearSettings: state.bcsYearSettings,
      marriageDate: state.route === "marriage" ? state.marriageDate : undefined,
    };
  }, [state]);

  const value: AppStateContextValue = { state, setState, update, engineInput };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

/** Years spanned by the current travel log + ARC date, used to auto-populate
 * the BCS-year-settings list (fast-track only) without the user typing years
 * manually. */
export function deriveCandidateYears(state: AppState): number[] {
  const years = new Set<number>();
  if (state.arc.arcDate) years.add(getYear(state.arc.arcDate));
  if (state.personal.applicationDate) years.add(getYear(state.personal.applicationDate));
  for (const e of state.events as TravelEvent[]) years.add(getYear(e.date));
  const yearsArr = Array.from(years);
  if (yearsArr.length === 0) return [];
  const min = Math.min(...yearsArr);
  const max = Math.max(...yearsArr);
  const out: number[] = [];
  for (let y = min; y <= max; y++) out.push(y);
  return out;
}

export { evaluateEligibility };
