"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyCampaignToSession,
  emailGateHref,
  founderClaimKey,
  founderRequestKey,
  mapOriginsError,
  readClaimPhone,
  readFounderKeyExpired,
  type FounderKeyExpired,
} from "@/lib/api/origins";
import { readApiRefusal, refusalGoesToLogin, refusalLine } from "@/lib/api/errors";
import { bounceIfLiveSession } from "@/lib/live-session";
import { hasFounderToken, isFounderSession, readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { FounderKeyReissue } from "@/components/gate/FounderKeyReissue";
import { GateChrome } from "@/components/gate/GateChrome";
import { SessionHold } from "@/components/gate/SessionHold";
import { CtaEnd, ctaStateClass } from "@/components/gate/CtaEnd";

export function OriginsClaimForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [expired, setExpired] = useState<FounderKeyExpired | null>(null);

  useEffect(() => {
    if (bounceIfLiveSession()) return;
    if (!hasFounderToken()) {
      window.location.replace(emailGateHref());
      return;
    }
    setOpen(true);
  }, [router]);

  function applyExpired(next: FounderKeyExpired) {
    setExpired(next);
    setError("");
    setBusy(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = readSession().founderToken;
    setError("");
    if (!token) {
      router.replace(emailGateHref());
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
        phoneVerified: phone.phoneVerified,
        phoneMask: phone.phoneMask,
      });
      applyCampaignToSession(result);
      window.location.assign(isFounderSession() ? routes.founder : routes.demo);
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
        router.replace(emailGateHref());
        return;
      }
      const stale = readFounderKeyExpired(err);
      if (stale && (stale.canRequest || stale.requested) && isFounderSession()) {
        applyExpired(stale);
        return;
      }
      setError(refusalLine(err, mapOriginsError));
      setBusy(false);
    }
  }

  async function onRequest() {
    const token = readSession().founderToken;
    setError("");
    if (!token) {
      router.replace(emailGateHref());
      return;
    }
    setBusy(true);
    try {
      const result = await founderRequestKey(token);
      applyExpired({
        canRequest: false,
        requested: true,
        issuesAt: result.issues_at || expired?.issuesAt || null,
      });
    } catch (err) {
      const { code } = readApiRefusal(err);
      if (code === "key_not_expired") {
        setExpired(null);
        setError(refusalLine(err, mapOriginsError));
        setBusy(false);
        return;
      }
      setError(refusalLine(err, mapOriginsError));
      setBusy(false);
    }
  }

  if (!open) return <SessionHold />;

  const reissue = !!expired && (expired.canRequest || expired.requested);

  return (
    <GateChrome
      copy={
        reissue ? (
          expired.canRequest ? (
            <>
              SocialFit is invite-only.
              <br />
              Your Key window has closed.
            </>
          ) : (
            <>
              SocialFit is invite-only.
              <br />
              A new Key is being prepared.
            </>
          )
        ) : (
          <>
            SocialFit is invite-only.
            <br />
            Your Key is ready to claim.
          </>
        )
      }
      micro="No open signup · UAE mobile required"
    >
      {reissue ? (
        <FounderKeyReissue
          canRequest={expired.canRequest}
          issuesAt={expired.issuesAt}
          busy={busy}
          error={error}
          onRequest={() => void onRequest()}
        />
      ) : (
        <form onSubmit={onSubmit}>
          <p className="gate-error" style={{ opacity: error ? 1 : 0 }}>
            {error || " "}
          </p>
          <button
            className={`gate-cta gate-cta-primary${ctaStateClass(busy)}`}
            disabled={busy}
            type="submit"
            aria-busy={busy}
          >
            <span>{busy ? "One moment…" : "Claim my key"}</span>
            <CtaEnd busy={busy} />
          </button>
        </form>
      )}
    </GateChrome>
  );
}
