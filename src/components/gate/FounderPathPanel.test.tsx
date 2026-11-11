import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/member", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/member")>()),
  getMe: vi.fn(),
}));

import { getMe } from "@/lib/api/member";
import { writeSession } from "@/lib/session";
import { OriginsEmailForm } from "@/components/gate/OriginsEmailForm";
import { UnlockForm } from "@/components/gate/UnlockForm";

const PANEL = "This is invite-only access.";

describe("Founder path panel placement", () => {
  it("shows on /origins (gate=origins)", async () => {
    render(<OriginsEmailForm gate="origins" />);
    expect(await screen.findByPlaceholderText("YOUR EMAIL")).toBeTruthy();
    expect(screen.getByText(PANEL)).toBeTruthy();
    expect(screen.getByText("24h remaining")).toBeTruthy();
  });

  it("does not show on /enter (system members must never see Founder copy)", async () => {
    render(<OriginsEmailForm gate="enter" />);
    expect(await screen.findByPlaceholderText("YOUR EMAIL")).toBeTruthy();
    expect(screen.queryByText(PANEL)).toBeNull();
  });

  it("is gone from /unlock code entry", async () => {
    render(<UnlockForm />);
    expect(await screen.findByPlaceholderText("ENTER CODE")).toBeTruthy();
    expect(screen.getByText(/You have been gifted a Key\./)).toBeTruthy();
    expect(screen.queryByText(PANEL)).toBeNull();
  });

  it("is gone from /unlock founder claim mode", async () => {
    writeSession({ access: "test-access", founderToken: "t" });
    vi.mocked(getMe).mockResolvedValue({
      keys_to_the_city: true,
      has_claimed_key: false,
    } as Awaited<ReturnType<typeof getMe>>);
    render(<UnlockForm />);
    await waitFor(() => expect(screen.getByText(/Your Key is ready to claim\./)).toBeTruthy());
    expect(screen.queryByText(PANEL)).toBeNull();
  });
});
