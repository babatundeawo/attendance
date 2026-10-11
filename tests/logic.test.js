import { describe, expect, it } from "vitest";
import {
  autoParent,
  csvCell,
  currentWeekIndex,
  dayPoints,
  initials,
  isSchoolDay,
  nextOrderFor,
  sessionTally,
  sortStudents,
  termSummary,
  toCsv,
  weekDates,
  weekSummary,
} from "../src/logic.js";

const TERM = "2026-09-14"; // a Monday
const students = [
  { id: "a", name: "ADAMS JOHN", gender: "M", order: 1 },
  { id: "b", name: "BELLO MARY", gender: "F", order: 0 },
  { id: "c", name: "CHUKWU PAUL", gender: "M", order: 0 },
];
const attendance = {
  "2026-09-14": { a: { morning: true, afternoon: true }, b: { morning: true }, c: {} },
  "2026-09-15": { a: { morning: true }, b: { morning: true, afternoon: true } },
};

describe("dates", () => {
  it("lists the five weekdays of a week", () => {
    expect(weekDates(TERM, 1)).toEqual(["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"]);
    expect(weekDates(TERM, 2)[0]).toBe("2026-09-21");
  });

  it("finds the current week and clamps it to the term", () => {
    expect(currentWeekIndex(TERM, 13, "2026-09-16")).toBe(1);
    expect(currentWeekIndex(TERM, 13, "2026-09-19")).toBe(2); // Saturday rolls to next week
    expect(currentWeekIndex(TERM, 13, "2027-06-01")).toBe(13);
  });

  it("treats weekends, holidays and future dates as non-school days", () => {
    const holidays = { "2026-09-16": { label: "Break" } };
    expect(isSchoolDay("2026-09-14", holidays, "2026-09-18")).toBe(true);
    expect(isSchoolDay("2026-09-19", holidays, "2026-09-25")).toBe(false); // Saturday
    expect(isSchoolDay("2026-09-16", holidays, "2026-09-18")).toBe(false); // holiday
    expect(isSchoolDay("2026-09-18", holidays, "2026-09-17")).toBe(false); // future
  });
});

describe("attendance maths", () => {
  it("counts points and tallies per session", () => {
    expect(dayPoints(attendance, "2026-09-14", "a")).toBe(2);
    expect(dayPoints(attendance, "2026-09-14", "c")).toBe(0);
    expect(dayPoints(attendance, "2026-09-20", "a")).toBe(0);
    expect(sessionTally(attendance, students, "2026-09-14", "morning")).toBe(2);
    expect(sessionTally(attendance, students, "2026-09-14", "afternoon")).toBe(1);
  });

  it("summarises a week", () => {
    const s = weekSummary({ students, attendance, holidays: {}, termStart: TERM, week: 1, today: "2026-09-15" });
    expect(s.schoolDays).toBe(2);
    expect(s.wkM).toBe(4);
    expect(s.wkA).toBe(2);
    expect(s.actual).toBe(6);
    expect(s.pct).toBeCloseTo((6 / 12) * 100);
    expect(s.days.map((d) => d.kind)).toEqual(["school", "school", "future", "future", "future"]);
    expect(s.groups.M.map((r) => r.st.id)).toEqual(["c", "a"]); // register order
    expect(s.groups.M.find((r) => r.st.id === "a").pts).toBe(3);
    expect(s.groups.F[0].pts).toBe(3);
    expect(s.groups.F[0].pct).toBe(75);
  });

  it("marks holidays inside a week and excludes them from totals", () => {
    const s = weekSummary({
      students,
      attendance,
      holidays: { "2026-09-15": { label: "Open day" } },
      termStart: TERM,
      week: 1,
      today: "2026-09-15",
    });
    expect(s.schoolDays).toBe(1);
    expect(s.days[1]).toMatchObject({ kind: "holiday", label: "Open day" });
  });

  it("summarises the term and flags at-risk students", () => {
    const s = termSummary({ students, attendance, holidays: {}, termStart: TERM, weeks: 13, today: "2026-09-15", atRiskBelow: 75 });
    expect(s.schoolDays).toBe(2);
    expect(s.maxPts).toBe(4);
    expect(s.grandActual).toBe(6);
    expect(s.grandExpected).toBe(12);
    // a and b each have 3 of 4 points (75%, not below the limit); c has 0%
    expect(s.atRisk).toBe(1);
  });

  it("does not divide by zero before any school day", () => {
    const s = termSummary({ students, attendance: {}, holidays: {}, termStart: TERM, weeks: 13, today: "2026-09-01", atRiskBelow: 75 });
    expect(s.grandPct).toBe(0);
    expect(s.rows.every((r) => r.pct === 0)).toBe(true);
  });
});

describe("students", () => {
  it("sorts by register order, then name, with unordered students last", () => {
    const list = sortStudents([...students, { id: "d", name: "ABE", gender: "M" }]);
    expect(list.map((s) => s.id)).toEqual(["b", "c", "a", "d"]);
  });

  it("gives new students the next order number per gender", () => {
    expect(nextOrderFor(students, "M")).toBe(2);
    expect(nextOrderFor(students, "F")).toBe(1);
    expect(nextOrderFor([], "M")).toBe(0);
  });

  it("builds initials and a parent name", () => {
    expect(initials("abraham blessing")).toBe("AB");
    expect(initials("SOLO")).toBe("S");
    expect(autoParent("ABRAHAM BLESSING")).toBe("Mr & Mrs Abraham");
    expect(autoParent("  ")).toBe("");
  });
});

describe("csv", () => {
  it("quotes values that need it", () => {
    expect(csvCell('Smith, "Jo"')).toBe('"Smith, ""Jo"""');
    expect(csvCell(null)).toBe("");
    expect(csvCell(12)).toBe("12");
  });

  it("neutralises spreadsheet formulas but keeps phone numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("+234 803 000 0000")).toBe("+234 803 000 0000");
  });

  it("joins rows with CRLF", () => {
    expect(toCsv([["a", "b"], [1, 2]])).toBe("a,b\r\n1,2");
  });
});
