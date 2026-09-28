"use client";

import { useEffect, useState } from "react";
import { IdManageScreen } from "@/components/gate/IdManageScreen";
import { requireProfileAccess } from "@/lib/profile";

export default function IdManagePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!requireProfileAccess()) return;
    setReady(true);
  }, []);

  if (!ready) return null;
  return <IdManageScreen />;
}
