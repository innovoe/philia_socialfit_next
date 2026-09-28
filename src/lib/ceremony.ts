"use client";

import { isApiError } from "@/lib/api/errors";
import {
  applyMeToSession,
  readSession,
  writeSession,
  type CeremonyStep,
} from "@/lib/session";
import { firstIncomplete, STORY_SECTIONS } from "@/lib/story-data";
import { computeResume, loadAnswers, resumeUrl } from "@/lib/story-answers";
import { routes } from "@/lib/routes";
import type { Me, Passport } from "@/lib/api/member";

export const PASSPORT_THEMES = [
  "ice",
  "pearl",
  "lavender",
  "midnight",
  "forest",
  "smoke",
  "obsidian",
  "petroleum",
  "cigar",
  "bronzeolive",
] as const;

export type PassportTheme = (typeof PASSPORT_THEMES)[number];

export const THEME_LABELS: Record<PassportTheme, string> = {
  ice: "ICE",
  pearl: "PEARL",
  lavender: "LAVENDER",
  midnight: "MIDNIGHT",
  forest: "FOREST",
  smoke: "SMOKE",
  obsidian: "OBSIDIAN",
  petroleum: "PETROLEUM",
  cigar: "CIGAR",
  bronzeolive: "BRONZE OLIVE",
};

const THEME_KEY = "philia_id_theme";
const STEP_KEY = "philia_ceremony_step";
const WAITLIST_KEY = "philia_waitlist";

export function normalizePassportTheme(raw: unknown): PassportTheme | null {
  const t = String(raw || "")
    .trim()
    .toLowerCase();
  return (PASSPORT_THEMES as readonly string[]).includes(t) ? (t as PassportTheme) : null;
}

export function themeFromPassport(r: Passport | null | undefined): PassportTheme | null {
  if (!r) return null;
  if (typeof r.theme === "string") return normalizePassportTheme(r.theme);
  const c = r.colors;
  if (typeof c === "string") return normalizePassportTheme(c);
  if (c && typeof c === "object") {
    return normalizePassportTheme(c.theme || c.variant);
  }
  return null;
}

export function getSavedIdTheme(r?: Passport | null): PassportTheme {
  const fromBe = themeFromPassport(r);
  if (fromBe) return fromBe;
  try {
    return normalizePassportTheme(localStorage.getItem(THEME_KEY)) || "ice";
  } catch {
    return "ice";
  }
}

export function persistIdTheme(theme: PassportTheme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
  writeSession({ idTheme: theme });
}

export function persistCeremonyStep(step: CeremonyStep) {
  if (!step) return;
  try {
    localStorage.setItem(STEP_KEY, step);
  } catch {
    /* private mode */
  }
  writeSession({
    ceremonyStep: step,
    explorerReady: step === "id" || step === "keys" || step === "hub",
    hubUnlocked: step === "hub",
  });
}

export function ceremonyUrlForStep(step: CeremonyStep | null | undefined) {
  if (step === "hub") return routes.hub;
  if (step === "keys") return routes.ceremonyKeys;
  if (step === "id") return routes.ceremonyId;
  return routes.ceremony;
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic passport mark (QR-like). Not a real scannable QR. */
export function paintPassportMark(canvas: HTMLCanvasElement | null, payload: string) {
  if (!canvas) return;
  const g = canvas.getContext("2d");
  if (!g) return;
  const n = 21;
  const size = canvas.width;
  const cell = size / n;
  const seed = hashStr(String(payload || "philia"));
  g.fillStyle = "#F4F1EA";
  g.fillRect(0, 0, size, size);
  g.fillStyle = "#111018";
  const bit = (x: number, y: number) => {
    const v = hashStr(`${seed}:${x},${y}`);
    return (v & 7) > 2;
  };
  const stamp = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (edge || core) g.fillRect((ox + x) * cell, (oy + y) * cell, cell, cell);
      }
    }
  };
  stamp(0, 0);
  stamp(n - 7, 0);
  stamp(0, n - 7);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (x < 8 && y < 8) continue;
      if (x >= n - 8 && y < 8) continue;
      if (x < 8 && y >= n - 8) continue;
      if (bit(x, y)) g.fillRect(x * cell, y * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

export function formatMemberSince(r?: Passport | null) {
  const raw = r?.member_since || r?.activated_at || null;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
    }
    const m = String(raw).match(/^(\d{4})-(\d{2})/);
    if (m) return `${m[2]} / ${m[1]}`;
  }
  return "—";
}

