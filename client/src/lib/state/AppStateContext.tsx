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
      bcsAnchorDate: state.arc.firstBcsReceiptDate || undefined,
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
  const anchor = state.arc.firstBcsReceiptDate;
  if (anchor) {
    // Rolling 365-day BCS periods, bucketed relative to the anchor date.
    const anchorMs = new Date(anchor + "T00:00:00").getTime();
    const buckets = new Set<number>();
    const toBucket = (iso: string) => {
      const ms = new Date(iso + "T00:00:00").getTime();
      return Math.floor((ms - anchorMs) / 86400000 / 365);
    };
    buckets.add(0);
    if (state.arc.arcDate) buckets.add(toBucket(state.arc.arcDate));
    if (state.personal.applicationDate) buckets.add(toBucket(state.personal.applicationDate));
    for (const e of state.events as TravelEvent[]) buckets.add(toBucket(e.date));
    const arr = Array.from(buckets);
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const out: number[] = [];
    for (let b = min; b <= max; b++) out.push(b);
    return out;
  }

  // Fallback: plain calendar years (no BCS anchor set yet).
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
