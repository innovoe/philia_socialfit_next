"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { videos } from "@/lib/assets";
import {
  applyMeToSession,
  readSession,
  writeSession,
  type MembershipChoice,
} from "@/lib/session";
import { getMe, getMirror, type Me, type Mirror } from "@/lib/api/member";
import {
  createKeyRequest,
  getKeyRequests,
  getMyKeys,
  outboundClockMs,
  type KeyRequest,
  type OutboundKey,
} from "@/lib/api/keys";
import { isApiError } from "@/lib/api/errors";
import {
  canOfferExtraKeyRequest,
  countSentKeys,
  formatHubCountdown,
  formatHubWindow,
  goLogout,
  HUB_POLL_MS,
  hubArchetypeLabel,
  hubKeysSnapshot,
  hubSegFilled,
  keyRequestCopy,
  keyRequestCtaLabel,
  soonestKeyDeadline,
} from "@/lib/hub";
import { routes } from "@/lib/routes";
import { HubPricing } from "@/components/gate/HubPricing";
import { SocialFabric } from "@/components/gate/SocialFabric";

function keyDisplayName(k: OutboundKey) {
  const slot = k.slot || 0;
  let name = (k.nominee_name && String(k.nominee_name).trim()) || `Key ${String(slot).padStart(2, "0")}`;
  if (
    k.claimer_name &&
    k.nominee_name &&
    String(k.claimer_name).trim() !== String(k.nominee_name).trim()
  ) {
    name = `${String(k.nominee_name).trim()} · ${String(k.claimer_name).trim()}`;
  }
  return name;
}

