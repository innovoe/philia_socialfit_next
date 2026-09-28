"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isInvitePayload, mapKeyEntryError, validateKeyCode } from "@/lib/api/key-entry";
import { isApiError } from "@/lib/api/errors";
import { videos } from "@/lib/assets";
import {
  afterInviteValidate,
  inviteOwnerName,
  normaliseKeyCode,
  queryKeyCode,
  sentenceStartName,
  stashKeyValidate,
} from "@/lib/invite";
import { readSession } from "@/lib/session";
import { routes } from "@/lib/routes";

function errorCode(err: unknown) {
  if (isApiError(err)) return err.code;
  if (err instanceof Error) return err.message;
  return "";
}

export function InviteLanding() {
  const search = useSearchParams();
  const raw = search.toString();
  const queryCode = queryKeyCode(raw);
  const queryFrom = String(search.get("from") || search.get("name") || "").trim();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [settled, setSettled] = useState(false);
  const [from, setFrom] = useState(queryFrom || "a friend");
  const [nominee, setNominee] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const s = readSession();
    const nextCode = queryCode || s.keyCode || "";
    if (nextCode) setCode(nextCode);
    setFrom(s.ownerDisplayName || queryFrom || "a friend");
    setNominee(s.nomineeFirstName || "");

    const settle = window.setTimeout(() => setSettled(true), 3300);
    const play = window.setTimeout(() => {
      const vid = videoRef.current;
      if (!vid) return;
      vid.play().catch(() => {});
    }, 2600);
    const vid = videoRef.current;
    const onEnded = () => {
      try {
        vid?.pause();
      } catch {
        /* ignore */
      }
    };
    vid?.addEventListener("ended", onEnded);

    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(play);
      vid?.removeEventListener("ended", onEnded);
    };
  }, [queryCode, queryFrom]);

  const ready = normaliseKeyCode(code).length >= 4 && !busy;

  async function onOpen(e: React.FormEvent) {
    e.preventDefault();
    const val = normaliseKeyCode(code);
    if (val.length < 4) return;
    setError("");
    setBusy(true);
    try {
      const r = await validateKeyCode(val);
      if (!r || r.valid === false) {
        setError("Invalid code — check and try again");
        setBusy(false);
        return;
      }
      if (!isInvitePayload(r)) {
        stashKeyValidate(r, val);
        window.location.assign(routes.unlock);
        return;
      }
      stashKeyValidate(r, val);
      setFrom(inviteOwnerName());
      setNominee(readSession().nomineeFirstName || "");
      if (r.mirror_status === "expired") {
        setError("This Key’s claim window has closed.");
        setBusy(false);
        return;
      }
      window.location.assign(afterInviteValidate(r));
    } catch (err) {
      const mapped = mapKeyEntryError(errorCode(err));
      setError(mapped === "Could not continue — try again." ? "Could not validate — try again" : mapped);
      setBusy(false);
    }
  }

  return (
    <main id="sInvite" className={settled ? "key-settled" : undefined}>
      <div className="inv-key-wrap">
        <div className="inv-topbar">
          <span>Philia Life</span>
          <span>Dubai · First Wave</span>
        </div>
        <div className="inv-artifact-zone">
          <div className="inv-artifact">
            <div className="inv-arrival">
              <h1 className="inv-arrival-h">
                A Philia Key.
                <br />
                From {from}.
              </h1>
            </div>
            <div className="inv-key-object">
              <video
                ref={videoRef}
                className="inv-key-video"
                muted
                playsInline
                preload="auto"
                aria-label="Rotating Philia Key video"
              >
                <source src={videos.inviteRotatingKeys} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
        <div className="inv-entry">
          <p className="inv-reveal">
            {sentenceStartName(from)} chose you as one of three people whose perspective they
            trust.
            <br />
            One question comes with your Key.
          </p>
          <p className={`inv-to-line${nominee ? " is-on" : ""}`}>For {nominee}</p>
          <form onSubmit={onOpen}>
            <div className="inv-code-wrap">
              <div className="inv-code-shell">
                <input
                  className="inv-code-input"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={32}
                  placeholder="ENTER CODE"
                  aria-label="Philia Key code"
                  value={code}
                  onChange={(e) => {
                    setCode(normaliseKeyCode(e.target.value));
                    setError("");
                  }}
                />
              </div>
              <p className="inv-code-note">
                Your invite link fills this automatically. Or paste the code from WhatsApp.
              </p>
              <p className="inv-code-error" style={{ opacity: error ? 1 : 0 }}>
                {error || "Invalid code — check and try again"}
              </p>
            </div>
            <button className="inv-cta" type="submit" disabled={!ready}>
              <span>{busy ? "Checking…" : "Open your Key"}</span>
              <span>→</span>
            </button>
          </form>
          <p className="inv-micro">Private invitation · 48 hours to begin your Social Mirror</p>
        </div>
      </div>
    </main>
  );
}
