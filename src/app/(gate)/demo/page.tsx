"use client";

import { useEffect } from "react";
import { canPlaySignalDemo } from "@/lib/signal-demo";
import { routes } from "@/lib/routes";
import { SocialFabric } from "@/components/gate/SocialFabric";

export default function DemoPage() {
  useEffect(() => {
    if (!canPlaySignalDemo()) {
      window.location.replace(routes.origins);
    }
  }, []);

  return (
    <main className="demo-fabric screen active">
      <header className="demo-topbar">
        <span>Dubai</span>
        <span>Philia Life</span>
        <span>First Wave</span>
      </header>
      <SocialFabric />
      <section className="demo-fabric-bottom">
        <button
          className="gate-cta gate-cta-primary"
          type="button"
          onClick={() => window.location.assign(routes.demoEnter)}
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </section>
    </main>
  );
}
