import { apiRequest } from "@/lib/api/client";
import { publicEndpoints } from "@/lib/api/endpoints";

export type KeyValidate = {
  valid?: boolean;
  key_id?: number | null;
  key_type?: string | null;
  entry_path?: string | null;
  owner_name?: string | null;
  owner_display_name?: string | null;
  nominee_first_name?: string | null;
  mirror_question?: string | null;
  mirror_status?: string | null;
  mirror_answered?: boolean;
  claim_deadline?: string | null;
  finish_deadline?: string | null;
  invite_code?: string | null;
  error?: string;
};

export type MirrorSubmit = {
  received?: boolean;
  error?: string;
};

export function isInvitePayload(r: KeyValidate | null | undefined) {
  if (!r || r.valid === false) return false;
  if (r.entry_path === "invite") return true;
  if (r.entry_path === "founder") return false;
  return r.key_type === "member";
}

export function validateKeyCode(code: string) {
  return apiRequest<KeyValidate, []>(publicEndpoints.validateKeyCode, [], {
    code: String(code || "").trim(),
  });
}

export function submitKeyMirror(codeOrId: string, archetype: string) {
  return apiRequest<MirrorSubmit, [string]>(publicEndpoints.submitKeyMirror, [codeOrId], {
    archetype,
  });
}

export function mapKeyEntryError(code: string) {
  if (code === "invalid_archetype") return "That archetype isn’t available.";
  if (code === "mirror_expired" || code === "key_expired") return "This Key’s window has closed.";
  if (code === "throttled" || code === "rate_limited" || code === "http_429") {
    return "Too many attempts — wait a moment.";
  }
  if (code === "mirror_not_applicable") return "This Key doesn’t use a Social Mirror.";
  if (code === "invalid_key" || code === "not_found") {
    return "This Key can’t be claimed — it may be used or unopened.";
  }
  return "Could not continue — try again.";
}
