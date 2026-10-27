"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { OriginsEmailForm } from "@/components/gate/OriginsEmailForm";
import { queryKeyCode } from "@/lib/invite";
import { routes } from "@/lib/routes";
import { SessionHold } from "@/components/gate/SessionHold";

export function EnterResolver() {
  const search = useSearchParams();
  const code = queryKeyCode(search.toString());

  useEffect(() => {
    if (code) {
      window.location.replace(`${routes.unlock}?key=${encodeURIComponent(code)}`);
    }
  }, [code]);

  if (code) return <SessionHold />;
  return <OriginsEmailForm gate="enter" />;
}
