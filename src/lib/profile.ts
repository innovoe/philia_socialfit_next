"use client";

import { memberDisplayName } from "@/lib/ceremony";
import { requireMemberAccess } from "@/lib/expire";
import { readSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { worldsFilledCount, type WorldId } from "@/lib/worlds";

export { PROFILE_WORLDS, type WorldGroup, type WorldId } from "@/lib/worlds";

export const WORLDS_EVENT = "philia-profile-worlds";

export type NameVisibility = "full" | "first" | "initials";
export type LocPrecision = "city" | "area" | "neighbourhood";

export function emitWorldsBadge() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WORLDS_EVENT));
}

export function worldsBadgeDone(worlds?: Record<WorldId, string[]>) {
  const n = worlds ? worldsFilledCount(worlds) : readSession().worldsFilled || 0;
  return n >= 3;
}

export function memberInitials(name: string) {
  const parts = String(name || "M")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function visibleCardName(full: string, vis: NameVisibility) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (vis === "first") return { first: parts[0] || full, rest: "" };
  if (vis === "initials") return { first: memberInitials(full), rest: "" };
  if (parts.length >= 2) return { first: parts[0], rest: parts.slice(1).join(" ") };
  return { first: full || "", rest: "" };
}

export function profileTierLine() {
  const s = readSession();
  if (s.tier) {
    const t = String(s.tier);
    return `${t.charAt(0).toUpperCase()}${t.slice(1)} · SocialFit`;
  }
  return "SocialFit";
}

export function profileDisplayName() {
  return memberDisplayName();
}

export function requireProfileAccess() {
  if (!requireMemberAccess()) return false;
  const s = readSession();
  const explorer =
    s.explorerReady ||
    s.ceremonyStep === "id" ||
    s.ceremonyStep === "keys" ||
    s.ceremonyStep === "hub";
  if (!explorer) {
    window.location.replace(routes.ceremony);
    return false;
  }
  return true;
}