function HubKeyCard({
  k,
  now,
  helpOpen,
  onHelp,
}: {
  k: OutboundKey;
  now: number;
  helpOpen: boolean;
  onHelp: () => void;
}) {
  const slot = k.slot || 0;
  const state = k.state === "available" ? "allocated" : k.state || "allocated";
  const name = keyDisplayName(k);
  const unsent = state === "allocated";
  const deadline = outboundClockMs(k);
  const countdown = deadline ? formatHubCountdown(deadline) : "";

  function onCta() {
    if (unsent && Number(slot) <= 3) {
      window.location.assign(routes.ceremonyKeys);
      return;
    }
    if (state === "claimed" || state === "answered") {
      const nudge = encodeURIComponent(`Hey ${name} — gentle nudge on your Philia Key.`);
      window.open(`https://wa.me/?text=${nudge}`, "_blank");
    }
  }

  let ctaLabel = "View →";
  let ctaClass = "cer7-key-cta-ed muted";
  if (unsent) {
    ctaLabel = "Nominate →";
    ctaClass = "cer7-key-cta-ed dark";
  } else if (state === "sent") {
    ctaLabel = "Awaiting →";
    ctaClass = "cer7-key-cta-ed muted";
  } else if (state === "claimed" || state === "answered") {
    ctaLabel = "Nudge →";
    ctaClass = "cer7-key-cta-ed";
  }

  let tickerLabel: ReactNode = "Key sent";
  if (unsent) {
    tickerLabel = deadline ? (
      <>
        Send window: <span>{countdown}</span> remaining
      </>
    ) : (
      "Ready to send"
    );
  } else if (state === "activated") {
    tickerLabel = "Key activated";
  } else if (deadline) {
    tickerLabel = (
      <>
        Claim window{" "}
        <span className="win-help-wrap">
          <button
            type="button"
            className="win-help"
            aria-label="What is the claim window?"
            aria-expanded={helpOpen}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHelp();
            }}
          >
            ?
          </button>
          <span className="win-help-tip" hidden={!helpOpen}>
            The amount of time your friend has to claim the key you share.
          </span>
        </span>
        : <span>{countdown}</span> remaining
      </>
    );
  }

  void now;

  return (
    <div className="cer7-key-card" data-key-id={k.key_id != null ? k.key_id : ""}>
      <div className="cer7-key-row">
        <p className={`cer7-key-name-ed${unsent ? " unsent" : ""}`}>{name}</p>
        <button className={ctaClass} type="button" onClick={onCta}>
          {ctaLabel}
        </button>
      </div>
      <p className={`cer7-key-ticker ${unsent ? "cer7-ticker-unsent" : "cer7-ticker-sent"}`}>
        <span className="cer7-ticker-dot" />
        {tickerLabel}
      </p>
      <div className="cer7-seg-track">
        {(["sent", "claimed", "answered", "activated"] as const).map((stage) => (
          <div className="cer7-seg" key={stage}>
            <div className={`cer7-seg-bar${hubSegFilled(state, stage) ? " filled" : ""}`} />
            <span className="cer7-seg-lbl">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HubScreen({ initialTab = 1 }: { initialTab?: 1 | 2 | 3 }) {
  const [tab, setTab] = useState<1 | 2 | 3>(initialTab);
  const [keys, setKeys] = useState<OutboundKey[] | null>(null);
  const [mirror, setMirror] = useState<Mirror | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [request, setRequest] = useState<KeyRequest | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestErr, setRequestErr] = useState("");
  const [requestJustSent, setRequestJustSent] = useState(false);
  const [unlockOn, setUnlockOn] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [helpSlot, setHelpSlot] = useState<number | null>(null);
  const [choice, setChoice] = useState<MembershipChoice | null>(() => readSession().membershipChoice);
  const snapRef = useRef("");
  const keysRef = useRef<OutboundKey[]>([]);

  const refresh = useCallback(async (silent: boolean) => {
    try {
      const [nextKeys, nextMirror, nextMe] = await Promise.all([
        getMyKeys().catch(() => [] as OutboundKey[]),
        getMirror().catch(() => null),
        getMe().catch(() => null),
      ]);
      if (nextMe) {
        applyMeToSession(nextMe);
        setMe(nextMe);
        if (nextMe.membership_choice) {
          writeSession({ membershipChoice: nextMe.membership_choice });
          setChoice(nextMe.membership_choice);
        }
      }
      if (nextMirror) setMirror(nextMirror);
      const list = (nextKeys || []).slice().sort((a, b) => (a.slot || 0) - (b.slot || 0));
      const snap = hubKeysSnapshot(list, nextMirror);
      if (silent && snap === snapRef.current && keysRef.current.length) {
        /* keep countdown smooth */
      } else {
        snapRef.current = snap;
        keysRef.current = list;
        setKeys(list);
      }
      if (canOfferExtraKeyRequest(list, nextMe)) {
        try {
          const reqs = await getKeyRequests();
          setRequest(reqs[0] || null);
        } catch (err) {
          const code = isApiError(err) ? err.code : "";
          if (code === "not_explorer") setRequest(null);
        }
      } else {
        setRequest(null);
      }
    } catch {
      if (!silent && keysRef.current.length === 0) setKeys([]);
    }
  }, []);

  useEffect(() => {
    refresh(false);
    const poll = window.setInterval(() => refresh(true), HUB_POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [refresh]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest(".win-help-wrap")) return;
      setHelpSlot(null);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function onRequest() {
    setRequestBusy(true);
    setRequestErr("");
    try {
      await createKeyRequest("");
      const reqs = await getKeyRequests();
      setRequest(reqs[0] || { status: "pending" });
      setRequestJustSent(true);
    } catch (err) {
      const code = isApiError(err) ? err.code : "";
      if (code === "request_pending") {
        setRequestJustSent(false);
        try {
          const reqs = await getKeyRequests();
          setRequest(reqs[0] || { status: "pending" });
        } catch {
          /* keep */
        }
      } else {
        setRequestErr(code === "not_explorer" ? "Available after you finish Origins." : "Could not send — try again.");
        if (code === "not_explorer") setRequest(null);
      }
    } finally {
      setRequestBusy(false);
    }
  }

  const list = keys || [];
  const sent = countSentKeys(list);
  const archSrc = mirror
    ? mirror.archetypes || mirror.archetype || mirror.social_archetype || mirror.leading_archetype
    : null;
  const archLabel = hubArchetypeLabel(archSrc);
  const mirrors = typeof mirror?.responses_count === "number" ? mirror.responses_count : 0;
  const windowMs = soonestKeyDeadline(list);
  const showRequest = keys !== null && canOfferExtraKeyRequest(list, me);
  const reqStatus = String(request?.status || "").toLowerCase();
  const reqCopy = keyRequestCopy(reqStatus, requestJustSent);
  const reqLocked = requestBusy || reqStatus === "pending" || reqStatus === "granted";

  return (
    <main id="sCer7" className="screen active">
      <div className="cer-topbar">
        <span className="cer-top-l">Philia Life</span>
        <span className="cer-top-c">SocialFit</span>
        <button type="button" className="cer-top-logout" onClick={goLogout}>
          Log out
        </button>
      </div>

      <div className="cer7-tab-bar">
        <button className={`cer7-tab${tab === 1 ? " is-active" : ""}`} type="button" onClick={() => setTab(1)}>
          Key Drop Tracker
        </button>
        <button className={`cer7-tab${tab === 2 ? " is-active" : ""}`} type="button" onClick={() => setTab(2)}>
          While You Wait
        </button>
        <button className={`cer7-tab${tab === 3 ? " is-active" : ""}`} type="button" onClick={() => setTab(3)}>
          Pricing
        </button>
      </div>

      <div className={`cer7-panel${tab === 1 ? " is-active" : ""}`} id="cer7Panel1">
        <div className="sty-hero" style={{ margin: "16px 22px 0", background: "#0e0e1a" }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          >
            <source src={videos.frame32} type="video/mp4" />
          </video>
          <div className="cer1-vignette" />
          <div className="sty-chip" style={{ zIndex: 3 }}>
            <i style={{ background: "#5e77fd", boxShadow: "0 0 8px rgba(94,119,253,.80)" }} />
            <span>SocialFit Key Status</span>
          </div>
        </div>

        <div className="cer-pad" style={{ paddingTop: 20, paddingBottom: 52 }}>
          <div className="cer7-stat-bar-wrap">
            <div className="cer7-stat-bar">
              <div className="cer7-stat-col">
                <div className="cer7-stat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <p className="cer7-stat-lbl">Archetype</p>
                <p
                  className="cer7-stat-val"
                  style={archLabel ? undefined : { fontSize: 14, color: "rgba(32,32,52,.35)", fontWeight: 400, letterSpacing: 0 }}
                >
                  {archLabel || "pending"}
                </p>
              </div>
              <div className="cer7-stat-sep" />
              <div className="cer7-stat-col">
                <div className="cer7-stat-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </div>
                <p className="cer7-stat-lbl">Keys Sent</p>
                <p className="cer7-stat-val">
                  {sent}/{Math.max(list.length, 3)}
                </p>
              </div>
              <div className="cer7-stat-sep" />
              <div className="cer7-stat-col">
                <div className="cer7-stat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="6" r="3" />
                    <path d="M1 20v-1a5 5 0 0 1 5-5h2" />
                    <circle cx="17" cy="6" r="3" />
                    <path d="M23 20v-1a5 5 0 0 0-5-5h-2" />
                  </svg>
                </div>
                <p className="cer7-stat-lbl">Mirrors</p>
                <p className="cer7-stat-val">{mirrors}/3</p>
              </div>
              <div className="cer7-stat-sep" />
              <div className="cer7-stat-col">
                <div className="cer7-stat-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12,7 12,12 15,15" />
                  </svg>
                </div>
                <p className="cer7-stat-lbl">Window</p>
                <p className="cer7-stat-val">{formatHubWindow(windowMs)}</p>
              </div>
            </div>
          </div>

          <div className="cer7-tracker">
            {keys === null ? (
              <p className="cer-p" style={{ margin: 0, opacity: 0.5 }}>
                Loading your Keys…
              </p>
            ) : list.length === 0 ? (
              <p className="cer-p" style={{ margin: 0, opacity: 0.55 }}>
                No Keys allocated yet. Finish Explorer activate to receive your 3 Keys.
              </p>
            ) : (
              list.map((k) => (
                <HubKeyCard
                  key={k.key_id ?? k.slot}
                  k={k}
                  now={now}
                  helpOpen={helpSlot === (k.slot || 0)}
                  onHelp={() => setHelpSlot((cur) => (cur === (k.slot || 0) ? null : k.slot || 0))}
                />
              ))
            )}
          </div>

          {showRequest ? (
            <div className={`cer7-key-card key-request${reqStatus === "pending" || reqStatus === "granted" ? " is-pending" : ""}`}>
              <div className="cer7-key-row">
                <p className="cer7-key-name-ed">{reqCopy.title}</p>
                <button
                  type="button"
                  className="cer7-key-cta-ed dark key-request-link"
                  disabled={reqLocked}
                  onClick={onRequest}
                >
                  {requestBusy ? "Sending…" : keyRequestCtaLabel(reqStatus)}
                </button>
              </div>
              <p className="key-request-copy">{reqCopy.body}</p>
              <p className="key-request-status">
                {requestErr ||
                  (reqStatus === "declined"
                    ? (request?.decline_reason && String(request.decline_reason).trim()) ||
                      "This request was declined. You can ask again."
                    : "")}
              </p>
            </div>
          ) : null}

          <div className="cer7-insider-card">
            <div className="cer7-insider-body-ed">
              <p className="cer7-insider-title-ed">Insider complimentary for month 1 unlocks at launch.</p>
            </div>
            <div
              className={`cer7-unlock-cb${unlockOn ? " checked" : ""}`}
              id="cer7UnlockCb"
              onClick={() => setUnlockOn((v) => !v)}
            >
              <div className="cer7-unlock-ring">
                <svg viewBox="0 0 24 24">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <span className="cer7-unlock-lbl">{unlockOn ? "Understood" : "Got it"}</span>
            </div>
          </div>

          <div className="cer7-tier-card-wrap">
            <div className="cer7-tier-card">
              <p
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: 7,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "rgba(32,32,52,.38)",
                  margin: "0 0 12px",
                }}
              >
                Membership Tiers
              </p>
              <div className="cer7-tier-track">
                <div className="cer7-tier-col is-current">
                  <span className="cer7-tier-lbl">Explorer</span>
                  <div className="cer7-tier-bar is-filled" />
                  <div className="cer7-tier-you">
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <polyline points="2,7 5,3 8,7" />
                    </svg>
                    You
                  </div>
                </div>
                <div className="cer7-tier-col is-next">
                  <span className="cer7-tier-lbl">
                    Insider
                    <span className="cer7-tier-blink-arrow" />
                  </span>
                  <div className="cer7-tier-bar" />
                  <span className="cer7-tier-next">Unlocks next</span>
                </div>
                <div className="cer7-tier-col">
                  <span className="cer7-tier-lbl">Catalyst</span>
                  <div className="cer7-tier-bar" />
                </div>
              </div>
              <div className="cer7-tier-footer">
                <button className="cer7-key-cta-ed dark" type="button" onClick={() => setTab(3)}>
                  View pricing →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`cer7-panel${tab === 2 ? " is-active" : ""}`} id="cer7Panel2">
        <SocialFabric active={tab === 2} />
      </div>

      <div className={`cer7-panel${tab === 3 ? " is-active" : ""}`} id="cer7Panel3">
        <HubPricing choice={choice} onChoice={setChoice} />
      </div>
    </main>
  );
}
