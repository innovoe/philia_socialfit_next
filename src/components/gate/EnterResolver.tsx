"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { parseEntrySearch, shouldSkip } from "@/lib/entry";
import { bounceIfLiveSession } from "@/lib/live-session";
import { writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { SessionHold } from "@/components/gate/SessionHold";

export function EnterResolver() {
  const search = useSearchParams();
  const flags = useMemo(() => parseEntrySearch(search.toString()), [search]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (bounceIfLiveSession()) return;
    writeSession({
      entryPath: "consumer",
      skip: flags.skip,
      show: flags.show,
      access: flags.access,
      refresh: flags.refresh,
      founderToken: flags.founderToken,
      founderEmail: flags.email,
      emailStarted: !!flags.email,
    });
    setOpen(true);
  }, [flags]);

  const skipDemo = shouldSkip(flags.skip, "demo");
  const skipEmail = shouldSkip(flags.skip, "email");
  const bypass = !!flags.access;

  if (!open) return <SessionHold />;

  return (
    <main className="gate-wrap">
      <header className="gate-topbar">
        <span>Philia Life</span>
        <span>Consumer door</span>
      </header>
      <div className="gate-placeholder enter-copy">
        <p>
          This link decides the path. We stored the flags and did not jump
          ahead.
        </p>
        <ul className="enter-flags">
          <li>Skip demo: {skipDemo ? "yes" : "no"}</li>
          <li>Skip email: {skipEmail ? "yes" : "no"}</li>
          <li>Access token: {bypass ? "present" : "none"}</li>
          <li>Show: {flags.show.join(", ") || "default"}</li>
        </ul>
        <Link href={routes.landing} className="gate-text-link">
          Back to landing
        </Link>
      </div>
    </main>
  );
}
