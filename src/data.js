/** Firestore access: live subscriptions and every write the app makes. */
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
} from "firebase/firestore";
import { getFirebase } from "./firebase.js";
import { SESSIONS } from "./logic.js";
import { state, update } from "./store.js";
import { toast } from "./dom.js";

let unsubscribers = [];
let database = null;

/** Create the database connection once. The local cache keeps the register usable offline. */
function getDb() {
  if (!database) {
    database = initializeFirestore(getFirebase().app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  }
  return database;
}

function onDbError(error) {
  if (error?.code === "permission-denied") update({ access: "denied" });
  else update({ dbError: true });
}

/** Start live listeners. Returns nothing; call stopSync() to tear down. */
export function startSync() {
  stopSync();
  const db = getDb();
  const watch = (name, key, build) =>
    onSnapshot(
      collection(db, name),
      { includeMetadataChanges: true },
      (snap) => {
        const patch = { dbError: false, access: "granted", pending: snap.metadata.hasPendingWrites };
        if (snap.docChanges().length > 0 || !state.loaded[key]) {
          patch[name] = build(snap);
          patch.loaded = { ...state.loaded, [key]: true };
        }
        update(patch);
      },
      onDbError,
    );

  unsubscribers = [
    watch("students", "students", (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    watch("attendance", "attendance", (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
    watch("holidays", "holidays", (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
  ];
}

export function stopSync() {
  unsubscribers.forEach((fn) => fn());
  unsubscribers = [];
  update({
    students: [],
    attendance: {},
    holidays: {},
    loaded: { students: false, attendance: false, holidays: false },
    access: "unknown",
    dbError: false,
    pending: false,
  });
}

/** Run a write without blocking the UI (offline writes resolve later). */
function write(promise, failMessage = "That change could not be saved") {
  promise.catch((error) => {
    toast(error?.code === "permission-denied" ? "You don't have permission to do that" : failMessage, "error");
  });
}

const attendanceRef = (ds) => doc(getDb(), "attendance", ds);

export const actions = {
  setStatus(ds, id, session, present) {
    write(setDoc(attendanceRef(ds), { [id]: { [session]: present ? true : deleteField() } }, { merge: true }));
  },

  /** Mark every student present (or clear them) for one or both sessions in a single write. */
  markMany(ds, ids, sessions, present) {
    const data = {};
    for (const id of ids) {
      data[id] = {};
      for (const s of sessions) data[id][s] = present ? true : deleteField();
    }
    write(setDoc(attendanceRef(ds), data, { merge: true }));
  },

  clearDay(ds, ids) {
    actions.markMany(ds, ids, [SESSIONS.AM, SESSIONS.PM], false);
  },

  saveStudent(id, record) {
    write(setDoc(doc(getDb(), "students", id), record));
  },

  removeStudent(id) {
    write(deleteDoc(doc(getDb(), "students", id)));
  },

  addHoliday(ds, label) {
    write(setDoc(doc(getDb(), "holidays", ds), { label }));
  },

  removeHoliday(ds) {
    write(deleteDoc(doc(getDb(), "holidays", ds)));
  },
};
