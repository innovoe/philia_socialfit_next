"use client";

import { cachedMe, isHubMe } from "@/lib/me-cache";
import { isExplorerStep, readSession, type GateSession } from "@/lib/session";
import { routes } from "@/lib/routes";

const empty: Pick<GateSession, "explorerReady" | "hubUnlocked" | "ceremonyStep"> = {
  explorerReady: false,
  hubUnlocked: false,
  ceremonyStep: null,
};

function onExplorerScreen(path: string) {
  return (
    path.startsWith(routes.ceremonyId) ||
    path.startsWith(routes.ceremonyMirror) ||
    path.startsWith(routes.ceremonyKeys) ||
    path.startsWith(routes.hub) ||
    path.startsWith(routes.profile) ||
    path === routes.id ||
    path.startsWith(`${routes.id}/`)
  );
}

/** Nav lock flags only. Does not write session or change resume/ceremony. */
export function readNavFlags(path: string, useStore = true) {
  const s = useStore ? readSession() : empty;
  const me = useStore ? cachedMe() : null;
  const hub =
    s.hubUnlocked ||
    s.ceremonyStep === "hub" ||
    path.startsWith(routes.hub) ||
    isHubMe(me);
  const explorer =
    s.explorerReady ||
    s.hubUnlocked ||
    isExplorerStep(s.ceremonyStep) ||
    onExplorerScreen(path) ||
    hub;
  const storyDone =
    s.ceremonyStep === "summary" ||
    isExplorerStep(s.ceremonyStep) ||
    !!me?.story_complete ||
    explorer;
  const revisitingStory = path.startsWith(routes.story) || path.startsWith(routes.read);
  return {
    explorer,
    ready: explorer || (revisitingStory && storyDone),
    hub,
  };
}
