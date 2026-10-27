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

export const WORLD_LABEL_MAX = 40;
export const WORLD_GROUP_MAX = 20;

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

function compactWorld(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i][0] = i;
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
    }
  }
  return grid[a.length][b.length];
}

function cleanWorldLabel(raw: unknown) {
  return String(raw || "").trim().replace(/\s+/g, " ");
}

/** Exact chip match, ignoring case. Used on read — do not fuzzy-map stored custom labels. */
export function knownWorldChip(id: WorldId, raw: string) {
  const label = cleanWorldLabel(raw);
  if (!label) return "";
  return LABEL_MAP[id].get(label.toLowerCase()) || "";
}

/** Map a typed value to a chip when the spelling is close (`tenniss` → `Tennis`). */
export function matchWorldChip(id: WorldId, raw: string) {
  const exact = knownWorldChip(id, raw);
  if (exact) return exact;
  const compact = compactWorld(raw);
  if (compact.length < 3) return "";
  const chips = PROFILE_WORLDS.find((g) => g.id === id)?.chips || [];
  const prefixes = chips.filter((chip) => {
    const c = compactWorld(chip);
    return compact.length >= 4 && (c.startsWith(compact) || compact.startsWith(c));
  });
  if (prefixes.length === 1) return prefixes[0];
  let best = "";
  let bestDist = Infinity;
  let ties = 0;
  const maxDist = compact.length >= 6 ? 2 : 1;
  for (const chip of chips) {
    const dist = levenshtein(compact, compactWorld(chip));
    if (dist > maxDist) continue;
    if (dist < bestDist) {
      best = chip;
      bestDist = dist;
      ties = 1;
    } else if (dist === bestDist) {
      ties += 1;
    }
  }
  return ties === 1 ? best : "";
}

export function resolveWorldInput(id: WorldId, raw: string): { label?: string; error?: string } {
  const label = cleanWorldLabel(raw);
  if (!label) return { error: "Type a world to add." };
  if (label.length > WORLD_LABEL_MAX) return { error: "Keep that under 40 characters." };
  if (!/[0-9a-z]/i.test(label)) return { error: "That world isn’t on the list." };
  return { label: matchWorldChip(id, label) || label };
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
      const text = cleanWorldLabel(item);
      if (!text || text.length > WORLD_LABEL_MAX || !/[0-9a-z]/i.test(text)) continue;
      const label = knownWorldChip(id, text) || text;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out[id].push(label);
      if (out[id].length >= WORLD_GROUP_MAX) break;
    }
  }
  return out;
}

export function worldsFilledCount(worlds: Record<WorldId, string[]>) {
  return WORLD_IDS.filter((id) => worlds[id].length > 0).length;
}
