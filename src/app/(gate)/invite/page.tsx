import { Suspense } from "react";
import { InviteLanding } from "@/components/gate/InviteLanding";

export default function InvitePage() {
  return (
    <Suspense fallback={<main className="gate-wrap" />}>
      <InviteLanding />
    </Suspense>
  );
}
