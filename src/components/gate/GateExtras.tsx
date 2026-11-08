"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AskPhilia } from "@/components/gate/AskPhilia";
import { FlexNav } from "@/components/gate/FlexNav";
import { ensureMe } from "@/lib/me-cache";
import { readNavFlags } from "@/lib/nav-flags";
import { hasAccess, SESSION_EVENT } from "@/lib/session";
import { routes } from "@/lib/routes";

function showOn(path: string) {
  return (
    path.startsWith(routes.story) ||
    path.startsWith(routes.read) ||
    path.startsWith(routes.ceremony) ||
    path.startsWith(routes.hub) ||
    path.startsWith(routes.profile) ||
    path === routes.id ||
    path.startsWith(`${routes.id}/`)
  );
}

export function GateExtras() {
  const path = usePathname();
  const [askOpen, setAskOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const flags = readNavFlags(path, tick > 0);

  useLayoutEffect(() => {
    setTick(1);
    const bump = () => setTick((n) => n + 1);
    window.addEventListener(SESSION_EVENT, bump);
    return () => window.removeEventListener(SESSION_EVENT, bump);
  }, []);

  useEffect(() => {
    if (!hasAccess()) return;
    void ensureMe();
  }, []);

  if (!showOn(path)) return null;

  return (
    <>
      <FlexNav
        askOpen={askOpen}
        explorerReady={flags.explorer}
        hubUnlocked={flags.hub}
        storyReady={flags.ready}
        onAskOpen={() => setAskOpen(true)}
        onAskClose={() => setAskOpen(false)}
      />
      <AskPhilia
        open={askOpen}
        explorerReady={flags.explorer}
        hubUnlocked={flags.hub}
        onClose={() => setAskOpen(false)}
      />
    </>
  );
}
