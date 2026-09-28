"use client";

import { saveStoryRead, getStoryRead } from "@/lib/api/story";
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

export function loadAnswers(): StoryAnswers {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    return raw ? (JSON.parse(raw) as StoryAnswers) : {};
  } catch {
    return {};
  }
}

export function writeAnswers(answers: StoryAnswers) {
  try {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    const email = readSession().founderEmail;
    if (email) localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* private mode */
  }
}

export function persistAnswers(answers: StoryAnswers) {
  writeAnswers(answers);
  if (!hasAccess()) return;
  const story_blanks: Record<string, StoryAnswer> = {};
  const read_blanks: Record<string, StoryAnswer> = {};
  STORY_KEYS.forEach((k) => {
    if (answers[k] != null) story_blanks[k] = answers[k] as StoryAnswer;
  });
  READ_KEYS.forEach((k) => {
    if (answers[k] != null) read_blanks[k] = answers[k] as StoryAnswer;
  });
  saveStoryRead({ story_blanks, read_blanks }).catch(() => {
    const note = document.getElementById("storySaveNote") ?? document.createElement("div");
    note.id = "storySaveNote";
    note.textContent = "Couldn’t sync answers — saved on this device only.";
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
  try {
    const r = await getStoryRead();
    const next: StoryAnswers = {};
    Object.assign(next, r.story_blanks || {}, r.read_blanks || {});
    writeAnswers(next);
    return next;
  } catch {
    return loadAnswers();
  }
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

export function clearStoryProgress() {
  try {
    localStorage.removeItem(ANSWERS_KEY);
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* private mode */
  }
}
