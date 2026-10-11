/** Term report: class average, at-risk count and a ranked per-student table. */
import { AT_RISK_BELOW, TERM_START, WEEKS } from "../config.js";
import { downloadCsv, h, icon, mount } from "../dom.js";
import { termSummary, todayStr } from "../logic.js";
import { state } from "../store.js";
import { miniBar } from "./weekly.js";

export function renderTerm() {
  const s = termSummary({
    students: state.students,
    attendance: state.attendance,
    holidays: state.holidays,
    termStart: TERM_START,
    weeks: WEEKS,
    today: todayStr(),
    atRiskBelow: AT_RISK_BELOW,
  });

  const csvRows = [["#", "Name", "Points", "Max", "Percent"]];
  const rows = s.rows.map(({ st, pts, pct }, i) => {
    const rounded = Math.round(pct);
    csvRows.push([i + 1, st.name, pts, s.maxPts, `${rounded}%`]);
    let tag = null;
    if (pct >= 99.5) tag = h("span", { class: "tag tag-star" }, "★ 100%");
    else if (pct < AT_RISK_BELOW) tag = h("span", { class: "tag tag-risk" }, "At risk");
    return h("tr", {}, h("td", { class: "num" }, i + 1), h("td", {}, st.name, tag ? " " : null, tag), h("td", {}, miniBar(rounded, `${rounded}%`)));
  });

  const exportBtn = h("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: () => downloadCsv("term-attendance.csv", csvRows) }, icon("download", 16), " Export CSV");

  mount(
    document.getElementById("termOut"),
    h(
      "div",
      { class: "overview-grid" },
      h("div", { class: "stat-card" }, h("div", { class: "v" }, s.schoolDays), h("div", { class: "l" }, "School days")),
      h("div", { class: "stat-card" }, h("div", { class: "v" }, `${s.grandPct.toFixed(0)}%`), h("div", { class: "l" }, "Class average")),
      h("div", { class: "stat-card" }, h("div", { class: "v" }, s.atRisk), h("div", { class: "l" }, `Below ${AT_RISK_BELOW}%`)),
    ),
    h("p", { class: "note" }, `School days so far: ${s.schoolDays} (weekends and holidays excluded, future dates not counted).`),
    h("div", { class: "section-head section-head-end" }, exportBtn),
    rows.length
      ? h(
          "div",
          { class: "table-wrap" },
          h(
            "table",
            {},
            h("thead", {}, h("tr", {}, h("th", { scope: "col", class: "num" }, "#"), h("th", { scope: "col" }, "Name"), h("th", { scope: "col", class: "col-bar" }, "Attendance"))),
            h("tbody", {}, rows),
            h("tfoot", {}, h("tr", {}, h("th", { scope: "row", colspan: 2 }, "Grand total"), h("td", {}, `${s.grandActual} / ${s.grandExpected} (${s.grandPct.toFixed(1)}%)`))),
          ),
        )
      : h("p", { class: "note" }, "No students yet."),
  );
}
