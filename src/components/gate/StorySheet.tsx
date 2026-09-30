"use client";

import { useEffect, useMemo, useState } from "react";
import { getNeighbourhoods, type Neighbourhood } from "@/lib/api/story";
import {
  FREETEXT_KEYS,
  FREQUENT_VARIES,
  FREQUENT_VARIES_SUB,
  HOME_ANOTHER,
  HOME_ANOTHER_SUB,
  PILL_KEYS,
  SB_FIELDS,
  WORK_FROM_HOME,
  WORK_FROM_HOME_SUB,
  cap,
  type StoryAnswer,
  type StoryAnswers,
  type StoryField,
} from "@/lib/story-data";

type Pod = { name: string; hint: string };
type HomeRow = {
  kind: "pod" | "area" | "another" | "fromhome" | "varies";
  main: string;
  sub: string;
  value: string;
};

function splitHints(hint: string) {
  return String(hint || "")
    .split(",")
    .map((s) => s.replace(/[.…]+$/g, "").trim())
    .filter(Boolean);
}

function homeSearchRows(pods: Pod[], q: string): HomeRow[] {
  const query = q.trim().toLowerCase();
  const rows: HomeRow[] = [];
  pods.forEach((p) => {
    const nameHit = !query || p.name.toLowerCase().includes(query);
    const areas = splitHints(p.hint);
    const areaHits = query ? areas.filter((a) => a.toLowerCase().includes(query)) : [];
    if (query) {
      areaHits.forEach((a) => {
        if (a.toLowerCase() === p.name.toLowerCase()) return;
        rows.push({ kind: "area", main: a, sub: `In ${p.name}`, value: p.name });
      });
    }
    if (nameHit || (!query && p.name) || (areaHits.length && !nameHit)) {
      rows.push({ kind: "pod", main: p.name, sub: p.hint || "", value: p.name });
    }
  });
  return rows;
}

