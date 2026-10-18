import { isApiError } from "@/lib/api/errors";

export const LOCATION_KEYS = ["home", "work", "frequent"] as const;
export type LocationKey = (typeof LOCATION_KEYS)[number];

export const LOCATION_RADIUS_M = 1000;
export const LOCATION_NAME_MAX = 120;

export type LocationPlace = {
  name: string;
  lat: number;
  lng: number;
  radius_m: typeof LOCATION_RADIUS_M;
};

export function isLocationKey(key: string): key is LocationKey {
  return (LOCATION_KEYS as readonly string[]).includes(key);
}

export function isLocationPlace(v: unknown): v is LocationPlace {
  return toLocationPlace(v) != null;
}

export function toLocationPlace(v: unknown): LocationPlace | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name || name.length > LOCATION_NAME_MAX) return null;
  const lat = typeof o.lat === "number" ? o.lat : Number(o.lat);
  const lng = typeof o.lng === "number" ? o.lng : Number(o.lng);
  const radius =
    typeof o.radius_m === "number" ? o.radius_m : Number(o.radius_m);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  if (radius !== LOCATION_RADIUS_M) return null;
  return { name, lat, lng, radius_m: LOCATION_RADIUS_M };
}

export function makeLocationPlace(
  name: string,
  lat: number,
  lng: number,
): LocationPlace | null {
  return toLocationPlace({
    name,
    lat,
    lng,
    radius_m: LOCATION_RADIUS_M,
  });
}

export function locationName(v: unknown): string {
  if (typeof v === "string") return v;
  if (isLocationPlace(v)) return v.name;
  return "";
}

export function locationSaveLine(err: unknown) {
  const code = isApiError(err) ? err.code : "";
  if (code === "location_incomplete") {
    return "Couldn’t save that place — add a name and the 1 km circle.";
  }
  if (code === "location_invalid") {
    return "That place isn’t valid. Check the name and try again.";
  }
  if (code === "location_not_allowed") {
    return "That option isn’t available for this blank.";
  }
  return "";
}

export function allowedLocationString(key: string, value: string) {
  if (key === "work") return value === "From home";
  if (key === "frequent") return value === "Varies";
  return false;
}
