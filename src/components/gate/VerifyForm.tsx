"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { claimKey, getMe } from "@/lib/api/member";
import { founderClaimKey, readClaimPhone } from "@/lib/api/origins";
import { mapOtpError, readOtpSend, sendOtp, verifyOtp } from "@/lib/api/otp";
import { normalizeUaePhone, sanitizeUaeLocalInput } from "@/lib/api/phone";
import { isApiError, readApiRefusal, refusalGoesToLogin, refusalLine } from "@/lib/api/errors";
import {
  hasAccess,
  hasFounderKey,
  readSession,
  writeSession,
} from "@/lib/session";
import { routes } from "@/lib/routes";
import { OtpInput } from "@/components/gate/OtpInput";

function errorCode(err: unknown) {
  if (isApiError(err)) return err.code;
  if (err instanceof Error) return err.message;
  return "";
}

export function VerifyForm() {
  const [email, setEmail] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [sent, setSent] = useState(false);
  const [phoneMask, setPhoneMask] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [offerLogin, setOfferLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasAccess()) {
      window.location.replace(routes.verified);
      return;
    }
    if (!hasFounderKey()) {
      window.location.replace(routes.origins);
      return;
    }

    let cancelled = false;
    const s = readSession();
    setEmail(s.founderEmail || "");
    setPhoneVerified(s.phoneVerified === true);
    setPhoneMask(s.phoneMask || "");

    (async () => {
      if (!s.founderToken) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const result = await founderClaimKey(s.founderToken);
        const phone = readClaimPhone(result);
        if (cancelled) return;
        writeSession({
          keyId: result.key_id ?? s.keyId,
          keyCode: result.code || s.keyCode,
          claimDeadline: result.claim_deadline || s.claimDeadline,
          founderEmail: result.email || s.founderEmail,
          phoneVerified: phone.phoneVerified,
          phoneMask: phone.phoneMask,
        });
        setEmail(result.email || s.founderEmail || "");
        setPhoneVerified(phone.phoneVerified);
        setPhoneMask(phone.phoneMask);
      } catch {
        if (cancelled) return;
        setPhoneVerified(s.phoneVerified === true);
        setPhoneMask(s.phoneMask || "");
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const phone = normalizeUaePhone(`+971${localPhone}`);
  const canSend = !!phone && ageOk && !busy;
  const canContinue = ageOk && !busy;
  const canVerify = code.length === 6 && !busy;

  function onPhoneChange(value: string) {
    setLocalPhone(sanitizeUaeLocalInput(value));
    setOfferLogin(false);
  }

  function showOtpRefusal(err: unknown, redirectOnLogin = false) {
    const { code, next } = readApiRefusal(err);
    if (code === "key_expired") {
      window.location.replace(routes.originsClaim);
      return;
    }
    if (redirectOnLogin && refusalGoesToLogin(err)) {
      window.location.replace(routes.login);
      return;
    }
    setError(refusalLine(err, mapOtpError));
    setOfferLogin(next === "login");
    setBusy(false);
  }

  async function finishAfterTokens(access: string, refresh?: string, userId?: number) {
    const s = readSession();
    writeSession({
      access,
      refresh: refresh || null,
      userId: userId ?? null,
    });
    try {
      const claim = await claimKey(
        s.keyId!,
        {
          founder_token: s.founderToken,
          code: s.keyCode,
        },
        access,
      );
      writeSession({
        claimDeadline: claim.claim_deadline || s.claimDeadline,
        finishDeadline: claim.finish_deadline || null,
      });
      try {
        const me = await getMe(access);
        writeSession({
          claimDeadline: me.claim_deadline || claim.claim_deadline || s.claimDeadline,
          finishDeadline: me.finish_deadline || claim.finish_deadline || null,
        });
      } catch {
        /* keep claim deadlines */
      }
    } catch (err) {
      const claimCode = errorCode(err);
      if (refusalGoesToLogin(err)) {
        window.location.replace(routes.login);
        return;
      }
      if (
        claimCode === "already_claimed" ||
        claimCode === "key_already_claimed" ||
        claimCode === "claimed"
      ) {
        window.location.assign(routes.verified);
        return;
      }
      if (claimCode === "key_expired") {
        window.location.replace(routes.originsClaim);
        return;
      }
      setError(
        refusalLine(err, (code) =>
          mapOtpError(code) === "Could not continue — try again."
            ? "Verified, but Key claim failed — code may already be used. Ask ops for a fresh opened Key."
            : mapOtpError(code),
        ),
      );
      setBusy(false);
      return;
    }
    window.location.assign(routes.verified);
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const s = readSession();
    if (!ageOk) {
      setError("Confirm you are over 18 to continue.");
      return;
    }
    if (!phone || s.keyId == null || !s.founderToken) {
      setError("Use a UAE mobile (+9715…).");
      return;
    }
    setError("");
    setOfferLogin(false);
    setBusy(true);
    try {
      const result = await sendOtp({
        phone,
        key_id: s.keyId,
        founder_token: s.founderToken,
      });
      setPhoneMask(readOtpSend(result).phoneMask);
      setSent(true);
      setBusy(false);
    } catch (err) {
      showOtpRefusal(err);
    }
  }

  async function onContinue(e: React.FormEvent) {
    e.preventDefault();
    const s = readSession();
    if (!ageOk) {
      setError("Confirm you are over 18 to continue.");
      return;
    }
    if (s.keyId == null || !s.founderToken) {
      setError("Email verification expired — start again.");
      return;
    }
    setError("");
    setOfferLogin(false);
    setBusy(true);
    try {
      const tokens = await verifyOtp({
        founder_token: s.founderToken,
      });
      await finishAfterTokens(tokens.access, tokens.refresh, tokens.user_id);
    } catch (err) {
      showOtpRefusal(err, true);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    const s = readSession();
    if (!phone || s.keyId == null || !s.founderToken || code.length < 6) return;
    setError("");
    setBusy(true);
    try {
      const tokens = await verifyOtp({
        phone,
        phone_code: code,
        key_id: s.keyId,
        founder_token: s.founderToken,
      });
      await finishAfterTokens(tokens.access, tokens.refresh, tokens.user_id);
    } catch (err) {
      showOtpRefusal(err, true);
    }
  }

  async function onResend() {
    const s = readSession();
    if (!phone || s.keyId == null || !s.founderToken) return;
    setError("");
    setBusy(true);
    setCode("");
    try {
      const result = await sendOtp({
        phone,
        key_id: s.keyId,
        founder_token: s.founderToken,
      });
      setPhoneMask(readOtpSend(result).phoneMask);
      setBusy(false);
    } catch (err) {
      showOtpRefusal(err);
    }
  }

  if (!ready) return null;

  if (phoneVerified) {
    return (
      <main className="verify-wrap">
        <p className="verify-step">Origin · Step 2 of 3</p>
        <form onSubmit={onContinue}>
          <h1 className="verify-head">
            Secure your
            <br />
            access.
          </h1>
          <p className="verify-sub">Your email and phone are already verified.</p>
          <div className="verify-fields">
            <div>
              <label className="verify-label" htmlFor="vEmail">
                Email <span className="verify-pill">Verified</span>
              </label>
              <input
                id="vEmail"
                className="verify-input is-locked"
                type="email"
                value={email}
                readOnly
              />
            </div>
            <div>
              <label className="verify-label" htmlFor="vPhone">
                Mobile <span className="verify-pill">Verified</span>
              </label>
              <input
                id="vPhone"
                className="verify-input is-locked"
                type="text"
                value={phoneMask}
                readOnly
              />
            </div>
          </div>
          <p className="verify-error" style={{ opacity: error ? 1 : 0 }}>
            {error || " "}
          </p>
          {offerLogin ? (
            <Link href={routes.login} className="gate-text-link" style={{ marginTop: 0, marginBottom: 18 }}>
              Log in instead
            </Link>
          ) : null}
          <label className="verify-age">
            <input
              type="checkbox"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
            />
            <span className="verify-age-box" aria-hidden="true" />
            <span className="verify-age-text">I&apos;m over 18 years old.</span>
          </label>
          <button
            className={`gate-cta gate-cta-primary${canContinue ? "" : " is-wait"}`}
            disabled={!canContinue}
            type="submit"
          >
            <span>{busy ? "Continuing…" : "Continue"}</span>
            <span>→</span>
          </button>
          <p className="verify-legal">
            By clicking the “Continue” button you are agreeing with our{" "}
            <Link href={routes.terms} target="_blank" rel="noopener noreferrer">
              Terms
            </Link>{" "}
            and{" "}
            <Link href={routes.privacy} target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="verify-private">
            Your details stay private. They&apos;re used only to protect your
            Philia ID and access.
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="verify-wrap">
      <p className="verify-step">Origin · Step 2 of 3</p>
      {!sent ? (
        <form onSubmit={onSend}>
          <h1 className="verify-head">
            Secure your
            <br />
            access.
          </h1>
          <p className="verify-sub">
            We&apos;ll send one code to your phone, so your SocialFit access
            stays tied to you.
          </p>
          <div className="verify-fields">
            <div>
              <label className="verify-label" htmlFor="vEmail">
                Email <span className="verify-pill">Verified</span>
              </label>
              <input
                id="vEmail"
                className="verify-input is-locked"
                type="email"
                value={email}
                readOnly
              />
            </div>
            <div>
              <label className="verify-label" htmlFor="vPhone">
                Mobile
              </label>
              <div className="verify-phone">
                <select className="verify-cc" value="+971" disabled>
                  <option>+971</option>
                </select>
                <input
                  id="vPhone"
                  className={`verify-input${localPhone ? " is-filled" : ""}`}
                  type="tel"
                  inputMode="numeric"
                  placeholder="50 123 4567"
                  autoComplete="tel"
                  value={localPhone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                />
              </div>
              <p className="verify-hint">UAE mobile required (+9715…)</p>
            </div>
          </div>
          <p className="verify-error" style={{ opacity: error ? 1 : 0 }}>
            {error || " "}
          </p>
          {offerLogin ? (
            <Link href={routes.login} className="gate-text-link" style={{ marginTop: 0, marginBottom: 18 }}>
              Log in instead
            </Link>
          ) : null}
          <label className="verify-age">
            <input
              type="checkbox"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
            />
            <span className="verify-age-box" aria-hidden="true" />
            <span className="verify-age-text">I&apos;m over 18 years old.</span>
          </label>
          <button
            className={`gate-cta gate-cta-primary${canSend ? "" : " is-wait"}`}
            disabled={!canSend}
            type="submit"
          >
            <span>{busy ? "Sending…" : "Send code"}</span>
            <span>→</span>
          </button>
          <p className="verify-legal">
            By clicking the “Send code” button you are agreeing with our{" "}
            <Link href={routes.terms} target="_blank" rel="noopener noreferrer">
              Terms
            </Link>{" "}
            and{" "}
            <Link href={routes.privacy} target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="verify-private">
            Your details stay private. They&apos;re used only to protect your
            Philia ID and access.
          </p>
        </form>
      ) : (
        <form onSubmit={onVerify}>
          <h1 className="verify-head">
            Check your
            <br />
            phone.
          </h1>
          <p className="verify-sub">
            {phoneMask
              ? `Your verification code was sent to ${phoneMask}.`
              : "Enter the code we sent to confirm it's you."}
          </p>
          <div className="verify-otp">
            <label className="verify-label">Phone code</label>
            <OtpInput label="Phone code" onChange={setCode} disabled={busy} />
            <button className="verify-resend" type="button" onClick={onResend} disabled={busy}>
              Resend code
            </button>
          </div>
          <p className="verify-error" style={{ opacity: error ? 1 : 0 }}>
            {error || " "}
          </p>
          {offerLogin ? (
            <Link href={routes.login} className="gate-text-link" style={{ marginTop: 0, marginBottom: 10 }}>
              Log in instead
            </Link>
          ) : null}
          <button
            className={`gate-cta gate-cta-primary${canVerify ? "" : " is-wait"}`}
            disabled={!canVerify}
            type="submit"
            style={{ marginTop: 8 }}
          >
            <span>Verify and continue</span>
            <span>→</span>
          </button>
        </form>
      )}
    </main>
  );
}
