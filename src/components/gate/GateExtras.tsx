"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AskPhilia } from "@/components/gate/AskPhilia";
import { FlexNav } from "@/components/gate/FlexNav";
import { readSession } from "@/lib/session";
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
    s.ceremonyStep === "id" ||
    s.ceremonyStep === "keys" ||
    s.ceremonyStep === "hub" ||
    path.startsWith(routes.ceremonyId) ||
    path.startsWith(routes.ceremonyMirror) ||
    path.startsWith(routes.ceremonyKeys) ||
    path.startsWith(routes.hub) ||
    path.startsWith(routes.profile) ||
    path === routes.id ||
    path.startsWith(`${routes.id}/`)
  );
}

export function GateExtras() {
  const path = usePathname();
  const [askOpen, setAskOpen] = useState(false);
  const [explorerReady, setExplorerReady] = useState(() => isExplorer(path));
  const [hubUnlocked, setHubUnlocked] = useState(() => path.startsWith(routes.hub));

  useEffect(() => {
    const s = readSession();
    setExplorerReady(isExplorer(path));
    setHubUnlocked(s.hubUnlocked || s.ceremonyStep === "hub");
  }, [path]);

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
      <AskPhilia open={askOpen} explorerReady={explorerReady} onClose={() => setAskOpen(false)} />
    </>
  );
}
