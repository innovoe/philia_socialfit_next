import { apiRequest } from "@/lib/api/client";
import { publicEndpoints } from "@/lib/api/endpoints";
import { readSession } from "@/lib/session";

export type SignalDemoComplete = {
  ok?: boolean;
  completed?: boolean;
  already?: boolean;
};

type JourneySource = "founder_key" | "referredphilia_key" | "key_drop_web";

function journeySource(): JourneySource | null {
  const s = readSession();
  if (s.entryPath === "invite") return "referredphilia_key";
  if (s.entryPath === "founder" || s.founderToken) return "founder_key";
  return null;
}

/** Finish-CTA only. Safe to call twice. Never send event names. */
export async function completeSignalDemo() {
  const s = readSession();
  const journey = journeySource();
  const extra = journey ? { journey_source: journey } : {};

  if (s.access) {
    return apiRequest<SignalDemoComplete, []>(
      publicEndpoints.completeSignalDemo,
      [],
      journey ? extra : undefined,
      { auth: true, token: s.access },
    );
  }

  if (s.founderToken) {
    return apiRequest<SignalDemoComplete, []>(
      publicEndpoints.completeSignalDemo,
      [],
      { founder_token: s.founderToken, ...extra },
      { auth: false },
    );
  }

  const email = (s.email || s.founderEmail || "").trim();
  if (email) {
    return apiRequest<SignalDemoComplete, []>(
      publicEndpoints.completeSignalDemo,
      [],
      { email, ...extra },
      { auth: false },
    );
  }

  return null;
}
