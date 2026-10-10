"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe } from "@/lib/api/member";
import { isValidEmail } from "@/lib/api/origins";
import { mapOtpError, readOtpSend, sendOtp, verifyOtp } from "@/lib/api/otp";
import { normalizeUaePhone, sanitizeUaeLocalInput } from "@/lib/api/phone";
import { isApiError, readApiRefusal, refusalGoesToLogin, refusalLine } from "@/lib/api/errors";
import { claimInviteKey, isInviteSession } from "@/lib/invite";
import { hasAccess, readSession, writeSession } from "@/lib/session";
import { clearStoryProgress } from "@/lib/story-answers";
import { resumeMember } from "@/lib/resume";
import { routes } from "@/lib/routes";
import { OtpInput } from "@/components/gate/OtpInput";

function errorCode(err: unknown) {
  if (isApiError(err)) return err.code;
  if (err instanceof Error) return err.message;
  return "";
}

export function InviteVerifyForm() {
  const [email, setEmail] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailRequired, setEmailRequired] = useState(true);
  const [phoneMask, setPhoneMask] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [error, setError] = useState("");
  const [offerLogin, setOfferLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasAccess()) {
      window.location.replace(routes.verified);
      return;
    }
    const s = readSession();
    if (!isInviteSession() || s.keyId == null) {
      window.location.replace(routes.invite);
      return;
    }
    setEmail(s.email || s.founderEmail || "");
    setReady(true);
  }, []);

  const phone = normalizeUaePhone(`+971${localPhone}`);
  const canSend = isValidEmail(email) && !!phone && ageOk && !busy;
  const canVerify = emailRequired
    ? emailCode.length === 6 && phoneCode.length === 6 && !busy
    : phoneCode.length === 6 && !busy;

  function onPhoneChange(value: string) {
    setLocalPhone(sanitizeUaeLocalInput(value));
    setOfferLogin(false);
  }

  function showOtpRefusal(err: unknown, redirectOnLogin = false) {
    if (redirectOnLogin && refusalGoesToLogin(err)) {
      window.location.replace(routes.login);
      return;
    }
    setError(refusalLine(err, mapOtpError));
    setOfferLogin(readApiRefusal(err).next === "login");
    setBusy(false);
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const s = readSession();
    if (!ageOk) {
      setError("Confirm you are over 18 to continue.");
      return;
    }
    if (!phone || !isValidEmail(email) || s.keyId == null) {
      setError("Enter your email and a UAE mobile (+9715…).");
      return;
    }
    setError("");
    setOfferLogin(false);
    setBusy(true);
    try {
      const result = await sendOtp({
        email: email.trim(),
        phone,
        key_id: s.keyId,
      });
      const mode = readOtpSend(result);
      writeSession({ email: email.trim(), founderEmail: email.trim() });
      setEmailRequired(mode.emailRequired);
      setPhoneMask(mode.phoneMask);
      setSent(true);
      setBusy(false);
    } catch (err) {
      showOtpRefusal(err);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    const s = readSession();
    if (!s.keyId || phoneCode.length < 6) return;
    if (emailRequired && (emailCode.length < 6 || !phone)) return;
    setError("");
    setBusy(true);
    const nextEmail = email.trim();
    try {
      const tokens = await verifyOtp(
        emailRequired
          ? {
              email: nextEmail,
              phone: phone!,
              email_code: emailCode,
              phone_code: phoneCode,
              key_id: s.keyId,
            }
          : {
              email: nextEmail,
              phone_code: phoneCode,
              key_id: s.keyId,
            },
      );
      clearStoryProgress();
      writeSession({
        access: tokens.access,
        refresh: tokens.refresh || null,
        userId: tokens.user_id ?? null,
        email: nextEmail,
        founderEmail: nextEmail,
        entryPath: "invite",
      });
      try {
        const { me } = await claimInviteKey(tokens.access);
        if (me && me.needs_onboarding === false) {
          await resumeMember(me);
          return;
        }
        window.location.assign(routes.verified);
      } catch (err) {
        const claimCode = errorCode(err);
        if (claimCode === "already_member") {
          try {
            const me = await getMe(tokens.access);
            await resumeMember(me);
          } catch {
            window.location.replace(routes.login);
          }
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
        setError(refusalLine(err, mapOtpError));
        setBusy(false);
      }
    } catch (err) {
      showOtpRefusal(err, true);
    }
  }

  async function onResend() {
    const s = readSession();
    if (!phone || !isValidEmail(email) || s.keyId == null) return;
    setError("");
    setBusy(true);
    setEmailCode("");
    setPhoneCode("");
    setOtpKey((n) => n + 1);
    try {
      const result = await sendOtp({
        email: email.trim(),
        phone,
        key_id: s.keyId,
      });
      const mode = readOtpSend(result);
      setEmailRequired(mode.emailRequired);
      setPhoneMask(mode.phoneMask);
      setBusy(false);
    } catch (err) {
      showOtpRefusal(err);
    }
  }

  if (!ready) return null;

  return (
    <main className="verify-wrap">
      <p className="verify-step">Invite · Verify</p>
      {!sent ? (
        <form onSubmit={onSend}>
          <h1 className="verify-head">
            Secure your
            <br />
            access.
          </h1>
          <p className="verify-sub">
            We&apos;ll send one code to your email and one to your phone, so your SocialFit access
            stays tied to you.
          </p>
          <div className="verify-fields">
            <div>
              <label className="verify-label" htmlFor="invEmail">
                Email
              </label>
              <input
                id="invEmail"
                className={`verify-input${email ? " is-filled" : ""}`}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setOfferLogin(false);
                }}
              />
            </div>
            <div>
              <label className="verify-label" htmlFor="invPhone">
                Mobile
              </label>
              <div className="verify-phone">
                <select className="verify-cc" value="+971" disabled>
                  <option>+971</option>
                </select>
                <input
                  id="invPhone"
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
            <span>{busy ? "Sending…" : "Send codes"}</span>
            <span>→</span>
          </button>
          <p className="verify-legal">
            By clicking the “Send codes” button you are agreeing with our{" "}
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
            Your details stay private. They&apos;re used only to protect your Philia ID and access.
          </p>
        </form>
      ) : (
        <form onSubmit={onVerify}>
          {emailRequired ? (
            <>
              <h1 className="verify-head">
                Check your
                <br />
                email and phone.
              </h1>
              <p className="verify-sub">Enter the codes we sent to confirm it&apos;s you.</p>
              <div className="verify-otp">
                <label className="verify-label">Email code</label>
                <OtpInput key={`e-${otpKey}`} label="Email code" onChange={setEmailCode} disabled={busy} />
              </div>
            </>
          ) : (
            <>
              <h1 className="verify-head">
                Check your
                <br />
                phone.
              </h1>
              <p className="verify-sub">
                {phoneMask
                  ? `Your verification code was sent to ${phoneMask}.`
                  : "Your verification code was sent to the phone on your account."}
              </p>
            </>
          )}
          <div className="verify-otp">
            <label className="verify-label">Phone code</label>
            <OtpInput key={`p-${otpKey}`} label="Phone code" onChange={setPhoneCode} disabled={busy} />
            <button className="verify-resend" type="button" onClick={onResend} disabled={busy}>
              {emailRequired ? "Resend codes" : "Resend code"}
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
            <span>{busy ? "Verifying…" : "Verify and continue"}</span>
            <span>→</span>
          </button>
        </form>
      )}
    </main>
  );
}
