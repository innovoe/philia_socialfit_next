import { Suspense } from "react";
import { LandingHome } from "@/components/gate/LandingHome";

export default function LandingPage() {
  return (
    <Suspense fallback={<main className="gate-wrap" />}>
      <LandingHome />
    </Suspense>
  );
}
