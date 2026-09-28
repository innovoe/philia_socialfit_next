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

export function getNeighbourhoods() {
  return apiRequest<{ city?: string; options?: Neighbourhood[] }, []>(
    memberEndpoints.getNeighbourhoods,
    [],
  );
}
