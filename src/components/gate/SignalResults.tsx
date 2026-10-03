"use client";

import { useEffect, useRef, useState } from "react";
import { hasAccess, hasFounderKey } from "@/lib/session";
import { routes } from "@/lib/routes";
import { completeSignalDemo } from "@/lib/api/signal-demo";
import { canPlaySignalDemo, RESULT_PEOPLE, RESULT_ROOMS, TAB_DESC, takeSignalReturn } from "@/lib/signal-demo";
import { destroyAnim, playTrustGraph, type PlayGate } from "@/lib/lottie";

const SLOT = [
  { y: 0, scale: 1, op: 1, z: 4 },
  { y: -40, scale: 0.75, op: 1, z: 3 },
  { y: -73, scale: 0.5, op: 0.75, z: 2 },
  { y: -73, scale: 0.5, op: 0.35, z: 1 },
] as const;

const SHADOW = [
  "0 28px 56px rgba(32,32,52,.18),inset 0 1px 0 rgba(255,255,255,.88)",
  "0 36px 64px rgba(18,16,38,.38),inset 0 1px 0 rgba(255,255,255,.72)",
  "0 42px 72px rgba(14,12,30,.52),inset 0 1px 0 rgba(255,255,255,.52)",
  "0 48px 80px rgba(10,8,24,.62),inset 0 1px 0 rgba(255,255,255,.32)",
];

const FILTER = [
  "none",
  "blur(3px) brightness(.82) saturate(.88)",
  "blur(6px) brightness(.68) saturate(.78)",
  "blur(9px) brightness(.55) saturate(.68)",
];

type Tab = "rooms" | "people";

