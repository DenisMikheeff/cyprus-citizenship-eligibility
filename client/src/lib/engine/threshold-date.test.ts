import { describe, it, expect } from "vitest";
import { evaluateEligibility } from "./index";

describe("cumulative threshold reached date", () => {
  it("matches verify3.py ground truth (2025-07-05)", () => {
    const events = [
      { id: "1", date: "2022-08-13", type: "departure" as const },
      { id: "2", date: "2022-10-01", type: "arrival" as const },
      { id: "3", date: "2022-11-25", type: "departure" as const },
      { id: "4", date: "2022-11-27", type: "arrival" as const },
      { id: "5", date: "2022-12-13", type: "departure" as const },
      { id: "6", date: "2022-12-20", type: "arrival" as const },
      { id: "7", date: "2023-06-19", type: "departure" as const },
      { id: "8", date: "2023-06-20", type: "arrival" as const },
      { id: "9", date: "2023-12-20", type: "departure" as const },
      { id: "10", date: "2023-12-22", type: "arrival" as const },
      { id: "11", date: "2024-03-31", type: "departure" as const },
      { id: "12", date: "2024-04-07", type: "arrival" as const },
      { id: "13", date: "2025-09-26", type: "departure" as const },
      { id: "14", date: "2025-10-04", type: "arrival" as const },
      { id: "15", date: "2025-11-13", type: "departure" as const },
      { id: "16", date: "2025-11-16", type: "arrival" as const },
      { id: "17", date: "2026-02-03", type: "departure" as const },
      { id: "18", date: "2026-02-08", type: "arrival" as const },
      { id: "19", date: "2026-06-23", type: "departure" as const },
      { id: "20", date: "2026-07-05", type: "arrival" as const },
    ];
    const result = evaluateEligibility({
      route: "fast-track",
      greekLevel: "B1",
      arcDate: "2022-04-28",
      includeArcDate: false,
      events,
      applicationDate: "2026-08-04",
      bcsYearSettings: [],
    });
    console.log("thresholdReachedDate:", result.cumulative?.thresholdReachedDate);
    console.log("eligible:", result.eligible);
    console.log("actualDays:", result.cumulative?.actualDays, "requiredDays:", result.cumulative?.requiredDays);
    expect(result.cumulative?.thresholdReachedDate).toBe("2025-07-05");
  });
});
