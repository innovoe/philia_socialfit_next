"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { videos } from "@/lib/assets";
import { isInvitePayload, validateKeyCode } from "@/lib/api/key-entry";
import { founderClaimKey, mapOriginsError, readClaimPhone } from "@/lib/api/origins";
import { contactsAlreadyVerified, getMe } from "@/lib/api/member";
import { maskPhone } from "@/lib/api/phone";
import { readApiRefusal, refusalGoesToLogin, refusalLine } from "@/lib/api/errors";
import { isSessionExpiring } from "@/lib/expire";
import { normaliseKeyCode, stashKeyValidate } from "@/lib/invite";
import { bounceIfLiveSession } from "@/lib/live-session";
import { resumeMember } from "@/lib/resume";
import { applyMeToSession, hasAccess, readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { SessionHold } from "@/components/gate/SessionHold";

export function UnlockForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [claimMode, setClaimMode] = useState(false);

  useEffect(() => {
    if (bounceIfLiveSession({ onlyIfClaimed: true })) return;
    let cancelled = false;

    (async () => {
      const s = readSession();
      if (s.keyCode) setCode(s.keyCode);

      if (hasAccess()) {
        try {
          const me = await getMe();
          if (cancelled || isSessionExpiring()) return;
          applyMeToSession(me);
          setClaimMode(!!me.keys_to_the_city && me.has_claimed_key !== true);
        } catch {
          if (cancelled || isSessionExpiring()) return;
        }
      }

      if (!cancelled) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const ready = claimMode ? !busy : normaliseKeyCode(code).length >= 4 && !busy;

  async function onClaim() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await founderClaimKey(readSession().founderToken);
      const phone = readClaimPhone(result);
      writeSession({
        keyId: result.key_id,
        keyCode: result.code || null,
        claimDeadline: result.claim_deadline || null,
        founderEmail: result.email || readSession().founderEmail,
        entryPath: "founder",
        phoneVerified: phone.phoneVerified,
        phoneMask: phone.phoneMask,
      });
      const me = await getMe();
      applyMeToSession(me);
      if (contactsAlreadyVerified(me)) {
        const mail = me.verified_email || me.email || readSession().founderEmail;
        const mobile = me.verified_mobile || "";
        writeSession({
          email: mail,
          founderEmail: mail,
          phoneVerified: true,
          phoneMask: mobile.includes("*") ? mobile : maskPhone(mobile),
        });
        window.location.assign(routes.verify);
        return;
      }
      await resumeMember(me);
    } catch (err) {
      if (isSessionExpiring()) return;
      if (refusalGoesToLogin(err)) {
        window.location.replace(routes.login);
        return;
      }
      setError(refusalLine(err, mapOriginsError));
      setBusy(false);
    }
  }

  async function onEnterCode(e: React.FormEvent) {
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
            {claimMode ? (
              <>
                You&apos;re not just early.
                <br />
                You&apos;re the Origins.
              </>
            ) : (
              <>
                A private layer
                <br />
                for the city.
              </>
            )}
          </h1>
        </div>
        <div className="gate-key">
          <video autoPlay muted playsInline preload="auto">
            <source src={videos.founderKeyRotate} type="video/mp4" />
          </video>
        </div>
      </section>
      <section className="gate-entry">
        {claimMode ? (
          <>
            <p className="gate-copy">
              Your Key is ready to claim.
              <br />
              No code to enter.
            </p>
            <p className="gate-error" style={{ opacity: error ? 1 : 0 }}>
              {error || " "}
            </p>
            <button
              className={`gate-cta gate-cta-primary${ready ? "" : " is-wait"}`}
              disabled={!ready}
              type="button"
              onClick={() => void onClaim()}
            >
              <span>{busy ? "Claiming…" : "Claim my key"}</span>
              <span>→</span>
            </button>
          </>
        ) : (
          <>
            <p className="gate-copy">
              You have been gifted a Key.
              <br />
              Enter your code to begin.
            </p>
            <form onSubmit={onEnterCode}>
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
                <span>{busy ? "Checking…" : "Enter your key"}</span>
                <span>→</span>
              </button>
            </form>
            <Link href={routes.login} className="gate-text-link" style={{ marginTop: 16, display: "inline-block" }}>
              Already a member? Log in
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
