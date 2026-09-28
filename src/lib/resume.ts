"use client";

import type { Me } from "@/lib/api/member";
import { applyMeToSession } from "@/lib/session";
import { ceremonyUrlForStep, persistCeremonyStep } from "@/lib/ceremony";
import { computeResume, hydrateAnswersFromServer, resumeUrl } from "@/lib/story-answers";
import { isFilled, type StoryAnswers } from "@/lib/story-data";
import { routes } from "@/lib/routes";

export function isHubReady(me: Me | null | undefined) {
  if (!me) return false;
  return (
    me.ceremony_step === "hub" || (me.onboarding_step === "done" && me.needs_onboarding === false)
  );
}

function answersHaveProgress(answers: StoryAnswers) {
  return Object.keys(answers).some((k) => isFilled(answers[k]));
}

/** After login / session restore — Hub, ceremony, Story, or Verified. */
export async function resumeMember(me: Me) {
  applyMeToSession(me);
  const step = me.ceremony_step;
  if (step === "summary" || step === "id" || step === "keys" || step === "hub") {
    persistCeremonyStep(step);
  }

  if (me.waitlisted) {
    window.location.replace(routes.waitlist);
    return;
  }
  if (isHubReady(me)) {
    window.location.replace(routes.hub);
    return;
  }
  if (me.has_claimed_key === false) {
    window.location.replace(routes.unlock);
    return;
  }
  if (step === "id" || step === "keys") {
    window.location.replace(ceremonyUrlForStep(step));
    return;
  }

  const answers = await hydrateAnswersFromServer();
  const target = computeResume(answers);
  const progressed = answersHaveProgress(answers);

  if (
    !progressed &&
    !me.story_complete &&
    !me.read_complete &&
    step !== "id" &&
    step !== "keys" &&
    step !== "hub"
  ) {
    window.location.replace(routes.verified);
    return;
  }

  if (target.kind === "ceremony") {
    window.location.replace(ceremonyUrlForStep(step));
    return;
  }
  window.location.replace(resumeUrl(target));
}
