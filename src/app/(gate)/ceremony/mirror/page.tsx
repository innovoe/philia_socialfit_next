"use client";

import { useEffect, useState } from "react";
import { PhiliaIdCard } from "@/components/gate/PhiliaIdCard";
import { getMe, getPassport, patchCeremony } from "@/lib/api/member";
import {
  applyPassportToSession,
  persistCeremonyStep,
  passportView,
  type PassportView,
} from "@/lib/ceremony";
import { isSessionExpiring, requireMemberAccess } from "@/lib/expire";
import { applyMeToSession, readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function CeremonyMirrorPage() {
  const [view, setView] = useState<PassportView | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!requireMemberAccess()) return;
    if (!readSession().explorerReady) {
      window.location.replace(routes.ceremony);
      return;
    }

    async function boot() {
      try {
        const me = await getMe();
        applyMeToSession(me);
        writeSession({ explorerReady: true });
      } catch {
        if (isSessionExpiring()) return;
      }
      try {
        const passport = await getPassport();
        applyPassportToSession(passport);
        setView(passportView(undefined, passport));
      } catch {
        if (isSessionExpiring()) return;
        setView(passportView());
      }
    }

    boot();
  }, []);

  async function enterKeys() {
    if (busy) return;
    setBusy(true);
    writeSession({ explorerReady: true, hubUnlocked: false });
    persistCeremonyStep("keys");
    try {
      await patchCeremony("keys");
    } catch {
      /* stay optimistic */
    }
    window.location.assign(routes.ceremonyKeys);
  }

  if (!view) return null;

  return (
    <main id="sCer4" className="screen active" style={{ overflowY: "auto" }}>
      <div className="cer-topbar">
        <span className="cer-top-l">Philia Life</span>
        <span className="cer-top-c">SocialFit</span>
        <span className="cer-top-r">Dubai · First Wave</span>
      </div>
      <div className="cer-pad" style={{ paddingTop: 52, flex: 1, display: "flex", flexDirection: "column" }}>
        <p className="cer-super" style={{ color: "rgba(32,32,52,.28)", marginBottom: 28 }}>
          Social Mirror · Locked
        </p>
        <h1 className="cer-h" style={{ marginBottom: 28 }}>
          One layer remains.
        </h1>
        <p className="cer-p" style={{ margin: "0 0 12px" }}>
          Your Philia ID now holds your self-read. But SocialFit does not rely only on how you
          describe yourself.
        </p>
        <p className="cer-p" style={{ margin: 0 }}>
          It also listens for how you are received.
        </p>

        <div style={{ display: "flex", justifyContent: "center", margin: "36px 0 0" }}>
          <div
            style={{
              borderRadius: 36,
              padding: 16,
              background:
                "radial-gradient(circle at 22% 12%,rgba(255,255,255,.72),transparent 22%),radial-gradient(circle at 80% 80%,rgba(255,255,255,.48),transparent 26%),linear-gradient(135deg,#f7f2ec 0%,#ede4d8 52%,#e4d8c8 100%)",
              display: "inline-flex",
            }}
          >
            <div style={{ pointerEvents: "none" }}>
              <PhiliaIdCard
                view={view}
                flipped
                interactive={false}
                highlightSocial
                qrCaption="Private mirror pending."
              />
            </div>
          </div>
        </div>

        <p className="cer-p" style={{ margin: "64px 0 20px" }}>
          The Social Archetype field comes from people who have felt your presence in real life: the
          ones who know what you bring, what they remember, and how you are received.
        </p>
        <p className="cer-p" style={{ margin: "0 0 36px" }}>
          To unlock it, choose three people whose perspective you trust.
        </p>

        <div style={{ marginTop: "auto", paddingTop: 48 }}>
          <button className="cer-cta" type="button" onClick={enterKeys} disabled={busy}>
            <span>Choose my 3 people</span>
            <span>→</span>
          </button>
          <div className="cer-status">Self-read complete · Social mirror pending</div>
        </div>
      </div>
    </main>
  );
}
