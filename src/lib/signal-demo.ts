import { hasAccess, hasFounderKey } from "@/lib/session";
import { routes } from "@/lib/routes";

const SIGNAL_RETURN_KEY = "philia_signal_return";

export function canPlaySignalDemo() {
  return hasFounderKey() || hasAccess();
}

export function setSignalReturn(path: string) {
  try {
    sessionStorage.setItem(SIGNAL_RETURN_KEY, path);
  } catch {
    /* private mode */
  }
}

export function takeSignalReturn() {
  try {
    const path = sessionStorage.getItem(SIGNAL_RETURN_KEY);
    sessionStorage.removeItem(SIGNAL_RETURN_KEY);
    return path && path.startsWith("/") ? path : null;
  } catch {
    return null;
  }
}

export function startSignalReplay(returnTo = routes.profile) {
  setSignalReturn(returnTo);
  window.location.assign(routes.demo);
}

export type SignalMode = "mood" | "mission";
export type MoodId = "feel" | "with" | "time" | "purpose";
export type MissionId = "action" | "people" | "when" | "outcome";
export type Band = "loose" | "middle" | "specific";

export type BlankMeta = {
  id: MoodId | MissionId;
  low: string;
  high: string;
  helper: string;
};

export type Chip = {
  blank: string;
  band: Band;
  label: string;
};

export const MOOD_BLANKS: BlankMeta[] = [
  { id: "feel", low: "loose", high: "specific", helper: "What kind of moment are you reaching for?" },
  { id: "with", low: "open", high: "specific", helper: "Who would make this feel right?" },
  { id: "time", low: "soon", high: "planned", helper: "When should this happen?" },
  { id: "purpose", low: "light", high: "meaningful", helper: "What do you want this moment to give you?" },
];

export const MISSION_BLANKS: BlankMeta[] = [
  { id: "action", low: "anything", high: "one thing", helper: "What do you want to make happen?" },
  { id: "people", low: "anyone", high: "someone in mind", helper: "Who should be part of this?" },
  { id: "when", low: "whenever", high: "a set date", helper: "When do you want this?" },
  { id: "outcome", low: "just show up", high: "a real outcome", helper: "What would make this worth it?" },
];

export const MOOD_CHIPS: Chip[] = [
  { blank: "feel", band: "loose", label: "something with good energy" },
  { blank: "feel", band: "loose", label: "gentle company" },
  { blank: "feel", band: "loose", label: "a reason to get out" },
  { blank: "feel", band: "loose", label: "something low-pressure" },
  { blank: "feel", band: "middle", label: "a check-in" },
  { blank: "feel", band: "middle", label: "a small adventure" },
  { blank: "feel", band: "middle", label: "a change of scene" },
  { blank: "feel", band: "specific", label: "a small dinner" },
  { blank: "feel", band: "specific", label: "a proper conversation" },
  { blank: "feel", band: "specific", label: "moving my body" },
  { blank: "with", band: "loose", label: "playful people" },
  { blank: "with", band: "loose", label: "familiar faces" },
  { blank: "with", band: "loose", label: "new faces" },
  { blank: "with", band: "middle", label: "someone who gets it" },
  { blank: "with", band: "middle", label: "someone steady" },
  { blank: "with", band: "specific", label: "a quiet friend" },
  { blank: "with", band: "specific", label: "someone who really listens" },
  { blank: "time", band: "loose", label: "right now" },
  { blank: "time", band: "loose", label: "in the next hour" },
  { blank: "time", band: "middle", label: "later today" },
  { blank: "time", band: "middle", label: "this evening" },
  { blank: "time", band: "specific", label: "this weekend" },
  { blank: "time", band: "specific", label: "next week" },
  { blank: "purpose", band: "loose", label: "laugh a little" },
  { blank: "purpose", band: "loose", label: "not be alone right now" },
  { blank: "purpose", band: "loose", label: "reset" },
  { blank: "purpose", band: "middle", label: "feel seen" },
  { blank: "purpose", band: "middle", label: "break from routine" },
  { blank: "purpose", band: "specific", label: "be honest without performing" },
  { blank: "purpose", band: "specific", label: "take a next step" },
];

export const MISSION_CHIPS: Chip[] = [
  { blank: "action", band: "loose", label: "meet interesting people" },
  { blank: "action", band: "middle", label: "expand my world" },
  { blank: "action", band: "specific", label: "play padel" },
  { blank: "action", band: "specific", label: "grab dinner" },
  { blank: "people", band: "loose", label: "good people" },
  { blank: "people", band: "middle", label: "people in a similar chapter" },
  { blank: "people", band: "specific", label: "2–4 people" },
  { blank: "when", band: "loose", label: "this week" },
  { blank: "when", band: "middle", label: "this weekend" },
  { blank: "when", band: "specific", label: "tomorrow evening" },
  { blank: "outcome", band: "loose", label: "feel more connected" },
  { blank: "outcome", band: "middle", label: "create momentum" },
  { blank: "outcome", band: "specific", label: "find aligned collaborators" },
];

export const DEFAULT_SLIDERS: Record<string, number> = {
  feel: 20,
  with: 15,
  time: 15,
  purpose: 35,
  action: 20,
  people: 15,
  when: 15,
  outcome: 35,
};

export function bandFromSlider(v: number): Band {
  if (v < 34) return "loose";
  if (v < 67) return "middle";
  return "specific";
}

export function optionsFor(blank: string, slider: number, chips: Chip[]) {
  const band = bandFromSlider(slider);
  return chips.filter((c) => c.blank === blank && c.band === band);
}

export const RESULT_ROOMS = [
  { image: "/assets/images/room-1-hands-coffee.webp", when: "Now · 3 spots", name: "Piknik at Safa Park" },
  { image: "/assets/images/room-hikers.webp", when: "In 45 min · Open", name: "Trekking with friends" },
  { image: "/assets/images/room-3-talk.webp", when: "Tonight · Open", name: "The Talk, Downtown" },
  { image: "/assets/images/room-4-coffee-women.webp", when: "Now-ish · 2 spots", name: "Slow Coffee Somewhere" },
] as const;

export const RESULT_PEOPLE = [
  { image: "/assets/images/people-1-layla.webp", when: "4 mutual worlds", name: "Layla M." },
  { image: "/assets/images/people-2-omar.webp", when: "6 mutual worlds", name: "Omar S." },
  { image: "/assets/images/people-3-amira.webp", when: "5 mutual worlds", name: "Amira K." },
  { image: "/assets/images/people-4-dina.webp", when: "3 mutual worlds", name: "Dina R." },
] as const;

export const TAB_DESC = {
  rooms:
    "A Room fit is a curated social space. An experience, venue, or gathering where your signal fits the energy in the room.",
  people:
    "A Person fit is someone whose frequency aligns with yours. Matched by the Philia Trust Graph, not by a profile.",
} as const;
