/** Holidays tab: add and remove non-school days. */
import { confirmDialog, h, icon, mount, toast } from "../dom.js";
import { actions } from "../sync.js";
import { parseD } from "../logic.js";
import { state } from "../store.js";

const $ = (id) => document.getElementById(id);

export function initHolidays() {
  $("addHoliday").append(icon("plus", 16), " Add holiday");
  $("holidayForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const ds = $("holDate").value;
    if (!ds) {
      toast("Choose a date first", "error");
      $("holDate").focus();
      return;
    }
    actions.addHoliday(ds, $("holLabel").value.trim());
    $("holLabel").value = "";
    $("holDate").value = "";
    toast("Holiday added");
  });
}

export function renderHolidays() {
  const keys = Object.keys(state.holidays).sort();
  if (keys.length === 0) {
    mount(
      $("holList"),
      h("div", { class: "empty-state" }, h("p", { class: "empty-title" }, "No holidays added"), h("p", { class: "muted" }, "Days you add here are skipped in reports.")),
    );
    return;
  }
  mount(
    $("holList"),
    keys.map((ds) => {
      const d = parseD(ds);
      const full = d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" });
      const label = state.holidays[ds].label;
      return h(
        "div",
        { class: "hol-item" },
        h("div", { class: "date-badge", "aria-hidden": "true" }, h("b", {}, d.getDate()), h("span", {}, d.toLocaleDateString(undefined, { weekday: "short" }))),
        h("div", { class: "hol-info" }, h("div", { class: "d1" }, full), label ? h("div", { class: "d2" }, label) : null),
        h(
          "button",
          {
            class: "btn btn-danger-quiet btn-sm",
            type: "button",
            "aria-label": `Remove holiday ${full}`,
            onclick: async () => {
              const ok = await confirmDialog("Remove this holiday?", `${full} will be treated as a normal school day again.`, "Remove");
              if (!ok) return;
              actions.removeHoliday(ds);
              toast("Holiday removed");
            },
          },
          "Remove",
        ),
      );
    }),
  );
}
