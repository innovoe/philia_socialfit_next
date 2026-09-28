"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { computeResume, loadAnswers, resumeUrl } from "@/lib/story-answers";
import { readSession } from "@/lib/session";
import { routes } from "@/lib/routes";
import { goHub } from "@/lib/hub";
import { WORLDS_EVENT, worldsBadgeDone } from "@/lib/profile";

type FlexNavProps = {
  askOpen: boolean;
  explorerReady?: boolean;
  hubUnlocked?: boolean;
  onAskOpen: () => void;
  onAskClose: () => void;
};

function pad(n: number) {
  return n < 10 ? "0" + n : String(n);
}

function remainingSeconds(iso: string | null) {
  if (!iso) return 0;
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}

function formatBuildTimer(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${pad(m)}m ${pad(sec)}s`;
}

function screenFromPath(path: string): "story" | "read" | "ceremony" | "id" | "hub" | "profile" | "other" {
  if (path.startsWith(routes.story)) return "story";
  if (path.startsWith(routes.read)) return "read";
  if (path.startsWith(routes.hub)) return "hub";
  if (path.startsWith(routes.profile)) return "profile";
  if (path === routes.id || path.startsWith(`${routes.id}/`)) return "id";
  if (
    path.startsWith(routes.ceremonyId) ||
    path.startsWith(routes.ceremonyMirror) ||
    path.startsWith(routes.ceremonyKeys)
  ) {
    return "id";
  }
  if (path.startsWith(routes.ceremony)) return "ceremony";
  return "other";
}

function buildStep(path: string) {
  const story = path.match(/^\/story\/(\d+)/);
  if (story) {
    const n = Number(story[1]);
    return { steps: 3, step: Math.min(3, Math.max(1, n)) };
  }
  const read = path.match(/^\/read\/(\d+)/);
  if (read) {
    const n = Number(read[1]);
    return { steps: 4, step: Math.min(4, Math.max(1, n)) };
  }
  if (path.startsWith(routes.ceremony)) return { steps: 4, step: 4 };
  return null;
}

function slotClass(
  slot: 1 | 2 | 3 | 4 | 5,
  askOpen: boolean,
  current: number,
  explorerReady: boolean,
  hubUnlocked: boolean,
) {
  if (!explorerReady) {
    if (slot === 1 || slot === 3 || slot === 4) return "fn-locked";
    if (slot === 2) return askOpen ? "fn-live" : current === 2 ? "fn-on fn-cta" : "fn-cta";
    return askOpen ? "fn-on" : "fn-live";
  }
  if (slot === 4 && !hubUnlocked) return "fn-locked";
  if (askOpen) return slot === 5 ? "fn-on" : "fn-live";
  return current === slot ? "fn-on" : "fn-live";
}

export function FlexNav({
  askOpen,
  explorerReady = false,
  hubUnlocked = false,
  onAskOpen,
  onAskClose,
}: FlexNavProps) {
  const path = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [inClass, setInClass] = useState(false);
  const [toast, setToast] = useState("");
  const [toastIn, setToastIn] = useState(false);
  const [timer, setTimer] = useState("");
  const [ready, setReady] = useState(explorerReady);
  const [hub, setHub] = useState(hubUnlocked);
  const [worldsDone, setWorldsDone] = useState(false);
  const closeT = useRef<number | null>(null);
  const toastT = useRef<number | null>(null);

  const screen = screenFromPath(path);
  const current = askOpen
    ? 5
    : screen === "id"
      ? 1
      : screen === "profile"
        ? 3
        : screen === "hub"
          ? 4
          : screen === "other"
            ? 0
            : 2;
  const step = ready ? null : buildStep(path);
  const expanded = open || askOpen;

  useEffect(() => {
    const t = window.setTimeout(() => setInClass(true), 60);
    document.body.classList.add("fn-on");
    return () => {
      window.clearTimeout(t);
      document.body.classList.remove("fn-on");
    };
  }, []);

  useEffect(() => {
    if (askOpen) setOpen(true);
  }, [askOpen]);

  useEffect(() => {
    function tick() {
      const s = readSession();
      const left = remainingSeconds(s.finishDeadline || s.claimDeadline);
      setTimer(left > 0 ? formatBuildTimer(left) : "");
      const live = explorerReady || s.explorerReady || s.ceremonyStep === "id" || s.ceremonyStep === "keys" || s.ceremonyStep === "hub";
      setReady(live);
      setHub(hubUnlocked || s.hubUnlocked || s.ceremonyStep === "hub");
      setWorldsDone(worldsBadgeDone());
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [explorerReady, hubUnlocked, path]);

  useEffect(() => {
    function syncBadge() {
      setWorldsDone(worldsBadgeDone());
    }
    syncBadge();
    window.addEventListener(WORLDS_EVENT, syncBadge);
    return () => window.removeEventListener(WORLDS_EVENT, syncBadge);
  }, [path]);

  function cancelClose() {
    if (closeT.current != null) {
      window.clearTimeout(closeT.current);
      closeT.current = null;
    }
  }

  function expand() {
    cancelClose();
    setOpen(true);
  }

  function collapse(ms = 0) {
    if (askOpen) return;
    cancelClose();
    closeT.current = window.setTimeout(() => setOpen(false), ms);
  }

  function showToast(msg: string) {
    setToast(msg);
    setToastIn(true);
    if (toastT.current != null) window.clearTimeout(toastT.current);
    toastT.current = window.setTimeout(() => setToastIn(false), 2400);
  }

  function goStory() {
    if (askOpen) {
      onAskClose();
      return;
    }
    // Mid-story / Signal Read: keep the current section.
    if (screen === "story" || screen === "read") return;
    // Ceremony treats Story as current in the pill, but it is a different screen.
    if (screen === "ceremony" || screen === "id" || screen === "hub" || screen === "profile") {
      window.location.assign(`${routes.story}/1`);
      return;
    }
    const target = resumeUrl(computeResume(loadAnswers()));
    if (target !== path) window.location.assign(target);
  }

  function onSlot(n: 1 | 2 | 3 | 4 | 5) {
    if (!ready && (n === 1 || n === 3 || n === 4)) {
      showToast("Finish your Story to unlock this");
      return;
    }
    if (n === 4 && !hub) {
      showToast("Finish Keys to unlock Hub");
      return;
    }
    if (n === 5) {
      onAskOpen();
      return;
    }
    if (n === 1) {
      if (path !== routes.id) window.location.assign(routes.id);
      return;
    }
    if (n === 2) {
      goStory();
      return;
    }
    if (n === 3) {
      if (path !== routes.profile) window.location.assign(routes.profile);
      return;
    }
    if (n === 4) {
      if (path === routes.hub) return;
      goHub();
    }
  }

  useEffect(() => {
    function onDoc(e: Event) {
      const nav = navRef.current;
      if (!nav || nav.contains(e.target as Node)) return;
      collapse(0);
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [askOpen]);

  const navClass = [
    "fn-visible",
    inClass ? "fn-in" : "",
    expanded ? "fn-open" : "",
    ready ? "" : "fn-mode-build",
    askOpen ? "fn-ask-on" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        id="flexNav"
        ref={navRef}
        className={navClass}
        data-fn-steps={step?.steps}
        data-fn-step={step?.step}
        data-timer={timer || undefined}
        role="navigation"
        aria-label="Menu"
        aria-expanded={expanded}
        onMouseEnter={expand}
        onMouseLeave={() => collapse(300)}
        onClick={() => {
          if (!expanded) expand();
        }}
        onTouchStart={(e) => {
          if (!expanded) {
            e.preventDefault();
            expand();
          }
        }}
      >
        <div className="fn-indicator" aria-hidden="true">
          Menu
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 3.5L5 6.5L8 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="fn-s2-label">
          <span className="fn-s2-dot" />
          <span>Building Philia ID</span>
        </span>
        <button
          className={`fn-slot ${slotClass(1, askOpen, current, ready, hub)}`}
          id="fnS1"
          type="button"
          aria-label="Philia ID"
          onClick={() => onSlot(1)}
        >
          <span className="fn-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="3.5" width="13" height="9" rx="2" />
              <circle cx="5.5" cy="8" r="1.4" />
              <path d="M9 6.5h3.5M9 9.5h2.5" />
            </svg>
          </span>
          <span className="fn-lbl">ID</span>
        </button>
        <button
          className={`fn-slot ${slotClass(2, askOpen, current, ready, hub)}`}
          id="fnS2"
          type="button"
          aria-label="Your Story"
          onClick={() => onSlot(2)}
        >
          <span className="fn-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2.5 4.5h11M2.5 8h8.5M2.5 11.5h6" />
            </svg>
          </span>
          <span className="fn-lbl">Story</span>
        </button>
        <button
          className={`fn-slot ${slotClass(3, askOpen, current, ready, hub)}`}
          id="fnS3"
          type="button"
          aria-label="Profile"
          onClick={() => onSlot(3)}
        >
          <span className="fn-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="5.5" r="2.5" />
              <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
            </svg>
          </span>
          <span className="fn-lbl">Profile</span>
          <span className={`fn-badge${worldsDone ? " fn-badge-done" : ""}`} />
        </button>
        <button
          className={`fn-slot ${slotClass(4, askOpen, current, ready, hub)}`}
          id="fnS4"
          type="button"
          aria-label="Launch Hub"
          onClick={() => onSlot(4)}
        >
          <span className="fn-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="4" r="1.8" />
              <circle cx="3.5" cy="12" r="1.8" />
              <circle cx="12.5" cy="12" r="1.8" />
              <path d="M8 5.8V8.5M8 8.5L4.2 10.5M8 8.5L11.8 10.5" />
            </svg>
          </span>
          <span className="fn-lbl">Hub</span>
        </button>
        <button
          className={`fn-slot ${slotClass(5, askOpen, current, ready, hub)}`}
          id="fnS5"
          type="button"
          aria-label="Ask Philia"
          onClick={() => onSlot(5)}
        >
          <span className="fn-icon">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 8c0 2.762-2.462 5-5.5 5a5.8 5.8 0 0 1-2.6-.614L2 14l1.1-2.886A4.8 4.8 0 0 1 2.5 8C2.5 5.238 4.962 3 8 3s5.5 2.238 5.5 5z" />
              <circle cx="6.2" cy="8" r=".65" fill="currentColor" stroke="none" />
              <circle cx="8" cy="8" r=".65" fill="currentColor" stroke="none" />
              <circle cx="9.8" cy="8" r=".65" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="fn-lbl">Ask</span>
        </button>
        <span className="fn-sep" />
        <span className="fn-time">{timer || "—"}</span>
      </div>
      <div id="fnToast" className={toastIn ? "fn-toast-in" : undefined}>
        {toast}
      </div>
    </>
  );
}
