"use client";

import { useEffect, useState } from "react";
import { InviteVerifyForm } from "@/components/gate/InviteVerifyForm";
import { VerifyForm } from "@/components/gate/VerifyForm";
import { isInviteSession } from "@/lib/invite";
import { hasAccess, hasFounderKey, readSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export function VerifyGate() {
  const [mode, setMode] = useState<"founder" | "invite" | null>(null);

  useEffect(() => {
    if (hasAccess()) {
      window.location.replace(routes.verified);
      return;
    }
    const s = readSession();
    if (isInviteSession() && s.keyId != null) {
      setMode("invite");
      return;
    }
    if (hasFounderKey()) {
      setMode("founder");
      return;
    }
    window.location.replace(routes.origins);
  }, []);

  if (mode === "invite") return <InviteVerifyForm />;
  if (mode === "founder") return <VerifyForm />;
  return null;
}
