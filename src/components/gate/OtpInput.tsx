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
    return refs.current.map((el) => (el?.value ?? "").replace(/\D/g, "").slice(-1)).join("");
  }

  function setAt(index: number, digits: string, clearRest = false) {
    const chars = digits.replace(/\D/g, "").slice(0, length - index).split("");
    chars.forEach((ch, offset) => {
      const el = refs.current[index + offset];
      if (el) el.value = ch;
    });
    if (clearRest) {
      for (let j = index + chars.length; j < length; j++) {
        const el = refs.current[j];
        if (el) el.value = "";
      }
    }
    const focusIndex = chars.length
      ? Math.min(index + chars.length, length - 1)
      : index;
    refs.current[focusIndex]?.focus();
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
          maxLength={length}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          placeholder=" "
          disabled={disabled}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setAt(i, digits, digits.length > 1);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
            if (!digits) return;
            setAt(digits.length >= length || i === 0 ? 0 : i, digits, true);
          }}
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
