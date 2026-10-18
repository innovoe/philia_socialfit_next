"use client";

import { useEffect, useRef, useState } from "react";
import {
  LOCATION_NAME_MAX,
  isLocationPlace,
  locationName,
  makeLocationPlace,
  type LocationPlace,
} from "@/lib/location";
import {
  DUBAI_CENTER,
  loadGoogleMaps,
  malibuCircleOpts,
  mapsKeyMissing,
  nearbyPlaceName,
  placeDetails,
  searchPlacePredictions,
  type CircleHandle,
  type LatLng,
  type MapHandle,
  type PlacePrediction,
} from "@/lib/google-maps";
import {
  FREQUENT_VARIES,
  FREQUENT_VARIES_SUB,
  WORK_FROM_HOME,
  WORK_FROM_HOME_SUB,
  type StoryAnswer,
} from "@/lib/story-data";

type LocationField = "home" | "work" | "frequent";

function initialName(current: StoryAnswer | undefined) {
  if (isLocationPlace(current)) return current.name;
  if (typeof current === "string" && current !== WORK_FROM_HOME && current !== FREQUENT_VARIES) {
    return current;
  }
  return "";
}

export function PlaceMapPicker({
  fieldKey,
  current,
  onPick,
}: {
  fieldKey: LocationField;
  current: StoryAnswer | undefined;
  onPick: (value: StoryAnswer) => void;
}) {
  const mapBox = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const circleRef = useRef<CircleHandle | null>(null);
  const gRef = useRef<Awaited<ReturnType<typeof loadGoogleMaps>> | null>(null);
  const pinRef = useRef<LatLng | null>(isLocationPlace(current) ? current : null);
  const skipSearch = useRef(Boolean(initialName(current)));
  const labelGen = useRef(0);
  const commitPinRef = useRef<(next: LatLng, zoom: boolean, relabel: boolean) => void>(() => {});

  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "failed">(
    mapsKeyMissing() ? "missing" : "loading",
  );
  const [name, setName] = useState(() => initialName(current));
  const [preds, setPreds] = useState<PlacePrediction[]>([]);
  const [pin, setPin] = useState<LatLng | null>(() =>
    isLocationPlace(current) ? { lat: current.lat, lng: current.lng } : null,
  );

  const place = makeLocationPlace(name, pin?.lat ?? NaN, pin?.lng ?? NaN);
  const special = typeof current === "string" ? current : "";

  useEffect(() => {
    if (status === "missing") return;
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled) return;
        gRef.current = g;
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = err instanceof Error ? err.message : "";
        setStatus(code === "maps_key_missing" ? "missing" : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "ready" || !mapBox.current || !gRef.current) return;
    const g = gRef.current;
    const start = pinRef.current || DUBAI_CENTER;
    const map = new g.maps.Map(mapBox.current, {
      center: start,
      zoom: pinRef.current ? 14 : 11,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapRef.current = map;

    function attachCircle(next: LatLng) {
      if (circleRef.current) {
        circleRef.current.setCenter(next);
        return;
      }
      const circle = new g.maps.Circle(malibuCircleOpts(next));
      circle.setMap(map);
      circle.addListener("dragend", () => {
        const c = circle.getCenter();
        if (!c) return;
        commitPinRef.current({ lat: c.lat(), lng: c.lng() }, false, true);
      });
      circleRef.current = circle;
    }

    function commitPin(next: LatLng, zoom: boolean, relabel: boolean) {
      pinRef.current = next;
      setPin(next);
      attachCircle(next);
      map.panTo(next);
      if (zoom) map.setZoom(14);
      if (!relabel) return;
      const gen = ++labelGen.current;
      nearbyPlaceName(g, next).then((label) => {
        if (!label || gen !== labelGen.current) return;
        skipSearch.current = true;
        setName(label);
        setPreds([]);
      });
    }

    commitPinRef.current = commitPin;
    if (pinRef.current) attachCircle(pinRef.current);

    const clickL = map.addListener("click", (e) => {
      if (!e.latLng) return;
      commitPin({ lat: e.latLng.lat(), lng: e.latLng.lng() }, true, true);
    });

    return () => {
      clickL.remove();
      if (circleRef.current) g.maps.event.clearInstanceListeners(circleRef.current);
      g.maps.event.clearInstanceListeners(map);
      circleRef.current = null;
      mapRef.current = null;
      commitPinRef.current = () => {};
    };
  }, [status]);

  useEffect(() => {
    const q = name.trim();
    if (skipSearch.current) {
      setPreds([]);
      return;
    }
    if (status !== "ready" || !gRef.current || q.length < 2) {
      setPreds([]);
      return;
    }
    const g = gRef.current;
    const t = window.setTimeout(() => {
      searchPlacePredictions(g, q, pinRef.current || DUBAI_CENTER)
        .then(setPreds)
        .catch(() => setPreds([]));
    }, 220);
    return () => window.clearTimeout(t);
  }, [name, status]);

  function applyPlace(next: LocationPlace) {
    skipSearch.current = true;
    setName(next.name);
    setPreds([]);
    commitPinRef.current({ lat: next.lat, lng: next.lng }, true, false);
  }

  async function choosePrediction(pred: PlacePrediction) {
    skipSearch.current = true;
    setName(pred.main);
    setPreds([]);
    const g = gRef.current;
    const map = mapRef.current;
    if (!g || !map) return;
    const details = await placeDetails(g, map, pred);
    if (!details) return;
    const next = makeLocationPlace(details.name || pred.main, details.lat, details.lng);
    if (next) applyPlace(next);
  }

  return (
    <div className="sb-place">
      {fieldKey === "work" ? (
        <button
          className={`sb-option${special === WORK_FROM_HOME ? " sb-option-selected" : ""}`}
          type="button"
          onClick={() => onPick(WORK_FROM_HOME)}
        >
          <span className="sb-option-main">{WORK_FROM_HOME}</span>
          <span className="sb-option-sub">{WORK_FROM_HOME_SUB}</span>
        </button>
      ) : null}
      {fieldKey === "frequent" ? (
        <button
          className={`sb-option${special === FREQUENT_VARIES ? " sb-option-selected" : ""}`}
          type="button"
          onClick={() => onPick(FREQUENT_VARIES)}
        >
          <span className="sb-option-main">{FREQUENT_VARIES}</span>
          <span className="sb-option-sub">{FREQUENT_VARIES_SUB}</span>
        </button>
      ) : null}

      <div className="sb-place-search">
        <input
          type="search"
          className="sb-other-input"
          maxLength={LOCATION_NAME_MAX}
          placeholder="Search a place in Dubai…"
          autoComplete="off"
          value={name}
          onChange={(e) => {
            skipSearch.current = false;
            setName(e.target.value);
          }}
        />
        {preds.length ? (
          <ul className="sb-place-preds">
            {preds.map((p) => (
              <li key={p.placeId}>
                <button type="button" onClick={() => void choosePrediction(p)}>
                  <span className="sb-place-pred-main">{p.main}</span>
                  {p.sub ? <span className="sb-place-pred-sub">{p.sub}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {status === "missing" ? (
        <p className="sb-home-error">Place search isn’t available on this build.</p>
      ) : status === "failed" ? (
        <p className="sb-home-error">Couldn’t load the map. Check your connection and try again.</p>
      ) : status === "loading" ? (
        <p className="sb-home-status">Loading map…</p>
      ) : (
        <>
          <div ref={mapBox} className="sb-place-map" />
          <p className="sb-place-caption">
            1 km around this point. Search a place, or drag the circle — that name goes in your story.
          </p>
        </>
      )}

      {typeof current === "string" &&
      current &&
      current !== WORK_FROM_HOME &&
      current !== FREQUENT_VARIES ? (
        <p className="sb-home-status">
          Saved as {locationName(current)}. Search or drop the circle to set a 1 km pin — we won’t guess from the old name.
        </p>
      ) : null}

      <div className="sb-sheet-footer">
        <button
          className="sb-save-btn"
          type="button"
          disabled={!place}
          onClick={() => {
            if (place) onPick(place);
          }}
        >
          Add to my story
        </button>
      </div>
    </div>
  );
}
