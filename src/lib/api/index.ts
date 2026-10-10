import { env } from "@/lib/env";
import { endpoints, type ApiBase, type Endpoint } from "@/lib/api/endpoints";

export { env } from "@/lib/env";
export { apiRequest, apiFormRequest } from "@/lib/api/client";
export {
  ApiError,
  isApiError,
  readApiRefusal,
  refusalGoesToLogin,
  refusalLine,
} from "@/lib/api/errors";
export {
  founderClaimKey,
  founderEmailStart,
  founderEmailVerify,
  isValidEmail,
  mapOriginsError,
  readClaimPhone,
} from "@/lib/api/origins";
export {
  claimKey,
  getMe,
  patchMe,
  postMePhoto,
  deleteMePhoto,
  activateExplorer,
  getPassport,
  patchPassport,
  patchCeremony,
  getMirror,
  postMembershipChoice,
} from "@/lib/api/member";
export { validateKeyCode, submitKeyMirror, isInvitePayload } from "@/lib/api/key-entry";
export { getMyKeys, sendKey, getKeyRequests, createKeyRequest } from "@/lib/api/keys";
export { getNeighbourhoods, getStoryRead, saveStoryRead } from "@/lib/api/story";
export { mapOtpError, readOtpSend, sendOtp, verifyOtp } from "@/lib/api/otp";
export { completeSignalDemo } from "@/lib/api/signal-demo";
export { normalizeUaePhone, sanitizeContactField, sanitizeUaeLocalInput } from "@/lib/api/phone";
export {
  authEndpoints,
  endpoints,
  memberEndpoints,
  publicEndpoints,
} from "@/lib/api/endpoints";
export type { ApiBase, Endpoint, HttpMethod } from "@/lib/api/endpoints";

export function baseUrl(base: ApiBase) {
  return base === "auth" ? env.authBase : env.apiBase;
}

export function endpointUrl<Args extends unknown[]>(
  endpoint: Endpoint<Args>,
  ...args: Args
) {
  return `${baseUrl(endpoint.base)}${endpoint.path(...args)}`;
}

export { endpoints as default };
