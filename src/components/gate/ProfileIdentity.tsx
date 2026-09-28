"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  PROFILE_GENDERS,
  patchMe,
  type Me,
  type ProfileGender,
} from "@/lib/api/member";
import { patchMeError } from "@/lib/identity";
import { applyMeToSession } from "@/lib/session";

const field: CSSProperties = {
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
};

const saveBtn: CSSProperties = {
  padding: "13px 18px",
  borderRadius: 12,
  background: "#202034",
  border: "none",
  cursor: "pointer",
  fontFamily: "Montserrat,sans-serif",
  fontSize: 9,
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: "#fff",
};

type Props = {
  me: Me | null;
  onMe: (next: Me) => void;
};

export function ProfileIdentity({ me, onMe }: Props) {
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(me?.display_name || "");
  const [addressDraft, setAddressDraft] = useState(me?.address || "");
  const [dobDraft, setDobDraft] = useState(me?.date_of_birth || "");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setNameDraft(me?.display_name || "");
    setAddressDraft(me?.address || "");
    setDobDraft(me?.date_of_birth || "");
  }, [me]);

  function sync(next: Me) {
    onMe(next);
    applyMeToSession(next);
    setNameDraft(next.display_name || "");
    setAddressDraft(next.address || "");
    setDobDraft(next.date_of_birth || "");
  }

  async function save(body: Parameters<typeof patchMe>[0], key: string) {
    setBusy(key);
    setErr("");
    setNote("");
    try {
      const next = await patchMe(body);
      sync(next);
      setNote("Saved");
      window.setTimeout(() => setNote(""), 1600);
      if (key === "name") setNameOpen(false);
    } catch (e) {
      setErr(patchMeError(e));
    } finally {
      setBusy(null);
    }
  }

  const gender = me?.gender || "";
  const inviteHint = me?.name_source === "invite" && me?.display_name;

  return (
    <div style={{ marginBottom: 32 }}>
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
        Your details
      </div>
      <p
        style={{
          fontFamily: "Inter,sans-serif",
          fontSize: 11,
          color: "rgba(32,32,52,.38)",
          margin: "0 0 16px",
          lineHeight: 1.55,
        }}
      >
        Your name is printed on your Philia ID. Age, gender, and address stay on Profile — not on the card.
      </p>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(32,32,52,.08)",
          background: "rgba(255,255,255,.55)",
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setNameDraft(me?.display_name || "");
            setNameOpen((v) => !v);
          }}
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
              Display name
            </div>
            <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.38)" }}>
              {me?.display_name || "Add your name"}
              {inviteHint ? " · from your application" : ""}
            </div>
          </div>
          <span style={{ fontFamily: "Inter,sans-serif", fontSize: 18, color: "rgba(32,32,52,.18)", fontWeight: 300 }}>
            ›
          </span>
        </button>
        {nameOpen ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 18px 16px" }}>
            {inviteHint ? (
              <p style={{ margin: 0, fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(32,32,52,.40)", lineHeight: 1.5 }}>
                This name is from your application. Save it to keep it on your ID and Key messages.
              </p>
            ) : null}
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your name"
              maxLength={150}
              style={field}
            />
            <button
              type="button"
              style={{ ...saveBtn, opacity: busy === "name" ? 0.6 : 1 }}
              disabled={busy === "name"}
              onClick={() => save({ display_name: nameDraft.trim() }, "name")}
            >
              {busy === "name" ? "Saving…" : "Save name →"}
            </button>
          </div>
        ) : null}
      </div>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(32,32,52,.08)",
          background: "rgba(255,255,255,.55)",
          padding: "16px 18px",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--steel)",
            marginBottom: 4,
          }}
        >
          Gender
        </div>
        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.38)", marginBottom: 12 }}>
          {me?.gender_source === "story" && gender ? "From your Story — tap to save it on Profile" : "Optional"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PROFILE_GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              className="pchip"
              data-on={gender === g ? "1" : "0"}
              disabled={busy === "gender"}
              onClick={() => save({ gender: g as ProfileGender }, "gender")}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(32,32,52,.08)",
          background: "rgba(255,255,255,.55)",
          padding: "16px 18px",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--steel)",
            marginBottom: 4,
          }}
        >
          Date of birth
        </div>
        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.38)", marginBottom: 12 }}>
          {me?.age != null ? `${me.age} · exact age, not the Story band` : "Optional · 18 or over"}
        </div>
        <input
          type="date"
          value={dobDraft}
          onChange={(e) => {
            const v = e.target.value;
            setDobDraft(v);
            if (v && v !== (me?.date_of_birth || "")) save({ date_of_birth: v }, "dob");
          }}
          onBlur={() => {
            const cur = me?.date_of_birth || "";
            if (dobDraft === cur) return;
            save({ date_of_birth: dobDraft || null }, "dob");
          }}
          style={field}
        />
      </div>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(32,32,52,.08)",
          background: "rgba(255,255,255,.55)",
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontFamily: "Montserrat,sans-serif",
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--steel)",
            marginBottom: 4,
          }}
        >
          Address
        </div>
        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(32,32,52,.38)", marginBottom: 12 }}>
          Private to you and Philia. Not on your ID, not shown to other members.
        </div>
        <textarea
          value={addressDraft}
          onChange={(e) => setAddressDraft(e.target.value)}
          placeholder="Street, building, area"
          rows={3}
          style={{ ...field, resize: "vertical", minHeight: 72, lineHeight: 1.45 }}
        />
        <button
          type="button"
          style={{ ...saveBtn, marginTop: 8, opacity: busy === "address" ? 0.6 : 1 }}
          disabled={busy === "address"}
          onClick={() => save({ address: addressDraft.trim() }, "address")}
        >
          {busy === "address" ? "Saving…" : "Save address →"}
        </button>
      </div>

      {err ? (
        <p style={{ margin: "10px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(172,55,35,.75)" }}>
          {err}
        </p>
      ) : null}
      {note ? (
        <p style={{ margin: "10px 0 0", fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(32,32,52,.40)" }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
