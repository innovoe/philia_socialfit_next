"use client";

import { useRef } from "react";

type OtpInputProps = {
  length?: number;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
};

export function OtpInput({
  length = 6,
  onChange,
  disabled,
  label = "One-time code",
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function readValue() {
    return refs.current.map((el) => el?.value ?? "").join("");
  }

  function setAt(index: number, digits: string) {
    const chars = digits.replace(/\D/g, "").slice(0, length - index).split("");
    chars.forEach((ch, i) => {
      const el = refs.current[index + i];
      if (el) el.value = ch;
    });
    const focusAt = Math.min(index + chars.length, length - 1);
    refs.current[focusAt]?.focus();
    onChange(readValue());
  }

  return (
    <div className="gate-otp" role="group" aria-label={label}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="gate-otp-box"
          maxLength={1}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          placeholder=" "
          disabled={disabled}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Backspace") return;
            const el = refs.current[i];
            if (el && !el.value && i > 0) {
              const prev = refs.current[i - 1];
              if (prev) {
                prev.value = "";
                prev.focus();
              }
              onChange(readValue());
            }
          }}
        />
      ))}
    </div>
  );
}
