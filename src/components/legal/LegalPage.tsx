import Link from "next/link";
import type { ReactNode } from "react";
import { keyArt } from "@/lib/assets";
import { routes } from "@/lib/routes";
import "@/app/legal.css";

export function LegalPage({
  children,
  lang = "en",
  dir = "ltr",
}: {
  children: ReactNode;
  lang?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="legal-page" lang={lang} dir={dir}>
      <div className="legal-shell">
        <header className="legal-top">
          <Link className="legal-brand" href={routes.landing}>
            <img src={keyArt.philiaKey} alt="" width={22} height={22} />
            SocialFit
          </Link>
          <div className="legal-top-meta">P Labs FZE · UAE</div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function LegalHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
