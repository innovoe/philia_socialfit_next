"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe } from "@/lib/api/member";
import { isValidEmail } from "@/lib/api/origins";
import {
  mapOtpError,
  readOtpSend,
  sendOtp,
  verifyOtp,
  type SendOtpPayload,
} from "@/lib/api/otp";
import { normalizeUaePhone, sanitizeUaeLocalInput } from "@/lib/api/phone";
import { isApiError, refusalLine } from "@/lib/api/errors";
import { hasAccess, readSession, writeSession } from "@/lib/session";
import { resumeMember } from "@/lib/resume";
import { clearStoryProgress } from "@/lib/story-answers";
import { routes } from "@/lib/routes";
import { OtpInput } from "@/components/gate/OtpInput";

function errorCode(err: unknown) {
  if (isApiError(err)) return err.code;
  if (err instanceof Error) return err.message;
  return "";
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [needPhone, setNeedPhone] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailRequired, setEmailRequired] = useState(false);
  const [phoneMask, setPhoneMask] = useState("");
  const [lastSend, setLastSend] = useState<SendOtpPayload | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readSession().founderEmail || readSession().email || "";
    setEmail(saved);

    if (!hasAccess()) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) await resumeMember(me);
      } catch {
        writeSession({ access: null, refresh: null });
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const phone = normalizeUaePhone(`+971${localPhone}`);
  const canSend = isValidEmail(email) && (!needPhone || !!phone) && !busy;
  const canVerify = emailRequired
    ? emailCode.length === 6 && phoneCode.length === 6 && !busy
    : phoneCode.length === 6 && !busy;

  function onPhoneChange(value: string) {
    setLocalPhone(sanitizeUaeLocalInput(value));
  }

  async function dispatchSend(payload: SendOtpPayload) {
    const result = await sendOtp(payload);
    const mode = readOtpSend(result);
    if (mode.emailRequired && !payload.phone) {
      setNeedPhone(true);
      setError("Add a UAE mobile so we can send the codes.");
      return;
    }
    setEmailRequired(mode.emailRequired);
    setPhoneMask(mode.phoneMask);
    setLastSend(payload);
    setSent(true);
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (needPhone && !phone) {
      setError("Enter your email and a UAE mobile (+9715…).");
      return;
    }
    setError("");
    setBusy(true);
    const payload: SendOtpPayload = needPhone
      ? { email: email.trim(), phone: phone! }
      : { email: email.trim() };
    try {
      await dispatchSend(payload);
      setBusy(false);
    } catch (err) {
      const code = errorCode(err);
      if (code === "invalid_phone" && !needPhone) {
        setNeedPhone(true);
        setError("This email has no mobile on file. Add a UAE mobile, then send again.");
        setBusy(false);
        return;
      }
      setError(refusalLine(err, mapOtpError));
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (phoneCode.length < 6) return;
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
            }
          : {
              email: nextEmail,
              phone_code: phoneCode,
            },
      );
      const prev = (readSession().founderEmail || readSession().email || "").trim().toLowerCase();
      if (prev && prev !== nextEmail.toLowerCase()) clearStoryProgress();
      writeSession({
        access: tokens.access,
        refresh: tokens.refresh || null,
        userId: tokens.user_id ?? null,
        founderEmail: nextEmail,
        email: nextEmail,
        entryPath: readSession().entryPath || "founder",
      });
      const me = await getMe(tokens.access);
      await resumeMember(me);
    } catch (err) {
      setError(refusalLine(err, mapOtpError));
      setBusy(false);
    }
  }

  async function onResend() {
    if (!lastSend) return;
    setError("");
    setBusy(true);
    setEmailCode("");
    setPhoneCode("");
    setOtpKey((n) => n + 1);
    try {
      await dispatchSend(lastSend);
      setBusy(false);
    } catch (err) {
      setError(refusalLine(err, mapOtpError));
      setBusy(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="verify-wrap">
      <button
        type="button"
        className="verify-back"
        onClick={() => window.location.assign(routes.landing)}
      >
        ← Back
      </button>
      <p className="verify-step">SocialFit · Log in</p>
      {!sent ? (
        <form onSubmit={onSend}>
          <h1 className="verify-head">
            Welcome
            <br />
            back.
          </h1>
          <p className="verify-sub">
            {needPhone
              ? "We'll send one code to your email and one to your phone. No Key required."
              : "We'll text a code to the phone on your account. No Key required."}
          </p>
          <div className="verify-fields">
            <div>
              <label className="verify-label" htmlFor="lgEmail">
                Email
              </label>
              <input
                id="lgEmail"
                className="verify-input"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            </div>
            {needPhone ? (
              <div>
                <label className="verify-label" htmlFor="lgPhone">
                  Mobile
                </label>
                <div className="verify-phone">
                  <select className="verify-cc" value="+971" disabled>
                    <option>+971</option>
                  </select>
                  <input
                    id="lgPhone"
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
            ) : null}
          </div>
          <p className="verify-error" style={{ opacity: error ? 1 : 0 }}>
            {error || " "}
          </p>
          <button
            className={`gate-cta gate-cta-primary${canSend ? "" : " is-wait"}`}
            disabled={!canSend}
            type="submit"
          >
            <span>{busy ? "Sending…" : "Send code"}</span>
            <span>→</span>
          </button>
          <Link href={routes.unlock} className="gate-text-link" style={{ marginTop: 18, display: "inline-block" }}>
            I have a Key instead
          </Link>
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
          <button
            className={`gate-cta gate-cta-primary${canVerify ? "" : " is-wait"}`}
            disabled={!canVerify}
            type="submit"
            style={{ marginTop: 8 }}
          >
            <span>{busy ? "Signing in…" : "Log in"}</span>
            <span>→</span>
          </button>
        </form>
      )}
    </main>
  );
}
