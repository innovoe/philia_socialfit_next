"use client";

import { useEffect, useState } from "react";
import { KeysNominate } from "@/components/gate/KeysNominate";
import { videos } from "@/lib/assets";
import { getMe, patchCeremony } from "@/lib/api/member";
import { persistCeremonyStep } from "@/lib/ceremony";
import { isSessionExpiring, requireMemberAccess } from "@/lib/expire";
import { applyMeToSession, readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function CeremonyKeysPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!requireMemberAccess()) return;

    async function boot() {
      writeSession({ explorerReady: true, hubUnlocked: false });
      persistCeremonyStep("keys");
      try {
        const me = await getMe();
        applyMeToSession(me);
        writeSession({ explorerReady: true, hubUnlocked: me.ceremony_step === "hub" });
        if (me.ceremony_step !== "keys" && me.ceremony_step !== "hub") {
          try {
            await patchCeremony("keys");
          } catch {
            /* stay on keys */
          }
          persistCeremonyStep("keys");
        }
      } catch {
        if (isSessionExpiring()) return;
        if (!readSession().explorerReady) {
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
    <main id="sCer5" className="screen active" style={{ overflowY: "auto" }}>
      <div className="cer-topbar">
        <span className="cer-top-l">Philia Life</span>
        <span className="cer-top-c">SocialFit</span>
        <span className="cer-top-r">Dubai · First Wave</span>
      </div>

      <div className="sty-hero" style={{ margin: "16px 22px 0", height: 520, background: "#f0ece6" }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            zIndex: 0,
            background: "#f0ece6",
          }}
        >
          <source src={videos.rotatingKeys} type="video/mp4" />
        </video>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "38%",
            height: "22%",
            background:
              "radial-gradient(ellipse at 100% 100%,#f0ece6 40%,rgba(240,236,230,0) 76%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
        <div className="cer1-vignette" />
        <div className="sty-chip" style={{ zIndex: 3 }}>
          <i />
          <span>Your Philia Keys</span>
        </div>
      </div>

      <div className="cer-pad" style={{ paddingTop: 52, display: "flex", flexDirection: "column" }}>
        <h1 className="cer-h" style={{ marginBottom: 24 }}>
          Send your first
          <br />
          Philia Key.
        </h1>
        <p className="cer-p" style={{ margin: "0 0 20px" }}>
          Your Philia ID is waiting on one final field: Social Archetype. You have been issued 3
          Philia Keys to unlock it.
        </p>
        <p className="cer-p" style={{ margin: "0 0 36px" }}>
          Each Key carries one private mirror question and opens a private path into SocialFit for
          someone you would genuinely want in your social world.
        </p>

        <div className="cer5-q-callout">
          <p className="cer5-q-text">&quot;How do you see me socially?&quot;</p>
          <p className="cer5-q-sub">Private response · Combined pattern only</p>
        </div>

        <KeysNominate />
      </div>
    </main>
  );
}
