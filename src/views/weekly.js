/** Weekly report: day totals plus per-student points for the chosen week. */
import { AT_RISK_BELOW, TERM_START, WEEKS } from "../config.js";
import { downloadCsv, h, icon, mount } from "../dom.js";
import { parseD, todayStr, weekDates, weekSummary } from "../logic.js";
import { state, update } from "../store.js";

const $ = (id) => document.getElementById(id);

export function initWeekly() {
  const select = $("weekSelect");
  for (let w = 1; w <= WEEKS; w++) {
    const wd = weekDates(TERM_START, w);
    select.append(h("option", { value: w }, `Week ${w} (${wd[0].slice(5)} – ${wd[4].slice(5)})`));
  }
  select.value = state.week;
  $("weekPrev").append(icon("left"));
  $("weekNext").append(icon("right"));
  select.addEventListener("change", () => update({ week: parseInt(select.value, 10) }));
  $("weekPrev").addEventListener("click", () => update({ week: Math.max(1, state.week - 1) }));
  $("weekNext").addEventListener("click", () => update({ week: Math.min(WEEKS, state.week + 1) }));
}

export const miniBar = (pct, label) =>
  h(
    "div",
    { class: "mini-bar-wrap" },
    h("div", { class: `mini-bar${pct < AT_RISK_BELOW ? " low" : ""}`, role: "presentation" }, h("span", { style: { width: `${pct}%` } })),
    h("span", { class: "mini-pct" }, label),
  );

function table(headers, body, foot) {
  return h(
    "div",
    { class: "table-wrap" },
    h(
      "table",
      {},
      h("thead", {}, h("tr", {}, headers.map(([text, cls]) => h("th", { scope: "col", class: cls }, text)))),
      h("tbody", {}, body),
      foot ? h("tfoot", {}, foot) : null,
    ),
  );
}

export function renderWeekly() {
  const out = $("weeklyOut");
  $("weekSelect").value = state.week;
  const w = state.week;
  const s = weekSummary({
    students: state.students,
    attendance: state.attendance,
    holidays: state.holidays,
    termStart: TERM_START,
    week: w,
    today: todayStr(),
  });

  const dayRows = s.days.map((day) => {
    const label = parseD(day.ds).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    if (day.kind === "holiday") {
      return h("tr", {}, h("th", { scope: "row" }, label), h("td", { colspan: 3 }, h("span", { class: "tag tag-holiday" }, `Holiday${day.label ? `: ${day.label}` : ""}`)));
    }
    if (day.kind === "future") {
      return h("tr", {}, h("th", { scope: "row" }, label), h("td", { colspan: 3, class: "muted" }, "Not yet occurred"));
    }
    return h("tr", {}, h("th", { scope: "row" }, label), h("td", { class: "num" }, day.m), h("td", { class: "num" }, day.a), h("td", { class: "num" }, day.m + day.a));
  });

  const csvRows = [["#", "Gender", "Name", "Points", "Max", "Percent"]];
  const groupNodes = [];
  for (const [g, title] of [["M", "Males"], ["F", "Females"]]) {
    const rows = s.groups[g].map(({ st, pts, pct }, i) => {
      csvRows.push([i + 1, title, st.name, pts, s.maxPts, `${pct}%`]);
      return h("tr", {}, h("td", { class: "num" }, i + 1), h("td", {}, st.name), h("td", {}, miniBar(pct, `${pts}/${s.maxPts}`)));
    });
    groupNodes.push(
      h("h2", { class: "group-title" }, title),
      rows.length ? table([["#", "num"], ["Name"], ["Attendance", "col-bar"]], rows) : h("p", { class: "note" }, "No students yet."),
    );
  }

  const exportBtn = h("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: () => downloadCsv(`week-${w}-attendance.csv`, csvRows) }, icon("download", 16), " Export CSV");

  mount(
    out,
    table(
      [["Day"], ["AM", "num"], ["PM", "num"], ["Total", "num"]],
      dayRows,
      h("tr", {}, h("th", { scope: "row" }, "Week total"), h("td", { class: "num" }, s.wkM), h("td", { class: "num" }, s.wkA), h("td", { class: "num" }, s.actual)),
    ),
    h(
      "div",
      { class: "overview-grid overview-2" },
      h("div", { class: "stat-card" }, h("div", { class: "v" }, s.schoolDays), h("div", { class: "l" }, "School days")),
      h("div", { class: "stat-card" }, h("div", { class: "v" }, `${s.pct.toFixed(1)}%`), h("div", { class: "l" }, "Week attendance")),
    ),
    h("div", { class: "section-head" }, h("h2", {}, "Per student"), exportBtn),
    groupNodes,
  );
}
