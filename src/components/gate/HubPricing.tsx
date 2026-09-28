"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { videos } from "@/lib/assets";
import {
  isValidMembershipPackage,
  postMembershipChoice,
} from "@/lib/api/member";
import { applyMeToSession, writeSession, type MembershipChoice } from "@/lib/session";
import { membershipChoiceError, membershipPackageLabel } from "@/lib/hub";
import { routes } from "@/lib/routes";

const PC_ORDER = ["explorer", "insider", "catalyst"] as const;
const PC_STATES = ["is-front", "is-mid", "is-back"] as const;
const PC_DESCS: Record<(typeof PC_ORDER)[number], string> = {
  explorer: "Your first read, your self-perception layer, and your entry into SocialFit. No payment needed.",
  insider: "Activate your Philia ID, send Signals, and step into SocialFit properly. Month 1 complimentary if 3 Keys are claimed at launch.",
  catalyst: "For a more intentional, more active social life. Priority routing, advanced filters, full SocialFit dashboard.",
};

function Icon({ d }: { d: ReactNode }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

const I = {
  eye: (
    <>
      <circle cx="8" cy="8" r="2" />
      <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" />
    </>
  ),
  signal: (
    <>
      <path d="M2.5 12c1-2.5 3-4.5 5.5-4.5S12.5 9.5 13.5 12" />
      <path d="M5 12c.6-1.5 1.6-2.5 3-2.5s2.4 1 3 2.5" />
      <circle cx="8" cy="12.5" r="1" fill="currentColor" />
    </>
  ),
  door: (
    <>
      <rect x="3" y="3" width="10" height="11" rx="1.5" />
      <path d="M6 14V9.5h4V14" />
      <path d="M7.5 7a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0" />
    </>
  ),
  ticket: (
    <>
      <path d="M2 6a1.5 1.5 0 0 1 0 4v2h12v-2a1.5 1.5 0 0 1 0-4V4H2z" />
      <line x1="8" y1="4" x2="8" y2="12" strokeDasharray="2 2" />
    </>
  ),
  pod: (
    <>
      <polygon points="8,2 14,5.5 14,10.5 8,14 2,10.5 2,5.5" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" opacity=".5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="7.5" width="8" height="6.5" rx="1.5" />
      <path d="M5.5 7.5V5a2.5 2.5 0 0 1 5 0v2.5" />
    </>
  ),
  shield: (
    <>
      <path d="M8 2.5L3.5 4.5V9c0 2.5 2 4.5 4.5 5.5 2.5-1 4.5-3 4.5-5.5V4.5z" />
      <path d="M6 8.5l1.5 1.5 3-3" />
    </>
  ),
  star: (
    <>
      <path d="M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M3.5 3.5l1.8 1.8M10.7 10.7l1.8 1.8M3.5 12.5l1.8-1.8M10.7 5.3l1.8-1.8" />
    </>
  ),
  starFill: (
    <>
      <path d="M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M3.5 3.5l1.8 1.8M10.7 10.7l1.8 1.8M3.5 12.5l1.8-1.8M10.7 5.3l1.8-1.8" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </>
  ),
  up: <path d="M8 12V4M4 8l4-4 4 4" />,
  route: (
    <>
      <path d="M3 12h4a2 2 0 0 0 2-2V7" />
      <path d="M9 7l3-3m0 0h-3m3 0v3" />
      <circle cx="4.5" cy="12" r="1.5" />
    </>
  ),
  bars: (
    <>
      <rect x="2" y="9" width="3" height="5" rx=".8" />
      <rect x="6.5" y="5.5" width="3" height="8.5" rx=".8" />
      <rect x="11" y="2" width="3" height="12" rx=".8" />
    </>
  ),
};

export function HubPricing({
  choice,
  onChoice,
}: {
  choice: MembershipChoice | null;
  onChoice: (c: MembershipChoice) => void;
}) {
  const [active, setActive] = useState(2);
  const [billing, setBilling] = useState<{ insider: "annual" | "monthly"; catalyst: "annual" | "monthly" }>({
    insider: "annual",
    catalyst: "annual",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fillRef = useRef<HTMLDivElement | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!choice) return;
    if (choice.tier === "insider" || choice.tier === "catalyst") {
      setBilling((b) => ({ ...b, [choice.tier]: choice.billing_period === "monthly" ? "monthly" : "annual" }));
    }
  }, [choice]);

  useEffect(() => {
    let prog = 0;
    let held = false;
    const STEP = 40;
    const DUR = 3400;
    const reset = () => {
      prog = 0;
      const f = fillRef.current;
      if (f) {
        f.style.transition = "none";
        f.style.width = "0%";
      }
    };
    reset();
    const id = window.setInterval(() => {
      if (held) return;
      prog += (STEP / DUR) * 100;
      const f = fillRef.current;
      if (f) f.style.width = `${Math.min(prog, 100)}%`;
      if (prog >= 100) {
        reset();
        setActive((n) => (n + 1) % 3);
      }
    }, STEP);
    const zone = zoneRef.current;
    const down = () => {
      held = true;
    };
    const up = () => {
      held = false;
    };
    zone?.addEventListener("mousedown", down);
    zone?.addEventListener("mouseup", up);
    zone?.addEventListener("mouseleave", up);
    zone?.addEventListener("touchstart", down, { passive: true });
    zone?.addEventListener("touchend", up, { passive: true });
    return () => {
      window.clearInterval(id);
      zone?.removeEventListener("mousedown", down);
      zone?.removeEventListener("mouseup", up);
      zone?.removeEventListener("mouseleave", up);
      zone?.removeEventListener("touchstart", down);
      zone?.removeEventListener("touchend", up);
    };
  }, []);

  function tap(tier: (typeof PC_ORDER)[number]) {
    const idx = PC_ORDER.indexOf(tier);
    if (idx === active) return;
    setActive(idx);
  }

  function toggle(e: MouseEvent, tier: "insider" | "catalyst", plan: "annual" | "monthly") {
    e.stopPropagation();
    setBilling((b) => ({ ...b, [tier]: plan }));
  }

  async function choose(tier: (typeof PC_ORDER)[number], e: MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    const period = tier === "explorer" ? "none" : billing[tier];
    if (!isValidMembershipPackage(tier, period)) {
      setErr("That package isn't valid. Try another.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const r = await postMembershipChoice(tier, period);
      onChoice(r.membership_choice);
      writeSession({ membershipChoice: r.membership_choice });
      applyMeToSession({ membership_choice: r.membership_choice });
      window.location.assign(routes.hubMembership);
    } catch (error) {
      setErr(membershipChoiceError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="sty-hero" style={{ margin: "16px 22px 0", background: "linear-gradient(135deg,#0c0e18 0%,#12141e 55%,#1a1428 100%)" }}>
        <video autoPlay muted loop playsInline preload="auto">
          <source src={videos.cardFlip} type="video/mp4" />
        </video>
        <div className="cer1-vignette" />
        <div className="sty-chip" style={{ zIndex: 3 }}>
          <i />
          <span>Membership</span>
        </div>
      </div>

      <div className="cer-pad" style={{ paddingTop: 52, paddingBottom: 52 }}>
        <h1 className="cer-h" style={{ marginBottom: 12 }}>
          Find your level.
        </h1>
        <p className="cer-p" style={{ margin: 0 }}>
          Explorer is yours. Founding pricing locked for your first year once your Perception Mirror is complete. No payment today.
        </p>
        {choice ? (
          <p className="pc-recorded">
            Recorded: {membershipPackageLabel(choice)}. You can change this before payment.
          </p>
        ) : null}

        <div className="pc-deck-wrap" ref={zoneRef}>
          <div className="r-progress-bar">
            <div className="r-progress-fill" id="pcPF" ref={fillRef} />
          </div>
          <div className="pc-deck" id="pcDeck">
            <div
              className={`pc-card pc-explorer ${PC_STATES[(0 - active + 3) % 3]}`}
              onClick={() => tap("explorer")}
            >
              <div className="pc-card-inner">
                <div className="pc-top-row">
                  <p className="pc-eyebrow">See what is forming.</p>
                  <span className="pc-tier-pill">Explorer</span>
                </div>
                <div className="pc-billing-row pc-billing-single">
                  <div className="pc-billing-tile is-active">
                    <span className="pc-billing-label">No card needed</span>
                    <span className="pc-billing-free">Free</span>
                  </div>
                </div>
                <p className="pc-promise">Discover your SocialFit, send limited Signals and preview the network.</p>
                <div className="pc-feat-box">
                  <div className="pc-feat-row"><Icon d={I.eye} /><span>SocialFit Story</span></div>
                  <div className="pc-feat-row"><Icon d={I.signal} /><span>1 Signal / week</span></div>
                  <div className="pc-feat-row"><Icon d={I.door} /><span>Discoverable in network</span></div>
                  <div className="pc-feat-row"><Icon d={I.ticket} /><span>Access to ticketed events</span></div>
                  <div className="pc-feat-row"><Icon d={I.pod} /><span>Pod view, limited access</span></div>
                </div>
                <div className="pc-context">
                  <div className="pc-ctx-head">
                    <span className="pc-context-label">Upgrade to unlock</span>
                    <Icon d={I.lock} />
                  </div>
                  <div className="pc-ctx-row"><Icon d={I.shield} /><span>Government-verified Philia ID</span></div>
                  <div className="pc-ctx-row"><Icon d={I.star} /><span>SocialFit Signature events</span></div>
                  <div className="pc-ctx-row"><Icon d={I.door} /><span>Live member access</span></div>
                </div>
                <button className="pc-choose-btn" type="button" disabled={busy} onClick={(e) => choose("insider", e)}>
                  Upgrade membership
                </button>
              </div>
            </div>

            <div
              className={`pc-card pc-insider ${PC_STATES[(1 - active + 3) % 3]}`}
              onClick={() => tap("insider")}
            >
              <div className="pc-card-inner">
                <div className="pc-top-row">
                  <p className="pc-eyebrow">Step inside the network.</p>
                  <span className="pc-tier-pill">Insider</span>
                </div>
                <div className="pc-billing-row">
                  <div
                    className={`pc-billing-tile ${billing.insider === "annual" ? "is-active" : "is-alt"}`}
                    onClick={(e) => toggle(e, "insider", "annual")}
                  >
                    <span className="pc-billing-label">Annual</span>
                    <span className="pc-billing-aed">AED</span>
                    <div className="pc-billing-pricerow">
                      <span className="pc-billing-amount">50</span>
                      <span className="pc-billing-mo">/mo</span>
                    </div>
                    <span className="pc-billing-annual-total">AED 600 / yr · save AED 348</span>
                  </div>
                  <div
                    className={`pc-billing-tile ${billing.insider === "monthly" ? "is-active" : "is-alt"}`}
                    onClick={(e) => toggle(e, "insider", "monthly")}
                  >
                    <span className="pc-billing-label">Monthly</span>
                    <span className="pc-billing-aed">AED</span>
                    <div className="pc-billing-pricerow">
                      <span className="pc-billing-amount">79</span>
                      <span className="pc-billing-mo">/mo</span>
                    </div>
                  </div>
                </div>
                <p className="pc-promise">Get your government-verified Philia ID, access Signature SocialFit events and turn Signals into real Rooms and plans.</p>
                <div className="pc-feat-box">
                  <div className="pc-feat-row"><Icon d={I.shield} /><span>Government-verified Philia ID</span></div>
                  <div className="pc-feat-row"><Icon d={I.signal} /><span>8 Signals / month</span><span className="pc-vs">vs 4 in Explorer</span></div>
                  <div className="pc-feat-row"><Icon d={I.starFill} /><span>Members exclusive discounted events</span></div>
                  <div className="pc-feat-row"><Icon d={I.star} /><span>SocialFit Signature events</span></div>
                  <div className="pc-feat-row"><Icon d={I.door} /><span>SocialFit Room hosting privileges</span></div>
                  <div className="pc-feat-row"><Icon d={I.pod} /><span>Full pod access</span></div>
                </div>
                <div className="pc-context">
                  <div className="pc-ctx-head">
                    <span className="pc-context-label">Catalyst adds</span>
                    <Icon d={I.up} />
                  </div>
                  <div className="pc-ctx-row"><Icon d={I.signal} /><span>20 Signals / month</span></div>
                  <div className="pc-ctx-row"><Icon d={I.route} /><span>Priority routing</span></div>
                  <div className="pc-ctx-row"><Icon d={I.bars} /><span>Full SocialFit dashboard</span></div>
                </div>
                <span className="pc-badge">✓ &nbsp;Month 1 complimentary if 3 Keys claimed</span>
                <button className="pc-choose-btn" type="button" disabled={busy} onClick={(e) => choose("insider", e)}>
                  {billing.insider === "annual" ? "Choose annual" : "Choose monthly"}
                </button>
              </div>
            </div>

            <div
              className={`pc-card pc-catalyst ${PC_STATES[(2 - active + 3) % 3]}`}
              onClick={() => tap("catalyst")}
            >
              <div className="pc-card-inner">
                <div className="pc-top-row">
                  <p className="pc-eyebrow">Move through SocialFit with more agency.</p>
                  <span className="pc-tier-pill">Catalyst</span>
                </div>
                <div className="pc-billing-row">
                  <div
                    className={`pc-billing-tile ${billing.catalyst === "annual" ? "is-active" : "is-alt"}`}
                    onClick={(e) => toggle(e, "catalyst", "annual")}
                  >
                    <span className="pc-billing-label">Annual</span>
                    <span className="pc-billing-aed">AED</span>
                    <div className="pc-billing-pricerow">
                      <span className="pc-billing-amount">150</span>
                      <span className="pc-billing-mo">/mo</span>
                    </div>
                    <span className="pc-billing-annual-total">AED 1,800 / yr · save AED 228</span>
                  </div>
                  <div
                    className={`pc-billing-tile ${billing.catalyst === "monthly" ? "is-active" : "is-alt"}`}
                    onClick={(e) => toggle(e, "catalyst", "monthly")}
                  >
                    <span className="pc-billing-label">Monthly</span>
                    <span className="pc-billing-aed">AED</span>
                    <div className="pc-billing-pricerow">
                      <span className="pc-billing-amount">169</span>
                      <span className="pc-billing-mo">/mo</span>
                    </div>
                  </div>
                </div>
                <p className="pc-promise">Everything in Insider, with more Signals, priority routing and the full SocialFit dashboard.</p>
                <div className="pc-feat-box">
                  <div className="pc-feat-row"><Icon d={I.shield} /><span>Government-verified Philia ID</span></div>
                  <div className="pc-feat-row"><Icon d={I.signal} /><span>20 Signals / month</span><span className="pc-vs">vs 8 in Insider</span></div>
                  <div className="pc-feat-row"><Icon d={I.starFill} /><span>Members exclusive discounted events</span></div>
                  <div className="pc-feat-row"><Icon d={I.star} /><span>SocialFit Signature events</span></div>
                  <div className="pc-feat-row"><Icon d={I.door} /><span>SocialFit Room hosting privileges</span></div>
                  <div className="pc-feat-row"><Icon d={I.pod} /><span>Full pod access</span></div>
                  <div className="pc-feat-row"><Icon d={I.route} /><span>Priority routing</span></div>
                  <div className="pc-feat-row"><Icon d={I.bars} /><span>Full SocialFit dashboard</span></div>
                </div>
                <button className="pc-choose-btn" type="button" disabled={busy} onClick={(e) => choose("catalyst", e)}>
                  {billing.catalyst === "annual" ? "Choose annual" : "Choose monthly"}
                </button>
              </div>
            </div>
          </div>

          <p className="cer3-deck-desc" style={{ transition: "opacity .2s ease" }}>
            {PC_DESCS[PC_ORDER[active]]}
          </p>
          {err ? <p className="pc-choice-err">{err}</p> : null}

          <div className="cer3-nav">
            <div className="deck-dots">
              {(["Explorer", "Insider", "Catalyst"] as const).map((label, i) => (
                <button
                  key={label}
                  className={`deck-dot${i === active ? " is-active" : ""}`}
                  type="button"
                  onClick={() => tap(PC_ORDER[i])}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
