// Small helpers that wrap engine utilities for UI convenience. Does not
// modify or duplicate engine logic — only reformats/derives from it.
export { evaluateEligibility } from "@/lib/engine";

export function getYear(iso: string): number {
  return parseInt(iso.slice(0, 4), 10);
}

export function formatISODisplay(iso: string, locale: string = "en-GB"): string {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

/** Human-readable date range for a rolling 365-day BCS concession bucket,
 * counted from `anchorISO` (the applicant's first BCS status date). */
export function bcsPeriodRangeLabel(
  anchorISO: string,
  bucket: number,
  locale: string = "en-GB"
): string {
  const anchorMs = new Date(anchorISO + "T00:00:00").getTime();
  const startMs = anchorMs + bucket * 365 * 86400000;
  const endMs = startMs + 364 * 86400000;
  const toISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return `${formatISODisplay(toISO(startMs), locale)} – ${formatISODisplay(toISO(endMs), locale)}`;
}
