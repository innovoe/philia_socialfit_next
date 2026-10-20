"use client";

import { formatFounderKeyIssueAt } from "@/lib/api/origins";
import { CtaEnd, ctaStateClass } from "@/components/gate/CtaEnd";

type FounderKeyReissueProps = {
  canRequest: boolean;
  issuesAt?: string | null;
  busy?: boolean;
  error?: string;
  onRequest: () => void;
};

export function FounderKeyReissue({
  canRequest,
  issuesAt = null,
  busy = false,
  error = "",
  onRequest,
}: FounderKeyReissueProps) {
  const when = formatFounderKeyIssueAt(issuesAt);

  if (!canRequest) {
    return (
      <>
        <p className="gate-copy" style={{ marginTop: 0 }}>
          We&apos;ll email the new Founder Key when it&apos;s ready.
          {when ? ` Expected ${when}.` : ""}
        </p>
        {error ? <p className="gate-error">{error}</p> : null}
      </>
    );
  }

  return (
    <>
      <p className="gate-copy" style={{ marginTop: 0 }}>
        Request a new key if you want to be reconsidered for Origins.
      </p>
      <p className="gate-error" style={{ opacity: error ? 1 : 0 }}>
        {error || " "}
      </p>
      <button
        className={`gate-cta gate-cta-primary${ctaStateClass(busy)}`}
        disabled={busy}
        type="button"
        onClick={onRequest}
        aria-busy={busy}
      >
        <span>{busy ? "Sending…" : "Request a new key"}</span>
        <CtaEnd busy={busy} />
      </button>
    </>
  );
}
