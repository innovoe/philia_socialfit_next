"use client";

import { claimKey, getMe, type ClaimKeyResult, type Me } from "@/lib/api/member";
import type { KeyValidate } from "@/lib/api/key-entry";
import { isInvitePayload } from "@/lib/api/key-entry";
import { readSession, writeSession, type EntryPath } from "@/lib/session";
import { routes } from "@/lib/routes";

export const MIRROR_ARCHETYPES = [
  {
    name: "Anchor",
    title: "The Anchor",
    sub: "People feel steadier around them.",
    examples: [
      "They're the person you turn to when life feels a little uncertain.",
      "They stay calm when everyone else is getting overwhelmed.",
      "You know you can count on them, especially when it matters.",
    ],
  },
  {
    name: "Steward",
    title: "The Steward",
    sub: "They look after the people and communities they care about.",
    examples: [
      "They notice when someone's been quiet and make a point of checking in.",
      "They're the one making sure everyone feels included and looked after.",
      "They put real effort into keeping their friendships and communities thriving.",
    ],
  },
  {
    name: "Confidant",
    title: "The Confidant",
    sub: "People feel safe opening up to them.",
    examples: [
      "People tell them things they wouldn't feel comfortable sharing with everyone.",
      "They listen without rushing to judge or offer advice.",
      "You can be completely yourself around them, even on your difficult days.",
    ],
  },
  {
    name: "Connector",
    title: "The Connector",
    sub: "They bring people together who genuinely click.",
    examples: [
      'They\'re always saying, "You two really need to meet."',
      "They introduce people who end up becoming friends, collaborators or something more.",
      "They remember what people are looking for and know just who to connect them with.",
    ],
  },
  {
    name: "Bridge",
    title: "The Bridge",
    sub: "They help people from different worlds connect.",
    examples: [
      "They move comfortably between different cultures, communities and social circles.",
      "They help people find common ground, even when their backgrounds are very different.",
      "They make it easier for someone new to feel welcome in an unfamiliar circle.",
    ],
  },
  {
    name: "Builder",
    title: "The Builder",
    sub: "They turn shared ideas into something real.",
    examples: [
      'They\'re the one who turns "We should do this sometime" into an actual plan.',
      "They bring people together around an idea and get everyone involved.",
      "They create projects, initiatives or experiences that give people something to build together.",
    ],
  },
  {
    name: "Catalyst",
    title: "The Catalyst",
    sub: "They inspire people to take action and move forward.",
    examples: [
      "A conversation with them can give someone the push they've been needing.",
      "They spot potential in people and encourage them to do something with it.",
      "They have a way of turning hesitation into excitement about what's possible.",
    ],
  },
  {
    name: "Explorer",
    title: "The Explorer",
    sub: "They discover new possibilities and bring others along.",
    examples: [
      "They're usually the first to try a new place, activity or experience.",
      "They introduce friends to things they might never have discovered on their own.",
      "Their curiosity takes them beyond their usual circles and routines.",
    ],
  },
  {
    name: "Curator",
    title: "The Curator",
    sub: "They have a knack for choosing what feels just right.",
    examples: [
      "They know exactly which restaurant, event or experience a particular friend would love.",
      "They put thought into the people they invite and the experiences they create.",
      "Their recommendations feel personal because they pay attention to what makes people tick.",
    ],
  },
  {
    name: "Companion",
    title: "The Companion",
    sub: "They make everyday life feel better simply by being there.",
    examples: [
      "They're just as happy sharing a quiet coffee as planning a big night out.",
      "They make time for the little everyday moments that keep friendships close.",
      "Even after months apart, spending time together feels wonderfully familiar.",
    ],
  },
  {
    name: "Strategist",
    title: "The Strategist",
    sub: "They see connections and possibilities others might miss.",
    examples: [
      "They're the person people turn to when they need to think something through.",
      "They notice patterns in situations and help others see the bigger picture.",
      "They can spot an opportunity or potential problem before it becomes obvious.",
    ],
  },
  {
    name: "Atmosphere-Setter",
    title: "The Atmosphere-Setter",
    sub: "They make the people around them feel the moment.",
    examples: [
      "They have a way of making even an ordinary evening feel special.",
      "They sense the mood of a group and know how to make everyone feel at ease.",
      "Whether it's a cosy dinner or a lively party, they bring the kind of energy that makes people want to stay.",
    ],
  },
] as const;

export function normaliseKeyCode(value: string) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function queryKeyCode(search: string) {
  const q = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return normaliseKeyCode(q.get("code") || q.get("key") || q.get("invite") || "");
}

export function looksLikeInviteQuery(search: string) {
  const q = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return !!(String(q.get("from") || "").trim() || String(q.get("name") || "").trim());
}

export function sentenceStartName(from: string) {
  const s = String(from || "").trim() || "A friend";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatMirrorQuestion(raw: string | null | undefined) {
  let q = String(raw || "How do you see me socially?").trim();
  if (q.charAt(0) !== "“" && q.charAt(0) !== '"') q = `“${q}”`;
  return q;
}

export function stashKeyValidate(r: KeyValidate, code: string) {
  const c = normaliseKeyCode(code || r.invite_code || "");
  const invite = isInvitePayload(r);
  const path: EntryPath = invite ? "invite" : "founder";
  writeSession({
    keyId: r.key_id != null ? Number(r.key_id) : null,
    keyCode: c || null,
    keyType: r.key_type || null,
    entryPath: path,
    ownerDisplayName: r.owner_display_name || r.owner_name || null,
    nomineeFirstName: r.nominee_first_name || null,
    mirrorQuestion: r.mirror_question || "How do you see me socially?",
    mirrorAnswered: !!(r.mirror_answered || r.mirror_status === "answered"),
    claimDeadline: r.claim_deadline || null,
    finishDeadline: r.finish_deadline || null,
    ...(invite ? { founderToken: null } : {}),
  });
}

export function afterInviteValidate(r: KeyValidate) {
  if (r.mirror_answered || r.mirror_status === "answered") return routes.invitePrimer;
  return routes.inviteMirror;
}

export function isInviteSession() {
  const s = readSession();
  return s.entryPath === "invite" || s.keyType === "member";
}

export function inviteOwnerName() {
  const s = readSession();
  return (s.ownerDisplayName || "").trim() || "a friend";
}

export function inviteContinueHref() {
  return readSession().mirrorAnswered ? routes.invitePrimer : routes.inviteMirror;
}

export async function claimInviteKey(access: string): Promise<{ claim: ClaimKeyResult; me: Me | null }> {
  const s = readSession();
  if (s.keyId == null) {
    const err = new Error("no_key") as Error & { status: number; data: { error: string } };
    err.status = 400;
    err.data = { error: "code_required" };
    throw err;
  }
  const claim = await claimKey(s.keyId, { code: s.keyCode }, access);
  let me: Me | null = null;
  try {
    me = await getMe(access);
  } catch {
    me = null;
  }
  writeSession({
    claimDeadline: me?.claim_deadline || claim.claim_deadline || s.claimDeadline,
    finishDeadline: me?.finish_deadline || claim.finish_deadline || s.finishDeadline,
  });
  return { claim, me };
}

export function formatClaimClock(iso: string | null | undefined) {
  if (!iso) return "—";
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return "—";
  const diff = Math.max(0, end - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
