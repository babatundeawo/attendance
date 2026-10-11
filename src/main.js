/** App entry: boots theme, auth, live sync and the five views. */
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";

import { TERM_START, WEEKS } from "./config.js";
import { signOutUser, watchAuth } from "./auth.js";
import { startSync, stopSync } from "./sync.js";
import { h, icon, toast } from "./dom.js";
import { ConfigError, getFirebase } from "./firebase.js";
import { currentWeekIndex, todayStr } from "./logic.js";
import { isLoaded, state, subscribe, update } from "./store.js";
import { initTheme } from "./theme.js";
import { initHolidays, renderHolidays } from "./views/holidays.js";
import { initLogin, resetLoginForm } from "./views/login.js";
import { initRegister, renderRegister } from "./views/register.js";
import { initStudents, renderStudents } from "./views/students.js";
import { renderTerm } from "./views/term.js";
import { initWeekly, renderWeekly } from "./views/weekly.js";

const $ = (id) => document.getElementById(id);

const TABS = [
  { id: "register", label: "Register", icon: "register", render: renderRegister },
  { id: "weekly", label: "Weekly", icon: "week", render: renderWeekly },
  { id: "term", label: "Term", icon: "term", render: renderTerm },
  { id: "students", label: "Students", icon: "people", render: renderStudents },
  { id: "holidays", label: "Holidays", icon: "sun", render: renderHolidays },
];

const VIEWS = ["splash", "loginView", "deniedView", "configView", "appShell"];
let shownView = "splash";

function showView(id) {
  if (id === shownView) return;
  shownView = id;
  for (const v of VIEWS) $(v).hidden = v !== id;
  if (id === "loginView") $("loginEmail").focus();
}

function buildNav() {
  const nav = $("nav");
  for (const tab of TABS) {
    nav.append(
      h(
        "button",
        {
          class: "nav-btn",
          type: "button",
          dataset: { tab: tab.id },
          onclick: () => {
            update({ tab: tab.id });
            window.scrollTo({ top: 0 });
            $("main").focus({ preventScroll: true });
          },
        },
        icon(tab.icon, 22),
        h("span", {}, tab.label),
      ),
    );
  }
}

function buildAccountMenu() {
  const btn = $("accountBtn");
  const menu = $("accountMenu");
  $("signOutBtn").append(icon("logout", 18), " Sign out");
  const close = () => {
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  };
  btn.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !e.target.closest(".account")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      close();
      btn.focus();
    }
  });
  $("signOutBtn").addEventListener("click", () => {
    close();
    signOutUser();
  });
}

function syncLabel() {
  if (!state.online) return ["off", "Offline · saved on this device"];
  if (!isLoaded()) return ["busy", "Connecting"];
  if (state.pending) return ["busy", "Syncing…"];
  return ["ok", "Synced"];
}

function renderChrome() {
  const [status, text] = syncLabel();
  $("syncPill").dataset.status = status;
  $("syncText").textContent = text;
  $("dbBanner").hidden = !state.dbError;

  const week = currentWeekIndex(TERM_START, WEEKS, todayStr());
  $("metaLine").textContent = `Week ${week} of ${WEEKS} · ${state.students.length} students`;

  for (const btn of document.querySelectorAll(".nav-btn")) {
    const on = btn.dataset.tab === state.tab;
    btn.classList.toggle("is-active", on);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }
  for (const tab of TABS) $(`panel-${tab.id}`).hidden = tab.id !== state.tab;
  const active = TABS.find((t) => t.id === state.tab);
  document.title = `${active.label} · Attendance Register`;
}

function route() {
  if (!state.user) return;
  if (state.access === "denied") {
    $("deniedEmail").textContent = state.user.email || "this account";
    showView("deniedView");
    return;
  }
  showView("appShell");
  $("accountEmail").textContent = state.user.email || "";
  $("accountBtn").textContent = (state.user.email || "?").charAt(0).toUpperCase();
}

function render() {
  route();
  if (shownView !== "appShell") return;
  renderChrome();
  TABS.find((t) => t.id === state.tab).render();
}

function boot() {
  initTheme();
  initLogin();
  buildNav();
  buildAccountMenu();
  initRegister();
  initWeekly();
  initStudents();
  initHolidays();
  $("confirmNo").addEventListener("click", () => $("confirmDialog").close());

  window.addEventListener("online", () => {
    update({ online: true });
    toast("Back online — syncing changes");
  });
  window.addEventListener("offline", () => {
    update({ online: false });
    toast("You're offline — changes will sync later");
  });

  try {
    getFirebase();
  } catch (error) {
    if (error instanceof ConfigError) {
      showView("configView");
      return;
    }
    throw error;
  }

  subscribe(render);
  watchAuth((user) => {
    update({ user });
    if (user) {
      startSync();
    } else {
      stopSync();
      resetLoginForm();
      showView("loginView");
    }
  });
}

boot();

if ("serviceWorker" in navigator && location.protocol.startsWith("http") && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(() => {});
  });
}
