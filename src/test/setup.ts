import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Safety net: any unmocked network call fails the test instead of hitting a backend.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: unknown) => {
      throw new Error(`Unmocked fetch in test: ${String(url)}`);
    }),
  );
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});
