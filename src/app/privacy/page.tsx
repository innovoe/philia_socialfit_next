import type { Metadata } from "next";
import { LegalHtml, LegalPage } from "@/components/legal/LegalPage";
import { PrivacyLangSwitch } from "@/components/legal/PrivacyLangSwitch";
import { readLegalHtml } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · SocialFit",
  description:
    "SocialFit Privacy Policy — how P Labs FZE collects, uses, shares, and protects personal data on the SocialFit platform under UAE PDPL.",
};

export default function PrivacyPage() {
  return (
    <LegalPage>
      <PrivacyLangSwitch current="en" />
      <LegalHtml html={readLegalHtml("privacy-en")} />
    </LegalPage>
  );
}
