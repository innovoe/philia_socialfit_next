"use client";

import { wipeDeviceCaches } from "@/lib/expire";
import { routes } from "@/lib/routes";
import { clearSession, hasAccess, hasFounderKey, readSession } from "@/lib/session";
import { clearStoryProgress } from "@/lib/story-answers";

const TOKEN_SETTING_PREFIXES = [
  routes.origins,
  routes.unlock,
  routes.login,
  routes.enter,
  routes.founder,
] as const;

export function clearLiveSession() {
  clearStoryProgress();
  wipeDeviceCaches();
  clearSession();
}

export function hasClaimedPath() {
  const s = readSession();
  return !!(
    s.keyId != null ||
    s.hubUnlocked ||
    s.explorerReady ||
    s.ceremonyStep ||
    hasFounderKey()
  );
}

export function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

/** Send a live JWT away from pages that can mint or overwrite tokens. */
export function bounceIfLiveSession(opts?: { onlyIfClaimed?: boolean }) {
  if (!hasAccess()) return false;
  if (opts?.onlyIfClaimed && !hasClaimedPath()) return false;
  const next = currentPath();
  window.location.replace(`${routes.loggedIn}?next=${encodeURIComponent(next)}`);
  return true;
}

export function safeNextPath(raw?: string | null) {
  const fallback = routes.landing;
  let path = raw ?? "";
  if (!path && typeof window !== "undefined") {
    path = new URLSearchParams(window.location.search).get("next") || "";
  }
  if (!path) return fallback;
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("://")) return fallback;
  const pathname = path.split("?")[0].split("#")[0];
  if (pathname === routes.loggedIn) return fallback;
  const allowed = TOKEN_SETTING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  return allowed ? path : fallback;
}
