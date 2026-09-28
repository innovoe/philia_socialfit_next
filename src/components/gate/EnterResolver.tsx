"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { parseEntrySearch, shouldSkip } from "@/lib/entry";
import { writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export function EnterResolver() {
  const search = useSearchParams();
  const flags = useMemo(() => parseEntrySearch(search.toString()), [search]);

  useEffect(() => {
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
  }, [flags]);

  const skipDemo = shouldSkip(flags.skip, "demo");
  const skipEmail = shouldSkip(flags.skip, "email");
  const bypass = !!flags.access;

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
