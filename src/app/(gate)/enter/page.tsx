import { Suspense } from "react";
import { EnterResolver } from "@/components/gate/EnterResolver";

export default function EnterPage() {
  return (
    <Suspense fallback={<main className="gate-wrap" />}>
      <EnterResolver />
    </Suspense>
  );
}
