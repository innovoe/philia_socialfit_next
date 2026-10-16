import Link from "next/link";
import { routes } from "@/lib/routes";

type Lang = "en" | "ar";

export function PrivacyLangSwitch({ current }: { current: Lang }) {
  const en = current === "en";
  const ar = current === "ar";

  return (
    <nav className="legal-lang" aria-label="Privacy policy language" dir="ltr">
      {en ? (
        <span className="is-current is-en">English</span>
      ) : (
        <Link href={routes.privacy} className="is-en">
          English
        </Link>
      )}
      <span aria-hidden="true">·</span>
      {ar ? (
        <span className="is-current" lang="ar" dir="rtl">
          العربية
        </span>
      ) : (
        <Link href={routes.privacyAr} lang="ar" dir="rtl">
          العربية
        </Link>
      )}
    </nav>
  );
}
