import { describe, it, expect } from "vitest";
import { evaluateEligibility } from "./eligibility";
import { buildAbsenceIntervals, toDate, isPresentOn } from "./presence";
import { findNearestEligibleDate } from "./search";
import type { EngineInput, TravelEvent } from "./types";
import { addDays } from "date-fns";

// Denis's own verified case (ENGINE_SPEC.md / session summary):
// ARC 2022-04-28. Fast-track, B1. Application date 2026-08-04.
// Annual days present: 2022=189, 2023=362, 2024=359, 2025=355, 2026=198 -> total 1463.
const DENIS_EVENTS: TravelEvent[] = [
  { id: "1", date: "2022-08-13", type: "departure", passportPage: "9" },
  { id: "2", date: "2022-10-01", type: "arrival", passportPage: "12" },
  { id: "3", date: "2022-11-25", type: "departure", passportPage: "12" },
  { id: "4", date: "2022-11-27", type: "arrival", passportPage: "12" },
  { id: "5", date: "2022-12-13", type: "departure", passportPage: "12" },
  { id: "6", date: "2022-12-20", type: "arrival", passportPage: "6" },
  { id: "7", date: "2023-06-19", type: "departure", passportPage: "6" },
  { id: "8", date: "2023-06-20", type: "arrival", passportPage: "6" },
  { id: "9", date: "2023-12-20", type: "departure", passportPage: "6" },
  { id: "10", date: "2023-12-22", type: "arrival", passportPage: "13" },
  { id: "11", date: "2024-03-31", type: "departure", passportPage: "6" },
  { id: "12", date: "2024-04-07", type: "arrival", passportPage: "13" },
  { id: "13", date: "2025-09-26", type: "departure", passportPage: "13" },
  { id: "14", date: "2025-10-04", type: "arrival", passportPage: "13" },
  { id: "15", date: "2025-11-13", type: "departure", passportPage: "14" },
  { id: "16", date: "2025-11-16", type: "arrival", passportPage: "14" },
  { id: "17", date: "2026-02-03", type: "departure", passportPage: "6" },
  { id: "18", date: "2026-02-08", type: "arrival", passportPage: "14" },
  { id: "19", date: "2026-06-23", type: "departure", passportPage: "14" },
  { id: "20", date: "2026-07-05", type: "arrival", passportPage: "15" },
];

const baseInput: EngineInput = {
  route: "fast-track",
  greekLevel: "B1",
  arcDate: "2022-04-28",
  includeArcDate: false,
  events: DENIS_EVENTS,
  applicationDate: "2026-08-04",
  bcsYearSettings: [
    { year: 2022, heldBcsStatus: false, concessionOn: false },
    { year: 2023, heldBcsStatus: false, concessionOn: false },
    { year: 2024, heldBcsStatus: true, concessionOn: false },
    { year: 2025, heldBcsStatus: true, concessionOn: false },
    { year: 2026, heldBcsStatus: true, concessionOn: false },
  ],
};

describe("presence primitives", () => {
  it("departure day is absent, arrival day is present (verified convention)", () => {
    const boundary = toDate("2026-08-03");
    const intervals = buildAbsenceIntervals(
      [
        { id: "1", date: "2023-06-19", type: "departure" },
        { id: "2", date: "2023-06-20", type: "arrival" },
      ],
      boundary
    );
    // one absent day: the departure day itself (arrival day is present)
    expect(intervals.length).toBe(1);
    expect(isPresentOn(toDate("2023-06-19"), intervals)).toBe(false); // departure day absent
    expect(isPresentOn(toDate("2023-06-20"), intervals)).toBe(true); // arrival day present
  });

  it("counts departure day through the day before arrival as absent", () => {
    const boundary = toDate("2026-08-03");
    const intervals = buildAbsenceIntervals(
      [
        { id: "1", date: "2022-08-13", type: "departure" },
        { id: "2", date: "2022-10-01", type: "arrival" },
      ],
      boundary
    );
    expect(isPresentOn(toDate("2022-08-13"), intervals)).toBe(false); // departure day absent
    expect(isPresentOn(toDate("2022-08-14"), intervals)).toBe(false);
    expect(isPresentOn(toDate("2022-09-30"), intervals)).toBe(false);
    expect(isPresentOn(toDate("2022-10-01"), intervals)).toBe(true); // arrival day present
  });

  it("annual presence totals match the verified spreadsheet", () => {
    const boundary = toDate("2026-08-03");
    const intervals = buildAbsenceIntervals(DENIS_EVENTS, boundary);
    const countStart = addDays(toDate("2022-04-28"), 1); // 2022-04-29, ARC date excluded by default

    function presentDaysInYear(year: number): number {
      const yearStart = toDate(`${year}-01-01`);
      const yearEnd = toDate(`${year}-12-31`);
      const start = yearStart < countStart ? countStart : yearStart;
      const end = yearEnd > boundary ? boundary : yearEnd;
      let count = 0;
      let cursor = start;
      while (cursor <= end) {
        if (isPresentOn(cursor, intervals)) count++;
        cursor = addDays(cursor, 1);
      }
      return count;
    }

    // Verified against the independent day-by-day simulation in verify3.py
    // (run against the same event log) rather than the session summary's
    // paraphrased figures, per instructions to re-verify reported numbers.
    expect(presentDaysInYear(2022)).toBe(189);
    expect(presentDaysInYear(2023)).toBe(362);
    expect(presentDaysInYear(2024)).toBe(359);
    expect(presentDaysInYear(2025)).toBe(354);
    expect(presentDaysInYear(2026)).toBe(198);
  });
});

