"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { claimKey, getMe } from "@/lib/api/member";
import { mapOtpError, sendOtp, verifyOtp } from "@/lib/api/otp";
import { normalizeUaePhone, sanitizeUaeLocalInput } from "@/lib/api/phone";
import { isApiError } from "@/lib/api/errors";
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
  const [ageOk, setAgeOk] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
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
    setEmail(readSession().founderEmail || "");
    setReady(true);
  }, []);

  const phone = normalizeUaePhone(`+971${localPhone}`);
  const canSend = !!phone && ageOk && !busy;
  const canVerify = code.length === 6 && !busy;

  function onPhoneChange(value: string) {
    setLocalPhone(sanitizeUaeLocalInput(value));
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
    setBusy(true);
    try {
      await sendOtp({
        phone,
        key_id: s.keyId,
        founder_token: s.founderToken,
      });
      setSent(true);
      setBusy(false);
    } catch (err) {
      const code = errorCode(err);
      if (code === "key_expired") {
        window.location.replace(routes.originsClaim);
        return;
      }
      setError(mapOtpError(code));
      setBusy(false);
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
      writeSession({
        access: tokens.access,
        refresh: tokens.refresh || null,
        userId: tokens.user_id ?? null,
      });
      try {
        const claim = await claimKey(s.keyId, {
          founder_token: s.founderToken,
          code: s.keyCode,
        }, tokens.access);
        writeSession({
          claimDeadline: claim.claim_deadline || s.claimDeadline,
          finishDeadline: claim.finish_deadline || null,
        });
        try {
          const me = await getMe(tokens.access);
          writeSession({
            claimDeadline: me.claim_deadline || claim.claim_deadline || s.claimDeadline,
            finishDeadline: me.finish_deadline || claim.finish_deadline || null,
          });
        } catch {
          /* keep claim deadlines */
        }
      } catch (err) {
        const claimCode = errorCode(err);
        if (claimCode === "already_member") {
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
          mapOtpError(claimCode) === "Could not continue — try again."
            ? "Verified, but Key claim failed — code may already be used. Ask ops for a fresh opened Key."
            : mapOtpError(claimCode),
        );
        setBusy(false);
        return;
      }
      window.location.assign(routes.verified);
    } catch (err) {
      const code = errorCode(err);
      if (code === "key_expired") {
        window.location.replace(routes.originsClaim);
        return;
      }
      if (code === "already_member") {
        window.location.replace(routes.login);
        return;
      }
      setError(mapOtpError(code));
      setBusy(false);
    }
  }

  async function onResend() {
    const s = readSession();
    if (!phone || s.keyId == null || !s.founderToken) return;
    setError("");
    setBusy(true);
    setCode("");
    try {
      await sendOtp({
        phone,
        key_id: s.keyId,
        founder_token: s.founderToken,
      });
      setBusy(false);
    } catch (err) {
      const code = errorCode(err);
      if (code === "key_expired") {
        window.location.replace(routes.originsClaim);
        return;
      }
      setError(mapOtpError(code));
      setBusy(false);
    }
  }

  if (!ready) return null;

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
          <p className="verify-sub">Enter the code we sent to confirm it&apos;s you.</p>
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
