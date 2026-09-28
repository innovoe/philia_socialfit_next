import type { OutboundKey } from "@/lib/api/keys";
import { normalizeUaePhone } from "@/lib/api/phone";

export type KeyInvite = {
  invite_code?: string | null;
  invite_url?: string | null;
};

export function cer5ShareLink(invite?: KeyInvite | null) {
  const origin = typeof window !== "undefined" ? window.location.origin || "" : "";
  if (invite?.invite_url) {
    try {
      const u = new URL(invite.invite_url, origin || "https://socialfit.philia.life");
      u.searchParams.delete("phone");
      if (origin) return `${origin}/${u.search || ""}${u.hash || ""}`;
      return u.toString();
    } catch {
      return String(invite.invite_url);
    }
  }
  if (invite?.invite_code && origin) {
    return `${origin}/?code=${encodeURIComponent(invite.invite_code)}`;
  }
  return "";
}

export function cer5BuildMsg(name: string, invite?: KeyInvite | null) {
  const nm = (name && name.trim()) || "[Name]";
  const url = cer5ShareLink(invite);
  const code = invite?.invite_code ? String(invite.invite_code) : "";
  let linkLine = "";
  if (url) {
    linkLine = (code ? `\n\nYour invite code: ${code}` : "") + `\n\n${url}`;
  } else if (code) {
    linkLine = `\n\nYour invite code: ${code}`;
  } else {
    linkLine = "\n\nI’ll share your private invite once it’s ready.";
  }
  return (
    `Hey ${nm}! I’m activating my Philia ID for SocialFit, and I chose you as one of my 3 social mirrors because you’re someone I trust and respect.\n\n` +
    `You’ll get one private question:\n“How do you see me socially?”\n\n` +
    `Your answer helps unlock my Social Archetype: how I’m perceived by people who’ve actually experienced me in real life. I will see the archetype you choose, together with the combined pattern from my three Keys.\n\n` +
    `This Philia Key gives you a private path into SocialFit’s invite-only access, if it feels right for you.\n\n` +
    `You have 48 hours to claim it. If unused, the Key returns to me.` +
    linkLine
  );
}

export function cer5IsUnsent(k?: OutboundKey | null) {
  const state = String((k && (k.state || k.status)) || "allocated").toLowerCase();
  return !state || state === "allocated" || state === "available";
}

export function cer5PillLabel(k?: OutboundKey | null) {
  const state = String((k && (k.state || k.status)) || "sent").toLowerCase();
  if (state === "activated") return "Activated";
  if (
    state === "answered" ||
    (k && (k.mirror_answered || String(k.mirror_status || "") === "answered"))
  ) {
    return "Answered";
  }
  if (state === "claimed") return "Claimed";
  return "Sent";
}

export function cer5StatusCopy(k?: OutboundKey | null) {
  const state = String((k && (k.state || k.status)) || "sent").toLowerCase();
  const arch = k?.mirror_archetype ? String(k.mirror_archetype) : "";
  if (state === "activated") {
    return arch ? `Activated. They see you as ${arch}.` : "This Key is activated.";
  }
  if (
    state === "answered" ||
    (k && (k.mirror_answered || String(k.mirror_status || "") === "answered"))
  ) {
    return arch ? `Answered. They see you as ${arch}.` : "Your nominee has answered.";
  }
  if (state === "claimed") return "Claimed. Waiting on their Social Mirror.";
  return "Sent. Waiting for them to claim.";
}

export function cer5ContactRaw(local: string) {
  const value = String(local || "").trim();
  if (!value) return "";
  if (value.includes("@")) return value;
  if (value.charAt(0) === "+" || value.startsWith("971") || value.startsWith("00971")) return value;
  return `+971${value.replace(/\D/g, "")}`;
}

export function cer5NormalizeContact(raw: string): {
  contact?: string;
  isPhone?: boolean;
  error?: string;
} {
  const contact = String(raw || "").trim();
  if (!contact) return { error: "Add a UAE mobile or email." };
  if (contact.includes("@")) return { contact, isPhone: false };
  const phone = normalizeUaePhone(contact);
  if (phone) return { contact: phone, isPhone: true };
  return { error: "Use a UAE mobile (+971 5…)." };
}

export function sendKeyErrorMessage(code: string) {
  if (code === "not_key_owner") return "This Key is not yours.";
  if (code === "nominee_name_required" || code === "nominee_contact_required") {
    return "Name and contact are required.";
  }
  if (code === "send_window_expired") return "This Key’s send window has closed.";
  return "Could not send — check contact and try again.";
}

export function formatCer5Clock(ms: number | null) {
  if (ms == null) return "——:——:——";
  const diff = Math.max(0, ms - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function sentStatusLine(sent: number) {
  if (!sent) return "3 Keys issued · Send with name + UAE mobile";
  return `${sent} Key${sent === 1 ? "" : "s"} sent · Finish the rest anytime in Key Vault`;
}
