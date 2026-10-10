"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { founderEmailStart, isValidEmail, mapOriginsError } from "@/lib/api/origins";
import { readApiRefusal, refusalGoesToLogin, refusalLine } from "@/lib/api/errors";
import { bounceIfLiveSession } from "@/lib/live-session";
import { readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { GateChrome } from "@/components/gate/GateChrome";
import { SessionHold } from "@/components/gate/SessionHold";

export function OriginsEmailForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bounceIfLiveSession()) return;
    const params = new URLSearchParams(window.location.search);
    const token = (params.get("founder_token") || params.get("ft") || "").trim();
    const fromUrl = (params.get("email") || "").trim();
    if (token) {
      writeSession({
        founderToken: token,
        founderEmail: fromUrl || readSession().founderEmail,
        emailStarted: true,
        entryPath: "founder",
      });
      router.replace(routes.originsClaim);
      return;
    }
    const saved = fromUrl || readSession().founderEmail;
    if (saved) setEmail(saved);
    setOpen(true);
    const id = window.setTimeout(() => {
      const filled = emailRef.current?.value?.trim() || "";
      if (filled) setEmail(filled);
    }, 300);
    return () => window.clearTimeout(id);
  }, [router]);

  const ready = isValidEmail(email) && !busy && !blocked;

  function applyEmail(value: string) {
    setEmail(value);
    setError("");
    setBlocked(false);
    setBusy(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    setError("");
    if (!isValidEmail(value)) {
      setError("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      await founderEmailStart(value);
      writeSession({
        founderEmail: value,
        emailStarted: true,
        entryPath: "founder",
      });
      window.location.assign(routes.originsCode);
    } catch (err) {
      const { code } = readApiRefusal(err);
      if (refusalGoesToLogin(err)) {
        writeSession({ founderEmail: value, entryPath: "founder" });
        window.location.assign(routes.login);
        return;
      }
      setError(refusalLine(err, mapOriginsError));
      setBusy(false);
      if (code === "unknown_email") setBlocked(true);
    }
  }

  if (!open) return <SessionHold />;

  return (
    <GateChrome>
      replay
      headline={"A private layer\nfor the city."}
      copy={
        <>
          SocialFit is invite-only.
          <br />
          How are you entering?
        </>
      }
      micro="No open signup · UAE mobile required"
    >
      <form onSubmit={onSubmit}>
        <input
          className="gate-field gate-field-email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          ref={emailRef}
          placeholder="YOUR EMAIL"
          value={email}
          onChange={(e) => applyEmail(e.target.value)}
          onInput={(e) => applyEmail((e.target as HTMLInputElement).value)}
          onPaste={(e) => {
            const text = (e.clipboardData?.getData("text") || "").trim();
            if (!text) return;
            e.preventDefault();
            applyEmail(text);
          }}
          onBlur={(e) => applyEmail(e.target.value)}
        />
        <p className="gate-error" style={{ opacity: error ? 1 : 0 }}>
          {error || " "}
        </p>
        <button className={`gate-cta gate-cta-primary${ready ? "" : " is-wait"}`} disabled={!ready} type="submit">
          <span>Send code</span>
          <span>→</span>
        </button>
      </form>
    </GateChrome>
  );
}
