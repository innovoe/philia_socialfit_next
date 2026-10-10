"use client";

import { useEffect, useMemo, useState } from "react";
import { videos } from "@/lib/assets";
import { activateExplorer, getMe } from "@/lib/api/member";
import {
  applyPassportToSession,
  ceremonyUrlForStep,
  gateIncompleteStory,
  handleActivateError,
  persistCeremonyStep,
} from "@/lib/ceremony";
import { isSessionExpiring, requireMemberAccess } from "@/lib/expire";
import { applyMeToSession, normalizeCeremonyStep, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { firstIncomplete, leadCap, STORY_SECTIONS, type StoryAnswers } from "@/lib/story-data";
import { hydrateAnswersFromServer } from "@/lib/story-answers";

export default function CeremonySummaryPage() {
  const [answers, setAnswers] = useState<StoryAnswers | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!requireMemberAccess()) return;
    hydrateAnswersFromServer()
      .then(async (next) => {
        if (isSessionExpiring()) return;
        const late = firstIncomplete(STORY_SECTIONS, next, 3);
        if (late != null) {
          window.location.replace(`${routes.story}/${late + 1}`);
          return;
        }
        try {
          const me = await getMe();
          applyMeToSession(me);
          const step = normalizeCeremonyStep(me.ceremony_step);
          if (step === "id" || step === "keys" || step === "hub") {
            persistCeremonyStep(step);
            writeSession({ explorerReady: true, hubUnlocked: step === "hub" });
            window.location.replace(ceremonyUrlForStep(step));
            return;
          }
        } catch {
          if (isSessionExpiring()) return;
        }
        setAnswers(next);
      })
      .catch(() => {
        /* dead session is leaving */
      });
  }, []);

  async function onContinue() {
    if (busy) return;
    if (gateIncompleteStory()) return;
    setError("");
    setBusy(true);
    try {
      const existing = await getMe();
      applyMeToSession(existing);
      const step = normalizeCeremonyStep(existing.ceremony_step);
      if (step === "id" || step === "keys" || step === "hub") {
        persistCeremonyStep(step);
        writeSession({ explorerReady: true, hubUnlocked: step === "hub" });
        window.location.assign(ceremonyUrlForStep(step));
        return;
      }
      const r = await activateExplorer();
      applyMeToSession({
        ...existing,
        ...r,
        ceremony_step: r.ceremony_step || "id",
        has_claimed_key: true,
        needs_onboarding: r.needs_onboarding != null ? !!r.needs_onboarding : true,
      });
      applyPassportToSession(r, existing);
      persistCeremonyStep(normalizeCeremonyStep(r.ceremony_step) || "id");
      writeSession({ explorerReady: true, hubUnlocked: false });
      window.location.assign(routes.ceremonyId);
    } catch (err) {
      const msg = handleActivateError(err);
      if (msg) setError(msg);
      setBusy(false);
    }
  }

  const mirror = useMemo(() => {
    if (!answers) return null;
    return {
      need: leadCap(answers.need, "connection"),
      arch: leadCap(answers.archetype, "yourself"),
      chap: leadCap(answers.chapter, "this chapter"),
      cont: leadCap(answers.contribution, "something real"),
      ptype: Array.isArray(answers.person_type)
        ? answers.person_type[0] || "the right people"
        : String(answers.person_type || "the right people"),
    };
  }, [answers]);

  if (!answers || !mirror) return null;

  return (
    <main id="sCer1" className="screen active sty-screen sty-story" style={{ overflowY: "auto" }}>
      <div className="cer-topbar">
        <span className="cer-top-l">Philia Life</span>
        <span className="cer-top-c">SocialFit</span>
        <span className="cer-top-r">Dubai · First Wave</span>
      </div>
      <div className="sty-hero" style={{ margin: "16px 22px 0" }}>
        <video
          muted
          playsInline
          autoPlay
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
          <source src={videos.storyReveal} type="video/mp4" />
        </video>
        <div className="cer1-vignette" />
        <div className="sty-chip">
          <i />
          <span>Your story is placed</span>
        </div>
      </div>
      <div className="cer-pad" style={{ paddingTop: 36 }}>
        <p className="cer-super">Self-read complete</p>
        <h1 className="cer-h">
          Here&apos;s what
          <br />
          we heard.
        </h1>
        <div className="cer-rule" />
        <div className="cer-mirror">
          <div className="sty-sent-block">
            <p className="sty-ed-sentence">
              You&apos;re here because you want <span className="str-ed-fill">{mirror.need}</span>. You
              tend to move through rooms as <span className="str-ed-fill">{mirror.arch}</span>. This
              chapter feels like <span className="str-ed-fill">{mirror.chap}</span>. You bring{" "}
              <span className="str-ed-fill">{mirror.cont}</span>, most naturally to{" "}
              <span className="str-ed-fill">{mirror.ptype}</span>.
            </p>
          </div>
          <div className="cer-note" style={{ marginTop: 20, marginLeft: 14 }}>
            Self-perception layer · Social perception still locked
          </div>
        </div>
        <p className="cer-p" style={{ marginTop: 32 }}>
          This is how Philia will find your people.
          <br />
          Not by what you list. By who you actually are.
        </p>
        {error ? (
          <p
            style={{
              display: "block",
              margin: "28px 0 0",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
              color: "rgba(172,55,35,.88)",
            }}
          >
            {error}
          </p>
        ) : null}
        <div style={{ marginTop: 48 }}>
          <button className="cer-cta" type="button" onClick={onContinue} disabled={busy}>
            <span>Continue</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
