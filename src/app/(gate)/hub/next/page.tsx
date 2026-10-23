"use client";

import { useEffect, useState } from "react";
import { HubNextContent } from "@/components/gate/HubNextContent";
import { getMe } from "@/lib/api/member";
import { goHub, goLogout } from "@/lib/hub";
import { isSessionExpiring, requireMemberAccess } from "@/lib/expire";
import { applyMeToSession, normalizeCeremonyStep, readSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function HubNextPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!requireMemberAccess()) return;

    async function boot() {
      const s = readSession();
      try {
        const me = await getMe();
        applyMeToSession(me);
        const step = normalizeCeremonyStep(me.ceremony_step);
        const explorer =
          step === "id" ||
          step === "keys" ||
          step === "hub" ||
          !!me.passport_display ||
          s.explorerReady;
        if (!explorer) {
          window.location.replace(routes.ceremony);
          return;
        }
      } catch {
        if (isSessionExpiring()) return;
        if (!(s.hubUnlocked || s.ceremonyStep === "hub" || s.explorerReady)) {
          window.location.replace(routes.ceremony);
          return;
        }
      }
      if (isSessionExpiring()) return;
      setReady(true);
    }

    boot();
  }, []);

  if (!ready) return null;

  return (
    <main id="sHubNext" className="screen active">
      <div className="cer-topbar">
        <span className="cer-top-l">Philia Life</span>
        <span className="cer-top-c">SocialFit</span>
        <button type="button" className="cer-top-logout" onClick={goLogout}>
          Log out
        </button>
      </div>
      <div className="hn-wrap">
        <HubNextContent />
        <button className="sv-cta" type="button" onClick={() => goHub()}>
          <span className="sv-cta-text">Back to Hub</span>
          <span className="sv-cta-arrow">→</span>
        </button>
      </div>
    </main>
  );
}
