"use client";

import { useEffect, useMemo, useState } from "react";
import { videos } from "@/lib/assets";
import { hasAccess, readSession } from "@/lib/session";
import { isInviteSession } from "@/lib/invite";
import { routes } from "@/lib/routes";

function formatWindow(iso: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diff = Math.max(0, t - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function VerifiedPage() {
  const [deadline, setDeadline] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [invite, setInvite] = useState(false);

  useEffect(() => {
    if (!hasAccess()) {
      window.location.replace(routes.verify);
      return;
    }
    const s = readSession();
    setInvite(isInviteSession());
    setDeadline(s.finishDeadline || s.claimDeadline);
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const windowLabel = useMemo(() => formatWindow(deadline), [deadline, now]);

  return (
    <main className="verified-wrap">
      <div className="verified-body">
        <div className="verified-check">
          <span>✓</span>
        </div>
        <h1 className="verified-head">You&apos;re verified.</h1>
        <div className="verified-card">
          <video autoPlay muted loop playsInline preload="auto">
            <source src={videos.keyIsLive} type="video/mp4" />
          </video>
        </div>
        <p className="verified-stakes">
          {invite
            ? "Your Key is live. Finish setup before the window closes."
            : "Your Founder Key is live. Finish setup before the window closes."}
        </p>
        <p className="verified-note">
          {invite
            ? "If the window closes, your access becomes dormant and this Key returns to your friend."
            : "If the window closes, your access becomes dormant and this Key returns to the founder pool."}
        </p>
        <div className="verified-line" />
        <div className="verified-cards">
          <div className="verified-info">
            <p className="verified-info-label">What is SocialFit</p>
            <p className="verified-info-text">
              SocialFit is a new way to find your people in a city.
            </p>
            <p className="verified-info-text">
              Your needs and moods become live Signals, carrying your unique
              frequency into the city and finding the people who resonate.
            </p>
            <p className="verified-info-text">
              No swiping. No performing for a feed. Just a more natural way for
              the right people to find one another.
            </p>
          </div>
          <div className="verified-info">
            <p className="verified-info-label">Who it&apos;s for</p>
            <div className="verified-selves">
              <span>the unedited self</span>
              <span>the ambitious self</span>
              <span>the soft self</span>
              <span>the curious self</span>
              <span>the social self</span>
            </div>
          </div>
          <div className="verified-info">
            <p className="verified-info-label">What happens now</p>
            <p className="verified-info-text">Key is live. Now we listen.</p>
            <p className="verified-info-text">
              Your SocialFit Story is how Philia gets to know the real you: your
              world, your needs, your ambitions, who you&apos;re becoming.
            </p>
            <p className="verified-info-text">
              The more honestly you share, the better Philia&apos;s Trust Graph
              can find the rooms, people and moments that genuinely fit.
            </p>
          </div>
        </div>
        <div className="verified-cta-wrap">
          <button
            className="verified-cta"
            type="button"
            onClick={() => window.location.assign(routes.story)}
          >
            <span>Begin SocialFit Story</span>
            <span>→</span>
            <span className="verified-cta-dot" />
            <span className="verified-cta-ring one" />
            <span className="verified-cta-ring two" />
          </button>
          <div className="verified-status">
            <span className="verified-dot" />
            <span>{invite ? "Key live" : "Founder Key live"}</span>
            <span className="verified-sep">·</span>
            <span>{windowLabel || "Window pending"}</span>
            <span className="verified-mark">)))</span>
          </div>
        </div>
      </div>
    </main>
  );
}
