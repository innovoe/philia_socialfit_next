"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mapKeyEntryError, submitKeyMirror } from "@/lib/api/key-entry";
import { isApiError } from "@/lib/api/errors";
import {
  formatMirrorQuestion,
  inviteOwnerName,
  isInviteSession,
  MIRROR_ARCHETYPES,
  normaliseKeyCode,
} from "@/lib/invite";
import { readSession, writeSession } from "@/lib/session";
import { routes } from "@/lib/routes";

function errorCode(err: unknown) {
  if (isApiError(err)) return err.code;
  if (err instanceof Error) return err.message;
  return "";
}

export function InviteMirror() {
  const [ready, setReady] = useState(false);
  const [from, setFrom] = useState("a friend");
  const [question, setQuestion] = useState("“How do you see me socially?”");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cueHidden, setCueHidden] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = readSession();
    if (!isInviteSession() || s.keyId == null) {
      window.location.replace(routes.invite);
      return;
    }
    if (s.mirrorAnswered) {
      window.location.replace(routes.invitePrimer);
      return;
    }
    setFrom(inviteOwnerName());
    setQuestion(formatMirrorQuestion(s.mirrorQuestion));
    const stage = document.querySelector(".phone-screen");
    setHost(stage instanceof HTMLElement ? stage : null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const grid = gridRef.current;
    if (!grid) return;
    function sync() {
      if (!grid) return;
      const more = grid.scrollHeight - grid.scrollTop - grid.clientHeight > 28;
      setCueHidden(!more);
    }
    sync();
    grid.addEventListener("scroll", sync, { passive: true });
    return () => grid.removeEventListener("scroll", sync);
  }, [sheetOpen]);

  async function pick(name: string) {
    if (busy || picked) return;
    const s = readSession();
    const code = normaliseKeyCode(s.keyCode || "");
    if (!code) {
      setError("Re-enter your Key code, then try again.");
      setSheetOpen(false);
      return;
    }
    setBusy(true);
    setPicked(name);
    setToast(`${name} · reflection received`);
    setError("");
    try {
      const res = await submitKeyMirror(code, name);
      if (!res || res.received !== true) {
        throw new Error("mirror_failed");
      }
      writeSession({ mirrorAnswered: true });
      window.setTimeout(() => setSheetOpen(false), 650);
      window.setTimeout(() => window.location.assign(routes.invitePrimer), 1050);
    } catch (err) {
      setPicked(null);
      setToast("");
      setSheetOpen(false);
      setBusy(false);
      const codeErr = errorCode(err);
      setError(
        codeErr === "mirror_failed"
          ? "Could not save your reflection — try again."
          : mapKeyEntryError(codeErr) === "Could not continue — try again."
            ? "Could not save your reflection — try again."
            : mapKeyEntryError(codeErr),
      );
    }
  }

  if (!ready) return null;

  const sheet =
    host &&
    createPortal(
      <>
        <div
          id="invSbBackdrop"
          className={sheetOpen ? "open" : undefined}
          aria-hidden={!sheetOpen}
          onClick={() => {
            if (!busy) setSheetOpen(false);
          }}
        />
        <div id="invSbSheet" className={sheetOpen ? "open" : undefined} aria-hidden={!sheetOpen}>
          <div className="inv-sb-handle" />
          <div className="inv-sb-top">
            <div className="inv-sb-label">How do you see them socially?</div>
            <button
              className="inv-sb-close"
              type="button"
              aria-label="Close"
              onClick={() => {
                if (!busy) setSheetOpen(false);
              }}
            >
              ×
            </button>
          </div>
          <div className="inv-sb-hint">
            <span>
              Choose one. They will see this archetype. The combined pattern still forms on their
              Philia ID.
            </span>
            <span className="inv-scroll-cue" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 4.2L6 8.2L10 4.2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="inv-sb-options-wrap">
            <div className="inv-sb-grid" ref={gridRef}>
              {MIRROR_ARCHETYPES.map((arch, idx) => (
                <div
                  key={arch.name}
                  className={`inv-sb-option${picked === arch.name ? " is-selected" : ""}`}
                  data-name={arch.name}
                  onClick={() => pick(arch.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick(arch.name);
                    }
                  }}
                >
                  <span className="inv-sb-main">{arch.title}</span>
                  <span className="inv-sb-sub">{arch.sub}</span>
                  <button
                    className={`inv-sb-expand${expanded === idx ? " open" : ""}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded((cur) => (cur === idx ? null : idx));
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 3.5L5 6.5L8 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Examples
                  </button>
                  <div className={`inv-sb-examples${expanded === idx ? " open" : ""}`}>
                    {arch.examples.map((ex) => (
                      <div className="inv-sb-ex" key={ex}>
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={`inv-sb-scroll${cueHidden ? " is-hidden" : ""}`}
              aria-label="Scroll for more archetypes"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const grid = gridRef.current;
                if (!grid) return;
                grid.scrollBy({
                  top: Math.max(140, Math.round(grid.clientHeight * 0.6)),
                  behavior: "smooth",
                });
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 6l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className={`inv-toast${toast ? " show" : ""}`}>{toast || "Reflection received"}</div>
        </div>
      </>,
      host,
    );

  return (
    <>
      <main id="sMirror">
        <header className="inv-cer-top">
          <span>Philia Life</span>
          <span>Dubai · First Wave</span>
        </header>
        <section className="inv-mirror-stage">
          <div>
            <div className="inv-cer-super">A question from {from}</div>
            <h1 className="inv-cer-h">{question}</h1>
            <div className="inv-cer-rule" />
            <p className="inv-cer-p">
              Choose the one archetype that feels most like them. They will see the archetype you
              choose.
            </p>
            <div className="inv-q-card">
              <p className="inv-q-label">What happens next</p>
              <p className="inv-q-copy">
                Your answer helps form their Social Archetype. They see the archetype you chose on
                their Key Vault. The combined pattern still appears on their Philia ID.
              </p>
            </div>
          </div>
          <div className="inv-mirror-bottom">
            <button
              className="inv-answer-btn"
              type="button"
              disabled={busy}
              onClick={() => setSheetOpen(true)}
            >
              <span>Open answer options</span>
              <span>→</span>
            </button>
            <p className="inv-answer-micro">12 archetypes · tap to answer</p>
            <p className={`inv-mirror-err${error ? " is-on" : ""}`}>{error}</p>
          </div>
        </section>
      </main>
      {sheet}
    </>
  );
}
