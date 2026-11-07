"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AskPhilia } from "@/components/gate/AskPhilia";
import { FlexNav } from "@/components/gate/FlexNav";
import { cachedMe, ensureMe, isHubMe } from "@/lib/me-cache";
import { hasAccess, readSession, SESSION_EVENT } from "@/lib/session";
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

function isExplorer(path: string) {
  const s = readSession();
  return (
    s.explorerReady ||
    s.hubUnlocked ||
    s.ceremonyStep === "id" ||
    s.ceremonyStep === "keys" ||
    s.ceremonyStep === "hub" ||
    isHubMe(cachedMe()) ||
    path.startsWith(routes.ceremonyId) ||
    path.startsWith(routes.ceremonyMirror) ||
    path.startsWith(routes.ceremonyKeys) ||
    path.startsWith(routes.hub) ||
    path.startsWith(routes.profile) ||
    path === routes.id ||
    path.startsWith(`${routes.id}/`)
  );
}

function hubFromSession() {
  const s = readSession();
  return s.hubUnlocked || s.ceremonyStep === "hub" || isHubMe(cachedMe());
}

export function GateExtras() {
  const path = usePathname();
  const [askOpen, setAskOpen] = useState(false);
  const [explorerReady, setExplorerReady] = useState(() => isExplorer(path));
  const [hubUnlocked, setHubUnlocked] = useState(() => path.startsWith(routes.hub));

  useLayoutEffect(() => {
    function sync() {
      setExplorerReady(isExplorer(path));
      setHubUnlocked(hubFromSession());
    }
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, [path]);

  useEffect(() => {
    if (!hasAccess()) return;
    void ensureMe();
  }, []);

  if (!showOn(path)) return null;

  return (
    <>
      <FlexNav
        askOpen={askOpen}
        explorerReady={explorerReady}
        hubUnlocked={hubUnlocked}
        onAskOpen={() => setAskOpen(true)}
        onAskClose={() => setAskOpen(false)}
      />
      <AskPhilia
        open={askOpen}
        explorerReady={explorerReady}
        hubUnlocked={hubUnlocked}
        onClose={() => setAskOpen(false)}
      />
    </>
  );
}
