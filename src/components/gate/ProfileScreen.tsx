"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  deleteMePhoto,
  getMe,
  getPassport,
  patchMe,
  postMePhoto,
  type Me,
} from "@/lib/api/member";
import { createKeyRequest } from "@/lib/api/keys";
import { isApiError } from "@/lib/api/errors";
import { applyPassportToSession, memberDisplayName } from "@/lib/ceremony";
import { goHub, goLogout, keyRequestCopy, keyRequestCtaLabel } from "@/lib/hub";
import { ProfileIdentity } from "@/components/gate/ProfileIdentity";
import { emitWorldsBadge, memberInitials, PROFILE_WORLDS, profileTierLine, type WorldId } from "@/lib/profile";
import { patchMeError } from "@/lib/identity";
import { startSignalReplay } from "@/lib/signal-demo";
import { applyMeToSession, readSession } from "@/lib/session";
import { emptyWorlds } from "@/lib/worlds";
import { routes } from "@/lib/routes";

function LinkRow({
  onClick,
  href,
  icon,
  title,
  sub,
}: {
  onClick?: () => void;
  href?: string;
  icon: ReactNode;
  title: string;
  sub: string;
}) {
  const inner = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "rgba(32,32,52,.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
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
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.38)" }}>
            {sub}
          </div>
        </div>
      </div>
      <span style={{ fontFamily: "Inter,sans-serif", fontSize: 16, color: "rgba(32,32,52,.20)", fontWeight: 300 }}>
        ›
      </span>
    </>
  );
  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 0",
    border: "none",
    background: "none",
    cursor: "pointer",
    borderBottom: "1px solid rgba(32,32,52,.06)",
    textAlign: "left",
    width: "100%",
    textDecoration: "none",
    color: "inherit",
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...style, borderBottom: "none" }}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style}>
      {inner}
    </button>
  );
}

