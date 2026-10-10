"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { videos } from "@/lib/assets";
import { isInvitePayload, validateKeyCode } from "@/lib/api/key-entry";
import { normaliseKeyCode, stashKeyValidate } from "@/lib/invite";
import { bounceIfLiveSession } from "@/lib/live-session";
import { readSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { SessionHold } from "@/components/gate/SessionHold";

export function UnlockForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (bounceIfLiveSession({ onlyIfClaimed: true })) return;
    const s = readSession();
    if (s.keyCode) setCode(s.keyCode);
    setOpen(true);
  }, []);

  const ready = normaliseKeyCode(code).length >= 4 && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = normaliseKeyCode(code);
    if (val.length < 4) {
      setError("Invalid code — check and try again");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const r = await validateKeyCode(val);
      if (!r || r.valid === false) {
        setError("Invalid code — check and try again");
        setBusy(false);
        return;
      }
      stashKeyValidate(r, val);
      if (isInvitePayload(r)) {
        window.location.assign(routes.invite);
        return;
      }
      window.location.assign(routes.founder);
    } catch {
      setError("Could not validate — try again");
      setBusy(false);
    }
  }

  if (!open) return <SessionHold />;

  return (
    <main className="gate-wrap">
      <header className="gate-topbar">
        <Link href={routes.landing}>← Back</Link>
        <span>Dubai · First Wave</span>
      </header>
      <section className="gate-artifact" aria-hidden="true">
        <div className="gate-arrival">
          <h1>
            You&apos;re not just early.
            <br />
            You&apos;re the Origins.
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
          You have been gifted a Founder Key.
          <br />
          Enter your code to begin.
        </p>
        <form onSubmit={onSubmit}>
          <input
            className="gate-field gate-field-email"
            style={{ textAlign: "center", letterSpacing: "0.24em", textTransform: "uppercase" }}
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={32}
            placeholder="ENTER CODE"
            value={code}
            onChange={(e) => {
              setCode(normaliseKeyCode(e.target.value));
              setError("");
            }}
          />
          <p className="gate-error" style={{ opacity: error ? 1 : 0 }}>
            {error || " "}
          </p>
          <button className={`gate-cta gate-cta-primary${ready ? "" : " is-wait"}`} disabled={!ready} type="submit">
            <span>{busy ? "Checking…" : "Unlock Key"}</span>
            <span>→</span>
          </button>
        </form>
        <Link href={routes.login} className="gate-text-link" style={{ marginTop: 16, display: "inline-block" }}>
          Already a member? Log in
        </Link>
      </section>
    </main>
  );
}
