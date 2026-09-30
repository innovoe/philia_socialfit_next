"use client";

import { useEffect } from "react";
import { videos } from "@/lib/assets";
import { canPlaySignalDemo } from "@/lib/signal-demo";
import { routes } from "@/lib/routes";

export default function DemoEnterPage() {
  useEffect(() => {
    if (!canPlaySignalDemo()) {
      window.location.replace(routes.origins);
    }
  }, []);

  return (
    <main className="demo-home">
      <header className="demo-topbar">
        <span>Dubai</span>
        <span>Philia Life</span>
        <span>First Wave</span>
      </header>
      <section className="demo-video">
        <video autoPlay muted loop playsInline preload="auto">
          <source src={videos.imageStretch} type="video/mp4" />
        </video>
        <div className="demo-chip">
          <i />
          <span>SocialFit</span>
        </div>
      </section>
      <section className="demo-copy">
        <h1>
          Make a city
          <br />
          feel like home.
        </h1>
        <p>Serendipity, by design.</p>
        <div className="demo-line" />
      </section>
      <section className="demo-bottom">
        <button
          className="gate-cta gate-cta-primary"
          type="button"
          onClick={() => window.location.assign(routes.demoIntro)}
        >
          <span>Enter SocialFit Demo</span>
          <span>→</span>
        </button>
        <div className="gate-micro">Connection has a new language</div>
      </section>
    </main>
  );
}
