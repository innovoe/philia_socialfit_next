"use client";

import { useEffect, useState } from "react";
import { PlaceMapPicker } from "@/components/gate/PlaceMapPicker";
import {
  FREETEXT_KEYS,
  PILL_KEYS,
  SB_FIELDS,
  cap,
  type StoryAnswer,
  type StoryAnswers,
  type StoryField,
} from "@/lib/story-data";

export function StorySheet({
  fieldKey,
  answers,
  onClose,
  onPick,
}: {
  fieldKey: string | null;
  answers: StoryAnswers;
  onClose: () => void;
  onPick: (key: string, value: StoryAnswer, extra?: { partnershipNote?: string }) => void;
}) {
  const field = fieldKey
    ? (SB_FIELDS[fieldKey as keyof typeof SB_FIELDS] as StoryField | undefined)
    : null;
  const [temp, setTemp] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherVal, setOtherVal] = useState("");
  const [partnership, setPartnership] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const isPod = fieldKey === "home" || fieldKey === "work" || fieldKey === "frequent";
  const isMulti = field?.type === "multi" || field?.type === "rank";

  useEffect(() => {
    if (!fieldKey || !field) return;
    const cur = answers[fieldKey];
    setTemp(Array.isArray(cur) ? [...cur] : []);
    setOtherOpen(false);
    setOtherVal("");
    setExpanded(null);
    setPartnership(String(answers.partnershipNote || ""));
  }, [fieldKey]);

  if (!fieldKey || !field) return null;

  const max = field.max || 1;
  const count = temp.length;
  const needMore = field.min && count < field.min;
  const counter = needMore
    ? `${count} ${field.type === "rank" ? "ranked" : "selected"}. Pick ${field.min! - count} more.`
    : `${count} / ${max} ${field.type === "rank" ? "ranked" : "selected"}`;
  const canSave = count >= (field.min || 1);
  const showPartnership = fieldKey === "need" && temp.includes("Partnership");

  function pickSingle(value: string) {
    onPick(fieldKey!, value);
    onClose();
  }

  function toggle(opt: string) {
    setTemp((cur) => {
      const idx = cur.indexOf(opt);
      if (idx >= 0) return cur.filter((x) => x !== opt);
      if (cur.length >= max) return cur;
      return [...cur, opt];
    });
  }

  function confirmOther() {
    const val = otherVal.trim();
    if (!val) return;
    pickSingle(val);
  }

  return (
    <>
      <div className="sb-backdrop open" onClick={onClose} />
      <div className={`sb-sheet open${isPod ? " sb-sheet-place" : ""}`}>
        <div className="sb-handle" />
        <div className="sb-sheet-top">
          <span className="sb-sheet-label">{field.label}</span>
          <button className="sb-sheet-close" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="sb-sheet-hint">{field.hint}</p>

        {isPod ? (
          <PlaceMapPicker
            fieldKey={fieldKey as "home" | "work" | "frequent"}
            current={answers[fieldKey]}
            onPick={(value) => {
              onPick(fieldKey, value);
              onClose();
            }}
          />
        ) : (
          <>
            <div className="sb-options-wrap">
              {PILL_KEYS.has(fieldKey) ? (
                <div className="sb-options-pills" id="sbOptionsList">
                  {field.options.map((o) => {
                    const sel = isMulti && temp.includes(o.main);
                    return (
                      <button
                        key={o.main}
                        className={`sb-pill-opt${sel ? " sb-pill-selected" : ""}`}
                        type="button"
                        onClick={() => (isMulti ? toggle(o.main) : pickSingle(o.main))}
                      >
                        {cap(o.main)}
                      </button>
                    );
                  })}
                  {FREETEXT_KEYS.has(fieldKey) ? (
                    <div className="sb-other-row" style={{ width: "100%" }}>
                      <button className="sb-other-btn" type="button" onClick={() => setOtherOpen(true)}>
                        + Not on the list? Type it in
                      </button>
                      <div className={`sb-other-input-wrap${otherOpen ? " open" : ""}`}>
                        <input
                          className="sb-other-input"
                          placeholder="Type it in…"
                          value={otherVal}
                          onChange={(e) => setOtherVal(e.target.value)}
                        />
                        <button className="sb-other-confirm" type="button" onClick={confirmOther}>
                          Done
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="sb-options-grid" id="sbOptionsList">
                  {field.options.map((o, i) => {
                    const rankIdx = temp.indexOf(o.main);
                    const sel = isMulti && rankIdx >= 0;
                    const examples = o.examples;
                    return (
                      <button
                        key={o.main}
                        className={`sb-option${field.type === "rank" ? " sb-rank-item" : ""}${
                          sel ? (field.type === "rank" ? " sb-rank-selected" : " sb-option-selected") : ""
                        }`}
                        type="button"
                        onClick={() => (isMulti ? toggle(o.main) : pickSingle(o.main))}
                      >
                        {field.type === "rank" ? (
                          <div className="sb-rank-row">
                            <span className="sb-rank-num">{sel ? rankIdx + 1 : ""}</span>
                            <span className="sb-option-main">
                              {cap(o.main)}
                              {o.sub ? (
                                <>
                                  <br />
                                  <span className="sb-option-sub">{cap(o.sub)}</span>
                                </>
                              ) : null}
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="sb-option-main">{cap(o.main)}</span>
                            {o.sub ? <span className="sb-option-sub">{cap(o.sub)}</span> : null}
                          </>
                        )}
                        {examples?.length ? (
                          <>
                            <span
                              className={`sb-opt-expand${expanded === i ? " open" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpanded((cur) => (cur === i ? null : i));
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path
                                  d="M2 3.5L5 6.5L8 3.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Examples
                            </span>
                            <div className={`sb-opt-examples${expanded === i ? " open" : ""}`}>
                              {examples.map((ex) => (
                                <div key={ex} className="sb-opt-example-line">
                                  {cap(ex)}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {showPartnership ? (
              <div className="sb-partnership-followup open">
                <p className="sb-partnership-label">In partnership</p>
                <textarea
                  className="sb-partnership-input"
                  rows={2}
                  placeholder="What are you looking for?"
                  value={partnership}
                  onChange={(e) => setPartnership(e.target.value)}
                />
              </div>
            ) : null}

            {isMulti ? (
              <div className="sb-sheet-footer">
                <div className="sb-counter">{counter}</div>
                <button
                  className="sb-save-btn"
                  type="button"
                  disabled={!canSave}
                  onClick={() => {
                    onPick(fieldKey, [...temp], {
                      partnershipNote: showPartnership ? partnership.trim() : "",
                    });
                    onClose();
                  }}
                >
                  Add to my story
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
