import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Terms · SocialFit",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-porcelain px-7 py-12 text-steel">
      <p className="font-display text-[7px] font-bold uppercase tracking-[0.28em] text-muted">
        Legal
      </p>
      <h1 className="mt-3 font-display text-[25px] font-bold tracking-[-0.048em]">
        Terms
      </h1>
      <p className="mt-6 text-[13.5px] leading-6 text-[rgba(79,90,114,0.72)]">
        SocialFit is operated by P Labs FZE. The full terms will live here; for
        now this page keeps the verify link intact.
      </p>
      <p className="mt-8">
        <Link
          href={routes.landing}
          className="font-display text-[8px] font-bold uppercase tracking-[0.16em] text-malibu"
        >
          ← Back to SocialFit
        </Link>
      </p>
    </main>
  );
}