export function ProfileScreen() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [tierLine, setTierLine] = useState("SocialFit");
  const [passport, setPassport] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [worlds, setWorlds] = useState(emptyWorlds);
  const [openGrp, setOpenGrp] = useState<WorldId | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [requestJustSent, setRequestJustSent] = useState(false);

  function applyIdentity(next: Me) {
    applyMeToSession(next);
    setMe(next);
    setName(memberDisplayName(next));
    setWorlds(next.worlds || emptyWorlds());
    setAvatar(next.photo_url || null);
    setPassport(next.passport_display || readSession().passportDisplay || "");
    emitWorldsBadge();
  }

  useEffect(() => {
    setName("");
    setTierLine(profileTierLine());
    setPassport(readSession().passportDisplay || "");

    async function boot() {
      try {
        const next = await getMe();
        applyIdentity(next);
        setTierLine(profileTierLine());
      } catch {
        setName(memberDisplayName());
      }
      try {
        const p = await getPassport();
        applyPassportToSession(p);
        if (p.passport_display) setPassport(p.passport_display);
        setTierLine(profileTierLine());
      } catch {
        /* keep session */
      }
    }
    boot();
  }, []);

  async function pickAvatar(file: File | undefined) {
    if (!file) return;
    setBusy("photo");
    setErr("");
    setNote("");
    try {
      applyIdentity(await postMePhoto(file));
      setNote("Saved");
      window.setTimeout(() => setNote(""), 1600);
    } catch (e) {
      setErr(patchMeError(e));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto() {
    setBusy("photo");
    setErr("");
    setNote("");
    try {
      applyIdentity(await deleteMePhoto());
      setNote("Saved");
      window.setTimeout(() => setNote(""), 1600);
    } catch (e) {
      setErr(patchMeError(e));
    } finally {
      setBusy(null);
    }
  }

  async function toggleChip(grp: WorldId, label: string) {
    const prev = worlds;
    const next = {
      ...worlds,
      [grp]: worlds[grp].includes(label)
        ? worlds[grp].filter((c) => c !== label)
        : [...worlds[grp], label],
    };
    setWorlds(next);
    setBusy("worlds");
    setErr("");
    setNote("");
    try {
      applyIdentity(await patchMe({ worlds: next }));
      setNote("Saved");
      window.setTimeout(() => setNote(""), 1600);
    } catch (e) {
      setWorlds(prev);
      setErr(patchMeError(e));
    } finally {
      setBusy(null);
    }
  }

  async function onRequestKeys() {
    if (me?.request_pending) return;
    setBusy("keys");
    setErr("");
    setNote("");
    try {
      await createKeyRequest("");
      applyIdentity(await getMe());
      setRequestJustSent(true);
    } catch (e) {
      const code = isApiError(e) ? e.code : "";
      if (code === "request_pending") setRequestJustSent(false);
      else setErr(patchMeError(e));
      try {
        applyIdentity(await getMe());
      } catch {
        /* keep */
      }
    } finally {
      setBusy(null);
    }
  }

  const initials = memberInitials(name);
  const shownName = name || "Add your name";
  const keysQuota = me?.keys_quota ?? 0;
  const keysUsed = me?.keys_used ?? 0;
  const keysPct = keysQuota > 0 ? Math.min(100, Math.round((keysUsed / keysQuota) * 100)) : 0;
  const explorerActive = String(me?.state || "").toLowerCase() === "explorer_active";
  const showKeyRequest = !!(me && (me.can_request || me.request_pending || explorerActive));
  const keyRequestEnabled = !!me?.can_request && busy !== "keys";
  const reqCopy = keyRequestCopy(me?.request_pending ? "pending" : "", requestJustSent);
  const keyRequestLabel = busy === "keys" ? "Sending…" : keyRequestEnabled ? "Request →" : keyRequestCtaLabel(me?.request_pending ? "pending" : "");

  return (
    <main
      id="sProfile"
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
          <button
            type="button"
            onClick={() => goHub()}
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
            Profile
          </span>
          <button
            type="button"
            onClick={() => goLogout()}
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
              color: "rgba(172,55,35,.55)",
            }}
          >
            Log out
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div
              id="profAvatar"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: avatar
                  ? `url("${avatar}") center/cover`
                  : "linear-gradient(135deg,#d0d6e8 0%,#dfe4f0 60%,#ece8e2 100%)",
                border: "1px solid rgba(255,255,255,.6)",
                boxShadow: "0 8px 28px rgba(32,32,52,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {!avatar ? (
                <span
                  style={{
                    fontFamily: "Montserrat,sans-serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "rgba(32,32,52,.32)",
                  }}
                >
                  {initials}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                if (busy === "photo") return;
                fileRef.current?.click();
              }}
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#202034",
                border: "2px solid var(--porcelain)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="2.2" />
                <path d="M4 1.5h4l.8 1.2H10a.8.8 0 0 1 .8.8v5.5a.8.8 0 0 1-.8.8H2a.8.8 0 0 1-.8-.8V3.5a.8.8 0 0 1 .8-.8h1.2z" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => pickAvatar(e.target.files?.[0])}
            />
          </div>
          <h2
            style={{
              margin: "0 0 8px",
              fontFamily: "Montserrat,sans-serif",
              fontSize: 20,
              letterSpacing: "-.042em",
              fontWeight: 650,
              color: name ? "var(--steel)" : "rgba(32,32,52,.32)",
            }}
          >
            {shownName}
          </h2>
          {passport ? (
            <p
              style={{
                margin: "0 0 10px",
                fontFamily: "Montserrat,sans-serif",
                fontSize: 10,
                letterSpacing: ".12em",
                fontWeight: 700,
                color: "rgba(94,119,253,.75)",
              }}
            >
              {passport}
            </p>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(100,185,100,.8)" }} />
            <span
              style={{
                fontFamily: "Montserrat,sans-serif",
                fontSize: 7.5,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "rgba(32,32,52,.35)",
              }}
            >
              {tierLine}
            </span>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 26 }} />

        <ProfileIdentity
          me={me}
          onMe={(next) => {
            applyIdentity(next);
          }}
        />

        {err ? (
          <p style={{ margin: "-16px 0 24px", fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(172,55,35,.75)" }}>
            {err}
          </p>
        ) : null}
        {note ? (
          <p style={{ margin: "-16px 0 24px", fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(32,32,52,.40)" }}>
            {note}
          </p>
        ) : null}

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 26 }} />

        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 7,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            fontWeight: 800,
            color: "rgba(32,32,52,.28)",
            marginBottom: 12,
          }}
        >
          Your Philia
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
          <LinkRow
            title="Philia ID"
            sub="Customise your identity card"
            onClick={() => window.location.assign(routes.id)}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(32,32,52,.48)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="3.5" width="13" height="9" rx="2" />
                <circle cx="5.5" cy="8" r="1.4" />
                <path d="M9 6.5h3.5M9 9.5h2.5" />
              </svg>
            }
          />
          <LinkRow
            title="Your Story"
            sub="Review your SocialFit story"
            onClick={() => window.location.assign(`${routes.read}/1`)}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(32,32,52,.48)" strokeWidth="1.4" strokeLinecap="round">
                <path d="M2.5 4h11M2.5 8h8.5M2.5 12h6" />
              </svg>
            }
          />
          <LinkRow
            title="Replay Signal Demo"
            sub="Re-experience the signal read"
            onClick={() => startSignalReplay(routes.profile)}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(32,32,52,.48)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="5.5" />
                <circle cx="8" cy="8" r="2" />
              </svg>
            }
          />
          <LinkRow
            href={routes.privacy}
            title="Privacy Policy"
            sub="How we collect and protect your data"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(32,32,52,.48)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2.5L3.5 4.5V9c0 2.5 2 4.5 4.5 5.5 2.5-1 4.5-3 4.5-5.5V4.5z" />
                <path d="M6 8.5l1.5 1.5 3-3" />
              </svg>
            }
          />
        </div>

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 26 }} />

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
          Your Worlds
        </div>
        <p
          style={{
            fontFamily: "Inter,sans-serif",
            fontSize: 11,
            color: "rgba(32,32,52,.38)",
            margin: "0 0 20px",
            lineHeight: 1.55,
          }}
        >
          The more you add, the better your matches. Tap anything that fits.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {PROFILE_WORLDS.map((grp) => {
            const selected = worlds[grp.id];
            const open = openGrp === grp.id;
            return (
              <div
                key={grp.id}
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(32,32,52,.08)",
                  background: "rgba(255,255,255,.55)",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenGrp(open ? null : grp.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 18px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
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
                      {grp.title}
                    </div>
                    <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.28)" }}>
                      {selected.length === 0
                        ? "tap to add"
                        : `${selected.length} selected`}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "Inter,sans-serif",
                      fontSize: 18,
                      color: "rgba(32,32,52,.18)",
                      fontWeight: 300,
                      transition: "transform .2s",
                      transform: open ? "rotate(90deg)" : undefined,
                    }}
                  >
                    ›
                  </span>
                </button>
                <div
                  style={{
                    display: open ? "flex" : "none",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: "0 18px 18px",
                  }}
                >
                  {grp.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="pchip"
                      data-on={selected.includes(chip) ? "1" : "0"}
                      disabled={busy === "worlds"}
                      onClick={() => toggleChip(grp.id, chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 26 }} />

        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 7,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            fontWeight: 800,
            color: "rgba(32,32,52,.28)",
            marginBottom: 12,
          }}
        >
          Account
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
          <LinkRow
            title={avatar ? "Change display picture" : "Add Display Picture"}
            sub={avatar ? "JPEG, PNG or WebP · under 5MB" : "Upload a photo for your profile"}
            onClick={() => fileRef.current?.click()}
            icon={
              <svg width="15" height="15" viewBox="0 0 12 12" fill="none" stroke="rgba(32,32,52,.48)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="2.2" />
                <path d="M4 1.5h4l.8 1.2H10a.8.8 0 0 1 .8.8v5.5a.8.8 0 0 1-.8.8H2a.8.8 0 0 1-.8-.8V3.5a.8.8 0 0 1 .8-.8h1.2z" />
              </svg>
            }
          />
          {avatar ? (
            <LinkRow
              title="Remove photo"
              sub="Clears it from Profile"
              onClick={() => {
                if (busy === "photo") return;
                void removePhoto();
              }}
              icon={
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(32,32,52,.48)" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              }
            />
          ) : null}
          {showKeyRequest ? (
            <LinkRow
              title={reqCopy.title}
              sub={reqCopy.body}
              onClick={() => {
                if (!keyRequestEnabled) return;
                void onRequestKeys();
              }}
              icon={
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(32,32,52,.48)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="5.5" />
                  <path d="M8 5.5v5M5.5 8h5" />
                </svg>
              }
            />
          ) : null}
        </div>

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 26 }} />

        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 7,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            fontWeight: 800,
            color: "rgba(32,32,52,.28)",
            marginBottom: 12,
          }}
        >
          Key Allocation
        </div>
        <div
          style={{
            padding: 18,
            borderRadius: 14,
            background: "rgba(32,32,52,.04)",
            border: "1px solid rgba(32,32,52,.06)",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 400, color: "var(--steel)" }}>
              Keys used
            </span>
            <span style={{ fontFamily: "Montserrat,sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(32,32,52,.55)" }}>
              {keysUsed} / {keysQuota}
            </span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 4,
              background: "rgba(32,32,52,.08)",
              marginBottom: 14,
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${keysPct}%`, height: "100%", borderRadius: 4, background: "rgba(32,32,52,.22)" }} />
          </div>
          <p
            style={{
              fontFamily: "Inter,sans-serif",
              fontSize: 10.5,
              color: "rgba(32,32,52,.42)",
              margin: "0 0 14px",
              lineHeight: 1.5,
            }}
          >
            {keysQuota > 0 && keysUsed >= keysQuota
              ? `All ${keysQuota} keys are in use. Request an additional allocation from Philia when you need more.`
              : keysQuota > 0
                ? `${keysUsed} of ${keysQuota} keys in use.`
                : "Your Key vault will show here once it is allocated."}
          </p>
          {showKeyRequest ? (
            <button
              type="button"
              disabled={!keyRequestEnabled}
              onClick={() => void onRequestKeys()}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 10,
                border: "1.5px solid rgba(32,32,52,.18)",
                background: "transparent",
                cursor: keyRequestEnabled ? "pointer" : "default",
                opacity: keyRequestEnabled ? 1 : 0.45,
                fontFamily: "Montserrat,sans-serif",
                fontSize: 8,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "rgba(32,32,52,.65)",
              }}
            >
              {me?.request_pending ? reqCopy.title : keyRequestLabel}
            </button>
          ) : null}
        </div>

        <div style={{ height: 1, background: "rgba(32,32,52,.07)", marginBottom: 26 }} />
        <button
          type="button"
          onClick={() => goLogout()}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "14px 0",
            fontFamily: "Montserrat,sans-serif",
            fontSize: 8,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "rgba(172,55,35,.38)",
          }}
        >
          Log out
        </button>
      </div>
    </main>
  );
}
