"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { founderEmailStart, isValidEmail, mapOriginsError } from "@/lib/api/origins";
import { isApiError } from "@/lib/api/errors";
import { readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { GateChrome } from "@/components/gate/GateChrome";

export function OriginsEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
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
  }, [router]);

  const ready = isValidEmail(email) && !busy && !blocked;

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
      const code = isApiError(err) ? err.code : "";
      if (code === "already_member") {
        writeSession({ founderEmail: value, entryPath: "founder" });
        window.location.assign(routes.login);
        return;
      }
      setError(mapOriginsError(code));
      setBusy(false);
      if (code === "unknown_email") setBlocked(true);
    }
  }

  return (
    <GateChrome
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
          placeholder="YOUR EMAIL"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            setBlocked(false);
          }}
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
