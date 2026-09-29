"use client";

import { getMe, patchCeremony } from "@/lib/api/member";
import { isApiError } from "@/lib/api/errors";
import { persistCeremonyStep } from "@/lib/ceremony";
import { routes } from "@/lib/routes";
import {
  applyMeToSession,
  clearSession,
  hasAccess,
  readSession,
  writeSession,
  type MembershipChoice,
} from "@/lib/session";
import { clearStoryProgress } from "@/lib/story-answers";
import type { OutboundKey } from "@/lib/api/keys";
import { outboundClockMs, parseDeadline } from "@/lib/api/keys";
import type { Me, Mirror } from "@/lib/api/member";

export const HUB_POLL_MS = 30000;

export function formatHubCountdown(deadlineMs: number | null | undefined) {
  if (!deadlineMs) return "";
  const diff = Math.max(0, deadlineMs - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function formatHubWindow(deadlineMs: number | null | undefined) {
  if (!deadlineMs) return "—";
  const diff = Math.max(0, deadlineMs - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function hubSegFilled(state: string | null | undefined, stage: "sent" | "claimed" | "answered" | "activated") {
  const order = ["allocated", "available", "sent", "claimed", "answered", "activated"];
  let idx = order.indexOf(String(state || "allocated"));
  if (idx < 0) idx = 0;
  if (stage === "sent") return idx >= 2;
  if (stage === "claimed") return idx >= 3;
  if (stage === "answered") return idx >= 4;
  if (stage === "activated") return idx >= 5;
  return false;
}

export function hubArchetypeLabel(raw: unknown): string {
  if (raw == null || raw === "") return "";
  if (typeof raw === "number" && Number.isFinite(raw)) return "";
  if (typeof raw === "boolean") return "";
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s === "[object Object]") return "";
    const titled: Record<string, string> = {
      Anchor: "The Anchor",
      Steward: "The Steward",
      Confidant: "The Confidant",
      Connector: "The Connector",
      Bridge: "The Bridge",
      Builder: "The Builder",
      Catalyst: "The Catalyst",
      Explorer: "The Explorer",
      Curator: "The Curator",
      Companion: "The Companion",
      Strategist: "The Strategist",
      "Atmosphere-Setter": "The Atmosphere-Setter",
      "Atmosphere Setter": "The Atmosphere-Setter",
    };
    return titled[s] || s;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const fromArr = hubArchetypeLabel(item);
      if (fromArr) return fromArr;
    }
    return "";
  }
  if (typeof raw !== "object") return "";
  const keys = ["name", "label", "title", "display", "display_name", "main", "archetype", "value", "slug"];
  const rec = raw as Record<string, unknown>;
  for (const key of keys) {
    if (rec[key] == null) continue;
    const fromKey = hubArchetypeLabel(rec[key]);
    if (fromKey) return fromKey;
  }
  if (rec.en != null) {
    const nested = hubArchetypeLabel(rec.en);
    if (nested) return nested;
  }
  return "";
}

export function hubKeysSnapshot(keys: OutboundKey[], mirror: Mirror | null) {
  const keyPart = (keys || [])
    .map((k) =>
      [k.slot, k.key_id, k.state, k.nominee_name || "", k.claim_deadline || "", k.send_deadline || "", k.invite_code || ""].join(":"),
    )
    .join("|");
  const mirPart = mirror
    ? [
        mirror.status || "",
        mirror.responses_count != null ? mirror.responses_count : "",
        hubArchetypeLabel(mirror.archetypes || mirror.archetype || ""),
      ].join(":")
    : "";
  return `${keyPart}::${mirPart}`;
}

export function soonestKeyDeadline(keys: OutboundKey[]) {
  let best: number | null = null;
  for (const k of keys || []) {
    const dl = outboundClockMs(k);
    if (dl && (best == null || dl < best)) best = dl;
  }
  return best;
}

export function countSentKeys(keys: OutboundKey[]) {
  return (keys || []).filter((k) => k.state && k.state !== "allocated" && k.state !== "available").length;
}

export function keyIsAllocated(k: OutboundKey | null | undefined) {
  const s = String((k && (k.state || k.status)) || "").toLowerCase();
  return !s || s === "allocated" || s === "available";
}

export function keyHasLiveSendWindow(k: OutboundKey | null | undefined) {
  if (!keyIsAllocated(k)) return false;
  const dl = parseDeadline(k?.send_deadline);
  if (!dl) return true;
  return dl > Date.now();
}

export function memberIsExplorerActive(me: Me | null | undefined) {
  const st = String(me?.state || "").toLowerCase();
  return st === "explorer_active" || st === "paid_active";
}

export function canOfferExtraKeyRequest(keys: OutboundKey[], me: Me | null | undefined) {
  if (!memberIsExplorerActive(me)) return false;
  const list = keys || [];
  if (list.some(keyHasLiveSendWindow)) return false;
  const orig = [1, 2, 3].map((slot) => list.find((k) => Number(k.slot) === slot) || null);
  const allThreeActivated = orig.every((k) => k && String(k.state || "").toLowerCase() === "activated");
  const allocated = list.filter(keyIsAllocated);
  const windowFinished =
    allocated.length > 0 &&
    allocated.every((k) => {
      const dl = parseDeadline(k.send_deadline);
      return !!(dl && dl <= Date.now());
    });
  return allThreeActivated || windowFinished;
}

export function keyRequestCtaLabel(st: string | null | undefined) {
  if (st === "pending") return "Request sent";
  if (st === "granted") return "Granted";
  if (st === "declined") return "Ask again →";
  return "Request →";
}

export function keyRequestCopy(status: string | null | undefined, justSent = false) {
  const st = String(status || "").toLowerCase();
  if (st === "pending" && justSent) {
    return {
      title: "Request received",
      body: "We’ll review your request. If approved, another Key will appear in your vault.",
    };
  }
  if (st === "pending") {
    return {
      title: "Request already pending",
      body: "We have your request. There’s no need to send another.",
    };
  }
  if (st === "granted") {
    return {
      title: "Granted",
      body: "A Key was added to your vault.",
    };
  }
  return {
    title: "Request another Philia Key",
    body: "Used your first three? Request another to invite someone else into SocialFit.",
  };
}

export function membershipPackageLabel(choice: MembershipChoice | null | undefined) {
  if (!choice || !choice.tier) return "";
  const cap = choice.tier.charAt(0).toUpperCase() + choice.tier.slice(1);
  if (choice.tier === "explorer" || choice.billing_period === "none") return `${cap} · Free`;
  const period = choice.billing_period === "monthly" ? "Monthly" : "Annual";
  return `${cap} · ${period}`;
}

export function membershipPackagePrice(choice: MembershipChoice | null | undefined) {
  if (!choice) return "";
  if (choice.tier === "explorer" || choice.billing_period === "none") return "No payment today.";
  if (choice.tier === "insider" && choice.billing_period === "annual") return "AED 50 / mo · billed annually";
  if (choice.tier === "insider" && choice.billing_period === "monthly") return "AED 79 / mo · billed monthly";
  if (choice.tier === "catalyst" && choice.billing_period === "annual") return "AED 150 / mo · billed annually";
  if (choice.tier === "catalyst" && choice.billing_period === "monthly") return "AED 169 / mo · billed monthly";
  return "No payment today.";
}

export function membershipChoiceError(err: unknown) {
  const code = isApiError(err) ? err.code : String((err as { message?: string })?.message || "");
  const status = isApiError(err) ? err.status : 0;
  if (status === 401) return "Sign in again to record your package.";
  if (code === "hub_required" || status === 403) return "Finish Hub setup to record a package.";
  if (code === "pathfinder") return "This account can't pick a Hub package yet.";
  if (
    code === "invalid_tier" ||
    code === "invalid_package" ||
    code === "tier_required" ||
    code === "billing_period_required"
  ) {
    return "That package isn't valid. Try another.";
  }
  return "Couldn't record your package. Try again.";
}

export function isHubReady(me?: Me | null) {
  if (me) {
    if (me.ceremony_step === "hub") return true;
    if (me.onboarding_step === "done" && me.needs_onboarding === false) return true;
  }
  const s = readSession();
  return s.hubUnlocked || s.ceremonyStep === "hub";
}

export function goLogout() {
  clearStoryProgress();
  try {
    localStorage.removeItem("philia_ceremony_step");
    localStorage.removeItem("philia_id_theme");
  } catch {
    /* private mode */
  }
  clearSession();
  window.location.assign(routes.landing);
}

export async function goHub(opts?: { tab?: 1 | 2 | 3; assign?: boolean }) {
  const wasHub = readSession().ceremonyStep === "hub";
  persistCeremonyStep("hub");
  writeSession({ explorerReady: true, hubUnlocked: true, ceremonyStep: "hub" });

  if (hasAccess() && !wasHub) {
    try {
      await patchCeremony("hub");
      const me = await getMe();
      applyMeToSession(me);
    } catch {
      /* still open Hub — same as legacy catch(open) */
    }
  }

  persistCeremonyStep("hub");
  writeSession({ explorerReady: true, hubUnlocked: true });

  const dest = opts?.tab === 3 ? `${routes.hub}?tab=3` : opts?.tab === 2 ? `${routes.hub}?tab=2` : routes.hub;
  const path = window.location.pathname;
  const alreadyThere = path === routes.hub && (!opts?.tab || new URLSearchParams(window.location.search).get("tab") === String(opts.tab));
  if (opts?.assign === false || alreadyThere) return;
  if (path !== routes.hub || (opts?.tab && !alreadyThere)) {
    window.location.assign(dest);
  }
}
