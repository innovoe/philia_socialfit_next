"use client";

import { useEffect, useRef, useState } from "react";
import { videos } from "@/lib/assets";

const CER7_DESCS = [
  "Your home base in SocialFit: your local geo-based fabric of compatible people close enough for real life to repeat.",
  "Shared interest spaces that surface compatible people across the city — curated, not crowded.",
  "The people who start to matter. Circles deepen over time through repeated real-life signal.",
];

const CER7_CARDS = ["pods", "rooms", "circles"] as const;
const DECK_STATES = ["is-front", "is-mid", "is-back"] as const;

function useDeckAuto(active: boolean, advance: () => void) {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    if (!active) return;
    let prog = 0;
    let held = false;
    const STEP = 40;
    const DUR = 3400;
    const reset = () => {
      prog = 0;
      const f = fillRef.current;
      if (f) {
        f.style.transition = "none";
        f.style.width = "0%";
      }
    };
    reset();
    const id = window.setInterval(() => {
      if (held) return;
      prog += (STEP / DUR) * 100;
      const f = fillRef.current;
      if (f) f.style.width = `${Math.min(prog, 100)}%`;
      if (prog >= 100) {
        reset();
        advanceRef.current();
      }
    }, STEP);
    const zone = zoneRef.current;
    const down = () => {
      held = true;
    };
    const up = () => {
      held = false;
    };
    zone?.addEventListener("mousedown", down);
    zone?.addEventListener("mouseup", up);
    zone?.addEventListener("mouseleave", up);
    zone?.addEventListener("touchstart", down, { passive: true });
    zone?.addEventListener("touchend", up, { passive: true });
    return () => {
      window.clearInterval(id);
      zone?.removeEventListener("mousedown", down);
      zone?.removeEventListener("mouseup", up);
      zone?.removeEventListener("mouseleave", up);
      zone?.removeEventListener("touchstart", down);
      zone?.removeEventListener("touchend", up);
    };
  }, [active]);

  return { fillRef, zoneRef };
}

export function SocialFabric({ active = true }: { active?: boolean }) {
  const [deckIdx, setDeckIdx] = useState(0);
  const waitAuto = useDeckAuto(active, () => setDeckIdx((i) => (i + 1) % 3));

  return (
    <div className="social-fabric">
      <div className="sty-hero" style={{ margin: "16px 22px 0" }}>
        <video
          muted
          playsInline
          autoPlay
          loop
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        >
          <source src={videos.podsRoomsCircles} type="video/mp4" />
        </video>
        <div className="cer1-vignette" />
        <div className="sty-chip" style={{ zIndex: 3 }}>
          <i />
          <span>SocialFit Social Fabric</span>
        </div>
      </div>
      <div className="cer-pad" style={{ paddingTop: 52, paddingBottom: 48 }}>
        <h1 className="cer-h" style={{ marginBottom: 20 }}>
          Dubai is full of people.
        </h1>
        <p className="cer-p" style={{ margin: "0 0 16px" }}>
          The hard part is not meeting more people. It is finding the people, places and rhythms that keep becoming real.
        </p>
        <p className="cer-p" style={{ margin: "0 0 16px" }}>
          SocialFit turns scattered introductions into a social fabric: pods for proximity, rooms for context, and circles for the people who start to matter. All through the signals you send.
        </p>
        <p className="cer-p" style={{ margin: "0 0 0" }}>
          Tap to see each layer form.
        </p>
        <div className="cer3-deck-wrap" ref={waitAuto.zoneRef}>
          <div className="r-progress-bar">
            <div className="r-progress-fill" ref={waitAuto.fillRef} />
          </div>
          <div className="cer3-deck">
            {CER7_CARDS.map((layer, i) => {
              const slot = (i - deckIdx + 3) % 3;
              const meta =
                layer === "pods" ? "Geo · Proximity" : layer === "rooms" ? "Shared Context" : "Depth · Trust";
              const pill =
                layer === "pods"
                  ? "Your neighbourhood layer"
                  : layer === "rooms"
                    ? "Where compatible people meet"
                    : "The people who start to matter";
              return (
                <div
                  key={layer}
                  className={`cer3-card cer3-card-${layer} ${DECK_STATES[slot]}`}
                  onClick={() => setDeckIdx((n) => (n + 1) % 3)}
                >
                  <div className="cer3-card-inner">
                    <div className="cer3-card-overlay" />
                    <div className="cer3-card-top">
                      <span className="cer3-card-label">{layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
                      <span className="cer3-card-meta">{meta}</span>
                    </div>
                    <div className="cer3-card-bot">
                      <div className="cer3-card-pill">
                        <span className="cer3-pill-dot" />
                        <span className="cer3-pill-text">{pill}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="cer3-deck-desc">{CER7_DESCS[deckIdx]}</p>
          <div className="cer3-nav">
            <div className="deck-dots">
              {["Pods", "Rooms", "Circles"].map((label, i) => (
                <button
                  key={label}
                  className={`deck-dot${i === deckIdx ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setDeckIdx(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
