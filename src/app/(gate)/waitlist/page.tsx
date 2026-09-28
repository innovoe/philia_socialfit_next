"use client";

import { useEffect, useState } from "react";
import { readWaitlistNote } from "@/lib/ceremony";
import { clearSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function WaitlistPage() {
  const [message, setMessage] = useState("Dubai First Wave isn’t open for your area yet.");
  const [home, setHome] = useState("");

  useEffect(() => {
    const note = readWaitlistNote();
    if (note.message) setMessage(note.message);
    if (note.home) setHome(note.home);
  }, []);

  function backToPhilia() {
    clearSession();
    window.location.assign(routes.landing);
  }

  return (
    <main id="sWaitlist" className="screen">
      <div className="cer-topbar">
        <span className="cer-top-l">Philia Life</span>
        <span className="cer-top-c">SocialFit</span>
        <span className="cer-top-r">Dubai · First Wave</span>
      </div>
      <div
        className="cer-pad"
        style={{
          paddingTop: 72,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <p className="cer-super">Waitlist</p>
        <h1 className="cer-h" style={{ marginBottom: 24 }}>
          You’re on the list.
        </h1>
        <div className="cer-rule" />
        <p className="cer-p" style={{ margin: "0 0 16px" }}>
          {message}
        </p>
        {home ? (
          <p className="cer-p" style={{ margin: "0 0 16px", opacity: 0.72 }}>
            You marked home as “{home}”.
          </p>
        ) : null}
        <p className="cer-p" style={{ margin: 0 }}>
          We’ve saved your place. When your neighbourhood opens, we’ll reach you on the email and
          phone you verified.
        </p>
        <div style={{ marginTop: "auto", paddingTop: 48, paddingBottom: 40 }}>
          <button className="cer-cta" type="button" onClick={backToPhilia}>
            <span>Back to Philia</span>
            <span>→</span>
          </button>
          <div className="cer-status">No action needed · We’ll be in touch</div>
        </div>
      </div>
    </main>
  );
}
