import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The views talk to the database through sync.js; replace it with spies.
vi.mock("../src/sync.js", () => ({
  actions: {
    setStatus: vi.fn(),
    markMany: vi.fn(),
    clearDay: vi.fn(),
    saveStudent: vi.fn(),
    removeStudent: vi.fn(),
    addHoliday: vi.fn(),
    removeHoliday: vi.fn(),
  },
  startSync: vi.fn(),
  stopSync: vi.fn(),
}));

import { actions } from "../src/sync.js";
import { state } from "../src/store.js";
import { initRegister, renderRegister } from "../src/views/register.js";
import { initWeekly, renderWeekly } from "../src/views/weekly.js";
import { renderTerm } from "../src/views/term.js";
import { initStudents, renderStudents } from "../src/views/students.js";
import { initHolidays, renderHolidays } from "../src/views/holidays.js";

const html = readFileSync("index.html", "utf8");
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));

const EVIL = '<img src=x onerror="window.pwned=1">';
const students = [
  { id: "s1", name: "ADAMS JOHN", gender: "M", order: 0 },
  { id: "s2", name: "BELLO MARY", gender: "F", order: 0 },
  { id: "s3", name: EVIL, gender: "M", order: 1 },
];

function setState(patch) {
  Object.assign(state, {
    loaded: { students: true, attendance: true, holidays: true },
    students,
    attendance: {},
    holidays: {},
    date: "2026-09-16", // a Wednesday
    week: 1,
    registerQuery: "",
    studentsQuery: "",
    ...patch,
  });
}

beforeEach(() => {
  document.body.innerHTML = body;
  vi.clearAllMocks();
  vi.useFakeTimers({ now: new Date("2026-09-17T09:00:00"), toFake: ["Date"] });
  setState({});
  initRegister();
  initWeekly();
  initStudents();
  initHolidays();
  delete window.pwned;
});

describe("register", () => {
  it("shows a loading skeleton until data arrives", () => {
    setState({ loaded: { students: false, attendance: false, holidays: false } });
    renderRegister();
    expect(document.querySelectorAll(".skeleton-row").length).toBeGreaterThan(0);
    expect(document.getElementById("markAllAM").disabled).toBe(true);
  });

  it("lists students by gender with an AM and PM switch each", () => {
    renderRegister();
    expect(document.querySelectorAll("#studentList .group-title").length).toBe(2);
    expect(document.querySelectorAll('#studentList input[role="switch"]').length).toBe(6);
  });

  it("never turns a student's name into markup", () => {
    renderRegister();
    renderStudents();
    renderWeekly();
    renderTerm();
    expect(document.querySelector("img")).toBeNull();
    expect(document.body.textContent).toContain(EVIL);
  });

  it("writes attendance when a switch is flipped", () => {
    renderRegister();
    const sw = document.querySelector('[data-key="s1|morning"]');
    sw.checked = true;
    sw.dispatchEvent(new Event("change"));
    expect(actions.setStatus).toHaveBeenCalledWith("2026-09-16", "s1", "morning", true);
  });

  it("reflects stored attendance and the AM tally", () => {
    setState({ attendance: { "2026-09-16": { s1: { morning: true }, s2: { morning: true, afternoon: true } } } });
    renderRegister();
    expect(document.querySelector('[data-key="s1|morning"]').checked).toBe(true);
    expect(document.querySelector('[data-key="s1|afternoon"]').checked).toBe(false);
    const nums = [...document.querySelectorAll(".ring-num")].map((n) => n.textContent.replace(/\s+/g, ""));
    expect(nums).toEqual(["2/3", "1/3"]);
  });

  it("filters by search text and shows an empty state", () => {
    setState({ registerQuery: "bello" });
    renderRegister();
    expect(document.querySelectorAll(".stud-row").length).toBe(1);
    setState({ registerQuery: "zzz" });
    renderRegister();
    expect(document.querySelector(".empty-state")).not.toBeNull();
  });

  it("blocks marking on weekends and shows holidays", () => {
    setState({ date: "2026-09-19" });
    renderRegister();
    expect(document.querySelector(".note-weekend")).not.toBeNull();
    expect(document.querySelectorAll(".stud-row").length).toBe(0);
    setState({ date: "2026-09-16", holidays: { "2026-09-16": { label: "Break" } } });
    renderRegister();
    expect(document.querySelector(".note-holiday").textContent).toBe("Holiday: Break");
  });

  it("marks everyone present in one write", () => {
    renderRegister();
    document.getElementById("markAllAM").click();
    expect(actions.markMany).toHaveBeenCalledWith("2026-09-16", ["s1", "s2", "s3"], ["morning"], true);
  });
});

describe("reports", () => {
  it("renders the weekly report with totals", () => {
    setState({ attendance: { "2026-09-14": { s1: { morning: true, afternoon: true } } } });
    renderWeekly();
    expect(document.querySelectorAll("#weeklyOut table").length).toBe(3);
    expect(document.querySelector("#weeklyOut tfoot").textContent).toContain("Week total");
    expect(document.querySelectorAll("#weekSelect option").length).toBe(13);
  });

  it("renders the term report with at-risk and perfect-attendance tags", () => {
    const full = { s1: { morning: true, afternoon: true } };
    // "Today" is Thursday 17 Sep, so four school days have occurred.
    setState({ attendance: { "2026-09-14": full, "2026-09-15": full, "2026-09-16": full, "2026-09-17": full } });
    renderTerm();
    expect(document.querySelector("#termOut .tag-risk")).not.toBeNull();
    expect(document.querySelector("#termOut .tag-star")).not.toBeNull();
  });

  it("copes with no students", () => {
    setState({ students: [] });
    renderWeekly();
    renderTerm();
    expect(document.querySelector("#termOut").textContent).toContain("No students yet.");
  });
});

describe("students and holidays", () => {
  it("shows counts per gender", () => {
    renderStudents();
    expect(document.getElementById("cntM").textContent).toBe("2");
    expect(document.getElementById("cntF").textContent).toBe("1");
  });

  it("requires a name before saving", () => {
    renderStudents();
    document.getElementById("studentForm").dispatchEvent(new Event("submit", { cancelable: true }));
    expect(actions.saveStudent).not.toHaveBeenCalled();
    expect(document.getElementById("fNameField").classList.contains("invalid")).toBe(true);
  });

  it("saves a new student at the end of its gender's order", () => {
    document.getElementById("fName").value = "  CAROL ANNE ";
    document.getElementById("fGenF").click();
    document.getElementById("studentForm").dispatchEvent(new Event("submit", { cancelable: true }));
    const [, record] = actions.saveStudent.mock.calls[0];
    expect(record).toMatchObject({ name: "CAROL ANNE", gender: "F", order: 1, parentName: "Mr & Mrs Carol" });
  });

  it("lists holidays and saves a new one", () => {
    setState({ holidays: { "2026-10-01": { label: "Independence Day" } } });
    renderHolidays();
    expect(document.querySelector(".hol-info .d2").textContent).toBe("Independence Day");
    document.getElementById("holDate").value = "2026-10-12";
    document.getElementById("holLabel").value = "Break";
    document.getElementById("holidayForm").dispatchEvent(new Event("submit", { cancelable: true }));
    expect(actions.addHoliday).toHaveBeenCalledWith("2026-10-12", "Break");
  });
});
