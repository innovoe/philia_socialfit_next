"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { refusalLine } from "@/lib/api/errors";
import {
  getMyKeys,
  outboundClockMs,
  sendKey,
  type OutboundKey,
} from "@/lib/api/keys";
import { sanitizeContactField } from "@/lib/api/phone";
import {
  cer5BuildMsg,
  cer5ContactRaw,
  cer5IsUnsent,
  cer5NormalizeContact,
  cer5PillLabel,
  cer5StatusCopy,
  formatCer5Clock,
  sendKeyErrorMessage,
  sentStatusLine,
  type KeyInvite,
} from "@/lib/ceremony-keys";
import { goHub } from "@/lib/hub";

const SLOTS = [1, 2, 3] as const;
type Slot = (typeof SLOTS)[number];

type Draft = {
  name: string;
  contact: string;
  isEmail: boolean;
  dubai: boolean;
  msgOpen: boolean;
  error: string;
  sending: boolean;
};

const emptyDraft = (): Draft => ({
  name: "",
  contact: "",
  isEmail: false,
  dubai: false,
  msgOpen: false,
  error: "",
  sending: false,
});

function WaIcon() {
  return (
    <svg className="cer5-wa-icon" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.556 4.12 1.528 5.852L.057 23.516a.5.5 0 00.624.601l5.806-1.525A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.064-1.411l-.363-.216-3.764.988.999-3.67-.236-.375A9.778 9.778 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}

export function KeysNominate() {
  const [keys, setKeys] = useState<OutboundKey[]>([]);
  const [open, setOpen] = useState<Slot | null>(1);
  const [drafts, setDrafts] = useState<Record<Slot, Draft>>({
    1: emptyDraft(),
    2: emptyDraft(),
    3: emptyDraft(),
  });
  const [invites, setInvites] = useState<Record<Slot, KeyInvite | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [clock, setClock] = useState("24:00:00");

  function patchDraft(n: Slot, patch: Partial<Draft>) {
    setDrafts((cur) => ({ ...cur, [n]: { ...cur[n], ...patch } }));
  }

  function applyKeys(list: OutboundKey[]) {
    setKeys(list);
    let firstUnsent: Slot | null = null;
    list.forEach((k, i) => {
      const slot = (Number(k.slot) || i + 1) as Slot;
      if (![1, 2, 3].includes(slot)) return;
      if (cer5IsUnsent(k) && firstUnsent == null) firstUnsent = slot;
    });
    setInvites((cur) => {
      const next = { ...cur };
      list.forEach((k, i) => {
        const slot = (Number(k.slot) || i + 1) as Slot;
        if (![1, 2, 3].includes(slot)) return;
        if (k.invite_code || k.invite_url) {
          next[slot] = { invite_code: k.invite_code, invite_url: k.invite_url };
        }
      });
      return next;
    });
    setDrafts((cur) => {
      const next = { ...cur };
      list.forEach((k, i) => {
        const slot = (Number(k.slot) || i + 1) as Slot;
        if (![1, 2, 3].includes(slot)) return;
        if (!cer5IsUnsent(k)) {
          const name = k.nominee_name || "Sent";
          const contact = k.nominee_contact || k.claimer_mobile || k.claimer_email || "";
          const cleaned = sanitizeContactField(contact);
          next[slot] = {
            ...next[slot],
            name,
            contact: cleaned.value || String(contact),
            isEmail: cleaned.isEmail,
            dubai: true,
            sending: false,
            error: "",
          };
        }
      });
      return next;
    });
    setOpen(firstUnsent || 1);
  }

  useEffect(() => {
    getMyKeys()
      .then(applyKeys)
      .catch(() => {
        setKeys([]);
      });
  }, []);

  useEffect(() => {
    let best: number | null = null;
    keys.forEach((k) => {
      const dl = outboundClockMs(k);
      if (dl && (best == null || dl < best)) best = dl;
    });
    function paint() {
      setClock(formatCer5Clock(best));
    }
    paint();
    if (!best) return;
    const id = window.setInterval(paint, 1000);
    return () => window.clearInterval(id);
  }, [keys]);

  const sentCount = useMemo(
    () => keys.filter((k) => !cer5IsUnsent(k)).length,
    [keys],
  );

  function toggle(n: Slot) {
    setOpen((cur) => (cur === n ? null : n));
  }

  function onContact(n: Slot, raw: string) {
    const cleaned = sanitizeContactField(raw);
    patchDraft(n, {
      contact: cleaned.isEmail ? raw : cleaned.value,
      isEmail: cleaned.isEmail,
    });
  }

  async function onSend(n: Slot) {
    const key = keys.find((k) => Number(k.slot) === n);
    if (key && !cer5IsUnsent(key)) return;
    const draft = drafts[n];
    const name = draft.name.trim();
    if (!name) {
      patchDraft(n, { error: "Add a nominee name." });
      return;
    }
    const norm = cer5NormalizeContact(cer5ContactRaw(draft.contact));
    const contact = norm.contact;
    if (norm.error || !contact) {
      patchDraft(n, { error: norm.error || "Add a UAE mobile or email." });
      return;
    }
    if (!draft.dubai) {
      patchDraft(n, { error: "Confirm this nominee is 18+ to send." });
      return;
    }
    let keyId = key?.key_id ?? null;
    patchDraft(n, { sending: true, error: "" });
    try {
      if (keyId == null) {
        const fresh = await getMyKeys();
        applyKeys(fresh);
        const found = fresh.find((k) => Number(k.slot) === n);
        keyId = found?.key_id ?? null;
      }
      if (keyId == null) {
        patchDraft(n, { sending: false, error: "No Key in this slot yet — activate Explorer first." });
        return;
      }
      const r = await sendKey(keyId, { nominee_name: name, nominee_contact: contact });
      const invite: KeyInvite = {
        invite_code: r.invite_code || null,
        invite_url: r.invite_url || null,
      };
      setInvites((cur) => ({ ...cur, [n]: invite }));
      const merged: OutboundKey = {
        ...(key || {}),
        ...r,
        slot: n,
        key_id: keyId,
        state: r.state || "sent",
        nominee_name: name,
        nominee_contact: contact,
        invite_code: invite.invite_code,
        invite_url: invite.invite_url,
      };
      setKeys((cur) => {
        const next = cur.filter((k) => Number(k.slot) !== n);
        next.push(merged);
        return next.sort((a, b) => (Number(a.slot) || 0) - (Number(b.slot) || 0));
      });
      patchDraft(n, { sending: false, name, dubai: true });
      if (norm.isPhone) {
        const msg = encodeURIComponent(cer5BuildMsg(name, invite));
        const num = contact.replace(/\D/g, "");
        window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
      }
      if (n < 3) {
        window.setTimeout(() => setOpen((n + 1) as Slot), 400);
      }
      getMyKeys().then(setKeys).catch(() => {});
    } catch (err) {
      patchDraft(n, { sending: false, error: refusalLine(err, sendKeyErrorMessage) });
    }
  }

  return (
    <>
      <div className="cer5-ticker">
        <div className="cer5-ticker-inner">
          {Array.from({ length: 10 }, (_, i) => (
            <Fragment key={i}>
              <div className="cer5-clock-seg">
                <span className="cer5-clock-val cer5-clock-node">{clock}</span>
              </div>
              <div className="cer5-clock-sep" />
            </Fragment>
          ))}
        </div>
      </div>

      <div className="cer5-info-block">
        <div className="cer5-info-col">
          <div className="cer5-info-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19 7l-1-4H6L5 7" />
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M12 7v14M9 13h6" />
            </svg>
          </div>
          <p className="cer5-info-label">3 Keys issued</p>
          <p className="cer5-info-sub">Send window from activate</p>
        </div>
        <div className="cer5-info-sep" />
        <div className="cer5-info-col">
          <div className="cer5-info-icon">
            <svg viewBox="0 0 24 24">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <circle cx="12" cy="16" r="1" fill="rgba(32,32,52,.45)" />
            </svg>
          </div>
          <p className="cer5-info-label">When all 3 are claimed</p>
          <p className="cer5-info-sub">Your Social Archetype unlocks and your Philia ID activates.</p>
        </div>
      </div>

      <div className="cer5-accordion" style={{ marginTop: 28 }}>
        {SLOTS.map((n) => {
          const key = keys.find((k) => Number(k.slot) === n);
          const sent = !!(key && !cer5IsUnsent(key));
          const draft = drafts[n];
          const isOpen = open === n;
          const label = sent ? `${draft.name || key?.nominee_name || "Sent"} ✓` : draft.name.trim();
          const heading = sent
            ? `${draft.name || key?.nominee_name || "This nominee"} already holds this Key.`
            : "Nominate someone who gets you.";
          const desc = sent
            ? cer5StatusCopy(key)
            : "Someone who has seen you socially. Not just professionally or online.";
          const pill = sent ? cer5PillLabel(key) : "Send window";
          const msg = cer5BuildMsg(draft.name, invites[n]);
          const pad = n < 10 ? `0${n}` : String(n);

          return (
            <div
              key={n}
              className={`cer5-acc-card${isOpen ? " is-open" : ""}${sent ? " is-sent" : ""}`}
              data-key={n}
            >
              <div className="cer5-acc-header" onClick={() => toggle(n)}>
                <div className="cer5-key-badge">{pad}</div>
                <div className="cer5-acc-header-left">
                  <p className="cer5-acc-num">Philia Key · {pad} of 03</p>
                  <p className="cer5-acc-name">{label}</p>
                </div>
                <div className="cer5-acc-header-right">
                  <div className="cer5-active-pill">
                    {!sent ? (
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12,7 12,12 15,15" />
                      </svg>
                    ) : null}
                    {pill}
                  </div>
                  <div className="cer5-acc-chevron">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="4,6 8,10 12,6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="cer5-acc-body">
                <div className="cer5-acc-body-inner">
                  <div className="cer5-acc-divider" />
                  <p className="cer5-acc-heading">{heading}</p>
                  <p className="cer5-acc-desc">{desc}</p>
                  <input
                    className="cer5-acc-input"
                    placeholder="Their name"
                    value={draft.name}
                    readOnly={sent}
                    disabled={sent}
                    onChange={(e) => {
                      patchDraft(n, { name: e.target.value, error: draft.dubai ? "" : draft.error });
                    }}
                  />
                  <div className={`uae-phone-wrap${draft.isEmail ? " is-email" : ""}`}>
                    <span className="uae-phone-cc" aria-hidden="true">
                      +971
                    </span>
                    <input
                      className="cer5-acc-input uae-phone-local"
                      type={draft.isEmail ? "email" : "tel"}
                      inputMode={draft.isEmail ? "email" : "numeric"}
                      placeholder="50 123 4567"
                      autoComplete="tel"
                      maxLength={64}
                      value={draft.contact}
                      readOnly={sent}
                      disabled={sent}
                      onChange={(e) => onContact(n, e.target.value)}
                    />
                  </div>
                  <div className={`cer5-msg-preview${draft.msgOpen ? " is-open" : ""}`}>
                    <div className="cer5-msg-toggle" onClick={() => patchDraft(n, { msgOpen: !draft.msgOpen })}>
                      <span className="cer5-msg-toggle-label">Message preview</span>
                      <span className="cer5-msg-toggle-chev">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="4,6 8,10 12,6" />
                        </svg>
                      </span>
                    </div>
                    <div className="cer5-msg-body">
                      <p className="cer5-msg-text">{msg}</p>
                    </div>
                  </div>
                  <label className="cer5-dubai-check">
                    <input
                      type="checkbox"
                      checked={draft.dubai}
                      disabled={sent}
                      onChange={(e) =>
                        patchDraft(n, { dubai: e.target.checked, error: e.target.checked ? "" : draft.error })
                      }
                    />{" "}
                    Please confirm this nominee is 18+ and a Dubai resident
                  </label>
                  <button
                    className="cer5-wa-btn"
                    type="button"
                    disabled={sent || draft.sending}
                    onClick={() => onSend(n)}
                  >
                    <WaIcon />
                    {draft.sending ? "Sending…" : sent ? (pill === "Activated" ? "Key activated ✓" : "Key sent ✓") : "Send Key →"}
                  </button>
                  {draft.error ? (
                    <p
                      style={{
                        display: "block",
                        margin: "10px 0 0",
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 12,
                        lineHeight: 1.4,
                        color: "rgba(172,55,35,.9)",
                      }}
                    >
                      {draft.error}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ paddingTop: 40 }}>
        <button className="cer-cta" type="button" onClick={() => goHub()}>
          <span>Live Key Tracker</span>
          <span>→</span>
        </button>
        <div className="cer-status">{sentStatusLine(sentCount)}</div>
      </div>

    </>
  );
}