export function memberDisplayName(me?: Me | null) {
  if (me) {
    if (me.display_name) return String(me.display_name).trim();
    return [me.first_name, me.last_name].filter(Boolean).join(" ").trim();
  }
  const s = readSession();
  if (s.displayName) return String(s.displayName).trim();
  return [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
}

export function nameLines(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return { first: parts[0], rest: parts.slice(1).join(" ") };
  return { first: name.trim(), rest: "" };
}

export function titleCaseTier(tier: string | null | undefined) {
  const t = String(tier || "explorer");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function storyArchetypeLabel() {
  try {
    const answers = loadAnswers();
    const arch = answers.archetype;
    const value = Array.isArray(arch) ? arch[0] : arch;
    return value ? `The ${value}` : "—";
  } catch {
    return "—";
  }
}

export function applyPassportToSession(r: Passport | null | undefined, me?: Me | null) {
  if (!r && !me) return;
  const theme = getSavedIdTheme(r);
  persistIdTheme(theme);
  writeSession({
    passportDisplay: r?.passport_display || me?.passport_display || readSession().passportDisplay,
    tier: r?.tier || me?.tier || readSession().tier,
  });
  if (me) applyMeToSession(me);
}

export function gateIncompleteStory() {
  const late = firstIncomplete(STORY_SECTIONS, loadAnswers(), 3);
  if (late != null) {
    window.location.replace(`${routes.story}/${late + 1}`);
    return true;
  }
  return false;
}

export function activateErrorMessage(code: string) {
  if (code === "story_read_incomplete") {
    return "Finish Story §§1–7 and Signal Read first, then try again.";
  }
  if (code === "no_claimed_key") {
    return "Your Key claim isn’t on this session. Sign out, sign in, then try Continue again.";
  }
  if (code === "finish_expired") {
    return "This Key’s finish window has closed.";
  }
  return "Could not activate Explorer.";
}

export function handleActivateError(err: unknown) {
  const data =
    isApiError(err) && err.data && typeof err.data === "object"
      ? (err.data as Record<string, unknown>)
      : {};
  const code = isApiError(err) ? err.code : String((err as { message?: string })?.message || "");
  if (code === "dubai_ineligible") {
    try {
      sessionStorage.setItem(
        WAITLIST_KEY,
        JSON.stringify({
          message: typeof data.message === "string" ? data.message : "",
          home: typeof data.home === "string" ? data.home : "",
        }),
      );
    } catch {
      /* ignore */
    }
    window.location.assign(routes.waitlist);
    return null;
  }
  if (code === "story_read_incomplete") {
    const target = resumeUrl(computeResume(loadAnswers()));
    window.location.replace(target);
    return null;
  }
  return activateErrorMessage(code);
}

export function readWaitlistNote() {
  try {
    const raw = sessionStorage.getItem(WAITLIST_KEY);
    if (!raw) return { message: "", home: "" };
    const parsed = JSON.parse(raw) as { message?: string; home?: string };
    return { message: parsed.message || "", home: parsed.home || "" };
  } catch {
    return { message: "", home: "" };
  }
}

export type PassportView = {
  name: string;
  first: string;
  rest: string;
  tier: string;
  tierLabel: string;
  serial: string;
  since: string;
  archetype: string;
  theme: PassportTheme;
};

export function passportView(me?: Me | null, passport?: Passport | null): PassportView {
  const name = memberDisplayName(me);
  const lines = nameLines(name);
  const tier = String(passport?.tier || me?.tier || "explorer");
  const serial =
    (typeof passport?.passport_display === "string" && passport.passport_display) ||
    me?.passport_display ||
    readSession().passportDisplay ||
    "";
  return {
    name,
    first: lines.first,
    rest: lines.rest,
    tier,
    tierLabel: titleCaseTier(tier),
    serial,
    since: formatMemberSince(passport),
    archetype: storyArchetypeLabel(),
    theme: getSavedIdTheme(passport),
  };
}