export function SignalResults() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<Tab>("rooms");
  const [desc, setDesc] = useState<string>(TAB_DESC.rooms);
  const [switching, setSwitching] = useState(false);
  const [roomsTop, setRoomsTop] = useState(0);
  const [peopleTop, setPeopleTop] = useState(0);
  const [progress, setProgress] = useState(0);
  const paused = useRef(false);
  const touchY = useRef(0);
  const roomsTopRef = useRef(0);
  const peopleTopRef = useRef(0);
  const tabRef = useRef<Tab>("rooms");
  const lottieHost = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canPlaySignalDemo()) {
      window.location.replace(routes.origins);
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !lottieHost.current) return;
    const host = lottieHost.current;
    const gate: PlayGate = { cancelled: false };
    let anim: { destroy: () => void } | null = null;
    let hide = 0;
    let reveal = 0;

    playTrustGraph(host, gate).then((a) => {
      if (gate.cancelled) {
        destroyAnim(a);
        return;
      }
      anim = a;
      if (a) host.closest(".res-loader")?.classList.add("has-lottie");
      hide = window.setTimeout(() => {
        setLoading(false);
        reveal = window.setTimeout(() => setVisible(true), 400);
      }, 3800);
    });

    return () => {
      gate.cancelled = true;
      window.clearTimeout(hide);
      window.clearTimeout(reveal);
      destroyAnim(anim);
    };
  }, [ready]);

  const top = tab === "rooms" ? roomsTop : peopleTop;
  const cards = tab === "rooms" ? RESULT_ROOMS : RESULT_PEOPLE;
  roomsTopRef.current = roomsTop;
  peopleTopRef.current = peopleTop;
  tabRef.current = tab;

  function setTop(next: number, which: Tab = tabRef.current) {
    if (which === "rooms") {
      roomsTopRef.current = next;
      setRoomsTop(next);
    } else {
      peopleTopRef.current = next;
      setPeopleTop(next);
    }
  }

  function advance(dir: number) {
    const which = tabRef.current;
    const cur = which === "rooms" ? roomsTopRef.current : peopleTopRef.current;
    const next = (cur + dir + 4) % 4;
    setTop(next, which);
    setProgress(0);
  }

  useEffect(() => {
    if (loading || !visible) return;
    setProgress(0);
    const id = window.setInterval(() => {
      if (paused.current) return;
      setProgress((p) => {
        if (p >= 100) {
          advance(1);
          return 0;
        }
        return p + (40 / 3400) * 100;
      });
    }, 40);
    return () => window.clearInterval(id);
  }, [loading, visible, tab]);

  function goTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    tabRef.current = next;
    setSwitching(true);
    window.setTimeout(() => {
      setDesc(TAB_DESC[next]);
      setSwitching(false);
    }, 200);
    setProgress(0);
  }

  async function leave() {
    try {
      await completeSignalDemo();
    } catch {
      /* event write must not block the existing finish CTA */
    }
    const back = takeSignalReturn();
    if (back) {
      window.location.assign(back);
      return;
    }
    if (hasAccess()) {
      window.location.assign(routes.verified);
      return;
    }
    if (hasFounderKey()) {
      window.location.assign(routes.verify);
      return;
    }
    window.location.replace(routes.origins);
  }

  if (!ready) return null;

  return (
    <main className={`res-wrap${loading ? " is-loading" : ""}`}>
      <div className={`res-loader${loading ? "" : " is-out"}`}>
        <div className="res-loader-ring" />
        <div className="res-lottie" ref={lottieHost} />
        <div className="res-loader-label">Reading your signal</div>
      </div>
      <div className={`res-content${visible ? " is-visible" : ""}`}>
        <div className="res-topbar">
          <span>Dubai</span>
          <span>Philia Life</span>
          <span>First Wave</span>
        </div>
        <div className="res-read">
          <h2>
            Philia read this as a
            <br />
            Playful Reset Signal.
          </h2>
          <div className="res-line" />
        </div>
        <section className="res-section">
          <div className="res-pill">
            <i />
            Philia Trust Graph result
          </div>
          <div className={`res-toggle${tab === "people" ? " is-people" : ""}`}>
            <div className="res-plate" />
            <button
              className={`res-tab${tab === "rooms" ? " is-active" : ""}`}
              type="button"
              onClick={() => goTab("rooms")}
            >
              Room fits
            </button>
            <button
              className={`res-tab${tab === "people" ? " is-active" : ""}`}
              type="button"
              onClick={() => goTab("people")}
            >
              People fits
            </button>
          </div>
          <p className={`res-tab-desc${switching ? " is-switching" : ""}`}>{desc}</p>
          <div
            className="res-stack-zone"
            onWheel={(e) => {
              e.preventDefault();
              advance(e.deltaY > 0 ? 1 : -1);
            }}
            onTouchStart={(e) => {
              touchY.current = e.touches[0].clientY;
              paused.current = true;
            }}
            onTouchEnd={(e) => {
              paused.current = false;
              const dy = touchY.current - e.changedTouches[0].clientY;
              if (Math.abs(dy) > 44) advance(dy > 0 ? 1 : -1);
            }}
            onMouseDown={() => {
              paused.current = true;
            }}
            onMouseUp={() => {
              paused.current = false;
            }}
            onMouseLeave={() => {
              paused.current = false;
            }}
          >
            <div className="res-progress">
              <div className="res-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="res-stack">
              {cards.map((card, i) => {
                const n = cards.length;
                const slot = (i - top + n) % n;
                const p = SLOT[Math.min(slot, 3)];
                return (
                  <div
                    key={card.name}
                    className="res-card"
                    style={{
                      transform: `translateY(${p.y}px) scale(${p.scale})`,
                      opacity: p.op,
                      zIndex: p.z,
                      boxShadow: SHADOW[Math.min(slot, 3)],
                      filter: FILTER[Math.min(slot, 3)],
                    }}
                  >
                    <div
                      className={`res-card-inner${tab === "people" ? " is-people" : ""}`}
                      style={{ backgroundImage: `url(${card.image})` }}
                    >
                      <div className="res-card-l">{tab === "rooms" ? "Room fit" : "People fit"}</div>
                      <div className="res-card-r">{card.when}</div>
                      <div className={`res-card-chip${tab === "people" ? " is-people" : ""}`}>
                        <i />
                        {card.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="res-dots">
              {cards.map((card, i) => (
                <button
                  key={card.name}
                  className={`res-dot${i === top % 4 ? " is-active" : ""}`}
                  type="button"
                  aria-label={String(i + 1)}
                  onClick={() => {
                    setTop(i);
                    setProgress(0);
                  }}
                />
              ))}
            </div>
          </div>
        </section>
        <section className="res-end">
          <h3>
            You sent a Signal.
            <br />
            This is what came back.
          </h3>
          <p className="res-bridge">
            This is what it looks like when <span>your frequency meets the city.</span>
          </p>
          <p className="res-body">
            This is a preview. The real thing is richer.
            <br />
            <br />
            See who fits. See what forms. See your social life respond to you. Signals, not
            swipes. People, not profiles.
          </p>
          <div className="res-end-line" />
          <button className="res-cta" type="button" onClick={leave}>
            <span>Continue with your Key</span>
            <span>→</span>
            <span className="res-cta-dot" />
            <span className="res-cta-ring one" />
            <span className="res-cta-ring two" />
          </button>
          <p className="res-cta-sub">
            {hasAccess()
              ? "Next: Story Builder"
              : hasFounderKey()
                ? "Next: verify your phone to claim access"
                : "Next: verify email & phone to claim access"}
          </p>
        </section>
      </div>
    </main>
  );
}
