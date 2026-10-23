import {
  HUB_NEXT_EYEBROW,
  HUB_NEXT_HEAD,
  HUB_NEXT_HEAR,
  HUB_NEXT_STEPS,
} from "@/lib/hub-next";

export function HubNextContent({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`hn-content${compact ? " is-compact" : ""}`}>
      <p className="hn-hear">{HUB_NEXT_HEAR}</p>
      <p className="hn-eyebrow">{HUB_NEXT_EYEBROW}</p>
      {compact ? (
        <h2 className="hn-head hn-head-sm">{HUB_NEXT_HEAD}</h2>
      ) : (
        <h1 className="cer-h hn-head">{HUB_NEXT_HEAD}</h1>
      )}
      <ol className="hn-steps">
        {HUB_NEXT_STEPS.map((step) => (
          <li key={step.n} className="hn-step">
            <p className="hn-n">{step.n}.</p>
            <div className="hn-step-copy">
              <p className="hn-title">{step.title}</p>
              <p className="hn-body">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
