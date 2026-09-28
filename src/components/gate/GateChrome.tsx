"use client";

import { videos } from "@/lib/assets";

type GateChromeProps = {
  headline?: string;
  copy: React.ReactNode;
  micro: string;
  replay?: boolean;
  children: React.ReactNode;
};

export function GateChrome({
  headline,
  copy,
  micro,
  replay = false,
  children,
}: GateChromeProps) {
  return (
    <main className="gate-wrap">
      <header className="gate-topbar">
        <span>Philia Life</span>
        <span>Dubai · First Wave</span>
      </header>

      <section className="gate-artifact" aria-hidden="true">
        {headline && replay ? (
          <div className="gate-arrival">
            <h1>
              {headline.split("\n").map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </h1>
          </div>
        ) : null}
        <div className={replay ? "gate-key" : "gate-key is-ready"}>
          <video autoPlay muted playsInline preload="auto">
            <source src={videos.founderKeyRotate} type="video/mp4" />
          </video>
        </div>
      </section>

      <section className={replay ? "gate-entry" : "gate-entry is-ready"}>
        <p className="gate-copy">{copy}</p>
        {children}
        <p className="gate-micro">{micro}</p>
      </section>
    </main>
  );
}
