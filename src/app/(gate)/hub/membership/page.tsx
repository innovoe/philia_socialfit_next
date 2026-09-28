"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/api/member";
import { goHub, goLogout, membershipPackageLabel, membershipPackagePrice } from "@/lib/hub";
import { applyMeToSession, hasAccess, readSession, writeSession, type MembershipChoice } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function HubMembershipPage() {
  const [choice, setChoice] = useState<MembershipChoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasAccess()) {
      window.location.replace(routes.verify);
      return;
    }

    async function boot() {
      const local = readSession().membershipChoice;
      try {
        const me = await getMe();
        applyMeToSession(me);
        writeSession({ explorerReady: true, hubUnlocked: true });
        const next = me.membership_choice || local;
        if (!next) {
          await goHub({ tab: 3 });
          return;
        }
        writeSession({ membershipChoice: next });
        setChoice(next);
      } catch {
        if (!local) {
          await goHub({ tab: 3 });
          return;
        }
        setChoice(local);
      }
      setReady(true);
    }

    boot();
  }, []);

  if (!ready || !choice) return null;

  return (
    <main id="sMembership" className="screen active">
      <div className="cer-topbar">
        <span className="cer-top-l">Philia Life</span>
        <span className="cer-top-c">SocialFit</span>
        <button type="button" className="cer-top-logout" onClick={goLogout}>
          Log out
        </button>
      </div>
      <div className="mc-wrap">
        <div className="sv-check" aria-hidden="true">
          <span className="sv-check-mark">✓</span>
        </div>
        <p className="mc-eyebrow">Membership</p>
        <h1 className="cer-h mc-head">We&apos;ve recorded your chosen tier.</h1>
        <div className="mc-package">{membershipPackageLabel(choice) || "—"}</div>
        <p className="mc-price">{membershipPackagePrice(choice)}</p>
        <p className="cer-p mc-body">
          You&apos;re still Explorer until it&apos;s paid. Founding pricing stays locked for your first year once
          your Perception Mirror is complete.
        </p>
        <button className="sv-cta" type="button" onClick={() => goHub()}>
          <span className="sv-cta-text">Continue to Hub</span>
          <span className="sv-cta-arrow">→</span>
        </button>
        <button type="button" className="landing-text-link mc-change" onClick={() => goHub({ tab: 3 })}>
          Change package
        </button>
      </div>
    </main>
  );
}
