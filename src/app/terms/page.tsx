import type { Metadata } from "next";
import { LegalHtml, LegalPage } from "@/components/legal/LegalPage";
import { readLegalHtml } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service · SocialFit",
  description:
    "SocialFit Master Terms and Conditions — eligibility, Keys, membership, in-person participation, and rules of the SocialFit platform operated by P Labs FZE.",
};

export default function TermsPage() {
  return (
    <LegalPage>
      <LegalHtml html={readLegalHtml("terms-en")} />
    </LegalPage>
  );
}
