/** Daily register: date bar, AM/PM stats, quick actions and the student list. */
import { confirmDialog, h, icon, mount, ring, toast } from "../dom.js";
import { SESSIONS, addDays, dstr, getStatus, initials, isWeekend, parseD, percent, sessionTally, sortStudents, todayStr } from "../logic.js";
import { actions } from "../sync.js";
import { isLoaded, state, update } from "../store.js";

const $ = (id) => document.getElementById(id);

export function initRegister() {
  const picker = $("datePicker");
  picker.value = state.date;
  $("prevDay").append(icon("left"));
  $("nextDay").append(icon("right"));
  $("markAllAM").append(icon("check", 16), " All AM");
  $("markAllPM").append(icon("check", 16), " All PM");
  $("clearDay").append(icon("trash", 16), " Clear day");
  $("regSearchIcon").append(icon("search", 18));

  const go = (ds) => update({ date: ds });
  $("prevDay").addEventListener("click", () => go(dstr(addDays(parseD(state.date), -1))));
  $("nextDay").addEventListener("click", () => go(dstr(addDays(parseD(state.date), 1))));
  $("todayBtn").addEventListener("click", () => go(todayStr()));
  picker.addEventListener("change", () => picker.value && go(picker.value));
  $("registerSearch").addEventListener("input", (e) => update({ registerQuery: e.target.value }));

  $("markAllAM").addEventListener("click", () => {
    actions.markMany(state.date, state.students.map((s) => s.id), [SESSIONS.AM], true);
    toast("Marked all present for AM");
  });
  $("markAllPM").addEventListener("click", () => {
    actions.markMany(state.date, state.students.map((s) => s.id), [SESSIONS.PM], true);
    toast("Marked all present for PM");
  });
  $("clearDay").addEventListener("click", async () => {
    const ok = await confirmDialog(
      "Clear this day?",
      `This removes every AM and PM mark for ${$("dateNum").textContent}. This can't be undone.`,
      "Clear day",
    );
    if (!ok) return;
    actions.clearDay(state.date, state.students.map((s) => s.id));
    toast("Day cleared");
  });
}

function statCard(label, count, total) {
  const pct = Math.round(percent(count, total));
  return h(
    "div",
    { class: "ring-card" },
    ring(pct),
    h("div", {}, h("div", { class: "ring-label" }, label), h("div", { class: "ring-num" }, count, h("small", {}, ` / ${total}`))),
  );
}

function skeletonRows() {
  return Array.from({ length: 8 }, () =>
    h("div", { class: "stud-row skeleton-row", "aria-hidden": "true" }, h("span", { class: "sk sk-avatar" }), h("span", { class: "sk sk-line" })),
  );
}

export function renderRegister() {
  const ds = state.date;
  const d = parseD(ds);
  const picker = $("datePicker");
  if (picker.value !== ds) picker.value = ds;
  $("dateDow").textContent = d.toLocaleDateString(undefined, { weekday: "long" });
  $("dateNum").textContent = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  $("todayBtn").hidden = ds === todayStr();

  const list = $("studentList");
  const hol = $("holBadge");
  const stats = $("ringStats");
  const controlsDisabled = !isLoaded() || isWeekend(d);
  for (const id of ["markAllAM", "markAllPM", "clearDay"]) $(id).disabled = controlsDisabled || state.students.length === 0;

  if (!isLoaded()) {
    mount(hol);
    mount(stats);
    mount(list, ...skeletonRows());
    return;
  }
  if (isWeekend(d)) {
    mount(hol, h("span", { class: "note-pill note-weekend" }, "Weekend — no marking today"));
    mount(stats);
    mount(list);
    return;
  }
  const holiday = state.holidays[ds];
  mount(hol, holiday ? h("span", { class: "note-pill note-holiday" }, `Holiday${holiday.label ? `: ${holiday.label}` : ""}`) : null);

  const total = state.students.length;
  mount(
    stats,
    statCard("AM present", sessionTally(state.attendance, state.students, ds, SESSIONS.AM), total),
    statCard("PM present", sessionTally(state.attendance, state.students, ds, SESSIONS.PM), total),
  );

  // Keep keyboard focus on the same switch after the list redraws.
  const focused = document.activeElement?.dataset?.key;

  const q = state.registerQuery.trim().toLowerCase();
  const sorted = sortStudents(state.students);
  const nodes = [];
  for (const [gender, title] of [["M", "Males"], ["F", "Females"]]) {
    const group = sorted.filter((s) => s.gender === gender && (!q || s.name.toLowerCase().includes(q)));
    if (group.length === 0) continue;
    nodes.push(h("h2", { class: "group-title" }, title, " ", h("span", { class: "count" }, group.length)));
    group.forEach((st, i) => nodes.push(studentRow(st, i + 1, ds)));
  }
  if (nodes.length === 0) {
    nodes.push(
      h(
        "div",
        { class: "empty-state" },
        h("p", { class: "empty-title" }, total === 0 ? "No students yet" : "No students match your search"),
        h("p", { class: "muted" }, total === 0 ? "Add your first student from the Students tab." : "Try a different spelling."),
      ),
    );
  }
  mount(list, ...nodes);
  if (focused) list.querySelector(`[data-key="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
}

function sessionSwitch(st, ds, session, label) {
  const input = h("input", {
    type: "checkbox",
    role: "switch",
    "aria-label": `${st.name} present in the ${label}`,
    dataset: { key: `${st.id}|${session}` },
  });
  input.checked = getStatus(state.attendance, ds, st.id, session);
  input.addEventListener("change", () => actions.setStatus(ds, st.id, session, input.checked));
  return h("label", { class: "tick" }, h("span", { class: "switch" }, input, h("span", { class: "switch-track", "aria-hidden": "true" })));
}

function studentRow(st, n, ds) {
  return h(
    "div",
    { class: "stud-row" },
    h("span", { class: `avatar g-${st.gender}`, "aria-hidden": "true" }, initials(st.name)),
    h("span", { class: "name-wrap" }, h("span", { class: "name" }, `${n}. ${st.name}`)),
    sessionSwitch(st, ds, SESSIONS.AM, "morning"),
    sessionSwitch(st, ds, SESSIONS.PM, "afternoon"),
  );
}
