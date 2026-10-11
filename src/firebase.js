/**
 * Firebase setup. Configuration is injected at build time from GitHub Actions secrets.
 * Only sign-in is loaded here; the database is loaded after sign-in (see data.js)
 * so the sign-in screen appears quickly.
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export class ConfigError extends Error {}

let services = null;

/** Create (once) and return the Firebase app and auth, or throw ConfigError. */
export function getFirebase() {
  if (services) return services;
  const missing = ["apiKey", "authDomain", "projectId", "appId"].filter((k) => !config[k]);
  if (missing.length) throw new ConfigError(`Missing Firebase settings: ${missing.join(", ")}`);
  const app = initializeApp(config);
  services = { app, auth: getAuth(app) };
  return services;
}
