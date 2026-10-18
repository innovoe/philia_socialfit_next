export function ctaStateClass(busy: boolean, enabled = true) {
  if (busy) return " is-busy";
  if (!enabled) return " is-wait";
  return "";
}

export function CtaEnd({ busy }: { busy: boolean }) {
  if (busy) {
    return <span className="cta-spinner" aria-hidden="true" />;
  }
  return <span>→</span>;
}
