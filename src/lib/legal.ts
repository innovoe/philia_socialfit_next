import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readLegalHtml(name: "privacy-en" | "terms-en") {
  return readFileSync(
    join(process.cwd(), "src/content/legal", `${name}.html`),
    "utf8",
  );
}
