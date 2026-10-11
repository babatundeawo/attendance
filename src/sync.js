/**
 * Thin front door to the database code. The Firestore library is large, so it is
 * only downloaded after sign-in; everything else talks to it through here.
 */
import { update } from "./store.js";

let loading = null;
const load = () => (loading ??= import("./data.js"));

export function startSync() {
  return load().then((m) => m.startSync());
}

export function stopSync() {
  if (loading) loading.then((m) => m.stopSync());
  else update({ access: "unknown" });
}

/** Same shape as the actions in data.js; each call waits for the module if needed. */
export const actions = new Proxy(
  {},
  { get: (_, name) => (...args) => load().then((m) => m.actions[name](...args)) },
);