function resolveHome(pods: Pod[], raw: string) {
  const q = raw.trim().toLowerCase();
  if (!q) return null;
  const exact = pods.find((p) => p.name.toLowerCase() === q);
  if (exact) return exact.name;
  let match: string | null = null;
  for (const p of pods) {
    for (const a of splitHints(p.hint)) {
      if (a.toLowerCase() === q) {
        if (match && match !== p.name) return null;
        match = p.name;
      }
    }
  }
  return match;
}

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
  const [pods, setPods] = useState<Pod[] | null>(null);
  const [podsError, setPodsError] = useState(false);
  const [search, setSearch] = useState("");

  const isPod = fieldKey === "home" || fieldKey === "work" || fieldKey === "frequent";
  const isMulti = field?.type === "multi" || field?.type === "rank";

  useEffect(() => {
    if (!fieldKey || !field) return;
    const cur = answers[fieldKey];
    setTemp(Array.isArray(cur) ? [...cur] : []);
    setOtherOpen(false);
    setOtherVal("");
    setExpanded(null);
    setSearch("");
    setPartnership(String(answers.partnershipNote || ""));
    if (isPod) {
      setPodsError(false);
      getNeighbourhoods()
        .then((raw) => {
          const opts = (raw.options || [])
            .map((o: Neighbourhood) => ({
              name: String(o.name || "").trim(),
              hint: String(o.hint || "").trim(),
            }))
            .filter((o) => o.name);
          setPods(opts);
        })
        .catch(() => setPodsError(true));
    }
  }, [fieldKey]);

  const rows = useMemo(() => {
    if (!isPod || !pods) return [];
    const list = homeSearchRows(pods, search);
    if (fieldKey === "work") {
      list.push({ kind: "fromhome", main: WORK_FROM_HOME, sub: WORK_FROM_HOME_SUB, value: WORK_FROM_HOME });
    } else {
      if (fieldKey === "frequent") {
        list.push({ kind: "varies", main: FREQUENT_VARIES, sub: FREQUENT_VARIES_SUB, value: FREQUENT_VARIES });
      }
      list.push({ kind: "another", main: HOME_ANOTHER, sub: HOME_ANOTHER_SUB, value: HOME_ANOTHER });
    }
    return list;
  }, [isPod, pods, search, fieldKey]);

  if (!fieldKey || !field) return null;

  const min = field.min || (field.type === "rank" ? field.max : 1) || 1;
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
    if (fieldKey === "home" || fieldKey === "frequent") {
      if (!val) {
        if (fieldKey === "home") pickSingle(HOME_ANOTHER);
        return;
      }
      pickSingle(resolveHome(pods || [], val) || val);
      return;
    }
    if (!val) return;
    pickSingle(val);
  }

  return (
    <>
      <div className="sb-backdrop open" onClick={onClose} />
      <div className="sb-sheet open">
        <div className="sb-handle" />
        <div className="sb-sheet-top">
          <span className="sb-sheet-label">{field.label}</span>
          <button className="sb-sheet-close" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="sb-sheet-hint">{field.hint}</p>
        {isPod ? (
          <div className="sb-home-search-wrap">
            <input
              type="search"
              className="sb-other-input"
              placeholder="Search a neighbourhood…"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const q = search.trim();
                if (!q) return;
                if (fieldKey === "work" && q.toLowerCase() === WORK_FROM_HOME.toLowerCase()) {
                  pickSingle(WORK_FROM_HOME);
                  return;
                }
                if (fieldKey === "frequent" && q.toLowerCase() === FREQUENT_VARIES.toLowerCase()) {
                  pickSingle(FREQUENT_VARIES);
                  return;
                }
                const mapped = resolveHome(pods || [], q);
                if (mapped) pickSingle(mapped);
                else if (fieldKey === "frequent") pickSingle(q);
              }}
            />
          </div>
        ) : null}

        <div className="sb-options-wrap">
          {isPod ? (
            <div className="sb-options-grid" id="sbOptionsList">
              {podsError ? (
                <>
                  <p className="sb-home-error">
                    Could not load neighbourhoods. Check your connection and try again.
                  </p>
                  <div className="sb-other-row">
                    <button
                      className="sb-other-btn"
                      type="button"
                      onClick={() => {
                        setPodsError(false);
                        setPods(null);
                        getNeighbourhoods()
                          .then((raw) => {
                            setPods(
                              (raw.options || [])
                                .map((o) => ({
                                  name: String(o.name || "").trim(),
                                  hint: String(o.hint || "").trim(),
                                }))
                                .filter((o) => o.name),
                            );
                          })
                          .catch(() => setPodsError(true));
                      }}
                    >
                      Retry
                    </button>
                  </div>
                </>
              ) : !pods ? (
                <p className="sb-home-status">Loading neighbourhoods…</p>
              ) : (
                <>
                  {rows.length <= 1 && search.trim() ? (
                    <p className="sb-home-status">
                      {fieldKey === "home"
                        ? "Nothing in the Pod list matches. Type your neighbourhood — this may waitlist you if it isn’t a Dubai Pod area."
                        : fieldKey === "frequent"
                          ? "Nothing in the Pod list matches. Type another area, or choose Varies."
                          : "Nothing in the Pod list matches. Choose From home if you work remotely."}
                    </p>
                  ) : null}
                  {rows.map((row) => {
                    const current = answers[fieldKey!];
                    const selected =
                      row.kind === "another"
                        ? current === HOME_ANOTHER
                        : current === row.value;
                    return (
                      <button
                        key={`${row.kind}-${row.main}`}
                        className={`sb-option${selected ? " sb-option-selected" : ""}`}
                        type="button"
                        onClick={() => {
                          if (row.kind === "another") {
                            setOtherOpen(true);
                            return;
                          }
                          pickSingle(row.value);
                        }}
                      >
                        <span className="sb-option-main">{row.main}</span>
                        {row.sub ? <span className="sb-option-sub">{row.sub}</span> : null}
                      </button>
                    );
                  })}
                  {fieldKey === "home" || fieldKey === "frequent" ? (
                    <div className="sb-other-row">
                      <button
                        className="sb-other-btn"
                        type="button"
                        onClick={() => setOtherOpen(true)}
                      >
                        + Not on the list? Type it in
                      </button>
                      <div className={`sb-other-input-wrap${otherOpen ? " open" : ""}`}>
                        <input
                          className="sb-other-input"
                          placeholder="Your neighbourhood…"
                          value={otherVal}
                          onChange={(e) => setOtherVal(e.target.value)}
                        />
                        <button className="sb-other-confirm" type="button" onClick={confirmOther}>
                          Done
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : PILL_KEYS.has(fieldKey) ? (
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
                      placeholder="Your neighbourhood…"
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
      </div>
    </>
  );
}
