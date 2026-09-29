"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { videos } from "@/lib/assets";
import { hasAccess } from "@/lib/session";
import { routes } from "@/lib/routes";
import {
  READ_SECTIONS,
  STORY_SECTIONS,
  firstIncomplete,
  formatSbAnswer,
  isFilled,
  readSentenceParts,
  sectionComplete,
  storySentenceParts,
  type StoryAnswer,
  type StoryAnswers,
} from "@/lib/story-data";
import {
  computeResume,
  hydrateAnswersFromServer,
  loadAnswers,
  persistAnswers,
  readComplete,
  resumeUrl,
} from "@/lib/story-answers";
import { StorySheet } from "@/components/gate/StorySheet";

const CUE_SVG = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M2 4.5L6 8.5L10 4.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function useHeroLoop(ref: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const vid = ref.current;
    if (!vid) return;
    let looping = false;
    vid.style.opacity = "1";
    if (vid.paused) vid.play().catch(() => {});
    const onTime = () => {
      if (looping || !vid.duration) return;
      if (vid.currentTime >= vid.duration - 1.3) {
        looping = true;
        vid.style.transition = "opacity 1.2s ease";
        vid.style.opacity = "0";
        window.setTimeout(() => {
          vid.currentTime = 0;
          vid.play().catch(() => {});
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              vid.style.opacity = "1";
              window.setTimeout(() => {
                looping = false;
              }, 1300);
            });
          });
        }, 1250);
      }
    };
    vid.addEventListener("timeupdate", onTime);
    return () => vid.removeEventListener("timeupdate", onTime);
  }, [ref]);
}

function Sentence({
  parts,
  answers,
  onBlank,
}: {
  parts: Array<string | { key: string }>;
  answers: StoryAnswers;
  onBlank: (key: string) => void;
}) {
  return (
    <p className="sty-ed-sentence">
      {parts.map((part, i) => {
        if (typeof part === "string") return <span key={i}>{part}</span>;
        const filled = isFilled(answers[part.key]);
        return (
          <button
            key={part.key}
            className={`sb-blank sq${filled ? " filled" : " pulse"}`}
            type="button"
            onClick={() => onBlank(part.key)}
          >
            {filled ? formatSbAnswer(answers, part.key) : "…"}
          </button>
        );
      })}
    </p>
  );
}

