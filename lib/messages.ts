// Web account Messages: private chats and enquiries, matching the app's Chats and Enquiries lists.
export type MessageTab = "private" | "enquiry";

/** `?tab=enquiries` opens Enquiries; anything else opens Chats, as the app does. */
export function messageTabFromSearch(search: string): MessageTab {
  return new URLSearchParams(search).get("tab") === "enquiries" ? "enquiry" : "private";
}

export function messageTabQuery(tab: MessageTab) {
  return tab === "enquiry" ? "?tab=enquiries" : "";
}

export function conversationListPath(tab: MessageTab, skip: number, take: number) {
  return `/chat/conversations?kind=${tab}&skip=${Math.max(0, Math.floor(skip))}&take=${Math.max(1, Math.floor(take))}`;
}

export type ViewOnceMessage = { viewOnce?: boolean | null; viewOnceOpenedAt?: string | null };

/** View-once photos open only in the app (the server serves them once); the web shows what happened. */
export function viewOnceLabel(message: ViewOnceMessage, mine: boolean): string | null {
  if (!message.viewOnce) return null;
  if (mine) return message.viewOnceOpenedAt ? "View once photo · Opened" : "View once photo";
  return message.viewOnceOpenedAt ? "View once photo · Opened" : "View once photo — open it in the Tivorah app";
}

type Preview = { content?: string | null; viewOnce?: boolean | null; type?: string | null; attachments?: unknown[] | null } | null | undefined;

/** Inbox snippet: the last message's text, or a plain description when it has none. */
export function inboxSnippet(last: Preview): string {
  const text = last?.content?.trim();
  if (text) return text;
  if (last?.viewOnce) return "View once photo";
  if (last?.type === "audio") return "Voice message";
  if (last?.type === "image" || last?.attachments?.length) return "Photo";
  return "Open conversation";
}
