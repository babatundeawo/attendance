/** Tiny reactive store shared by all views. */
import { TERM_START, WEEKS } from "./config.js";
import { currentWeekIndex, todayStr } from "./logic.js";

export const state = {
  user: null,
  access: "unknown", // "unknown" | "granted" | "denied"
  students: [],
  attendance: {},
  holidays: {},
  loaded: { students: false, attendance: false, holidays: false },
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pending: false,
  dbError: false,
  tab: "register",
  date: todayStr(),
  week: currentWeekIndex(TERM_START, WEEKS, todayStr()),
  registerQuery: "",
  studentsQuery: "",
};

const listeners = new Set();
let queued = false;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Merge a patch into state and notify listeners once per animation frame. */
export function update(patch) {
  Object.assign(state, patch);
  if (queued) return;
  queued = true;
  const run = () => {
    queued = false;
    listeners.forEach((fn) => fn(state));
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
  else queueMicrotask(run);
}

export const isLoaded = () => state.loaded.students && state.loaded.attendance && state.loaded.holidays;
