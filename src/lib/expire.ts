"use client";

import { isApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";
import { clearSession, hasAccess } from "@/lib/session";

let expiring = false;

const AUTH_CODES = new Set([
  "not_authenticated",
  "unauthenticated",
  "token_expired",
  "invalid_token",
  "authentication_failed",
]);

export function wipeDeviceCaches() {
  try {
    localStorage.removeItem("philia_answers");
    localStorage.removeItem("philia_answers_email");
    localStorage.removeItem("philia_ceremony_step");
    localStorage.removeItem("philia_id_theme");
    sessionStorage.removeItem("philia_waitlist");
  } catch {
    /* private mode */
  }
}

/** 401 is a dead JWT. 403 only if the body says the token itself failed. */
export function isDeadAccessError(err: unknown) {
  if (!isApiError(err)) return false;
  if (err.status === 401) return true;
  return err.status === 403 && AUTH_CODES.has(err.code);
}

export function isSessionExpiring() {
  return expiring;
}

/** Clear the dead session. Login resumes them via /me/ after a new OTP. */
export function expireDeadSession() {
  if (typeof window === "undefined" || expiring) return;
  expiring = true;
  wipeDeviceCaches();
  clearSession();
  const path = window.location.pathname;
  if (path === routes.loggedIn || path === routes.login) return;
  window.location.replace(routes.login);
}

export function requireMemberAccess() {
  if (hasAccess()) return true;
  expireDeadSession();
  return false;
}
