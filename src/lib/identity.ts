import { isApiError } from "@/lib/api/errors";
import { PROFILE_GENDERS, type Me } from "@/lib/api/member";

export { PROFILE_GENDERS };

export function memberSavedName(me?: Me | null) {
  const src = me || {};
  if (src.display_name) return String(src.display_name).trim();
  return [src.first_name, src.last_name].filter(Boolean).join(" ").trim();
}

export function patchMeError(err: unknown) {
  const code = isApiError(err) ? err.code : "";
  if (code === "underage") return "You need to be 18 or over.";
  if (code === "invalid_dob") return "That date isn’t valid.";
  if (code === "age_readonly") return "Save a date of birth, not an age.";
  if (code === "invalid_gender") return "Choose a gender option.";
  if (code === "invalid_address") return "That address is too long.";
  if (code === "invalid_address_coords") return "Location pin is incomplete.";
  if (code === "invalid_pod_open_to") return "Keep that to 200 characters.";
  if (code === "invalid_worlds") return "That world isn’t on the list.";
  if (code === "photo_too_large") return "Keep the photo under 5MB.";
  if (code === "invalid_photo") return "Use a JPEG, PNG, or WebP.";
  if (code === "photo_required") return "Choose a photo first.";
  if (code === "not_explorer") return "Available after you finish Origins.";
  if (code === "request_pending") return "That request is already in.";
  if (
    code === "invalid_name_visibility" ||
    code === "invalid_location_precision" ||
    code === "invalid_share_audience" ||
    code === "invalid_pod_visible"
  ) {
    return "Couldn’t save that setting.";
  }
  if (code === "nothing_to_update") return "";
  return "Couldn’t save. Try again.";
}
