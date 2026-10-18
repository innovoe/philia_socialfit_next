"use client";

import { useEffect, useState } from "react";
import { getMe, type Me } from "@/lib/api/member";
import { SessionHold } from "@/components/gate/SessionHold";
import { memberSavedName } from "@/lib/identity";
import { clearLiveSession, safeNextPath } from "@/lib/live-session";
import { resumeMember } from "@/lib/resume";
import { applyMeToSession, hasAccess } from "@/lib/session";
import { CtaEnd } from "@/components/gate/CtaEnd";

export function LoggedInForm() {
  const [name, setName] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"out" | "stay" | "">("");

  useEffect(() => {
    let cancelled = false;
    const next = safeNextPath();

    if (!hasAccess()) {
      window.location.replace(next);
      return;
    }

    (async () => {
      try {
        const live = await getMe();
        if (cancelled) return;
        applyMeToSession(live);
        setMe(live);
        setName(memberSavedName(live) || "your account");
        setReady(true);
      } catch {
        if (cancelled) return;
        clearLiveSession();
        window.location.replace(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function onLogout() {
    if (busy) return;
    setBusy("out");
    const next = safeNextPath();
    clearLiveSession();
    window.location.replace(next);
  }

  async function onStay() {
    if (busy || !me) return;
    setBusy("stay");
    await resumeMember(me);
  }

  if (!ready) {
    return <SessionHold />;
  }

  return (
    <main className="verify-wrap logged-in-wrap">
      <p className="verify-step">SocialFit</p>
      <p className="logged-in-kicker">You are logged in as</p>
      <h1 className="verify-head logged-in-name">{name}</h1>
      <p className="verify-sub">Want to log out?</p>
      <button
        className={`gate-cta gate-cta-primary${busy === "out" ? " is-busy" : ""}`}
        type="button"
        disabled={!!busy}
        onClick={onLogout}
        aria-busy={busy === "out"}
      >
        <span>{busy === "out" ? "One moment…" : "Log out"}</span>
        <CtaEnd busy={busy === "out"} />
      </button>
      <button
        className={`gate-cta gate-cta-secondary${busy === "stay" ? " is-busy" : ""}`}
        type="button"
        disabled={!!busy}
        onClick={() => void onStay()}
        aria-busy={busy === "stay"}
      >
        <span>{busy === "stay" ? "One moment…" : "No"}</span>
        <CtaEnd busy={busy === "stay"} />
      </button>
    </main>
  );
}
