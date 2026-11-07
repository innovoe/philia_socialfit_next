"use client";

import { getMe, type Me } from "@/lib/api/member";
import { isDeadAccessError, expireDeadSession } from "@/lib/expire";
import { applyMeToSession, hasAccess } from "@/lib/session";

let cached: Me | null = null;
let inflight: Promise<Me | null> | null = null;

export function cachedMe() {
  return cached;
}

export function isHubMe(me?: Me | null) {
  if (!me) return false;
  return (
    me.ceremony_step === "hub" ||
    (me.onboarding_step === "done" && me.needs_onboarding === false)
  );
}

export async function ensureMe() {
  if (!hasAccess()) return cached;
  if (inflight) return inflight;
  inflight = getMe()
    .then((me) => {
      cached = me;
      if (me) applyMeToSession(me);
      return me;
    })
    .catch((err) => {
      if (isDeadAccessError(err)) expireDeadSession();
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
