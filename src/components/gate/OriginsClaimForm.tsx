"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { founderClaimKey, mapOriginsError, readClaimPhone } from "@/lib/api/origins";
import { readApiRefusal, refusalGoesToLogin, refusalLine } from "@/lib/api/errors";
import { bounceIfLiveSession } from "@/lib/live-session";
import { hasFounderToken, readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { GateChrome } from "@/components/gate/GateChrome";
import { SessionHold } from "@/components/gate/SessionHold";

export function OriginsClaimForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (bounceIfLiveSession()) return;
    if (!hasFounderToken()) {
      window.location.replace(routes.origins);
      return;
    }
    setOpen(true);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = readSession().founderToken;
    setError("");
    if (!token) {
      router.replace(routes.origins);
      return;
    }
    setBusy(true);
    try {
      const result = await founderClaimKey(token);
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
      window.location.assign(routes.founder);
    } catch (err) {
      const { code } = readApiRefusal(err);
      if (refusalGoesToLogin(err)) {
        router.replace(routes.login);
        return;
      }
      if (
        code === "unknown_email" ||
        code === "founder_token_invalid" ||
        code === "founder_token_expired" ||
        code === "founder_token_required"
      ) {
        writeSession({ founderToken: null, emailStarted: false });
        router.replace(routes.origins);
        return;
      }
      setError(refusalLine(err, mapOriginsError));
      setBusy(false);
    }
  }

  if (!open) return <SessionHold />;

  return (
    <GateChrome>
      copy={
        <>
          SocialFit is invite-only.
          <br />
          Your Key is ready to claim.
        </>
      }
      micro="No open signup · UAE mobile required"
    >
      <form onSubmit={onSubmit}>
        <p className="gate-error" style={{ opacity: error ? 1 : 0 }}>
          {error || " "}
        </p>
        <button className={`gate-cta gate-cta-primary${busy ? " is-wait" : ""}`} disabled={busy} type="submit">
          <span>Claim my key</span>
          <span>→</span>
        </button>
      </form>
    </GateChrome>
  );
}
