/** Sign-in helpers and plain-English error messages. */
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirebase } from "./firebase.js";

export function watchAuth(callback) {
  return onAuthStateChanged(getFirebase().auth, callback);
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(getFirebase().auth, email.trim(), password);
}

export function signOutUser() {
  return signOut(getFirebase().auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(getFirebase().auth, email.trim());
}

const MESSAGES = {
  "auth/invalid-credential": "That email and password don't match. Please check them and try again.",
  "auth/wrong-password": "That email and password don't match. Please check them and try again.",
  "auth/user-not-found": "That email and password don't match. Please check them and try again.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/user-disabled": "This account has been switched off. Please contact the administrator.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes, or reset your password.",
  "auth/network-request-failed": "No internet connection. Check your network and try again.",
  "auth/operation-not-allowed": "Email and password sign-in is not switched on for this project yet.",
  "auth/unauthorized-domain": "This website address is not authorised in Firebase yet.",
  "auth/invalid-api-key": "The app's Firebase settings are not correct. Please contact the administrator.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "The app's Firebase settings are not correct. Please contact the administrator.",
};

export function friendlyAuthError(error) {
  return MESSAGES[error?.code] || "Something went wrong. Please try again.";
}
