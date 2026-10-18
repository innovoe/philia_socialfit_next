import { env } from "@/lib/env";

export const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };

export type LatLng = { lat: number; lng: number };

export type PlacePrediction = {
  placeId: string;
  main: string;
  sub: string;
  toPlace?: () => PlaceHandle;
};

type PlaceHandle = {
  fetchFields: (req: { fields: string[] }) => Promise<void>;
  displayName?: string;
  formattedAddress?: string;
  addressComponents?: Array<{ longText?: string; types?: string[] }>;
  location?: { lat: () => number; lng: () => number } | LatLng;
};

type MapsReady = {
  maps: {
    importLibrary?: (name: string) => Promise<unknown>;
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => MapHandle;
    Circle: new (opts: Record<string, unknown>) => CircleHandle;
    places: {
      AutocompleteSessionToken?: new () => object;
      AutocompleteSuggestion?: {
        fetchAutocompleteSuggestions: (req: Record<string, unknown>) => Promise<{
          suggestions?: Array<{
            placePrediction?: {
              placeId?: string;
              text?: { text?: string };
              mainText?: { text?: string };
              secondaryText?: { text?: string };
              toPlace?: () => PlaceHandle;
            };
          }>;
        }>;
      };
      Place?: (new (opts: { id: string }) => PlaceHandle) & {
        searchNearby?: (req: Record<string, unknown>) => Promise<{
          places?: PlaceHandle[];
        }>;
      };
      AutocompleteService?: new () => {
        getPlacePredictions: (
          req: Record<string, unknown>,
          cb: (preds: AutocompleteHit[] | null, status: string) => void,
        ) => void;
      };
      PlacesService?: new (el: HTMLElement | MapHandle) => {
        getDetails: (
          req: Record<string, unknown>,
          cb: (place: PlaceDetails | null, status: string) => void,
        ) => void;
      };
    };
    event: {
      clearInstanceListeners: (inst: object) => void;
    };
  };
};

export type MapHandle = {
  panTo: (c: LatLng) => void;
  setZoom: (z: number) => void;
  setCenter: (c: LatLng) => void;
  addListener: (
    name: string,
    fn: (e: { latLng?: { lat: () => number; lng: () => number } }) => void,
  ) => { remove: () => void };
};

export type CircleHandle = {
  setCenter: (c: LatLng) => void;
  getCenter: () => { lat: () => number; lng: () => number } | null;
  setMap: (m: MapHandle | null) => void;
  addListener: (name: string, fn: () => void) => { remove: () => void };
};

type AutocompleteHit = {
  place_id: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
  description?: string;
};

type PlaceDetails = {
  name?: string;
  formatted_address?: string;
  geometry?: { location?: { lat: () => number; lng: () => number } };
};

declare global {
  interface Window {
    google?: MapsReady;
    __philiaGoogleMapsReady?: () => void;
  }
}

let pending: Promise<MapsReady> | null = null;
let sessionToken: object | null = null;

export function mapsKeyMissing() {
  return !env.googleMapsKey;
}

export function loadGoogleMaps(): Promise<MapsReady> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("maps_ssr"));
  }
  const ready = window.google;
  if (ready?.maps?.places) return ensurePlacesLibrary(ready);
  if (!env.googleMapsKey) return Promise.reject(new Error("maps_key_missing"));
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const finish = () => {
      const g = window.google;
      if (g?.maps?.places) {
        ensurePlacesLibrary(g).then(resolve, reject);
        return true;
      }
      return false;
    };
    if (finish()) return;

    window.__philiaGoogleMapsReady = () => {
      delete window.__philiaGoogleMapsReady;
      if (!finish()) {
        pending = null;
        reject(new Error("maps_load_failed"));
      }
    };

    const existing = document.querySelector("script[data-philia-maps]");
    if (existing) {
      const t = window.setInterval(() => {
        if (finish()) window.clearInterval(t);
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(t);
        if (!window.google?.maps?.places) {
          pending = null;
          reject(new Error("maps_load_failed"));
        }
      }, 15000);
      return;
    }

    const script = document.createElement("script");
    script.dataset.philiaMaps = "1";
    script.async = true;
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(env.googleMapsKey) +
      "&libraries=places&callback=__philiaGoogleMapsReady&loading=async";
    script.onerror = () => {
      pending = null;
      reject(new Error("maps_load_failed"));
    };
    document.head.appendChild(script);
  });

  return pending;
}

function ensurePlacesLibrary(g: MapsReady) {
  if (!g.maps.importLibrary) return Promise.resolve(g);
  return g.maps.importLibrary("places").then(() => g);
}

function sessionFor(g: MapsReady) {
  const Token = g.maps.places.AutocompleteSessionToken;
  if (!Token) return undefined;
  if (!sessionToken) sessionToken = new Token();
  return sessionToken;
}

