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
