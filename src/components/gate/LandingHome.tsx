"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { videos } from "@/lib/assets";
import { getMe, type Me } from "@/lib/api/member";
import { isSessionExpiring } from "@/lib/expire";
import { continueFromKeyCode } from "@/lib/key-gate";
import { queryKeyCode } from "@/lib/invite";
import { isHubReady, resumeMember } from "@/lib/resume";
import { applyMeToSession, hasAccess } from "@/lib/session";
import { routes } from "@/lib/routes";
import { CtaEnd, ctaStateClass } from "@/components/gate/CtaEnd";

type Door = "hold" | "guest" | "hub" | "onboarding";

export function LandingHome() {
  const search = useSearchParams();
  const raw = search.toString();
  const code = queryKeyCode(raw);
  const [routing, setRouting] = useState(!!code);
  const [door, setDoor] = useState<Door>("hold");
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (code) return;
    if (!hasAccess()) {
      setDoor("guest");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const live = await getMe();
        if (cancelled || isSessionExpiring()) return;
        applyMeToSession(live);
        setMe(live);
        setDoor(isHubReady(live) ? "hub" : "onboarding");
      } catch {
        if (cancelled || isSessionExpiring()) return;
        setDoor("guest");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!code) {
      setRouting(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await continueFromKeyCode(code);
      if (cancelled) return;
      if (result.error) {
        window.location.replace(`${routes.unlock}?key=${encodeURIComponent(code)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, raw]);

  async function onContinue() {
    if (busy || !me) return;
    setBusy(true);
    await resumeMember(me);
  }

  if (routing) return <main className="gate-wrap" />;

  return (
    <main className="gate-wrap">
      <header className="gate-topbar">
        <span>Philia Life</span>
        <span>Dubai · First Wave</span>
      </header>

      <section className="gate-artifact" aria-hidden="true">
        <div className="gate-arrival">
          <h1>
            A private layer
            <br />
            for the city.
          </h1>
        </div>
        <div className="gate-key">
          <video autoPlay muted playsInline preload="auto">
            <source src={videos.founderKeyRotate} type="video/mp4" />
          </video>
        </div>
      </section>

      <section className="gate-entry">
        {door === "hub" ? (
          <>
            <p className="gate-copy">
              Welcome back.
              <br />
              Your Hub is ready.
            </p>
            <Link href={routes.hub} className="gate-cta gate-cta-primary">
              <span>Go to Hub</span>
              <span>→</span>
            </Link>
          </>
        ) : door === "onboarding" ? (
          <>
            <p className="gate-copy">
              Welcome back.
              <br />
              Pick up where you left off.
            </p>
            <button
              className={`gate-cta gate-cta-primary gate-cta-long${ctaStateClass(busy, !!me)}`}
              type="button"
              disabled={busy || !me}
              onClick={() => void onContinue()}
              aria-busy={busy}
            >
              <span>{busy ? "One moment…" : "Continue your onboarding"}</span>
              <CtaEnd busy={busy} />
            </button>
          </>
        ) : door === "guest" ? (
          <>
            <p className="gate-copy">
              SocialFit is invite-only.
              <br />
              How are you entering?
            </p>
            <Link href={routes.unlock} className="gate-cta gate-cta-primary">
              <span>I have a Key</span>
              <span>→</span>
            </Link>
            <Link href={routes.login} className="gate-cta gate-cta-secondary">
              <span>Log in</span>
              <span>→</span>
            </Link>
            <p className="gate-micro">No open signup · UAE mobile required</p>
          </>
        ) : (
          <p className="gate-copy"> </p>
        )}
        <p className="gate-legal">
          <Link href={routes.privacy} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
          <span className="gate-legal-sep" aria-hidden="true">
            ·
          </span>
          <Link
            href={routes.privacyAr}
            target="_blank"
            rel="noopener noreferrer"
            lang="ar"
          >
            سياسة الخصوصية
          </Link>
          <span className="gate-legal-sep" aria-hidden="true">
            ·
          </span>
          <Link href={routes.terms} target="_blank" rel="noopener noreferrer">
            Terms
          </Link>
        </p>
      </section>
    </main>
  );
}
