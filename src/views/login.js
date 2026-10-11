/** Sign-in, password reset and the signed-out / access-denied screens. */
import { friendlyAuthError, resetPassword, signIn, signOutUser } from "../auth.js";
import { icon } from "../dom.js";

const $ = (id) => document.getElementById(id);
let mode = "signin"; // "signin" | "reset"

function showMessage(text, kind = "error") {
  const el = $("loginMessage");
  el.textContent = text;
  el.hidden = !text;
  el.classList.toggle("is-success", kind === "success");
}

function setBusy(busy) {
  const btn = $("loginSubmit");
  btn.disabled = busy;
  btn.classList.toggle("is-busy", busy);
  btn.querySelector(".btn-label").textContent = busy
    ? mode === "reset" ? "Sending…" : "Signing in…"
    : mode === "reset" ? "Send reset link" : "Sign in";
}

function setMode(next) {
  mode = next;
  const reset = next === "reset";
  $("loginTitle").textContent = reset ? "Reset your password" : "Sign in";
  $("loginIntro").textContent = reset
    ? "Enter your email and we'll send you a link to choose a new password."
    : "Use the email and password your administrator gave you.";
  $("passwordField").hidden = reset;
  $("forgotLink").hidden = reset;
  $("backToSignIn").hidden = !reset;
  showMessage("");
  setBusy(false);
}

export function initLogin() {
  const toggle = $("togglePassword");
  toggle.append(icon("eye"));
  toggle.addEventListener("click", () => {
    const input = $("loginPassword");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggle.replaceChildren(icon(show ? "eyeOff" : "eye"));
  });

  $("forgotLink").addEventListener("click", () => setMode("reset"));
  $("backToSignIn").addEventListener("click", () => setMode("signin"));

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("loginEmail").value.trim();
    if (!email) {
      showMessage("Enter your email address.");
      $("loginEmail").focus();
      return;
    }
    if (mode === "signin" && !$("loginPassword").value) {
      showMessage("Enter your password.");
      $("loginPassword").focus();
      return;
    }
    showMessage("");
    setBusy(true);
    try {
      if (mode === "reset") {
        await resetPassword(email);
        showMessage("If that email has an account, a reset link is on its way. Check your inbox and spam folder.", "success");
        setBusy(false);
        return;
      }
      await signIn(email, $("loginPassword").value);
      $("loginPassword").value = "";
    } catch (error) {
      // Reset requests never reveal whether an address has an account.
      if (mode === "reset" && error?.code === "auth/user-not-found") {
        showMessage("If that email has an account, a reset link is on its way. Check your inbox and spam folder.", "success");
      } else {
        showMessage(friendlyAuthError(error));
      }
      setBusy(false);
    }
  });

  $("deniedSignOut").addEventListener("click", () => signOutUser());
  $("deniedReload").addEventListener("click", () => location.reload());
}

export function resetLoginForm() {
  setMode("signin");
  $("loginPassword").value = "";
}
