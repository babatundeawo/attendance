/** Small DOM helpers: element builder, icons, toasts, confirm dialog, CSV download. */
import { toCsv } from "./logic.js";

/**
 * Build an element. User-supplied text is always added as text nodes, never as
 * HTML, so names and labels can never inject markup.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value === null || value === undefined) continue;
    if (key === "class") el.className = value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key === "style") for (const [p, v] of Object.entries(value)) el.style.setProperty(p, v);
    else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) el.setAttribute(key, "");
    else el.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Icon geometry, 24x24 grid, stroked. Static constants only. */
const ICONS = {
  check: ["path", { d: "M20 6L9 17l-5-5" }],
  trash: ["path", { d: "M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" }],
  search: [["circle", { cx: 11, cy: 11, r: 7 }], ["path", { d: "M21 21l-4.3-4.3" }]],
  download: ["path", { d: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" }],
  plus: ["path", { d: "M12 5v14M5 12h14" }],
  left: ["path", { d: "M15 18l-6-6 6-6" }],
  right: ["path", { d: "M9 18l6-6-6-6" }],
  sun: [["circle", { cx: 12, cy: 12, r: 4 }], ["path", { d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" }]],
  moon: ["path", { d: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" }],
  logout: ["path", { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" }],
  register: [["rect", { x: 5, y: 3, width: 14, height: 18, rx: 2 }], ["path", { d: "M9 3v3h6V3" }], ["path", { d: "M8.5 12.5l2 2 4-4.5" }]],
  week: [["rect", { x: 3, y: 4, width: 18, height: 17, rx: 2 }], ["path", { d: "M3 9h18M8 3v3M16 3v3" }]],
  term: ["path", { d: "M3 21h18M6 21V10m6 11V4m6 17v-7" }],
  people: [["circle", { cx: 9, cy: 8, r: 3.2 }], ["path", { d: "M2.5 19c0-3.3 2.9-5.3 6.5-5.3s6.5 2 6.5 5.3M16 8.2a3 3 0 110 6M21.5 19c0-2.6-2-4.4-4.7-5" }]],
  eye: [["path", { d: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" }], ["circle", { cx: 12, cy: 12, r: 3 }]],
  eyeOff: ["path", { d: "M17.9 17.9A10.9 10.9 0 0112 19C5.6 19 2 12 2 12a18.7 18.7 0 015.1-5.9M9.9 4.2A9.9 9.9 0 0112 4c6.4 0 10 8 10 8a18.6 18.6 0 01-2.2 3.2M1 1l22 22M14.1 14.1a3 3 0 11-4.2-4.2" }],
  lock: [["rect", { x: 4, y: 11, width: 16, height: 10, rx: 2 }], ["path", { d: "M8 11V7a4 4 0 018 0v4" }]],
};

/** Build a decorative inline SVG icon (hidden from assistive tech). */
export function icon(name, size = 20) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const spec = ICONS[name];
  const parts = Array.isArray(spec[0]) ? spec : [spec];
  for (const [tag, attrs] of parts) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    svg.append(node);
  }
  return svg;
}

/** Progress ring used for the AM / PM stats. */
export function ring(pct, size = 48) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("aria-hidden", "true");
  const mk = (cls) => {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", cls);
    circle.setAttribute("cx", size / 2);
    circle.setAttribute("cy", size / 2);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke-width", "5");
    return circle;
  };
  const track = mk("ring-track");
  const val = mk("ring-val");
  val.setAttribute("stroke-dasharray", c);
  val.setAttribute("stroke-dashoffset", c * (1 - pct / 100));
  val.setAttribute("stroke-linecap", "round");
  val.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
  svg.append(track, val);
  return svg;
}

/** Show a short message. type "error" uses the error styling. */
export function toast(message, type) {
  const wrap = document.getElementById("toasts");
  if (!wrap) return;
  const el = h("div", { class: `toast${type === "error" ? " toast-error" : ""}` }, message);
  wrap.append(el);
  setTimeout(() => {
    el.classList.add("leave");
    setTimeout(() => el.remove(), 240);
  }, type === "error" ? 4800 : 2600);
}

/** Promise-based confirm dialog built on the native <dialog> element. */
export function confirmDialog(title, message, confirmLabel = "Confirm") {
  const dlg = document.getElementById("confirmDialog");
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  const yes = document.getElementById("confirmYes");
  yes.textContent = confirmLabel;
  return new Promise((resolve) => {
    const finish = (result) => {
      dlg.removeEventListener("close", onClose);
      dlg.removeEventListener("click", onBackdrop);
      yes.removeEventListener("click", onYes);
      if (dlg.open) dlg.close();
      resolve(result);
    };
    const onYes = () => finish(true);
    const onClose = () => finish(false);
    const onBackdrop = (e) => {
      if (e.target === dlg) finish(false);
    };
    yes.addEventListener("click", onYes);
    dlg.addEventListener("close", onClose);
    dlg.addEventListener("click", onBackdrop);
    dlg.showModal();
  });
}

/** Download rows as a CSV file. */
export function downloadCsv(filename, rows) {
  const blob = new Blob(["\ufeff", toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Downloaded ${filename}`);
}

/** Replace the contents of `node` with `children`. */
export function mount(node, ...children) {
  node.replaceChildren(...children.flat().filter(Boolean));
}
