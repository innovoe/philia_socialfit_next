"use client";

import { useEffect, useState } from "react";
import { PhiliaIdCard, PidThemeBar } from "@/components/gate/PhiliaIdCard";
import {
  formatMirrorArchetypes,
  getMe,
  getMirror,
  getPassport,
  patchCeremony,
  patchMe,
  patchPassport,
  type Me,
} from "@/lib/api/member";
import {
  applyPassportToSession,
  getSavedIdTheme,
  memberDisplayName,
  nameLines,
  persistCeremonyStep,
  persistIdTheme,
  passportView,
  THEME_LABELS,
  type PassportTheme,
  type PassportView,
} from "@/lib/ceremony";
import { isSessionExpiring, requireMemberAccess } from "@/lib/expire";
import { patchMeError } from "@/lib/identity";
import { applyMeToSession, normalizeCeremonyStep, readSession, writeSession } from "@/lib/session";
import { hydrateAnswersFromServer } from "@/lib/story-answers";
import { routes } from "@/lib/routes";

export default function CeremonyIdPage() {
  const [view, setView] = useState<PassportView | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimLabel, setClaimLabel] = useState("CLAIM ICE CARD");
  const [nameDraft, setNameDraft] = useState("");
  const [savedName, setSavedName] = useState("");
  const [nameSource, setNameSource] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameNote, setNameNote] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [socialArch, setSocialArch] = useState("Pending");

  function applyName(me: Me) {
    applyMeToSession(me);
    const name = memberDisplayName(me);
    const lines = nameLines(name);
    setSavedName(name);
    setNameDraft(name);
    setNameSource(String(me.name_source || ""));
    setView((cur) => (cur ? { ...cur, name, first: lines.first, rest: lines.rest } : cur));
  }

  useEffect(() => {
    if (!requireMemberAccess()) return;

    async function boot() {
      let identity: Me | undefined;
      try {
        identity = await getMe();
        applyMeToSession(identity);
        const name = memberDisplayName(identity);
        setSavedName(name);
        setNameDraft(name);
        setNameSource(String(identity.name_source || ""));
        const step = normalizeCeremonyStep(identity.ceremony_step);
        const already = readSession().explorerReady;
        if (!already && (step === "summary" || !step)) {
          window.location.replace(routes.ceremony);
          return;
        }
        if (step) persistCeremonyStep(step);
        writeSession({ explorerReady: true, hubUnlocked: step === "hub" });
      } catch {
        if (isSessionExpiring()) return;
        if (!readSession().explorerReady) {
          window.location.replace(routes.ceremony);
          return;
        }
      }

      try {
        const mirror = await getMirror();
        setSocialArch(formatMirrorArchetypes(mirror) || "Pending");
      } catch {
        /* keep Pending */
      }

      try {
        await hydrateAnswersFromServer();
      } catch {
        /* keep local story answers */
      }

      try {
        const passport = await getPassport();
        applyPassportToSession(passport, identity);
        const next = passportView(identity, passport);
        setView(next);
        setClaimLabel(`CLAIM ${THEME_LABELS[next.theme]} CARD`);
      } catch {
        if (isSessionExpiring()) return;
        setView(passportView(identity));
      }
    }

    boot();
  }, []);

  function pickTheme(theme: PassportTheme) {
    setView((cur) => (cur ? { ...cur, theme } : cur));
    setClaimed(false);
    setClaimLabel(`CLAIM ${THEME_LABELS[theme]} CARD`);
  }

  async function claim() {
    if (!view || claiming) return;
    const theme = view.theme;
    setClaiming(true);
    setClaimLabel("Saving…");
    try {
      const saved = await patchPassport(theme);
      applyPassportToSession(saved);
      const nextTheme = getSavedIdTheme(saved);
      persistIdTheme(nextTheme);
      setView((cur) =>
        cur
          ? {
              ...cur,
              ...passportView(undefined, saved),
              theme: nextTheme,
              name: cur.name,
              first: cur.first,
              rest: cur.rest,
            }
          : cur,
      );
      setClaimed(true);
      setClaimLabel(`✓ ${THEME_LABELS[nextTheme]} CLAIMED · YOUR CARD`);
      persistCeremonyStep("keys");
      writeSession({ explorerReady: true, hubUnlocked: false });
      try {
        await patchCeremony("keys");
      } catch {
        /* optimistic keys step already stored */
      }
    } catch {
      setClaimed(false);
      setClaimLabel(`CLAIM ${THEME_LABELS[theme]} CARD · RETRY`);
    } finally {
      setClaiming(false);
    }
  }

  async function saveName() {
    const nextName = nameDraft.trim();
    if (!nextName) {
      setNameErr("Add the name you want on this ID.");
      setNameNote("");
      return;
    }
    if (nextName === savedName && nameSource === "user") {
      setNameErr("");
      setNameNote("Saved on your ID");
      return;
    }
    setNameBusy(true);
    setNameErr("");
    setNameNote("");
    try {
      const next = await patchMe({ display_name: nextName });
      applyName(next);
      setNameNote("Saved on your ID");
    } catch (e) {
      if (isSessionExpiring()) return;
      setNameErr(patchMeError(e));
    } finally {
      setNameBusy(false);
    }
  }

  if (!view) return null;
  const inviteHint = nameSource === "invite" && !!savedName;

  return (
    <main id="sCer2" className="screen active" style={{ overflowY: "auto" }}>
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="cer-topbar">
          <span className="cer-top-l">Philia Life</span>
          <span className="cer-top-c">SocialFit</span>
          <span className="cer-top-r">Dubai · First Wave</span>
        </div>
        <div className="cer-pad" style={{ paddingTop: 56, flex: 1, display: "flex", flexDirection: "column" }}>
          <p className="cer-super" style={{ marginBottom: 30 }}>
            Explorer · First Wave · Dubai
          </p>
          <h1 className="cer-h" style={{ marginBottom: 36, fontSize: 30, lineHeight: 1.1 }}>
            Congratulations.
            <br />
            Your Philia ID is unlocked.
          </h1>
          <p className="cer-p" style={{ margin: "0 0 16px" }}>
            You are now an Explorer Member inside the SocialFit Dubai First Wave.
          </p>
          <p className="cer-p" style={{ margin: 0 }}>
            Your Philia ID is your private passport into SocialFit. It carries your access, your
            self-read, and the social mirror that unlocks as your trusted keys respond.
          </p>

          <div style={{ marginTop: 44 }} />
          <p className="cer-p" style={{ margin: 0, color: "rgba(32,32,52,.44)", fontSize: 14 }}>
            Choose the expression of your Philia ID. Your access stays the same. The finish becomes
            yours.
          </p>

          <div className="cer2-pair-wrap">
            <div className="pid-flip-hint">Tap card to flip · front / back</div>
            <div
              style={{
                borderRadius: 36,
                padding: 16,
                background:
                  "radial-gradient(circle at 22% 12%,rgba(255,255,255,.72),transparent 22%),radial-gradient(circle at 80% 80%,rgba(255,255,255,.48),transparent 26%),linear-gradient(135deg,#f7f2ec 0%,#ede4d8 52%,#e4d8c8 100%)",
                display: "inline-flex",
                marginBottom: 0,
              }}
            >
              <PhiliaIdCard
                view={view}
                flipped={flipped}
                socialArch={socialArch}
                onFlip={() => setFlipped((v) => !v)}
              />
            </div>
            <PidThemeBar theme={view.theme} onPick={pickTheme} />
            <button
              className={`pid-claim${claimed ? " claimed" : ""}`}
              type="button"
              disabled={claiming}
              onClick={claim}
            >
              {claimLabel}
            </button>
            <form
              className="pid-name-box"
              onSubmit={(e) => {
                e.preventDefault();
                void saveName();
              }}
            >
              <p className="pid-name-box-lbl">Your name on this ID</p>
              <p className="pid-name-box-hint">
                {inviteHint
                  ? "This name is from your application. Save it to keep it on your ID."
                  : "Printed on the card. You can still change it later from Profile."}
              </p>
              <div className="pid-name-box-row">
                <input
                  className="pid-name-box-input"
                  value={nameDraft}
                  onChange={(e) => {
                    setNameDraft(e.target.value);
                    setNameErr("");
                    setNameNote("");
                  }}
                  placeholder="Your name"
                  maxLength={150}
                  autoComplete="name"
                  disabled={nameBusy}
                />
                <button className="pid-name-box-save" type="submit" disabled={nameBusy}>
                  {nameBusy ? "Saving…" : "Save name"}
                </button>
              </div>
              {nameErr ? <p className="pid-name-box-err">{nameErr}</p> : null}
              {nameNote ? <p className="pid-name-box-note">{nameNote}</p> : null}
            </form>
          </div>

          <p className="cer2-live-lbl">Your first layer is live.</p>
          <p className="cer-p" style={{ margin: "12px 0 0", fontSize: 13.5, color: "rgba(32,32,52,.42)" }}>
            SocialFit can now begin organising the city around your rhythm, geography, chapter and
            the kinds of people likely to understand you.
          </p>

          <div style={{ marginTop: "auto", paddingTop: 56 }}>
            <button
              className="cer-cta"
              type="button"
              onClick={() => window.location.assign(routes.ceremonyMirror)}
            >
              <span>Enter Explorer</span>
              <span>→</span>
            </button>
            <div className="cer-status">Explorer active · First Wave access live</div>
          </div>
        </div>
      </div>
    </main>
  );
}
