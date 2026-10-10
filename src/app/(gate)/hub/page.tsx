"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HubScreen } from "@/components/gate/HubScreen";
import { getMe } from "@/lib/api/member";
import { goHub } from "@/lib/hub";
import { isSessionExpiring, requireMemberAccess } from "@/lib/expire";
import { applyMeToSession, normalizeCeremonyStep, readSession } from "@/lib/session";
import { routes } from "@/lib/routes";

function HubInner() {
  const search = useSearchParams();
  const tabRaw = search.get("tab");
  const initialTab = tabRaw === "3" ? 3 : tabRaw === "2" ? 2 : 1;
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
        await goHub({ assign: false });
      } catch {
        if (isSessionExpiring()) return;
        if (!(s.hubUnlocked || s.ceremonyStep === "hub" || s.explorerReady)) {
          window.location.replace(routes.ceremony);
          return;
        }
        await goHub({ assign: false });
      }
      if (isSessionExpiring()) return;
      setReady(true);
    }

    boot();
  }, []);

  if (!ready) return null;
  return <HubScreen initialTab={initialTab} />;
}

export default function HubPage() {
  return (
    <Suspense fallback={null}>
      <HubInner />
    </Suspense>
  );
}
