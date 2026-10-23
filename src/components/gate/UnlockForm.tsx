"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { videos } from "@/lib/assets";
import { isInvitePayload, validateKeyCode } from "@/lib/api/key-entry";
import {
  founderClaimKey,
  founderRequestKey,
  mapOriginsError,
  readClaimPhone,
  readFounderKeyExpired,
  type FounderKeyExpired,
} from "@/lib/api/origins";
import { FounderKeyReissue } from "@/components/gate/FounderKeyReissue";
import { contactsAlreadyVerified, getMe } from "@/lib/api/member";
import { maskPhone } from "@/lib/api/phone";
import { readApiRefusal, refusalGoesToLogin, refusalLine } from "@/lib/api/errors";
import { isSessionExpiring } from "@/lib/expire";
import { normaliseKeyCode, stashKeyValidate } from "@/lib/invite";
import { isHubReady, resumeMember } from "@/lib/resume";
import {
  applyMeToSession,
  hasAccess,
  isVerifiedMemberSession,
  normalizeCeremonyStep,
  readSession,
  writeSession,
} from "@/lib/session";
import { routes } from "@/lib/routes";
import { SessionHold } from "@/components/gate/SessionHold";
import { CtaEnd, ctaStateClass } from "@/components/gate/CtaEnd";

export function UnlockForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [claimMode, setClaimMode] = useState(false);
  const [expired, setExpired] = useState<FounderKeyExpired | null>(null);
  const [memberOnly, setMemberOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const s = readSession();
      if (s.keyCode) setCode(s.keyCode);

      if (hasAccess()) {
        try {
          const me = await getMe();
          if (cancelled || isSessionExpiring()) return;
          applyMeToSession(me);
          const founderClaim = !!me.keys_to_the_city && me.has_claimed_key !== true;
          if (founderClaim) {
            setClaimMode(true);
          } else if (
            me.has_claimed_key ||
            me.passport_display ||
            isHubReady(me) ||
            normalizeCeremonyStep(me.ceremony_step)
          ) {
            await resumeMember(me);
            return;
          }
        } catch {
          if (cancelled || isSessionExpiring()) return;
        }
      } else if (isVerifiedMemberSession()) {
        setMemberOnly(true);
      }

      if (!cancelled) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filled = claimMode || normaliseKeyCode(code).length >= 4;
  const ready = filled && !busy;

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
      const stale = readFounderKeyExpired(err);
      if (stale && (stale.canRequest || stale.requested)) {
        setExpired(stale);
        setError("");
        setBusy(false);
        return;
      }
      setError(refusalLine(err, mapOriginsError));
      setBusy(false);
    }
  }

  async function onRequestKey() {
    setError("");
    setBusy(true);
    try {
      const result = await founderRequestKey(readSession().founderToken);
      setExpired({
        canRequest: false,
        requested: true,
        issuesAt: result.issues_at || expired?.issuesAt || null,
      });
      setBusy(false);
    } catch (err) {
      if (isSessionExpiring()) return;
      const { code } = readApiRefusal(err);
      if (code === "key_not_expired") {
        setExpired(null);
        setError(refusalLine(err, mapOriginsError));
        setBusy(false);
        return;
      }
      const stale = readFounderKeyExpired(err);
      if (stale && (stale.canRequest || stale.requested)) {
        setExpired(stale);
        setError("");
        setBusy(false);
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
          expired && (expired.canRequest || expired.requested) ? (
            <>
              <p className="gate-copy">
                {expired.canRequest
                  ? "Your Founder Key window closed after 24 hours."
                  : "A new Founder Key is being prepared."}
              </p>
              <FounderKeyReissue
                canRequest={expired.canRequest}
                issuesAt={expired.issuesAt}
                busy={busy}
                error={error}
                onRequest={() => void onRequestKey()}
              />
            </>
          ) : (
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
              className={`gate-cta gate-cta-primary${ctaStateClass(busy, filled)}`}
              disabled={!ready}
              type="button"
              onClick={() => void onClaim()}
              aria-busy={busy}
            >
              <span>{busy ? "Claiming…" : "Claim my key"}</span>
              <CtaEnd busy={busy} />
            </button>
          </>
          )
        ) : memberOnly ? (
          <>
            <p className="gate-copy">
              You already have SocialFit access.
              <br />
              A Key is no longer needed.
            </p>
            <Link href={routes.login} className="gate-cta gate-cta-primary" style={{ display: "flex" }}>
              <span>Log in</span>
              <CtaEnd busy={false} />
            </Link>
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
              <button
                className={`gate-cta gate-cta-primary${ctaStateClass(busy, filled)}`}
                disabled={!ready}
                type="submit"
                aria-busy={busy}
              >
                <span>{busy ? "Checking…" : "Enter your key"}</span>
                <CtaEnd busy={busy} />
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
