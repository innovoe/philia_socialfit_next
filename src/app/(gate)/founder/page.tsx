"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { videos } from "@/lib/assets";
import { hasFounderToken, readSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function FounderPage() {
  const router = useRouter();

  useEffect(() => {
    const s = readSession();
    if (!hasFounderToken() || !s.keyId) {
      window.location.replace(routes.origins);
    }
  }, [router]);

  return (
    <main className="gate-wrap founder-wrap">
      <header className="gate-topbar">
        <span>Dubai</span>
        <span>Philia Life</span>
        <span>First Wave</span>
      </header>
      <div className="founder-card">
        <video autoPlay muted loop playsInline>
          <source src={videos.showcase} type="video/mp4" />
        </video>
      </div>
      <p className="founder-note">
        You&apos;re now holding a Founder Key. One of 50 issued directly by Philia
        Life to open the first SocialFit layer in Dubai. There is no open entry,
        only Philia Keys unlock access to the network. The keys are a trust
        object.
      </p>
      <div className="founder-bottom">
        <p className="founder-welcome">
          That makes you part of the <em>Origins.</em>
        </p>
        <a
          href={routes.demo}
          className="gate-cta gate-cta-primary"
          onClick={(e) => {
            e.preventDefault();
            window.location.assign(routes.demo);
          }}
        >
          <span>Begin</span>
          <span>→</span>
        </a>
      </div>
    </main>
  );
}
