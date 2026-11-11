"use client";

import { useEffect, useState } from "react";
import { readSession } from "@/lib/session";

function formatPathRemain(iso: string | null) {
  if (!iso) return "24h remaining";
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return "24h remaining";
  const sec = Math.max(0, Math.floor((end - Date.now()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m remaining`;
}

/** Boxed "invite-only access" panel from philia-flow-merged.html. Shown on /origins only. */
export function FounderPathPanel() {
  const [remain, setRemain] = useState("24h remaining");

  useEffect(() => {
    function tick() {
      const s = readSession();
      setRemain(formatPathRemain(s.claimDeadline || s.finishDeadline));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="engraved-panel">
      <div className="ep-rail" aria-hidden="true" />
      <div className="ep-grid" aria-hidden="true" />
      <div className="ep-arch" aria-hidden="true">
        <span className="a" />
        <span className="a" />
        <span className="a" />
        <span className="a" />
        <span className="a" />
        <span className="a" />
        <span className="a" />
      </div>
      <div className="ep-sparkles" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="ep-copy">
        <h3>This is invite-only access.</h3>
        <p className="ep-sub">Your Founder Key opens a staged path.</p>
        <ul className="ep-steps">
          <li>24h to claim Explorer</li>
          <li>24h to unlock your Philia ID</li>
          <li>24h to send your 3 Keys</li>
        </ul>
        <p className="ep-note">Each stage opens after the last is complete.</p>
      </div>
      <div className="ep-ticker" aria-label="Claim Explorer countdown">
        <span className="ep-dot" />
        <span className="ep-task">Claim Explorer</span>
        <span className="ep-sep">·</span>
        <span>{remain}</span>
        <span className="ep-mark">)))</span>
      </div>
    </div>
  );
}
