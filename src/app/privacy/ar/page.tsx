import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_Arabic } from "next/font/google";
import { LegalPage } from "@/components/legal/LegalPage";
import { PrivacyLangSwitch } from "@/components/legal/PrivacyLangSwitch";
import privacyAr from "@/content/privacy-ar.json";
import { routes } from "@/lib/routes";

const notoAr = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "سياسة الخصوصية · SocialFit",
  description: "سياسة خصوصية SocialFit — النسخة العربية.",
};

type Block = { k: "title" | "h" | "label" | "p"; t: string };

function headingLevel(text: string): "h2" | "h3" {
  return /^\d+\.\d+/.test(text) ? "h3" : "h2";
}

export default function PrivacyArPage() {
  const blocks = privacyAr as Block[];
  const title = blocks.find((b) => b.k === "title")?.t ?? "سياسة خصوصية SOCIALFIT";
  const afterTitle = blocks.filter((b) => b.k !== "title");
  const labels: Block[] = [];
  let bodyStart = 0;
  while (afterTitle[bodyStart]?.k === "label") {
    labels.push(afterTitle[bodyStart]);
    bodyStart += 1;
  }
  const rest = afterTitle.slice(bodyStart);

  type Section = { heading: string; body: Block[] };
  const sections: Section[] = [];
  for (const block of rest) {
    if (block.k === "h" && headingLevel(block.t) === "h2") {
      sections.push({ heading: block.t, body: [] });
      continue;
    }
    if (!sections.length) {
      sections.push({ heading: "", body: [block] });
      continue;
    }
    sections[sections.length - 1].body.push(block);
  }

  return (
    <LegalPage lang="ar" dir="rtl">
      <div className={notoAr.className}>
        <PrivacyLangSwitch current="ar" />
        <article className="legal-doc">
          <p className="legal-kicker">قانوني</p>
          <h1 className="legal-title">{title}</h1>
          {labels.map((block, i) => (
            <p key={i} className="legal-updated">
              {block.t}
            </p>
          ))}
          {sections.map((section, i) => (
            <section key={i} className="legal-section">
              {section.heading ? <h2>{section.heading}</h2> : null}
              {section.body.map((block, j) => {
                if (block.k === "h") {
                  return <h3 key={j}>{block.t}</h3>;
                }
                return <p key={j}>{block.t}</p>;
              })}
            </section>
          ))}
          <footer className="legal-footer">
            <p>© P Labs FZE · SocialFit</p>
            <nav className="legal-footer-nav" aria-label="Legal">
              <Link href={routes.privacy}>Privacy Policy</Link>
              <Link href={routes.terms}>Terms</Link>
              <Link className="legal-back" href={routes.landing}>
                ← العودة إلى SocialFit
              </Link>
            </nav>
          </footer>
        </article>
      </div>
    </LegalPage>
  );
}