export function StoryBuilder({ mode, index }: { mode: "story" | "read"; index: number }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<StoryAnswers>(loadAnswers);
  const [ready, setReady] = useState(true);
  const [sheetKey, setSheetKey] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [cueOn, setCueOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const hydrated = useRef(false);
  useHeroLoop(videoRef);

  const sections = mode === "story" ? STORY_SECTIONS : READ_SECTIONS;
  const sec = sections[index];

  useEffect(() => {
    if (!hasAccess()) {
      window.location.replace(routes.verify);
      return;
    }
    let cancelled = false;
    hydrateAnswersFromServer().then((next) => {
      if (cancelled) return;
      setAnswers(next);
      if (hydrated.current) {
        setReady(true);
        return;
      }
      hydrated.current = true;
      if (mode === "story") {
        const early = firstIncomplete(STORY_SECTIONS, next, 0, 3);
        if (index >= 3 && early != null) {
          router.replace(`${routes.story}/${early + 1}`);
          setReady(true);
          return;
        }
        if (index >= 3 && firstIncomplete(READ_SECTIONS, next) != null) {
          router.replace(resumeUrl({ kind: "read", index: firstIncomplete(READ_SECTIONS, next)! }));
          setReady(true);
          return;
        }
      }
      if (mode === "read") {
        const early = firstIncomplete(STORY_SECTIONS, next, 0, 3);
        if (early != null) {
          router.replace(`${routes.story}/${early + 1}`);
          setReady(true);
          return;
        }
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLeaving(false);
    setReview(false);
    const nextUrl =
      mode === "story"
        ? index >= STORY_SECTIONS.length - 1
          ? null
          : index === 2
            ? `${routes.read}/1`
            : `${routes.story}/${index + 2}`
        : index >= READ_SECTIONS.length - 1
          ? `${routes.story}/4`
          : `${routes.read}/${index + 2}`;
    if (nextUrl) router.prefetch(nextUrl);
  }, [index, mode, router]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (scroll) scroll.scrollTop = 0;
  }, [index, mode]);

  useEffect(() => {
    if (mode !== "read" || index !== 3) return;
    if (!isFilled(answers.professional_stance)) return;
    const last = scrollRef.current?.querySelector(".sty-sent-block .sb-blank:last-of-type");
    if (!(last instanceof HTMLElement)) return;
    last.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [mode, index, answers.professional_stance]);

  useEffect(() => {
    function update() {
      const scroll = scrollRef.current;
      const footer = footerRef.current;
      const block = scroll?.querySelector(".sty-sent-block");
      if (!scroll || !footer || !block) {
        setCueOn(false);
        return;
      }
      setCueOn(block.getBoundingClientRect().bottom > footer.getBoundingClientRect().top + 6);
    }
    update();
    const scroll = scrollRef.current;
    scroll?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroll?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ready, answers, index]);

  const done = useMemo(() => (sec ? sectionComplete(sec, answers) : false), [sec, answers]);
  const parts =
    mode === "story" ? storySentenceParts(index) : readSentenceParts(index, answers);

  const stepLabel =
    mode === "read"
      ? `${index + 1} of 4`
      : index < 3
        ? `${index + 1} of 3`
        : `${index + 1} of 7`;

  const continueLabel =
    mode === "read"
      ? index === READ_SECTIONS.length - 1
        ? "Continue Story →"
        : "Continue →"
      : index === 2
        ? "Next →"
        : index >= STORY_SECTIONS.length - 1
          ? "Review →"
          : "Continue →";

  const backOn = mode === "read" ? true : index > 0 || index === 3;

  function savePick(key: string, value: StoryAnswer, extra?: { partnershipNote?: string }) {
    setAnswers((cur) => {
      const next = { ...cur, [key]: value };
      if (key === "need") {
        if (Array.isArray(value) && value.includes("Partnership")) {
          next.partnershipNote = extra?.partnershipNote || "";
        } else {
          delete next.partnershipNote;
        }
      }
      persistAnswers(next);
      return next;
    });
  }

  function go(url: string) {
    setLeaving(true);
    window.setTimeout(() => {
      router.push(url);
    }, 160);
  }

  function onContinue() {
    if (!done) return;
    if (mode === "story") {
      if (index >= STORY_SECTIONS.length - 1) {
        setReview(true);
        return;
      }
      if (index === 2) {
        go(`${routes.read}/1`);
        return;
      }
      go(`${routes.story}/${index + 2}`);
      return;
    }
    if (index >= READ_SECTIONS.length - 1) {
      const late = firstIncomplete(STORY_SECTIONS, answers, 3) ?? 3;
      go(`${routes.story}/${late + 1}`);
      return;
    }
    go(`${routes.read}/${index + 2}`);
  }

  function onBack() {
    if (mode === "read") {
      if (index === 0) {
        router.push(`${routes.story}/3`);
        return;
      }
      router.push(`${routes.read}/${index}`);
      return;
    }
    if (index === 3) {
      router.push(`${routes.read}/4`);
      return;
    }
    if (index > 0) router.push(`${routes.story}/${index}`);
  }

  function onReviewContinue() {
    const postRead = readComplete(answers);
    if (!postRead) {
      setReview(false);
      router.push(`${routes.read}/1`);
      return;
    }
    const late = firstIncomplete(STORY_SECTIONS, answers, 3);
    if (late != null) {
      setReview(false);
      router.push(`${routes.story}/${late + 1}`);
      return;
    }
    persistAnswers(answers);
    window.location.assign(routes.ceremony);
  }

  if (!ready || !sec) return null;

  return (
    <main className={`sty-screen ${mode === "read" ? "sty-read" : "sty-story"}`}>
      <div className="sty-topbar">
        <span>Philia</span>
        <span>{mode === "read" ? "Signal Read" : "SocialFit Story"}</span>
        <span>{stepLabel}</span>
      </div>
      <div className="sty-scroll-body" ref={scrollRef}>
        <div
          className="sty-hero"
          id={mode === "read" ? "readHero" : "storyHero"}
          style={{
            background: mode === "story" ? sec.bg : undefined,
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            loop={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              opacity: 1,
              transition: "opacity 1.2s ease",
              pointerEvents: "none",
            }}
          >
            <source src={videos.storyBg} type="video/mp4" />
          </video>
          <div className="sty-hero-vignette" />
          <div className="sty-chip">
            <i />
            <span>{mode === "read" ? "Signal Read" : "StoryBuilder"}</span>
          </div>
        </div>
        <div className="sty-timer" />
        <div className="sty-sec-header">
          <span className="sty-sec-label">{sec.l}</span>
          <p className="sty-sec-hint">{sec.h}</p>
          <hr className="sty-sec-hr" />
        </div>
        <div className="sty-ed-content">
          <div
            className="sty-sec-wrap"
            style={
              leaving
                ? { opacity: 0, transform: "translateY(-10px)", transition: "opacity .22s,transform .22s" }
                : undefined
            }
          >
            <div className="sty-sent-block">
              <Sentence parts={parts} answers={answers} onBlank={setSheetKey} />
            </div>
            <hr className={`sty-sent-hr${done ? " on" : ""}`} />
          </div>
        </div>
      </div>
      <div className="sty-ed-footer" ref={footerRef}>
        <button
          type="button"
          className={`sty-scroll-cue${cueOn ? " is-on" : ""}`}
          aria-label="Scroll to see more"
          onClick={() => {
            const scroll = scrollRef.current;
            const footer = footerRef.current;
            const block = scroll?.querySelector(".sty-sent-block");
            if (!scroll || !footer || !block) return;
            const hidden = block.getBoundingClientRect().bottom - footer.getBoundingClientRect().top;
            scroll.scrollBy({ top: Math.max(72, hidden + 20), behavior: "smooth" });
          }}
        >
          {CUE_SVG}
        </button>
        <button className={`sty-ed-back${backOn ? " on" : ""}`} type="button" onClick={onBack}>
          ← Back
        </button>
        <p className="sty-ed-helper" />
        <button
          className={`sty-ed-continue${done ? " on" : ""}`}
          type="button"
          onClick={onContinue}
        >
          {continueLabel}
        </button>
      </div>

      {review ? (
        <div className="sty-result on">
          <div className="sty-result-scroll">
            <div className="str-result-top">
              <span style={{ color: "var(--muted)" }}>Philia</span>
              <span className="sc">SocialFit Story</span>
              <span />
            </div>
            <div style={{ marginTop: 36 }}>
              {STORY_SECTIONS.map((s, i) => (
                <div className="str-ed-block" key={s.l}>
                  <span className="str-ed-label">{s.l}</span>
                  <div className="sty-sent-block">
                    <p className="sty-ed-sentence">
                      {storySentenceParts(i).map((part, pi) => {
                        if (typeof part === "string") return <span key={pi}>{part}</span>;
                        const filled = isFilled(answers[part.key]);
                        return (
                          <span key={part.key} className={filled ? "str-ed-fill" : "str-ed-empty"}>
                            {filled ? formatSbAnswer(answers, part.key) : "…"}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="str-continue-wrap">
              <button className="str-edit-btn" type="button" onClick={() => setReview(false)}>
                ← Edit
              </button>
              <button className="str-continue-btn" type="button" onClick={onReviewContinue}>
                <span>{readComplete(answers) ? "Continue" : "Signal Read"}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <StorySheet
        fieldKey={sheetKey}
        answers={answers}
        onClose={() => setSheetKey(null)}
        onPick={savePick}
      />
    </main>
  );
}

export function StoryResume({ mode }: { mode: "story" | "read" }) {
  const router = useRouter();
  useEffect(() => {
    if (!hasAccess()) {
      window.location.replace(routes.verify);
      return;
    }
    const answers = loadAnswers();
    const target = computeResume(answers);
    if (mode === "story" && target.kind === "story") {
      router.replace(`${routes.story}/${target.index + 1}`);
      return;
    }
    if (mode === "read" && target.kind === "read") {
      router.replace(`${routes.read}/${target.index + 1}`);
      return;
    }
    window.location.replace(resumeUrl(target));
  }, [mode, router]);
  return null;
}
