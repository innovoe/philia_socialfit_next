"use client";

import { useSyncExternalStore } from "react";
import { saveStoryRead, getStoryRead } from "@/lib/api/story";
import { isDeadAccessError } from "@/lib/expire";
import { locationSaveLine, toLocationPlace } from "@/lib/location";
import { hasAccess, readSession } from "@/lib/session";
import {
  READ_KEYS,
  READ_SECTIONS,
  STORY_KEYS,
  STORY_SECTIONS,
  firstIncomplete,
  type StoryAnswer,
  type StoryAnswers,
} from "@/lib/story-data";
import { routes } from "@/lib/routes";

const ANSWERS_KEY = "philia_answers";
const EMAIL_KEY = "philia_answers_email";

const EMPTY_ANSWERS: StoryAnswers = {};
const answerListeners = new Set<() => void>();

let memoryAnswers: StoryAnswers | null = null;
let serverHydrated = false;
let hydrateInFlight: Promise<StoryAnswers> | null = null;

function emitAnswers() {
  answerListeners.forEach((fn) => fn());
}

export function subscribeAnswers(onStoreChange: () => void) {
  answerListeners.add(onStoreChange);
  return () => {
    answerListeners.delete(onStoreChange);
  };
}

export function getAnswersSnapshot() {
  return loadAnswers();
}

export function getAnswersServerSnapshot() {
  return EMPTY_ANSWERS;
}

export function useStoryAnswers() {
  return useSyncExternalStore(
    subscribeAnswers,
    getAnswersSnapshot,
    getAnswersServerSnapshot,
  );
}

export function loadAnswers(): StoryAnswers {
  if (memoryAnswers) return memoryAnswers;
  if (typeof window === "undefined") return EMPTY_ANSWERS;
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    memoryAnswers = coerceAnswers(raw ? (JSON.parse(raw) as unknown) : {});
    return memoryAnswers;
  } catch {
    memoryAnswers = {};
    return memoryAnswers;
  }
}

export function writeAnswers(answers: StoryAnswers) {
  memoryAnswers = answers;
  try {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    const email = readSession().founderEmail;
    if (email) localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* private mode */
  }
  emitAnswers();
}

export function persistAnswers(answers: StoryAnswers) {
  writeAnswers(answers);
  if (!hasAccess()) return;
  const story_blanks: Record<string, StoryAnswer> = {};
  const read_blanks: Record<string, StoryAnswer> = {};
  STORY_KEYS.forEach((k) => {
    const next = persistBlank(answers[k]);
    if (next != null) story_blanks[k] = next;
  });
  READ_KEYS.forEach((k) => {
    const next = persistBlank(answers[k]);
    if (next != null) read_blanks[k] = next;
  });
  saveStoryRead({ story_blanks, read_blanks }).catch((err) => {
    if (isDeadAccessError(err)) return;
    const note = document.getElementById("storySaveNote") ?? document.createElement("div");
    note.id = "storySaveNote";
    note.textContent =
      locationSaveLine(err) || "Couldn’t sync answers — saved on this device only.";
    note.style.cssText =
      "position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:80;padding:10px 14px;border-radius:999px;background:rgba(32,32,52,.88);color:#fff;font:500 11px/1.3 Inter,sans-serif;opacity:1;transition:opacity .25s;pointer-events:none;max-width:86vw;text-align:center";
    if (!note.parentNode) document.body.appendChild(note);
    window.setTimeout(() => {
      note.style.opacity = "0";
    }, 3200);
  });
}

export async function hydrateAnswersFromServer() {
  if (!hasAccess()) return loadAnswers();
  if (serverHydrated && memoryAnswers) return memoryAnswers;
  if (hydrateInFlight) return hydrateInFlight;
  hydrateInFlight = (async () => {
    try {
      const r = await getStoryRead();
      const next = coerceAnswers({
        ...(r.story_blanks || {}),
        ...(r.read_blanks || {}),
      });
      writeAnswers(next);
      serverHydrated = true;
      return next;
    } catch (err) {
      if (isDeadAccessError(err)) throw err;
      serverHydrated = true;
      return loadAnswers();
    } finally {
      hydrateInFlight = null;
    }
  })();
  return hydrateInFlight;
}

export type ResumeTarget =
  | { kind: "story"; index: number }
  | { kind: "read"; index: number }
  | { kind: "ceremony" };

export function computeResume(answers: StoryAnswers): ResumeTarget {
  const early = firstIncomplete(STORY_SECTIONS, answers, 0, 3);
  if (early != null) return { kind: "story", index: early };
  const read = firstIncomplete(READ_SECTIONS, answers, 0, READ_SECTIONS.length);
  if (read != null) return { kind: "read", index: read };
  const late = firstIncomplete(STORY_SECTIONS, answers, 3, STORY_SECTIONS.length);
  if (late != null) return { kind: "story", index: late };
  return { kind: "ceremony" };
}

export function resumeUrl(target: ResumeTarget) {
  if (target.kind === "story") return `${routes.story}/${target.index + 1}`;
  if (target.kind === "read") return `${routes.read}/${target.index + 1}`;
  return routes.ceremony;
}

export function readComplete(answers: StoryAnswers) {
  return firstIncomplete(READ_SECTIONS, answers) == null;
}

function persistBlank(v: StoryAnswer | undefined): StoryAnswer | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v;
  const place = toLocationPlace(v);
  return place ?? undefined;
}

function coerceAnswers(raw: unknown): StoryAnswers {
  if (!raw || typeof raw !== "object") return {};
  const next: StoryAnswers = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const a = coerceStoryAnswer(v);
    if (a !== undefined) next[k] = a;
  }
  return next;
}

function coerceStoryAnswer(v: unknown): StoryAnswer | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((item) => String(item));
  return toLocationPlace(v) ?? undefined;
}

export function clearStoryProgress() {
  memoryAnswers = null;
  serverHydrated = false;
  hydrateInFlight = null;
  try {
    localStorage.removeItem(ANSWERS_KEY);
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* private mode */
  }
  emitAnswers();
}
