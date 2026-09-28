"use client";

import { useEffect, useRef, useState } from "react";
import {
  CAT_LABELS,
  FALLBACK_CHIPS,
  HOME_CHIPS,
  KB_TOPIC_CHIPS,
  KB_TOPIC_INTRO,
  KB_TOPIC_LABELS,
  categoryChips,
  categoryIntro,
  issueResolution,
  kbAnswer,
  lookupAsk,
  nextTicket,
  normAsk,
  relatedChips,
  rewriteAskHtml,
  type TicketState,
} from "@/lib/ask-philia";

type Msg = { id: number; html: string; user: boolean };

type AskPhiliaProps = {
  open: boolean;
  explorerReady?: boolean;
  onClose: () => void;
};

function Typing() {
  return (
    <div className="ap-typing">
      <i />
      <i />
      <i />
    </div>
  );
}

export function AskPhilia({ open, explorerReady = false, onClose }: AskPhiliaProps) {
  const [inChat, setInChat] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chips, setChips] = useState<string[] | null>(null);
  const [issueChips, setIssueChips] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [ticket, setTicket] = useState<TicketState>(null);
  const [kbOpen, setKbOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  function resetHome() {
    setInChat(false);
    setMessages([]);
    setChips(null);
    setIssueChips(false);
    setThinking(false);
    setTicket(null);
    setKbOpen(null);
    setDraft("");
  }

  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(resetHome, 340);
    return () => window.clearTimeout(t);
  }, [open]);

  function push(html: string, user: boolean) {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { id, html: user ? html : rewriteAskHtml(html), user }]);
    return id;
  }

  function think(fn: () => void) {
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      fn();
    }, 700);
  }

  function goHome() {
    resetHome();
  }

  function startChat() {
    setInChat(true);
  }

  function ask(raw: string) {
    const q = normAsk(raw);
    startChat();
    setChips(null);
    setIssueChips(false);

    if (q === "back to topics") {
      goHome();
      return;
    }
    if (q === "i'm stuck" || q === "im stuck") {
      push("I'm stuck", true);
      think(() => {
        push("Let's fix it. What are you stuck on?", false);
        setChips(categoryChips("stuck"));
        setIssueChips(true);
      });
      return;
    }
    if (
      q === "still not working, raise a ticket" ||
      q === "raise a ticket" ||
      q === "send ticket"
    ) {
      push(raw, true);
      think(() => {
        const next = nextTicket(null, "something else");
        push(next.html, false);
        setTicket(next.state);
        setChips(next.chips || null);
        setIssueChips(!!next.issue);
      });
      return;
    }

    push(raw, true);
    think(() => {
      if (ticket) {
        const next = nextTicket(ticket, raw);
        push(next.html, false);
        setTicket(next.state);
        setChips(next.chips || null);
        setIssueChips(!!next.issue);
        return;
      }
      if (issueResolution(raw)) {
        const next = nextTicket(null, raw);
        push(next.html, false);
        setTicket(next.state);
        setChips(next.chips || null);
        setIssueChips(!!next.issue);
        return;
      }
      const hit = lookupAsk(raw);
      if (hit) {
        push(hit.html, false);
        setChips(relatedChips(hit.key));
        setIssueChips(false);
        return;
      }
      push(
        "I'm not sure about that one. Use the back arrow to pick a topic, or describe what you're stuck on and I'll help.",
        false,
      );
      setChips(FALLBACK_CHIPS);
      setIssueChips(false);
    });
  }

  function openCategory(id: string) {
    startChat();
    setChips(null);
    push(CAT_LABELS[id] || id, true);
    think(() => {
      if (id === "whatnext") {
        push(kbAnswer("what next") || categoryIntro(id), false);
        setChips(categoryChips("whatnext"));
        setIssueChips(false);
        return;
      }
      if (id === "stuck") {
        push("Let's fix it. What are you stuck on?", false);
        setChips(categoryChips("stuck"));
        setIssueChips(true);
        return;
      }
      push(categoryIntro(id), false);
      setChips(categoryChips(id));
      setIssueChips(false);
    });
  }

  function openTopic(id: string) {
    startChat();
    setChips(null);
    push(KB_TOPIC_LABELS[id] || id, true);
    think(() => {
      push(KB_TOPIC_INTRO[id] || "What would you like to know?", false);
      setChips(KB_TOPIC_CHIPS[id] || []);
      setIssueChips(false);
    });
  }

  function sendDraft() {
    const q = draft.trim();
    if (!q) return;
    setDraft("");
    ask(q);
  }

  function toggleKb(id: string) {
    if (!explorerReady) return;
    setKbOpen((cur) => (cur === id ? null : id));
  }

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const last = el.lastElementChild as HTMLElement | null;
    if (!last) return;
    if (last.classList.contains("ap-msg-user") || last.classList.contains("ap-typing")) {
      el.scrollTop = el.scrollHeight;
    } else {
      last.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [messages, thinking]);

  return (
    <div id="apOverlay" className={open ? "ap-open" : undefined}>
      <div className="ap-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            className="ap-back"
            type="button"
            onClick={goHome}
            style={{ display: inChat ? "flex" : "none" }}
          >
            ←
          </button>
          <span className="ap-title">Ask Philia</span>
        </div>
        <button className="ap-close" type="button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="ap-home" style={{ display: inChat ? "none" : "flex" }}>
        <p className="ap-home-intro">
          Questions about your Key, your Signal, your Philia ID, or what happens next.
        </p>
        <div className="ap-categories">
          <button className="ap-category" type="button" onClick={() => openCategory("whatis")}>
            <span className="ap-cat-label">About SocialFit</span>
          </button>
          <button className="ap-category" type="button" onClick={() => openCategory("whatnext")}>
            <span className="ap-cat-label">What next?</span>
          </button>
          <button className="ap-category" type="button" onClick={() => openCategory("mykey")}>
            <span className="ap-cat-label">My Key</span>
          </button>
          <button className="ap-category" type="button" onClick={() => openCategory("mysignal")}>
            <span className="ap-cat-label">My Signal</span>
          </button>
          <button className="ap-category" type="button" onClick={() => openCategory("philiaid")}>
            <span className="ap-cat-label">Philia ID</span>
          </button>
          <button className="ap-category" type="button" onClick={() => openCategory("threekeys")}>
            <span className="ap-cat-label">3 Keys</span>
          </button>
          <button className="ap-category" type="button" onClick={() => openCategory("privacy")}>
            <span className="ap-cat-label">Privacy</span>
          </button>
          <button
            className="ap-category ap-cat-issue"
            type="button"
            onClick={() => openCategory("stuck")}
          >
            <span className="ap-cat-label">I&apos;m stuck</span>
          </button>
        </div>
        <hr className="ap-home-divider" />
        <p className="ap-home-sub">Or ask in your own words below.</p>
        <div className={`ap-kb-accord${explorerReady ? "" : " is-locked"}`}>
          <div className="ap-kb-lockbar" style={{ display: explorerReady ? "none" : undefined }}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="7" width="10" height="7" rx="2" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            <span className="ap-kb-lockbar-label">
              SocialFit Guide · Unlocks when your Philia ID is active
            </span>
          </div>
          <div className="ap-kb-group">
            <button
              className={`ap-kb-group-hdr${kbOpen === "basics" ? " is-open" : ""}`}
              type="button"
              onClick={() => toggleKb("basics")}
            >
              <span className="ap-kb-group-label">Basics</span>
              <span className="ap-kb-chevron">›</span>
            </button>
            <div className={`ap-kb-group-body${kbOpen === "basics" ? " is-open" : ""}`}>
              <button className="ap-kb-row" type="button" onClick={() => openCategory("whatis")}>
                About SocialFit<span className="ap-kb-row-arrow">›</span>
              </button>
              <button className="ap-kb-row" type="button" onClick={() => openCategory("mykey")}>
                Keys &amp; access<span className="ap-kb-row-arrow">›</span>
              </button>
            </div>
          </div>
          <div className="ap-kb-group">
            <button
              className={`ap-kb-group-hdr${kbOpen === "using" ? " is-open" : ""}`}
              type="button"
              onClick={() => toggleKb("using")}
            >
              <span className="ap-kb-group-label">Using SocialFit</span>
              <span className="ap-kb-chevron">›</span>
            </button>
            <div className={`ap-kb-group-body${kbOpen === "using" ? " is-open" : ""}`}>
              <button className="ap-kb-row" type="button" onClick={() => openCategory("mysignal")}>
                Signals &amp; matching<span className="ap-kb-row-arrow">›</span>
              </button>
              <button className="ap-kb-row" type="button" onClick={() => openCategory("philiaid")}>
                Philia ID &amp; Social Mirror<span className="ap-kb-row-arrow">›</span>
              </button>
              <button className="ap-kb-row" type="button" onClick={() => openTopic("pods")}>
                Pods, Rooms &amp; real life<span className="ap-kb-row-arrow">›</span>
              </button>
            </div>
          </div>
          <div className="ap-kb-group">
            <button
              className={`ap-kb-group-hdr${kbOpen === "account" ? " is-open" : ""}`}
              type="button"
              onClick={() => toggleKb("account")}
            >
              <span className="ap-kb-group-label">Account &amp; safety</span>
              <span className="ap-kb-chevron">›</span>
            </button>
            <div className={`ap-kb-group-body${kbOpen === "account" ? " is-open" : ""}`}>
              <button className="ap-kb-row" type="button" onClick={() => openCategory("privacy")}>
                Privacy &amp; safety<span className="ap-kb-row-arrow">›</span>
              </button>
              <button className="ap-kb-row" type="button" onClick={() => openTopic("plans")}>
                Plans &amp; membership<span className="ap-kb-row-arrow">›</span>
              </button>
              <button
                className="ap-kb-row ap-kb-row-issue"
                type="button"
                onClick={() => openCategory("stuck")}
              >
                Report / get help
                <span className="ap-kb-row-arrow" style={{ color: "rgba(170,32,32,.22)" }}>
                  ›
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="ap-messages"
        ref={listRef}
        style={{ display: inChat ? "flex" : "none", flex: 1 }}
      >
        {messages.map((m) => (
          <div key={m.id} className={`ap-msg ${m.user ? "ap-msg-user" : "ap-msg-ai"}`}>
            {m.user ? <p>{m.html}</p> : <p dangerouslySetInnerHTML={{ __html: m.html }} />}
          </div>
        ))}
        {thinking ? <Typing /> : null}
      </div>

      <div
        className="ap-chips"
        style={{ display: inChat && chips && chips.length && !thinking ? "flex" : "none" }}
      >
        {(chips || HOME_CHIPS).map((label) => (
          <button
            key={label}
            className={`ap-chip${issueChips ? " ap-chip-issue" : ""}`}
            type="button"
            onClick={() => ask(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ap-input-row">
        <input
          type="text"
          className="ap-input"
          placeholder={inChat ? "Ask a follow-up…" : "Ask anything about your SocialFit journey."}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendDraft();
          }}
        />
        <button className="ap-send" type="button" onClick={sendDraft}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 17V4M4 9l6-6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
