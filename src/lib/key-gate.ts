import { isApiError } from "@/lib/api/errors";
import {
  isFounderPayload,
  isInvitePayload,
  mapKeyEntryError,
  validateKeyCode,
  type KeyValidate,
} from "@/lib/api/key-entry";
import { getMe } from "@/lib/api/member";
import { normaliseKeyCode, stashKeyValidate } from "@/lib/invite";
import { isHubReady, resumeMember } from "@/lib/resume";
import {
  applyMeToSession,
  hasAccess,
  isVerifiedMemberSession,
  normalizeCeremonyStep,
  readSession,
} from "@/lib/session";
import { routes } from "@/lib/routes";

export function afterKeyHref(r: KeyValidate) {
  if (isInvitePayload(r)) return routes.invite;
  if (isFounderPayload(r)) return routes.founder;
  return routes.enter;
}

function alreadyUsedKey(code: string) {
  return (
    code === "already_member" ||
    code === "already_claimed" ||
    code === "key_already_claimed" ||
    code === "claimed"
  );
}

async function resumeLiveMember() {
  const me = await getMe();
  applyMeToSession(me);
  await resumeMember(me);
}

/** Same Key again — pick up Hub / ceremony / Story / verify / demo. */
export async function resumeFromSameKey() {
  if (hasAccess()) {
    await resumeLiveMember();
    return true;
  }
  if (isVerifiedMemberSession()) {
    window.location.assign(routes.login);
    return true;
  }
  const s = readSession();
  if (s.entryPath === "invite" && s.keyId != null) {
    window.location.assign(routes.invite);
    return true;
  }
  if (s.entryPath === "founder" && s.founderToken && s.keyId != null) {
    window.location.assign(routes.founder);
    return true;
  }
  if (s.entryPath === "consumer") {
    if (s.founderToken && s.keyId != null) {
      window.location.assign(routes.demo);
      return true;
    }
    if (s.founderToken) {
      window.location.assign(routes.originsClaim);
      return true;
    }
    window.location.assign(routes.enter);
    return true;
  }
  return false;
}

export async function continueFromKeyCode(code: string): Promise<{ error?: string }> {
  const val = normaliseKeyCode(code);
  if (val.length < 4) return { error: "Invalid code — check and try again" };

  const sameKey = normaliseKeyCode(readSession().keyCode || "") === val;

  if (hasAccess()) {
    try {
      const me = await getMe();
      applyMeToSession(me);
      if (
        me.has_claimed_key ||
        me.passport_display ||
        isHubReady(me) ||
        normalizeCeremonyStep(me.ceremony_step) ||
        sameKey
      ) {
        await resumeMember(me);
        return {};
      }
    } catch {
      /* validate the code */
    }
  } else if (sameKey && (await resumeFromSameKey())) {
    return {};
  }

  try {
    const r = await validateKeyCode(val);
    if (!r || r.valid === false) {
      if (sameKey && (await resumeFromSameKey())) return {};
      return { error: "Invalid code — check and try again" };
    }
    stashKeyValidate(r, val);
    if (hasAccess()) {
      try {
        await resumeLiveMember();
        return {};
      } catch {
        /* fall through to the key's first gate */
      }
    }
    window.location.assign(afterKeyHref(r));
    return {};
  } catch (err) {
    const errCode = isApiError(err) ? err.code : "";
    if (alreadyUsedKey(errCode) || errCode === "already_member") {
      if (hasAccess()) {
        try {
          await resumeLiveMember();
          return {};
        } catch {
          /* login */
        }
      }
      window.location.assign(routes.login);
      return {};
    }
    if (sameKey && (await resumeFromSameKey())) return {};
    const mapped = mapKeyEntryError(errCode);
    return {
      error: mapped === "Could not continue — try again." ? "Could not validate — try again" : mapped,
    };
  }
}
