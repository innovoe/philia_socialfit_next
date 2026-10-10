"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  founderEmailVerify,
  mapOriginsError,
} from "@/lib/api/origins";
import { isApiError } from "@/lib/api/errors";
import { bounceIfLiveSession } from "@/lib/live-session";
import { hasEmailStarted, readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { GateChrome } from "@/components/gate/GateChrome";
import { SessionHold } from "@/components/gate/SessionHold";
import { OtpInput } from "@/components/gate/OtpInput";
import Link from "next/link";

export function OriginsCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (bounceIfLiveSession()) return;
    if (!hasEmailStarted()) {
      window.location.replace(routes.origins);
      return;
    }
    setEmail(readSession().founderEmail || "");
    setOpen(true);
  }, [router]);

  const ready = code.length === 6 && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) return;
    setError("");
    setBusy(true);
    try {
      const result = await founderEmailVerify(email, code);
      if (!result.founder_token) throw new Error("founder_token_required");
      writeSession({
        founderToken: result.founder_token,
        founderEmail: result.email || email,
        emailStarted: true,
        entryPath: "founder",
      });
      window.location.assign(routes.originsClaim);
    } catch (err) {
      const errCode = isApiError(err) ? err.code : String(err);
      if (errCode === "unknown_email") {
        writeSession({ emailStarted: false, founderToken: null });
        router.replace(routes.origins);
        return;
      }
      if (
        errCode === "founder_token_invalid" ||
        errCode === "expired" ||
        errCode === "founder_token_expired"
      ) {
        writeSession({ founderToken: null, emailStarted: false });
        router.replace(routes.origins);
        return;
      }
      setError(mapOriginsError(errCode));
      setBusy(false);
    }
  }

  if (!open) return <SessionHold />;

  return (
    <GateChrome>
      copy={
        <>
          Enter the code we sent
          <br />
          to confirm your email.
        </>
      }
      micro="First Wave list · email only at this step"
    >
      <form onSubmit={onSubmit}>
        <OtpInput onChange={setCode} disabled={busy} />
        <p className="gate-error" style={{ opacity: error ? 1 : 0 }}>
          {error || " "}
        </p>
        <button className={`gate-cta gate-cta-primary${ready ? "" : " is-wait"}`} disabled={!ready} type="submit">
          <span>Verify email</span>
          <span>→</span>
        </button>
        <Link href={routes.origins} className="gate-text-link">
          Use a different email
        </Link>
      </form>
    </GateChrome>
  );
}
