"use client";

import { useEffect, useRef, useState } from "react";
import { canPlaySignalDemo } from "@/lib/signal-demo";
import { routes } from "@/lib/routes";
import { destroyAnim, playSignalIntro, type PlayGate } from "@/lib/lottie";

export default function DemoIntroPage() {
  const [revealed, setRevealed] = useState(false);
  const [motionDone, setMotionDone] = useState(false);
  const lottieHost = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canPlaySignalDemo()) {
      window.location.replace(routes.origins);
      return;
    }
    const gate: PlayGate = { cancelled: false };
    let anim: { destroy: () => void } | null = null;
    if (lottieHost.current) {
      playSignalIntro(lottieHost.current, gate).then((a) => {
        if (gate.cancelled) {
          destroyAnim(a);
          return;
        }
        anim = a;
      });
    }
    const done = window.setTimeout(() => setMotionDone(true), 9600);
    return () => {
      gate.cancelled = true;
      window.clearTimeout(done);
      destroyAnim(anim);
    };
  }, []);

  return (
    <main className={`demo-intro${revealed ? " is-revealed" : ""}${motionDone ? " is-motion-done" : ""}`}>
      <section className="demo-motion" aria-hidden="true">
        <div id="demo-lottie" ref={lottieHost} />
      </section>
      <div className="demo-glass" />
      <header className="demo-signal-bar">
        <div className="demo-lockup">
          <div className="demo-parent">
            PHILIA
            <br />
            LIFE
          </div>
          <div className="demo-divider" />
          <div className="demo-product">
            Social<span>Fit</span>™
          </div>
        </div>
      </header>

      <section className="demo-intro-copy">
        <div className="demo-thesis">Signals, not swipes</div>
        <h1>
          Everyone carries
          <br />a unique <span>frequency.</span>
        </h1>
        <p>
          Your Signal tells the city what you&apos;re open to, in a moment on a
          lazy Saturday afternoon, or the chapter of life you&apos;re growing
          into.
          <br />
          <br />
          Show up as yourself.
          <br />
          Find the people, places and rooms that resonate.
        </p>
        <button
          className="demo-continue"
          type="button"
          onClick={() => setRevealed(true)}
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </section>

      <section className="demo-story">
        <div className="demo-moments">
          <div>Dinner after a long week.</div>
          <div>Padel on a Sunday.</div>
          <div>A friendly face nearby.</div>
          <div>An introduction that changes</div>
          <div>your next chapter.</div>
          <div>A stranger who feels</div>
          <div>strangely familiar.</div>
        </div>
        <div className="demo-separator" />
        <div className="demo-promise">
          <h2>
            Your Signal is
            <br />
            a new language.
          </h2>
          <p>
            To make the city
            <br />
            feel like home.
          </p>
        </div>
      </section>

      <section className="demo-signal-bottom">
        <button
          className="gate-cta gate-cta-primary demo-signal-cta"
          type="button"
          onClick={() => window.location.assign(routes.demoBuild)}
        >
          <span>Tune your Signal</span>
          <span>→</span>
          <span className="demo-signal-dot" />
          <span className="demo-signal-ring one" />
          <span className="demo-signal-ring two" />
        </button>
        <div className="gate-micro">Proceed to demo</div>
      </section>
    </main>
  );
}
