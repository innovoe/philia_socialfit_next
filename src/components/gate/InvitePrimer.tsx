"use client";

import { useEffect, useState, type ReactNode } from "react";
import { videos } from "@/lib/assets";
import {
  formatClaimClock,
  inviteOwnerName,
  isInviteSession,
  sentenceStartName,
} from "@/lib/invite";
import { readSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export function InvitePrimer() {
  const [ready, setReady] = useState(false);
  const [from, setFrom] = useState("A friend");
  const [clock, setClock] = useState("—");
  const [openAcc, setOpenAcc] = useState(false);
  const [openFrame, setOpenFrame] = useState<number | null>(null);

  useEffect(() => {
    const s = readSession();
    if (!isInviteSession() || s.keyId == null) {
      window.location.replace(routes.invite);
      return;
    }
    if (!s.mirrorAnswered) {
      window.location.replace(routes.inviteMirror);
      return;
    }
    setFrom(inviteOwnerName());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    function tick() {
      setClock(formatClaimClock(readSession().claimDeadline));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [ready]);

  if (!ready) return null;

  return (
    <main id="sPrimer">
      <header className="inv-primer-top">
        <span>Philia Life</span>
        <span>Dubai · First Wave</span>
      </header>
      <section className="inv-primer-wrap">
        <div>
          <div className="inv-primer-super">Thank you</div>
          <h1 className="inv-primer-h">
            Your reflection is in.
            <br />
            Welcome to SocialFit.
          </h1>
          <div className="inv-primer-rule" />
          <p className="inv-primer-p">
            <strong>A new way to get your keys to the city.</strong>
          </p>
          <p className="inv-primer-p">
            {sentenceStartName(from)} sent you a Philia Key. It isn’t a referral code. It’s a trust
            object, passed person to person, that opens an invite-only network built around real
            relationships.
          </p>
          <div className="inv-film-card">
            <div className="inv-film-stage">
              <video
                className="inv-film"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="People across Dubai passing Philia Keys through trusted introductions"
              >
                <source src={videos.keysToTheCity} type="video/mp4" />
              </video>
            </div>
            <div className="inv-film-caption">
              The Key moves through people, across generations and worlds, opening trusted pathways
              into the city.
            </div>
          </div>
          <p className="inv-primer-p">
            Inside, SocialFit helps you find better-fit people, rooms and experiences through trust,
            context and real friend-of-a-friend pathways.
          </p>
          <div className={`inv-sf-acc${openAcc ? " open" : ""}`}>
            <button
              className="inv-sf-trigger"
              type="button"
              aria-expanded={openAcc}
              onClick={() => setOpenAcc((v) => !v)}
            >
              <span className="inv-sf-q">What is SocialFit?</span>
              <span className="inv-sf-icon" aria-hidden="true">
                +
              </span>
            </button>
            <div className="inv-sf-panel">
              <p
                style={{
                  margin: "2px 0 10px",
                  fontFamily: "Inter,system-ui,sans-serif",
                  fontSize: "12.5px",
                  lineHeight: 1.55,
                  fontWeight: 300,
                  color: "#74788a",
                }}
              >
                Three ideas explain it. You can skim them here, or open any one for more.
              </p>
              <PrimerFrame
                open={openFrame === 0}
                onToggle={() => setOpenFrame((cur) => (cur === 0 ? null : 0))}
                kicker="01 · The promise"
                summary={
                  <>
                    <strong>Home is not measured in bricks, space or years.</strong> It grows
                    through the people, places and shared rhythms that make a life feel truly yours.
                  </>
                }
                icon={
                  <svg className="inv-sf-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <path
                      d="M7 18.5C7 11.9 11.7 7 18 7s11 4.9 11 11.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10.5 18.5C10.5 14 13.5 10.7 18 10.7s7.5 3.3 7.5 7.8"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      opacity=".65"
                    />
                    <path
                      d="M7 18.5V29h22V18.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                      opacity=".45"
                    />
                  </svg>
                }
              >
                <p className="inv-sf-copy">
                  It is felt in the moments when you feel held: in a warm hug you can return to, no
                  matter how far you roam.
                </p>
                <p className="inv-sf-copy">
                  SocialFit helps you deepen your roots in Dubai and opens up the connections,
                  experiences and possibilities that give you the wings to flourish.
                </p>
              </PrimerFrame>
              <PrimerFrame
                open={openFrame === 1}
                onToggle={() => setOpenFrame((cur) => (cur === 1 ? null : 1))}
                kicker="02 · The intelligence"
                summary={
                  <>
                    <strong>A trust graph for real life.</strong> SocialFit looks for the
                    combinations of people, places and experiences most likely to become meaningful
                    for you.
                  </>
                }
                icon={
                  <svg className="inv-sf-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <circle cx="8" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="18" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="28" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="18" cy="27" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                    <path
                      d="M9.8 16.4L16.3 10.6M19.7 10.6L26.2 16.4M26.2 19.6L19.7 25.4M16.3 25.4L9.8 19.6"
                      stroke="currentColor"
                      strokeWidth="1.1"
                      opacity=".72"
                    />
                    <path
                      d="M10.2 18H25.8M18 11.2V24.8"
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity=".35"
                    />
                  </svg>
                }
              >
                <p className="inv-sf-copy">
                  It learns patterns across people, communities, places and experiences, then
                  follows real friend-of-a-friend pathways to understand where trust and fit already
                  have a foundation.
                </p>
                <p className="inv-sf-copy">
                  Instead of making you swipe through strangers or search endless listings, it can
                  surface people, rooms and moments with context behind them.
                </p>
              </PrimerFrame>
              <PrimerFrame
                open={openFrame === 2}
                onToggle={() => setOpenFrame((cur) => (cur === 2 ? null : 2))}
                kicker="03 · The possibility"
                summary={
                  <>
                    <strong>Not another community. The fabric between them.</strong> A way into
                    circles, rituals and experiences that might otherwise remain outside your world.
                  </>
                }
                icon={
                  <svg className="inv-sf-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <path
                      d="M6.5 12.5C10 12.5 11.3 15.2 14.2 15.2C17.1 15.2 18.2 11.2 21.1 11.2C24 11.2 25.2 14 29.5 14"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6.5 21.2C10 21.2 11.3 18.5 14.2 18.5C17.1 18.5 18.2 22.5 21.1 22.5C24 22.5 25.2 19.7 29.5 19.7"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      opacity=".72"
                    />
                    <path
                      d="M6.5 25.5C10.5 25.5 12 28 15.1 28C18.2 28 19.1 24.5 22.1 24.5C25.1 24.5 26.1 27 29.5 27"
                      stroke="currentColor"
                      strokeWidth="1.05"
                      strokeLinecap="round"
                      opacity=".38"
                    />
                  </svg>
                }
              >
                <p className="inv-sf-copy">
                  Dubai already has extraordinary people and communities. Many simply sit apart from
                  one another, separated by routine, geography or social circles.
                </p>
                <p className="inv-sf-copy">
                  SocialFit creates pathways between them, giving the city a social layer with the
                  breadth of Dubai and the intimacy of a trusted introduction.
                </p>
              </PrimerFrame>
              <p className="inv-sf-tagline">The intelligence finds the fit, people create the belonging.</p>
            </div>
          </div>
          <div className="inv-key-card">
            <p className="inv-key-card-label">Your Key is now in play</p>
            <p className="inv-key-card-p">
              You can finish your SocialFit onboarding in about <strong>30 minutes</strong> if you
              want to keep going. But life has commitments, so we give you breathing room.
            </p>
            <p className="inv-key-card-p">
              Onboarding unfolds through <strong>three timed stages</strong>. Accepting this Key has
              a <strong>48-hour window</strong>. After that, Story and sending Keys each get a fresh
              24-hour clock.
            </p>
            <div className="inv-stage-map" aria-label="Three-stage SocialFit onboarding">
              <div className="inv-stage-item">
                <div className="inv-stage-num">01</div>
                <div>
                  <p className="inv-stage-name">Enter</p>
                  <p className="inv-stage-sub">Meet SocialFit and complete UAE mobile OTP verification.</p>
                  <span className="inv-stage-now">Your stage now</span>
                </div>
                <div className="inv-stage-limit">48 hrs</div>
              </div>
              <div className="inv-stage-item">
                <div className="inv-stage-num">02</div>
                <div>
                  <p className="inv-stage-name">Build</p>
                  <p className="inv-stage-sub">Build your social story.</p>
                </div>
                <div className="inv-stage-limit">24 hrs</div>
              </div>
              <div className="inv-stage-item">
                <div className="inv-stage-num">03</div>
                <div>
                  <p className="inv-stage-name">Become visible</p>
                  <p className="inv-stage-sub">Your Philia ID comes into focus.</p>
                </div>
                <div className="inv-stage-limit">24 hrs</div>
              </div>
            </div>
            <div className="inv-stage-rule" />
            <p className="inv-key-card-p">
              <strong>Stage 1 starts now.</strong> Complete through{" "}
              <strong>UAE mobile OTP verification</strong> before this first window closes.
            </p>
            <div className="inv-timer">
              <p className="inv-timer-label">Time left to claim this Key</p>
              <p className="inv-time">{clock}</p>
              <p className="inv-timer-note">
                If this clock reaches zero, the Key returns to {from}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PrimerFrame({
  open,
  onToggle,
  kicker,
  summary,
  icon,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  kicker: string;
  summary: ReactNode;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`inv-sf-frame${open ? " open" : ""}`}>
      <button
        className="inv-sf-frame-trigger"
        type="button"
        aria-expanded={open}
        onClick={onToggle}
      >
        {icon}
        <span>
          <span className="inv-sf-kicker">{kicker}</span>
          <span className="inv-sf-summary">{summary}</span>
        </span>
        <span className="inv-sf-plus" aria-hidden="true">
          +
        </span>
      </button>
      <div className="inv-sf-frame-panel">
        <div className="inv-sf-body">{children}</div>
      </div>
    </div>
  );
}
