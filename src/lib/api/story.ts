import { apiRequest } from "@/lib/api/client";
import { memberEndpoints } from "@/lib/api/endpoints";
import type { StoryAnswer } from "@/lib/story-data";

export type StoryReadPayload = {
  story_blanks?: Record<string, StoryAnswer>;
  read_blanks?: Record<string, StoryAnswer>;
  story_complete?: boolean;
  read_complete?: boolean;
  updated_at?: string;
};

export type Neighbourhood = {
  id?: number | string;
  name: string;
  slug?: string;
  hint?: string;
};

export function getStoryRead() {
  return apiRequest<StoryReadPayload, []>(memberEndpoints.getStoryRead, []);
}

export function saveStoryRead(body: {
  story_blanks: Record<string, StoryAnswer>;
  read_blanks: Record<string, StoryAnswer>;
}) {
  return apiRequest<StoryReadPayload, []>(memberEndpoints.saveStoryRead, [], body);
}

type NeighbourhoodsPayload = { city?: string; options?: Neighbourhood[] };

let neighbourhoodsCache: NeighbourhoodsPayload | null = null;
let neighbourhoodsInFlight: Promise<NeighbourhoodsPayload> | null = null;

export function getNeighbourhoods() {
  if (neighbourhoodsCache) return Promise.resolve(neighbourhoodsCache);
  if (neighbourhoodsInFlight) return neighbourhoodsInFlight;
  neighbourhoodsInFlight = apiRequest<NeighbourhoodsPayload, []>(
    memberEndpoints.getNeighbourhoods,
    [],
  )
    .then((raw) => {
      neighbourhoodsCache = raw;
      neighbourhoodsInFlight = null;
      return raw;
    })
    .catch((err) => {
      neighbourhoodsInFlight = null;
      throw err;
    });
  return neighbourhoodsInFlight;
}
