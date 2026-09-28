"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { videos } from "@/lib/assets";
import { isInvitePayload, validateKeyCode } from "@/lib/api/key-entry";
import { looksLikeInviteQuery, queryKeyCode, stashKeyValidate } from "@/lib/invite";
import { routes } from "@/lib/routes";

export function LandingHome() {
  const search = useSearchParams();
  const raw = search.toString();
  const code = queryKeyCode(raw);
  const [routing, setRouting] = useState(!!code);

  useEffect(() => {
    if (!code) {
      setRouting(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await validateKeyCode(code);
        if (cancelled) return;
        if (!r || r.valid === false) {
          window.location.replace(
            looksLikeInviteQuery(raw) ? `${routes.invite}?code=${encodeURIComponent(code)}` : routes.unlock,
          );
          return;
        }
        stashKeyValidate(r, code);
        if (isInvitePayload(r)) {
          window.location.replace(routes.invite);
          return;
        }
        window.location.replace(routes.unlock);
      } catch {
        if (cancelled) return;
        window.location.replace(
          looksLikeInviteQuery(raw) ? `${routes.invite}?code=${encodeURIComponent(code)}` : routes.unlock,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, raw]);

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
        <p className="gate-legal">
          <Link href={routes.privacy} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
        </p>
      </section>
    </main>
  );
}
