import { apiRequest } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { askEndpoints } from "@/lib/api/endpoints";

export type AskRole = "user" | "assistant";
export type AskMessage = { role: AskRole; content: string };

const ASK_LIMIT = 2000;
const ASK_TURNS = 10;

export function clipAsk(text: string) {
  return text.slice(0, ASK_LIMIT);
}

export function htmlToAskText(html: string) {
  return clipAsk(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export function packAskMessages(messages: AskMessage[]): AskMessage[] {
  const packed = messages
    .map((m) => ({
      role: m.role,
      content: clipAsk(String(m.content || "").trim()),
    }))
    .filter((m) => m.content)
    .slice(-ASK_TURNS);
  return packed;
}

export async function askSocialfit(messages: AskMessage[]) {
  const packed = packAskMessages(messages);
  const raw = await apiRequest<{ answer?: string }, []>(askEndpoints.askSocialfit, [], {
    messages: packed,
  });
  return String(raw?.answer || "").trim();
}

export function askErrorLine(err: unknown) {
  const code = isApiError(err) ? err.code : "";
  if (code === "rate_limited") return "Too many questions just now. Wait a bit, then try again.";
  if (code === "unavailable") return "Ask isn’t available right now. Try again in a moment.";
  if (code === "messages_required" || code === "last_message_must_be_user") {
    return "Couldn’t send that. Try asking again.";
  }
  return "Couldn’t get an answer. Try again.";
}
