"use client";

import { useEffect, useRef } from "react";
import {
  paintPassportMark,
  THEME_LABELS,
  PASSPORT_THEMES,
  type PassportTheme,
  type PassportView,
} from "@/lib/ceremony";

type PhiliaIdCardProps = {
  view: PassportView;
  flipped: boolean;
  interactive?: boolean;
  socialArch?: string;
  qrCaption?: string;
  highlightSocial?: boolean;
  onFlip?: () => void;
};

export function PhiliaIdCard({
  view,
  flipped,
  interactive = true,
  socialArch = "Pending",
  qrCaption,
  highlightSocial = false,
  onFlip,
}: PhiliaIdCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const caption = qrCaption ?? (view.serial ? view.serial : "Private passport mark");

  useEffect(() => {
    paintPassportMark(canvasRef.current, view.serial || view.name || "philia");
  }, [view.serial, view.name]);

  return (
    <div className={`pid-pair ${view.theme}${flipped ? " is-flipped" : ""}`}>
      <div
        className="pid-flip-shell"
        onClick={interactive ? onFlip : undefined}
        style={interactive ? undefined : { cursor: "default" }}
      >
        <div className="pid-flip-card">
          <section className="pid-card pid-front">
            <div className="pid-arch">
              <i />
              <i />
              <i />
              <i />
              <i />
              <span className="base" />
            </div>
            <div className="pid-inner">
              <div className="pid-brand">
                PHILIA LIFE <span className="pipe">|</span> SOCIALFIT
              </div>
              <div className="pid-status">
                <span className="pid-dot" />
                ACTIVE
              </div>
              <div className="pid-name">
                {view.rest ? (
                  <>
                    {view.first}
                    <br />
                    {view.rest}
                  </>
                ) : (
                  view.first
                )}
              </div>
              <div className="pid-tier">{view.tierLabel}</div>
            </div>
            <div className="pid-idp">
              <div className="pid-idp-c">
                <div className="pid-idt">PHILIA ID</div>
                <div className="pid-ids">Universal Passport</div>
                <div className="pid-rul" />
                <div className="pid-wld">Work · Life · Belonging</div>
              </div>
              <div className="pid-nfc" aria-hidden="true">
                <svg viewBox="0 0 32 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 28c6-6 14-6 20 0" />
                  <path d="M10 22c4-4 8-4 12 0" />
                  <path d="M14 16c2-2 4-2 6 0" />
                  <circle cx="16" cy="10" r="1.6" fill="currentColor" stroke="none" />
                </svg>
              </div>
            </div>
          </section>
          <section className="pid-card pid-back">
            <div className="pid-arch">
              <i />
              <i />
              <i />
              <i />
              <i />
              <span className="base" />
            </div>
            <div className="pid-inner">
              <div className="pid-btit">PHILIA ID</div>
              <div className="pid-field">
                <div className="pid-lbl">Member Since</div>
                <div className="pid-val">{view.since}</div>
                <div className="pid-mr" />
              </div>
              <div className="pid-field">
                <div className="pid-lbl">Tier</div>
                <div className="pid-val">{view.tierLabel}</div>
                <div className="pid-mr" />
              </div>
              <div className="pid-field">
                <div className="pid-lbl">Key Held</div>
                <div className="pid-val">Founder Key</div>
                <div className="pid-mr" />
              </div>
              <div className="pid-field compact">
                <div className="pid-lbl">Self Archetype</div>
                <div className="pid-val">{view.archetype}</div>
                <div className="pid-mr" />
              </div>
              <div className={`pid-field compact${highlightSocial ? " cer4-missing-field" : ""}`}>
                <div className="pid-lbl">Social Archetype</div>
                <div className="pid-val pending">{socialArch}</div>
                <div className="pid-mr" />
              </div>
              <div className="pid-field compact">
                <div className="pid-lbl">Passport ID</div>
                <div className="pid-val">{view.serial || "PH-DBX-EX-·····"}</div>
                <div className="pid-mr" />
              </div>
            </div>
            <div className="pid-qrw">
              <canvas
                ref={canvasRef}
                className="pid-qr-canvas"
                width={164}
                height={164}
                aria-label="Passport code"
              />
            </div>
            <div className="pid-qrc">{caption}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

type ThemeBarProps = {
  theme: PassportTheme;
  onPick: (theme: PassportTheme) => void;
};

export function PidThemeBar({ theme, onPick }: ThemeBarProps) {
  return (
    <div className="pid-vbar">
      {PASSPORT_THEMES.map((t) => (
        <button
          key={t}
          type="button"
          className={`pid-vbtn${theme === t ? " active" : ""}`}
          data-v={t}
          onClick={() => onPick(t)}
        >
          {THEME_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
