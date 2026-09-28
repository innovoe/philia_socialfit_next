"use client";

import { useEffect, useMemo, useState } from "react";
import { videos } from "@/lib/assets";
import { routes } from "@/lib/routes";
import {
  canPlaySignalDemo,
  DEFAULT_SLIDERS,
  MISSION_BLANKS,
  MOOD_BLANKS,
  MOOD_CHIPS,
  optionsFor,
  type MoodId,
  type SignalMode,
} from "@/lib/signal-demo";

const emptyMood: Record<MoodId, string> = {
  feel: "",
  with: "",
  time: "",
  purpose: "",
};

const emptyMission = {
  action: "",
  people: "",
  when: "",
  outcome: "",
};

export function SignalBuilder() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<SignalMode>("mood");
  const [selected, setSelected] = useState(emptyMood);
  const [mission, setMission] = useState(emptyMission);
  const [sliders, setSliders] = useState(DEFAULT_SLIDERS);
  const [active, setActive] = useState<MoodId | null>(null);
  const [howOpen, setHowOpen] = useState(false);

  useEffect(() => {
    if (!canPlaySignalDemo()) {
      window.location.replace(routes.origins);
      return;
    }
    setReady(true);
  }, []);

  const sliderValue = active ? sliders[active] : 20;
  const meta = MOOD_BLANKS.find((b) => b.id === active);
  const options = useMemo(() => {
    if (!active) return [];
    return optionsFor(active, sliders[active], MOOD_CHIPS);
  }, [active, sliders]);

  const filled =
    mode === "mood"
      ? MOOD_BLANKS.filter((b) => selected[b.id as MoodId]).length
      : MISSION_BLANKS.filter((b) => mission[b.id as keyof typeof mission].trim()).length;
  const canFind = filled >= 2;
  const firstEmpty = (MOOD_BLANKS.find((b) => !selected[b.id as MoodId])?.id ?? null) as MoodId | null;

  function pickBlank(id: MoodId) {
    setActive((cur) => (cur === id ? null : id));
    setHowOpen(false);
  }

  function chooseOption(label: string) {
    if (!active) return;
    const next = { ...selected, [active]: label };
    setSelected(next);
    const nxt = MOOD_BLANKS.slice(MOOD_BLANKS.findIndex((b) => b.id === active) + 1).find(
      (b) => !next[b.id as MoodId],
    );
    setActive(nxt ? (nxt.id as MoodId) : null);
  }

  function goResults() {
    if (!canFind) return;
    window.location.assign(routes.demoResults);
  }

  if (!ready) return null;

  return (
    <main className="sig-wrap">
      <header className="sig-topbar">
        <span>Dubai</span>
        <span>Philia Life</span>
        <span>First Wave</span>
      </header>
      <div className="sig-main">
        <section className="sig-teaser" aria-label="Tune your Signal teaser">
          <video muted playsInline autoPlay loop preload="auto">
            <source src={videos.ringScale} type="video/mp4" />
          </video>
          <div className="sig-teaser-chip">
            <i />
            <span>Tune your Signal</span>
          </div>
        </section>
        <h1>
          What are you
          <br />
          in the mood for?
        </h1>
        <p className="sig-sub">
          {mode === "mission" ? (
            <>
              You have a <span>plan</span>. Tell Philia. It will turn it into&nbsp;a&nbsp;
              <span>Signal</span> to assemble the right people.
            </>
          ) : (
            <>
              You have a <span>feeling</span>. Tell Philia. It will turn it into&nbsp;a&nbsp;
              <span>Signal</span> to find the rooms or people that fit.
            </>
          )}
        </p>
        <section className={`sig-modes${mode === "mission" ? " is-mission" : ""}`}>
          <div className="sig-mode-plate" />
          <button
            className={`sig-mode${mode === "mood" ? " is-active" : ""}`}
            type="button"
            onClick={() => {
              setMode("mood");
              setActive(null);
            }}
          >
            Mood
          </button>
          <button
            className={`sig-mode${mode === "mission" ? " is-active" : ""}`}
            type="button"
            onClick={() => {
              setMode("mission");
              setActive(null);
            }}
          >
            Mission
          </button>
        </section>
        <section className={`sig-card${active ? " is-picking" : ""}`}>
          <p className={`sig-hint${filled > 0 ? " is-hidden" : ""}`}>
            {mode === "mood"
              ? "Tap each blank to shape your signal."
              : "Type into each field to describe your plan."}
          </p>
          {mode === "mood" ? (
            <p className="sig-sentence">
              I feel like{" "}
              <Blank id="feel" value={selected.feel} active={active} pulse={firstEmpty} onPick={pickBlank} />{" "}
              with{" "}
              <Blank id="with" value={selected.with} active={active} pulse={firstEmpty} onPick={pickBlank} />{" "}
              sometime{" "}
              <Blank id="time" value={selected.time} active={active} pulse={firstEmpty} onPick={pickBlank} />{" "}
              so I can{" "}
              <Blank
                id="purpose"
                value={selected.purpose}
                active={active}
                pulse={firstEmpty}
                onPick={pickBlank}
              />
              .
            </p>
          ) : (
            <p className="sig-mission">
              I want to{" "}
              <input
                className={`sig-mission-in sig-w-action${mission.action ? "" : " is-empty"}`}
                value={mission.action}
                placeholder="play padel, grab dinner..."
                onChange={(e) => setMission({ ...mission, action: e.target.value })}
              />{" "}
              with{" "}
              <input
                className={`sig-mission-in sig-w-people${mission.people ? "" : " is-empty"}`}
                value={mission.people}
                placeholder="2–4 people..."
                onChange={(e) => setMission({ ...mission, people: e.target.value })}
              />{" "}
              on{" "}
              <input
                className={`sig-mission-in sig-w-when${mission.when ? "" : " is-empty"}`}
                value={mission.when}
                placeholder="this weekend..."
                onChange={(e) => setMission({ ...mission, when: e.target.value })}
              />{" "}
              so we can{" "}
              <input
                className={`sig-mission-in sig-w-outcome${mission.outcome ? "" : " is-empty"}`}
                value={mission.outcome}
                placeholder="feel connected..."
                onChange={(e) => setMission({ ...mission, outcome: e.target.value })}
              />
              .
            </p>
          )}

          {active && meta ? (
            <div className="sig-sheet">
              <div className="sig-drawer">
                <div className="sig-drawer-top">
                  <button className="sig-close" type="button" onClick={() => setActive(null)}>
                    ×
                  </button>
                </div>
                <p className="sig-helper">{meta.helper}</p>
                <div className="sig-labels">
                  <span>{meta.low}</span>
                  <span>{meta.high}</span>
                </div>
                <div className="sig-slider">
                  <div className="sig-track">
                    <div className="sig-fill" style={{ width: `${sliderValue}%` }} />
                  </div>
                  <div
                    className="sig-knob"
                    style={{ left: `calc(22px + (100% - 44px) * ${sliderValue / 100})` }}
                  />
                  <input
                    className="sig-range"
                    type="range"
                    min={0}
                    max={100}
                    value={sliderValue}
                    onChange={(e) =>
                      setSliders({ ...sliders, [active]: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="sig-opt-title">Choose an option</div>
                <div className="sig-options">
                  {options.map((o) => (
                    <button
                      key={o.label}
                      className="sig-option"
                      type="button"
                      onClick={() => chooseOption(o.label)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <button
            className={`sig-how${howOpen ? " is-open" : ""}`}
            type="button"
            onClick={() => setHowOpen((v) => !v)}
          >
            <span>How this works</span>
            <span className="sig-chev">›</span>
          </button>
          <div className={`sig-how-panel${howOpen ? " is-open" : ""}`}>
            <div className="sig-how-copy">
              Choose what you need in the moment. Philia turns the private sentence into a
              clean social signal others can respond to, without exposing the emotional
              context.
            </div>
          </div>
          <div className="sig-cta-wrap">
            <button
              className={`sig-find${canFind ? " is-ready" : ""}`}
              type="button"
              disabled={!canFind}
              onClick={goResults}
            >
              <span>{mode === "mission" ? "Assemble the group" : "Find what fits"}</span>
              <span>→</span>
              <span className="sig-dot" />
              <span className="sig-ring one" />
              <span className="sig-ring two" />
            </button>
            <div className="sig-micro">Connection has a new language</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Blank({
  id,
  value,
  active,
  pulse,
  onPick,
}: {
  id: MoodId;
  value: string;
  active: MoodId | null;
  pulse: MoodId | null;
  onPick: (id: MoodId) => void;
}) {
  const filled = Boolean(value);
  return (
    <button
      className={`sig-blank${filled ? " is-filled" : " is-empty"}${active === id ? " is-active" : ""}${
        !filled && pulse === id ? " is-pulse" : ""
      }`}
      type="button"
      onClick={() => onPick(id)}
    >
      {filled ? value : "___"}
    </button>
  );
}
