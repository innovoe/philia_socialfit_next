"use client";

import { useEffect, useState } from "react";
import { ProfileScreen } from "@/components/gate/ProfileScreen";
import { requireProfileAccess } from "@/lib/profile";

export default function ProfilePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!requireProfileAccess()) return;
    setReady(true);
  }, []);

  if (!ready) return null;
  return <ProfileScreen />;
}