function endSession() {
  sessionToken = null;
}

function readName(...vals: unknown[]) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object" && "text" in v) {
      const text = (v as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) return text.trim();
    }
  }
  return "";
}

function areaNameFromPlace(p: PlaceHandle) {
  const preferred = ["neighborhood", "sublocality", "sublocality_level_1", "locality"];
  for (const type of preferred) {
    const hit = p.addressComponents?.find((c) => c.types?.includes(type));
    if (hit?.longText?.trim()) return hit.longText.trim();
  }
  return readName(p.displayName, p.formattedAddress);
}

function readLatLng(loc: unknown): LatLng | null {
  if (!loc || typeof loc !== "object") return null;
  const o = loc as { lat?: unknown; lng?: unknown };
  const lat = typeof o.lat === "function" ? Number(o.lat()) : Number(o.lat);
  const lng = typeof o.lng === "function" ? Number(o.lng()) : Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function malibuCircleOpts(center: LatLng) {
  return {
    center,
    radius: 1000,
    strokeColor: "#5E77FD",
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: "#5E77FD",
    fillOpacity: 0.16,
    clickable: true,
    draggable: true,
    editable: false,
  };
}

export async function nearbyPlaceName(g: MapsReady, pin: LatLng): Promise<string> {
  const Place = g.maps.places.Place;
  if (!Place?.searchNearby) return "";
  try {
    const { places } = await Place.searchNearby({
      fields: ["displayName", "formattedAddress", "addressComponents"],
      locationRestriction: { center: pin, radius: 400 },
      maxResultCount: 5,
      rankPreference: "DISTANCE",
    });
    for (const p of places || []) {
      const name = areaNameFromPlace(p);
      if (name) return name.slice(0, 120);
    }
    return "";
  } catch {
    return "";
  }
}

export async function searchPlacePredictions(
  g: MapsReady,
  query: string,
  bias: LatLng = DUBAI_CENTER,
): Promise<PlacePrediction[]> {
  const q = query.trim();
  if (!q) return [];
  const AutocompleteSuggestion = g.maps.places.AutocompleteSuggestion;
  if (AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: q,
      includedRegionCodes: ["ae"],
      language: "en",
      region: "ae",
      locationBias: { radius: 35000, center: bias },
      sessionToken: sessionFor(g),
    });
    return (suggestions || [])
      .slice(0, 6)
      .map((s) => {
        const p = s.placePrediction;
        if (!p?.placeId) return null;
        return {
          placeId: p.placeId,
          main: p.mainText?.text || p.text?.text || "",
          sub: p.secondaryText?.text || "",
          toPlace: p.toPlace ? () => p.toPlace!() : undefined,
        };
      })
      .filter((p): p is PlacePrediction => p != null);
  }
  const AutocompleteService = g.maps.places.AutocompleteService;
  if (!AutocompleteService) return [];
  const svc = new AutocompleteService();
  return new Promise((resolve) => {
    svc.getPlacePredictions(
      {
        input: q,
        componentRestrictions: { country: "ae" },
        location: DUBAI_CENTER,
        radius: 35000,
      },
      (preds, status) => {
        if (status !== "OK" || !preds?.length) {
          resolve([]);
          return;
        }
        resolve(
          preds.slice(0, 6).map((p) => ({
            placeId: p.place_id,
            main: p.structured_formatting?.main_text || p.description || "",
            sub: p.structured_formatting?.secondary_text || "",
          })),
        );
      },
    );
  });
}

export async function placeDetails(
  g: MapsReady,
  map: MapHandle,
  pred: PlacePrediction | string,
): Promise<{ name: string; lat: number; lng: number } | null> {
  const placeId = typeof pred === "string" ? pred : pred.placeId;
  const Place = g.maps.places.Place;
  if (Place) {
    const place =
      typeof pred !== "string" && pred.toPlace ? pred.toPlace() : new Place({ id: placeId });
    await place.fetchFields({
      fields: ["displayName", "location", "formattedAddress"],
    });
    endSession();
    const pin = readLatLng(place.location);
    if (!pin) return null;
    const name = readName(place.displayName, place.formattedAddress);
    return { name, lat: pin.lat, lng: pin.lng };
  }
  const PlacesService = g.maps.places.PlacesService;
  if (!PlacesService) return null;
  const svc = new PlacesService(map);
  return new Promise((resolve) => {
    svc.getDetails(
      {
        placeId,
        fields: ["name", "geometry", "formatted_address"],
      },
      (place, status) => {
        const loc = place?.geometry?.location;
        if (status !== "OK" || !loc) {
          resolve(null);
          return;
        }
        const name = (place?.name || place?.formatted_address || "").trim();
        resolve({ name, lat: loc.lat(), lng: loc.lng() });
      },
    );
  });
}

