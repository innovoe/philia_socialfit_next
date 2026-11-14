export function ctaStateClass(busy: boolean, enabled = true) {
  if (busy) return " is-busy";
  if (!enabled) return " is-wait";
  return "";
}

/** Arrow for CTAs with the pulsing blue dot: head sits inside the dot, same level. */
export function CtaDotArrow() {
  return (
    <svg className="cta-arrow-in-dot" viewBox="0 0 14 10" aria-hidden="true">
      <path d="M0.8 5H9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 1.2L13.6 5L8 8.8Z" fill="#fff" />
    </svg>
  );
}

export function CtaEnd({ busy }: { busy: boolean }) {
  if (busy) {
    return <span className="cta-spinner" aria-hidden="true" />;
  }
  return <span>→</span>;
}
