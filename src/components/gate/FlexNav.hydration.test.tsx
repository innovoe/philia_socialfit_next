import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";

let pathname = "/profile";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/member", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/member")>()),
  getMe: vi.fn(),
}));

import type { getMe } from "@/lib/api/member";
import type { writeSession } from "@/lib/session";

type Me = Awaited<ReturnType<typeof getMe>>;
const HUB_ME = { ceremony_step: "hub", onboarding_step: "done", needs_onboarding: false } as Me;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

/**
 * Real page load: server renders with no browser session, then the browser
 * hydrates with whatever is already in philia_gate.
 */
async function serverThenHydrate(
  path: string,
  session: Parameters<typeof writeSession>[0] | null,
  me: Me,
) {
  // Fresh modules per test: me-cache keeps /me/ in module scope.
  vi.resetModules();
  const member = await import("@/lib/api/member");
  vi.mocked(member.getMe).mockResolvedValue(me);
  const { writeSession } = await import("@/lib/session");
  const { GateExtras } = await import("@/components/gate/GateExtras");
  pathname = path;
  localStorage.clear();
  sessionStorage.clear();
  const html = renderToString(<GateExtras />); // "server": empty storage
  if (session) writeSession(session);
  container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const recoverable: unknown[] = [];
  await act(async () => {
    root = hydrateRoot(container!, <GateExtras />, {
      onRecoverableError: (e) => recoverable.push(e),
    });
  });
  await act(async () => {
    await Promise.resolve();
  });
  return { recoverable };
}

function slot(n: number) {
  return document.getElementById(`fnS${n}`)!.className;
}

describe("FlexNav Hub slot after a fresh page load", () => {
  it("Hub is live on /profile when session already says Hub, and server/client HTML match", async () => {
    const me = HUB_ME;
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { recoverable } = await serverThenHydrate("/profile", {
      access: "a",
      hubUnlocked: true,
      explorerReady: true,
      ceremonyStep: "hub",
    }, me);
    expect(slot(4)).toContain("fn-live");
    expect(slot(4)).not.toContain("fn-locked");
    expect(recoverable).toEqual([]);
    const hydrationLogs = errors.mock.calls.filter((c) => /hydrat/i.test(String(c[0])));
    expect(hydrationLogs).toEqual([]);
  });

  it("Hub turns live from /me/ alone (ceremony_step hub), empty local flags", async () => {
    const me = HUB_ME;
    await serverThenHydrate("/story/1", { access: "a" }, me);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(slot(4)).toContain("fn-live");
  });

  it("lock rule unchanged: Explorer but not Hub keeps Hub locked on /profile", async () => {
    const me = { ceremony_step: "keys", needs_onboarding: true } as Me;
    await serverThenHydrate("/profile", { access: "a", explorerReady: true, ceremonyStep: "keys" }, me);
    expect(slot(4)).toContain("fn-locked");
    expect(slot(3)).not.toContain("fn-locked");
  });

  it("on /hub the Hub slot is not locked, even with empty local flags", async () => {
    const me = { ceremony_step: "keys", needs_onboarding: true } as Me;
    await serverThenHydrate("/hub", { access: "a", explorerReady: true, ceremonyStep: "keys" }, me);
    expect(slot(4)).not.toContain("fn-locked");
  });
});
