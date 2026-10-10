"use client";

import { useEffect, useRef, useState } from "react";
import { PhiliaIdCard, PidThemeBar } from "@/components/gate/PhiliaIdCard";
import {
  getMe,
  getPassport,
  patchMe,
  patchPassport,
  type LocationPrecision,
  type Me,
  type NameVisibility,
  type ShareAudience,
} from "@/lib/api/member";
import { isSessionExpiring } from "@/lib/expire";
import {
  applyPassportToSession,
  getSavedIdTheme,
  persistIdTheme,
  passportView,
  memberDisplayName,
  type PassportTheme,
  type PassportView,
} from "@/lib/ceremony";
import { memberInitials, visibleCardName } from "@/lib/profile";
import { patchMeError } from "@/lib/identity";
import { applyMeToSession } from "@/lib/session";
import { routes } from "@/lib/routes";

const LOC_BTNS: { id: LocationPrecision; label: string }[] = [
  { id: "city", label: "City only" },
  { id: "area", label: "City + area" },
  { id: "neighbourhood", label: "Area" },
];

export function IdManageScreen() {
  const [view, setView] = useState<PassportView | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [savedTheme, setSavedTheme] = useState<PassportTheme>("ice");
  const [saving, setSaving] = useState(false);
  const [badge, setBadge] = useState("");
  const [vis, setVis] = useState<NameVisibility>("full");
  const [loc, setLoc] = useState<LocationPrecision>("city");
  const [story, setStory] = useState<ShareAudience>("none");
  const [avail, setAvail] = useState<ShareAudience>("none");
  const [photo, setPhoto] = useState<ShareAudience>("none");
  const [podVisible, setPodVisible] = useState(false);
  const [podOpenTo, setPodOpenTo] = useState("");
  const [fullName, setFullName] = useState("");
  const [shareErr, setShareErr] = useState("");
  const [shareNote, setShareNote] = useState("");
  const podTimer = useRef<number | null>(null);

  function applyMe(next: Me) {
    applyMeToSession(next);
    const name = memberDisplayName(next);
    setFullName(name);
    setVis(next.name_visibility || "full");
    setLoc(next.location_precision || "city");
    setStory(next.story_visible_to || "none");
    setAvail(next.availability_visible_to || "none");
    setPhoto(next.photo_visible_to || "none");
    setPodVisible(!!next.pod_visible);
    setPodOpenTo(next.pod_open_to || "");
    setView((cur) => {
      const base = cur || passportView(next);
      const shown = visibleCardName(name, next.name_visibility || "full");
      return { ...base, name, first: shown.first, rest: shown.rest };
    });
  }

  useEffect(() => {
    async function boot() {
      let identity: Me | null = null;
      try {
        identity = await getMe();
        applyMe(identity);
      } catch {
        if (isSessionExpiring()) return;
      }
      if (isSessionExpiring()) return;
      try {
        const passport = await getPassport();
        applyPassportToSession(passport, identity || undefined);
        const next = passportView(identity, passport);
        const name = memberDisplayName(identity);
        const visNow = identity?.name_visibility || "full";
        const shown = visibleCardName(name, visNow);
        setView({ ...next, name, first: shown.first, rest: shown.rest });
        setFullName(name);
        setSavedTheme(next.theme);
      } catch {
        const next = passportView(identity);
        setView(next);
        setFullName(next.name);
        setSavedTheme(getSavedIdTheme());
      }
    }
    boot();
    return () => {
      if (podTimer.current != null) window.clearTimeout(podTimer.current);
    };
  }, []);

  function applyVis(nextVis: NameVisibility, base: PassportView) {
    const shown = visibleCardName(base.name || fullName, nextVis);
    return { ...base, first: shown.first, rest: shown.rest };
  }

  async function persist(body: Parameters<typeof patchMe>[0]) {
    setShareErr("");
    try {
      const next = await patchMe(body);
      applyMe(next);
      setShareNote("Saved");
      window.setTimeout(() => setShareNote(""), 1600);
    } catch (e) {
      setShareErr(patchMeError(e));
    }
  }

  function pickTheme(theme: PassportTheme) {
    setView((cur) => (cur ? { ...cur, theme } : cur));
    setBadge("");
  }

  async function saveColour() {
    if (!view || saving || view.theme === savedTheme) return;
    const theme = view.theme;
    setSaving(true);
    setBadge("");
    try {
      const saved = await patchPassport(theme);
      applyPassportToSession(saved);
      const nextTheme = getSavedIdTheme(saved);
      persistIdTheme(nextTheme);
      setSavedTheme(nextTheme);
      setView((cur) => (cur ? applyVis(vis, { ...cur, ...passportView(undefined, saved), theme: nextTheme }) : cur));
      setBadge("Saved ✓");
      window.setTimeout(() => setBadge(""), 2000);
    } catch {
      setBadge("Couldn’t save — retry");
    } finally {
      setSaving(false);
    }
  }

  function pickVis(next: NameVisibility) {
    setVis(next);
    setView((cur) => (cur ? applyVis(next, cur) : cur));
    persist({ name_visibility: next });
  }

  function queuePodOpen(value: string) {
    setPodOpenTo(value);
    if (podTimer.current != null) window.clearTimeout(podTimer.current);
    podTimer.current = window.setTimeout(() => {
      persist({ pod_open_to: value.slice(0, 200) });
    }, 500);
  }

  if (!view) return null;

  const dirty = view.theme !== savedTheme;
  const visPreview = {
    full: fullName || "—",
    first: fullName.trim().split(/\s+/).filter(Boolean)[0] || "—",
    initials: memberInitials(fullName) || "—",
  };

  return (
    <main
      id="sIdMgmt"
      className="screen active"
      style={{
        minHeight: "100vh",
        background: "var(--porcelain)",
        boxShadow: "0 0 60px rgba(0,0,0,.12)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div style={{ padding: "52px 28px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <button
            type="button"
            onClick={() => window.location.assign(routes.profile)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "Montserrat,sans-serif",
              fontSize: 8,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "rgba(32,32,52,.35)",
            }}
          >
            ← Back
          </button>
          <span
            style={{
              fontFamily: "Montserrat,sans-serif",
              fontSize: 8,
              letterSpacing: ".25em",
              textTransform: "uppercase",
              fontWeight: 800,
              color: "rgba(32,32,52,.38)",
            }}
          >
            Philia ID
          </span>
          <span style={{ width: 40 }} />
        </div>

        <div className="cer2-pair-wrap" style={{ margin: "0 0 32px" }}>
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
            <PhiliaIdCard view={view} flipped={flipped} onFlip={() => setFlipped((v) => !v)} />
          </div>
          <div className="pid-flip-hint">Tap card to flip · front / back</div>
          <PidThemeBar theme={view.theme} onPick={pickTheme} />
          <div style={{ marginTop: 18, position: "relative" }}>
            <button
              id="idmSaveColourBtn"
              type="button"
              className="cer-cta"
              onClick={saveColour}
              disabled={!dirty || saving}
              style={{
                justifyContent: "center",
                opacity: dirty && !saving ? 1 : 0.32,
                pointerEvents: dirty && !saving ? "auto" : "none",
                transition: "opacity .2s ease",
                boxShadow: "none",
              }}
            >
              {saving ? "Saving…" : `Set as my card colour`}
            </button>
            <span
              style={{
                position: "absolute",
                right: 0,
                bottom: -22,
                fontFamily: "Inter,sans-serif",
                fontSize: 11,
                color: "rgba(32,32,52,.35)",
                opacity: badge ? 1 : 0,
                transition: "opacity .3s ease",
              }}
            >
              {badge}
            </span>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 28 }} />

        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 7,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            fontWeight: 800,
            color: "rgba(32,32,52,.28)",
            marginBottom: 6,
          }}
        >
          Name Visibility
        </div>
        <p
          style={{
            fontFamily: "Inter,sans-serif",
            fontSize: 11,
            color: "rgba(32,32,52,.38)",
            margin: "0 0 18px",
            lineHeight: 1.5,
          }}
        >
          Control how your name appears to other members on Philia.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(32,32,52,.08)",
            background: "rgba(255,255,255,.55)",
            marginBottom: 32,
          }}
        >
          {(
            [
              ["full", "Full Name", visPreview.full],
              ["first", "First Name Only", visPreview.first],
              ["initials", "Initials Only", visPreview.initials],
            ] as const
          ).map(([id, label, preview], i) => {
            const on = vis === id;
            return (
              <button
                key={id}
                type="button"
                className={`idm-vis-btn${on ? " idm-vis-active" : ""}`}
                onClick={() => pickVis(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 18px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  borderBottom: i < 2 ? "1px solid rgba(32,32,52,.06)" : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "Montserrat,sans-serif",
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "var(--steel)",
                      marginBottom: 3,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.40)" }}>
                    {preview}
                  </div>
                </div>
                <div
                  className={`idm-radio${on ? " idm-radio-on" : ""}`}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `1.5px solid ${on ? "#5E77FD" : "rgba(32,32,52,.20)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: on ? "#5E77FD" : "transparent",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 28 }} />

        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 7,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            fontWeight: 800,
            color: "rgba(32,32,52,.28)",
            marginBottom: 6,
          }}
        >
          Sharing Controls
        </div>
        <p
          style={{
            fontFamily: "Inter,sans-serif",
            fontSize: 11,
            color: "rgba(32,32,52,.38)",
            margin: "0 0 18px",
            lineHeight: 1.5,
          }}
        >
          Manage what connected members can see about you.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(32,32,52,.08)",
            background: "rgba(255,255,255,.55)",
            marginBottom: 24,
          }}
        >
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(32,32,52,.06)" }}>
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontFamily: "Montserrat,sans-serif",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--steel)",
                  marginBottom: 2,
                }}
              >
                Location detail
              </div>
              <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.38)" }}>
                How precisely your location shows
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {LOC_BTNS.map((b) => {
                const on = loc === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setLoc(b.id);
                      persist({ location_precision: b.id });
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: on ? "1px solid transparent" : "1px solid rgba(32,32,52,.13)",
                      background: on ? "rgba(32,32,52,.82)" : "transparent",
                      color: on ? "#fff" : "rgba(32,32,52,.42)",
                      fontFamily: "Montserrat,sans-serif",
                      fontSize: 8,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all .15s ease",
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ShareToggle
            title="Story visible to"
            sub="Who can read your StoryBuilder answers"
            onLabel="Matched"
            offLabel="Hidden"
            on={story === "matched"}
            onToggle={() => {
              const next: ShareAudience = story === "matched" ? "none" : "matched";
              setStory(next);
              persist({ story_visible_to: next });
            }}
          />
          <ShareToggle
            title="Availability windows"
            sub="Show when you're open to plans"
            onLabel="Visible"
            offLabel="Hidden"
            on={avail === "matched"}
            onToggle={() => {
              const next: ShareAudience = avail === "matched" ? "none" : "matched";
              setAvail(next);
              persist({ availability_visible_to: next });
            }}
          />
          <ShareToggle
            title="Profile photo"
            sub="Who can see your display picture"
            onLabel="Matched"
            offLabel="Hidden"
            on={photo === "matched"}
            onToggle={() => {
              const next: ShareAudience = photo === "matched" ? "none" : "matched";
              setPhoto(next);
              persist({ photo_visible_to: next });
            }}
          />

          <div style={{ padding: "16px 18px", borderTop: "1px solid rgba(32,32,52,.06)" }}>
            <ShareToggle
              title="Pod presence"
              sub="Show me to members in my pod"
              onLabel="Visible"
              offLabel="Hidden"
              on={podVisible}
              onToggle={() => {
                const next = !podVisible;
                setPodVisible(next);
                persist({ pod_visible: next });
              }}
              last
              flush
            />
            {podVisible ? (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontFamily: "Inter,sans-serif",
                    fontSize: 11,
                    color: "rgba(32,32,52,.38)",
                    marginBottom: 8,
                    lineHeight: 1.45,
                  }}
                >
                  Add what you&apos;re open to being contacted for
                </div>
                <input
                  value={podOpenTo}
                  maxLength={200}
                  placeholder="Co-founders · wellness collabs · honest conversation"
                  onChange={(e) => queuePodOpen(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(32,32,52,.10)",
                    background: "rgba(32,32,52,.03)",
                    fontFamily: "Inter,sans-serif",
                    fontSize: 13,
                    color: "var(--steel)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>

        {shareErr ? (
          <p style={{ margin: "-8px 0 16px", fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(172,55,35,.75)" }}>
            {shareErr}
          </p>
        ) : null}
        {shareNote ? (
          <p style={{ margin: "-8px 0 16px", fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(32,32,52,.40)" }}>
            {shareNote}
          </p>
        ) : null}

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(32,32,52,.04)",
            border: "1px solid rgba(32,32,52,.07)",
          }}
        >
          <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(32,32,52,.42)", margin: 0, lineHeight: 1.6 }}>
            Your Explorer tier, archetypes, life chapter, and passport ID are always visible to connected members. Street
            address never appears on this card. The controls above govern everything else.
          </p>
        </div>
      </div>
    </main>
  );
}

function ShareToggle({
  title,
  sub,
  on,
  onLabel,
  offLabel,
  onToggle,
  last,
  flush,
}: {
  title: string;
  sub: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
  last?: boolean;
  flush?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: flush ? "0" : "16px 18px",
        borderBottom: last || flush ? "none" : "1px solid rgba(32,32,52,.06)",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--steel)",
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.38)" }}>{sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 8,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "rgba(32,32,52,.40)",
          }}
        >
          {on ? onLabel : offLabel}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={on}
          style={{
            width: 38,
            height: 22,
            borderRadius: 11,
            background: on ? "rgba(32,32,52,.82)" : "rgba(32,32,52,.18)",
            cursor: "pointer",
            position: "relative",
            transition: "background .2s ease",
            flexShrink: 0,
            border: "none",
            padding: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              right: on ? 3 : "auto",
              left: on ? "auto" : 3,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              transition: "right .2s ease,left .2s ease",
            }}
          />
        </button>
      </div>
    </div>
  );
}
