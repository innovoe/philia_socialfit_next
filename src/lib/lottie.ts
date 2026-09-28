"use client";

type LottieAnim = { destroy: () => void; setSpeed: (n: number) => void };

type LottiePlayer = {
  loadAnimation: (opts: {
    container: HTMLElement;
    renderer: "svg";
    loop: boolean;
    autoplay: boolean;
    animationData: object;
    rendererSettings?: { preserveAspectRatio: string };
  }) => LottieAnim;
};

export type PlayGate = { cancelled: boolean };

declare global {
  interface Window {
    lottie?: LottiePlayer;
    PHILIA_TRUST_GRAPH_LOTTIE?: object;
    SOCIALFIT_SIGNAL_LOTTIE?: object;
  }
}

function scriptReady(src: string) {
  if (src.includes("lottie.min.js")) return Boolean(window.lottie);
  if (src.includes("philia-trust-graph")) return Boolean(window.PHILIA_TRUST_GRAPH_LOTTIE);
  if (src.includes("signalLottieData")) return Boolean(window.SOCIALFIT_SIGNAL_LOTTIE);
  return false;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (scriptReady(src)) {
      resolve();
      return;
    }
    const file = src.split("/").pop() || src;
    const existing = document.querySelector<HTMLScriptElement>(`script[src*="${file}"]`);
    if (existing) {
      if (existing.dataset.ready === "1") {
        resolve();
        return;
      }
      const finish = () => {
        existing.dataset.ready = "1";
        resolve();
      };
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error(`failed ${src}`)), { once: true });
      const started = Date.now();
      const poll = window.setInterval(() => {
        if (scriptReady(src)) {
          window.clearInterval(poll);
          finish();
        } else if (Date.now() - started > 8000) {
          window.clearInterval(poll);
        }
      }, 40);
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.addEventListener("load", () => {
      el.dataset.ready = "1";
      resolve();
    });
    el.addEventListener("error", () => reject(new Error(`failed ${src}`)));
    document.head.appendChild(el);
  });
}

function withRootAssets(data: object) {
  const copy = JSON.parse(JSON.stringify(data)) as {
    assets?: Array<{ u?: string }>;
  };
  copy.assets?.forEach((asset) => {
    if (asset.u && !asset.u.startsWith("/")) asset.u = `/${asset.u}`;
  });
  return copy;
}

async function getLottie() {
  if (!window.lottie) {
    await loadScript("/assets/lottie-js/lottie.min.js");
  }
  return window.lottie ?? null;
}

export async function preloadSignalLottie() {
  await getLottie();
  await Promise.all([
    loadScript("/assets/lottie-js/philia-trust-graph-modified.js"),
    loadScript("/assets/lottie-js/signalLottieData.js"),
  ]);
}

async function play(
  container: HTMLElement,
  data: object | undefined,
  speed: number,
  gate?: PlayGate,
) {
  const lottie = await getLottie();
  if (gate?.cancelled || !lottie || !data) return null;
  container.replaceChildren();
  const anim = lottie.loadAnimation({
    container,
    renderer: "svg",
    loop: false,
    autoplay: true,
    animationData: withRootAssets(data),
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  });
  anim.setSpeed(speed);
  if (gate?.cancelled) {
    destroyAnim(anim);
    return null;
  }
  return anim;
}

export async function playTrustGraph(container: HTMLElement, gate?: PlayGate) {
  await loadScript("/assets/lottie-js/philia-trust-graph-modified.js");
  if (gate?.cancelled) return null;
  return play(container, window.PHILIA_TRUST_GRAPH_LOTTIE, 0.68, gate);
}

export async function playSignalIntro(container: HTMLElement, gate?: PlayGate) {
  await loadScript("/assets/lottie-js/signalLottieData.js");
  if (gate?.cancelled) return null;
  return play(container, window.SOCIALFIT_SIGNAL_LOTTIE, 0.72, gate);
}

export function destroyAnim(anim: { destroy: () => void } | null) {
  try {
    anim?.destroy();
  } catch {
    /* already gone */
  }
}
