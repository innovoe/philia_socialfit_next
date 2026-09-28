export const WORLD_IDS = ["sp", "cr", "fd", "iq", "ls", "ca"] as const;

export type WorldId = (typeof WORLD_IDS)[number];

export type WorldGroup = {
  id: WorldId;
  title: string;
  chips: string[];
};

export const PROFILE_WORLDS: WorldGroup[] = [
  {
    id: "sp",
    title: "Sport & Activity",
    chips: [
      "Tennis",
      "Padel",
      "Golf",
      "Running",
      "Cycling",
      "Swimming",
      "Yoga",
      "Pilates",
      "CrossFit",
      "Hiking",
      "Climbing",
      "Squash",
      "Football",
      "Basketball",
      "Cricket",
      "Boxing",
      "Dance",
      "Martial arts",
      "Horse riding",
      "Rowing",
    ],
  },
  {
    id: "cr",
    title: "Creative & Cultural",
    chips: [
      "Photography",
      "Writing",
      "Film",
      "Music",
      "DJing",
      "Painting",
      "Architecture",
      "Fashion",
      "Theatre",
      "Ceramics",
      "Poetry",
      "Interior design",
      "Illustration",
    ],
  },
  {
    id: "fd",
    title: "Food & Drink",
    chips: [
      "Fine dining",
      "Home cooking",
      "Coffee culture",
      "Wine",
      "Cocktails",
      "Mixology",
      "Markets & produce",
      "Street food",
      "Brunch culture",
    ],
  },
  {
    id: "iq",
    title: "Ideas & Thinking",
    chips: [
      "Philosophy",
      "Psychology",
      "Geopolitics",
      "Science & tech",
      "Finance & investing",
      "Economics",
      "History",
      "Literature",
      "AI & future",
      "Spirituality",
      "Religion & faith",
    ],
  },
  {
    id: "ls",
    title: "Lifestyle & Scene",
    chips: [
      "Yachting",
      "Motorsports",
      "Aviation",
      "Luxury travel",
      "Sustainable living",
      "Polo",
      "Wellness retreats",
      "Live music",
      "Art collecting",
      "Entertaining at home",
    ],
  },
  {
    id: "ca",
    title: "Career & Building",
    chips: [
      "Startups",
      "Tech",
      "Finance",
      "Real estate",
      "Creative industries",
      "Healthcare",
      "Law",
      "Education",
      "Media",
      "Hospitality",
      "Social impact",
      "Building a company",
      "Freelance / independent",
      "In transition",
    ],
  },
];

const LABEL_MAP: Record<WorldId, Map<string, string>> = WORLD_IDS.reduce(
  (acc, id) => {
    const grp = PROFILE_WORLDS.find((g) => g.id === id)!;
    acc[id] = new Map(grp.chips.map((c) => [c.toLowerCase(), c]));
    return acc;
  },
  {} as Record<WorldId, Map<string, string>>,
);

export function emptyWorlds(): Record<WorldId, string[]> {
  return { sp: [], cr: [], fd: [], iq: [], ls: [], ca: [] };
}

export function normalizeWorlds(raw: unknown): Record<WorldId, string[]> {
  const out = emptyWorlds();
  if (!raw || typeof raw !== "object") return out;
  const o = raw as Record<string, unknown>;
  for (const id of WORLD_IDS) {
    const arr = o[id];
    if (!Array.isArray(arr)) continue;
    const seen = new Set<string>();
    for (const item of arr) {
      const label = LABEL_MAP[id].get(String(item || "").trim().toLowerCase());
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out[id].push(label);
    }
  }
  return out;
}

export function worldsFilledCount(worlds: Record<WorldId, string[]>) {
  return WORLD_IDS.filter((id) => worlds[id].length > 0).length;
}
