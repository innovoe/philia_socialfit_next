"use client";

import { useEffect } from "react";
import { routes } from "@/lib/routes";

export default function SignalRedirectPage() {
  useEffect(() => {
    window.location.replace(routes.demo);
  }, []);
  return null;
}
