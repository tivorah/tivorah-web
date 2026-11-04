// Blocking, shared by Messages and Settings (the app's copy: tivorah-mobile/hooks/useConfirmBlock.ts).
// The API stops messages and calls, ends any connection and hides each other's posts and replies.

export type BlockedPerson = { userId: number; username: string; firstName: string | null; lastName: string | null; blockedAt: string };

/** The question asked before blocking, the same wording as the app. */
export const blockConfirmText = (name: string) =>
  `Block ${name}?\n\nThey won’t be able to message or call you, any connection between you ends, and you won’t see each other’s posts or replies. They aren’t told. You can unblock them in Account settings → Blocked people.`;

/** "First Last", or "@username" when there's no name. */
export const blockedPersonName = (person: Pick<BlockedPerson, "firstName" | "lastName" | "username">) =>
  [person.firstName, person.lastName].filter(Boolean).join(" ") || `@${person.username}`;