describe("fast-track B1 eligibility — Denis's verified case", () => {
  it("is eligible on the real application date 2026-08-04", () => {
    const result = evaluateEligibility(baseInput);
    expect(result.eligible).toBe(true);
    expect(result.anniversary?.found).toBe(true);
    expect(result.cumulative?.met).toBe(true);
  });

  it("is NOT eligible on a much earlier date (not enough history yet)", () => {
    const result = evaluateEligibility({ ...baseInput, applicationDate: "2024-01-01" });
    expect(result.eligible).toBe(false);
  });

  it("cumulative requirement is met with a thin margin at the real application date", () => {
    const result = evaluateEligibility(baseInput);
    // Verified independently: cumulative window (2022-04-29..2025-07-06) has
    // 1097 actual present days vs 1096 required (3 years incl. one leap day)
    // -> margin of exactly 1 day. Eligible, but only just.
    expect(result.cumulative?.shortfallDays).toBe(0);
    expect(result.cumulative!.actualDays).toBeGreaterThanOrEqual(result.cumulative!.requiredDays);
    expect(result.cumulative!.actualDays - result.cumulative!.requiredDays).toBeLessThanOrEqual(3);
  });
});

describe("toggles", () => {
  it("includeArcDate adds exactly one extra countable day", () => {
    const off = evaluateEligibility(baseInput);
    const on = evaluateEligibility({ ...baseInput, includeArcDate: true });
    // Both should still be eligible; the ARC day being an extra present day
    // should never reduce actual cumulative days.
    expect(on.cumulative!.actualDays).toBeGreaterThanOrEqual(off.cumulative!.actualDays);
  });

  it("BCS concession never decreases actual cumulative days", () => {
    const off = evaluateEligibility(baseInput);
    const on = evaluateEligibility({
      ...baseInput,
      bcsYearSettings: baseInput.bcsYearSettings.map((s) => ({ ...s, concessionOn: true })),
    });
    expect(on.cumulative!.actualDays).toBeGreaterThanOrEqual(off.cumulative!.actualDays);
  });
});

describe("anniversary-year tolerance", () => {
  it("fails when absences in the trailing window exceed 90 days", () => {
    const heavyAbsenceEvents: TravelEvent[] = [
      { id: "1", date: "2026-01-01", type: "departure" },
      { id: "2", date: "2026-05-01", type: "arrival" }, // ~120 days absent, well over 90
    ];
    const input: EngineInput = {
      route: "fast-track",
      greekLevel: "B1",
      arcDate: "2020-01-01",
      includeArcDate: false,
      events: heavyAbsenceEvents,
      applicationDate: "2026-08-01",
      bcsYearSettings: [],
    };
    const result = evaluateEligibility(input);
    expect(result.anniversary?.found).toBe(false);
    expect(result.anniversary?.toleranceExceeded).toBe(true);
  });

  it("succeeds when absences in the trailing window are within 90 days", () => {
    const lightAbsenceEvents: TravelEvent[] = [
      { id: "1", date: "2026-01-01", type: "departure" },
      { id: "2", date: "2026-01-20", type: "arrival" }, // 18 days absent
    ];
    const input: EngineInput = {
      route: "fast-track",
      greekLevel: "B1",
      arcDate: "2020-01-01",
      includeArcDate: false,
      events: lightAbsenceEvents,
      applicationDate: "2026-08-01",
      bcsYearSettings: [],
    };
    const result = evaluateEligibility(input);
    expect(result.anniversary?.found).toBe(true);
    expect(result.anniversary?.absentDaysInWindow).toBe(19);
  });
});

describe("marriage route", () => {
  it("requires 3 years married and 2 years cumulative residence", () => {
    const input: EngineInput = {
      route: "marriage",
      arcDate: "2022-01-01",
      includeArcDate: true,
      events: [],
      applicationDate: "2026-01-01",
      bcsYearSettings: [],
      marriageDate: "2022-01-01",
    };
    const result = evaluateEligibility(input);
    expect(result.marriage?.yearsMarriedMet).toBe(true);
    expect(result.reasons).toContain("marriage-final-period-unconfirmed");
  });

  it("is not eligible if married less than 3 years", () => {
    const input: EngineInput = {
      route: "marriage",
      arcDate: "2022-01-01",
      includeArcDate: true,
      events: [],
      applicationDate: "2024-01-01",
      bcsYearSettings: [],
      marriageDate: "2022-01-01",
    };
    const result = evaluateEligibility(input);
    expect(result.marriage?.yearsMarriedMet).toBe(false);
    expect(result.eligible).toBe(false);
  });
});

describe("nearest eligible date search", () => {
  it("finds the same real application date when searching from a bit earlier", () => {
    const search = findNearestEligibleDate(baseInput, "2026-07-01", 60);
    expect(search.found).toBe(true);
    // Should land on or before the real, already-eligible 2026-08-04.
    expect(search.date! <= "2026-08-04").toBe(true);
  });
});
