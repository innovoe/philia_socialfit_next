"use client";

import { worldsFilledCount, type WorldId } from "@/lib/worlds";

export type EntryPath = "founder" | "invite" | "consumer" | null;
export type CeremonyStep = "summary" | "id" | "keys" | "hub" | null;

export type MembershipChoice = {
  tier: "explorer" | "insider" | "catalyst";
  billing_period: "none" | "annual" | "monthly";
  chosen_at?: string | null;
};

export type GateSession = {
  entryPath: EntryPath;
  founderEmail: string | null;
  founderToken: string | null;
  emailStarted: boolean;
  keyId: number | null;
  keyCode: string | null;
  claimDeadline: string | null;
  finishDeadline: string | null;
  access: string | null;
  refresh: string | null;
  userId: number | null;
  skip: string[];
  show: string[];
  ceremonyStep: CeremonyStep;
  explorerReady: boolean;
  hubUnlocked: boolean;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  passportDisplay: string | null;
  tier: string | null;
  idTheme: string | null;
  membershipChoice: MembershipChoice | null;
  worldsFilled: number;
  ownerDisplayName: string | null;
  nomineeFirstName: string | null;
  mirrorQuestion: string | null;
  mirrorAnswered: boolean;
  keyType: string | null;
  phoneVerified: boolean;
  phoneMask: string | null;
};

const KEY = "philia_gate";

const empty: GateSession = {
  entryPath: null,
  founderEmail: null,
  founderToken: null,
  emailStarted: false,
  keyId: null,
  keyCode: null,
  claimDeadline: null,
  finishDeadline: null,
  access: null,
  refresh: null,
  userId: null,
  skip: [],
  show: [],
  ceremonyStep: null,
  explorerReady: false,
  hubUnlocked: false,
  displayName: null,
  firstName: null,
  lastName: null,
  email: null,
  passportDisplay: null,
  tier: null,
  idTheme: null,
  membershipChoice: null,
  worldsFilled: 0,
  ownerDisplayName: null,
  nomineeFirstName: null,
  mirrorQuestion: null,
  mirrorAnswered: false,
  keyType: null,
  phoneVerified: false,
  phoneMask: null,
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readSession(): GateSession {
  if (!canUseStorage()) return { ...empty };
  try {
    const raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return { ...empty };
  }
}

export function writeSession(patch: Partial<GateSession>): GateSession {
  const next = { ...readSession(), ...patch };
  if (!canUseStorage()) return next;
  const raw = JSON.stringify(next);
  try {
    sessionStorage.setItem(KEY, raw);
    localStorage.setItem(KEY, raw);
  } catch {
    /* private mode */
  }
  return next;
}

export function clearSession() {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hasFounderToken() {
  return !!readSession().founderToken;
}

export function hasEmailStarted() {
  const s = readSession();
  return s.emailStarted && !!s.founderEmail;
}

export function hasAccess() {
  return !!readSession().access;
}

export function hasFounderKey() {
  const s = readSession();
  return !!s.founderToken && s.keyId != null;
}

export function normalizeCeremonyStep(raw: unknown): CeremonyStep {
  const s = String(raw || "").toLowerCase();
  if (s === "summary" || s === "id" || s === "keys" || s === "hub") return s;
  return null;
}

export function applyMeToSession(me: {
  ceremony_step?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  passport_display?: string | null;
  tier?: string | null;
  finish_deadline?: string | null;
  claim_deadline?: string | null;
  user_id?: number | null;
  has_claimed_key?: boolean | null;
  needs_onboarding?: boolean;
  membership_choice?: MembershipChoice | null;
  worlds?: Record<string, string[]>;
} | null | undefined) {
  if (!me) return readSession();
  const step = normalizeCeremonyStep(me.ceremony_step);
  const explorer =
    step === "id" || step === "keys" || step === "hub" || readSession().explorerReady;
  return writeSession({
    ceremonyStep: step || readSession().ceremonyStep,
    explorerReady: explorer,
    hubUnlocked: step === "hub" || readSession().hubUnlocked,
    displayName: me.display_name != null ? me.display_name || null : readSession().displayName,
    firstName: me.first_name != null ? me.first_name || null : readSession().firstName,
    lastName: me.last_name != null ? me.last_name || null : readSession().lastName,
    email: me.email || readSession().email,
    passportDisplay: me.passport_display || readSession().passportDisplay,
    tier: me.tier || readSession().tier,
    finishDeadline: me.finish_deadline ?? readSession().finishDeadline,
    claimDeadline: me.claim_deadline ?? readSession().claimDeadline,
    userId: me.user_id ?? readSession().userId,
    membershipChoice: me.membership_choice ?? readSession().membershipChoice,
    worldsFilled: me.worlds
      ? worldsFilledCount(me.worlds as Record<WorldId, string[]>)
      : readSession().worldsFilled,
  });
}
