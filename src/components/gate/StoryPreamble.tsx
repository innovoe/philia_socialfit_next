"use client";

import { useEffect, useRef, useState } from "react";
import { videos } from "@/lib/assets";
import { isSessionExpiring, requireMemberAccess } from "@/lib/expire";
import { hasFinishedStory } from "@/lib/session";
import { routes } from "@/lib/routes";
import { STORY_SECTIONS, isFilled } from "@/lib/story-data";
import { computeResume, hydrateAnswersFromServer, resumeUrl } from "@/lib/story-answers";
import { CtaEnd } from "@/components/gate/CtaEnd";

export function StoryPreamble() {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!requireMemberAccess()) return;
    let cancelled = false;
    hydrateAnswersFromServer()
      .then((answers) => {
        if (cancelled || isSessionExpiring()) return;
        if (hasFinishedStory()) {
          window.location.replace(`${routes.story}/1`);
          return;
        }
        if (Object.keys(answers).some((k) => isFilled(answers[k]))) {
          window.location.replace(resumeUrl(computeResume(answers)));
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (isSessionExpiring()) return;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) vid.play().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <main className="sty-screen sty-story">
      <div className="sty-topbar">
        <span>Philia</span>
        <span>SocialFit Story</span>
        <span>Before</span>
      </div>
      <div className="sty-scroll-body">
        <div
          className="sty-hero"
          id="storyHero"
          style={{ background: STORY_SECTIONS[0].bg }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            loop
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <source src={videos.storyBg} type="video/mp4" />
          </video>
          <div className="sty-hero-vignette" />
          <div className="sty-chip">
            <i />
            <span>StoryBuilder</span>
          </div>
        </div>
        <div className="sty-ed-content" style={{ paddingTop: 28 }}>
          <h1 className="sty-preamble-title">The architecture of real alignment.</h1>
          <p className="sty-preamble-p">
            SocialFit is built on precision, not volume. To connect you with rooms, circles, and
            individuals who genuinely reflect your wavelength, our matching engine requires depth
            rather than surface data points.
          </p>
          <p className="sty-preamble-p">
            This onboarding conversation is designed to understand how you navigate your world, your
            rhythms, and your intentions. Take your time with it. Every nuance you share is the
            calibration key that ensures your experience remains entirely signal, zero noise.
          </p>
        </div>
      </div>
      <div className="sty-ed-footer">
        <button
          className="sty-ed-back on"
          type="button"
          onClick={() => window.location.assign(routes.verified)}
        >
          ← Back
        </button>
        <p className="sty-ed-helper" />
        <button
          className={`sty-ed-continue on${leaving ? " is-busy" : ""}`}
          type="button"
          disabled={leaving}
          aria-busy={leaving}
          onClick={() => {
            if (leaving) return;
            setLeaving(true);
            window.location.assign(`${routes.story}/1`);
          }}
        >
          {leaving ? "One moment…" : "Begin"}
          <CtaEnd busy={leaving} />
        </button>
      </div>
    </main>
  );
}
