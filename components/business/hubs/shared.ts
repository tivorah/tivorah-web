// Hub management on the web business dashboard. Uses the same /community API as the mobile app.

/** A Hub rule. Catalogue presets also carry the topic they are listed under in the rules sheet. */
export type HubRule = { key: string; text: string; group?: string };
/** How many preset rules show before "See all rules" (the app shows the same five). */
export const FEATURED_RULE_COUNT = 5;
/** Mirrors MAX_HUB_GUIDELINES on the API. */
export const MAX_HUB_RULES = 12;

export type ManagedHub = {
  id: number;
  name: string;
  username: string;
  slogan: string | null;
  description: string | null;
  avatar: unknown;
  banner: unknown;
  isPrivate: boolean;
  isVerified?: boolean;
  isOwner?: boolean;
  currentUserRole?: string;
  memberCount?: string | number;
  guidelines?: HubRule[];
  suburb?: string | null;
  state?: string | null;
};

export type HubSettings = {
  whoCanPostBanter: "members" | "moderators" | "creator";
  whoCanStartThreads: "members" | "moderators" | "creator";
  whoCanPostListings: "members" | "moderators" | "creator";
  whoCanPostJobs: "members" | "moderators" | "creator";
  whoCanPostAnnouncements: "moderators" | "creator";
  whoCanUploadMedia: "moderators" | "creator";
  membersCanSeeMemberList: boolean;
  membersCanInvite: boolean;
};

export type HubMember = {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  photo: unknown;
  city?: string | null;
  role: "creator" | "admin" | "member";
  isCreator: boolean;
  joinedAt?: string;
  restriction: { kind: "muted" | "suspended"; until: string; reason: string | null } | null;
};

export type JoinRequest = {
  request: { id: number; communityId: number; requestUserId: number; createdAt: string; message?: string | null };
  user: { id: number; username: string; profile: { firstName: string | null; lastName: string | null; photo: unknown; bio: string | null; city: string | null } };
  community: { id: number; name: string };
};

/** Owner, or a member the owner made a moderator. */
export const canManage = (hub: ManagedHub) => hub.isOwner === true || hub.currentUserRole === "creator" || hub.currentUserRole === "admin";

export const roleLabel = (hub: ManagedHub) => (hub.isOwner || hub.currentUserRole === "creator" ? "Owner" : "Moderator");

/** Media columns are stored as a URL string or an object with a url. */
export function mediaUrl(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object" && typeof (value as { url?: unknown }).url === "string") return (value as { url: string }).url;
  return null;
}

export const personName = (person: { firstName?: string | null; lastName?: string | null; username?: string | null }) =>
  [person.firstName, person.lastName].filter(Boolean).join(" ") || (person.username ? `@${person.username}` : "Tivorah member");

/** Lowercase handle from a Hub name, matching the API rule: letters, numbers, dots, underscores, hyphens. */
export function suggestHubUsername(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^[^a-z0-9]+|-+$/g, "")
    .slice(0, 40);
}

export const HUB_USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,39}$/;

export const SETTING_COPY: { key: keyof HubSettings; label: string; options: { value: string; label: string }[] }[] = [
  { key: "whoCanPostBanter", label: "Who can post in Banter", options: [{ value: "members", label: "All members" }, { value: "moderators", label: "Moderators and owner" }, { value: "creator", label: "Owner only" }] },
  { key: "whoCanStartThreads", label: "Who can reply in threads", options: [{ value: "members", label: "All members" }, { value: "moderators", label: "Moderators and owner" }, { value: "creator", label: "Owner only" }] },
  { key: "whoCanPostListings", label: "Who can share listings", options: [{ value: "members", label: "All members" }, { value: "moderators", label: "Moderators and owner" }, { value: "creator", label: "Owner only" }] },
  { key: "whoCanPostJobs", label: "Who can post jobs", options: [{ value: "members", label: "All members" }, { value: "moderators", label: "Moderators and owner" }, { value: "creator", label: "Owner only" }] },
  { key: "whoCanPostAnnouncements", label: "Who can post announcements", options: [{ value: "moderators", label: "Moderators and owner" }, { value: "creator", label: "Owner only" }] },
  { key: "whoCanUploadMedia", label: "Who can add to Hub media", options: [{ value: "moderators", label: "Moderators and owner" }, { value: "creator", label: "Owner only" }] },
];

export type NewHub = {
  name: string;
  username: string;
  slogan: string;
  bio: string;
  isPrivate: boolean;
  interestIds: number[];
  /** Optional preset keys. Base rules apply to every Hub, so they are never sent. Custom rules go as text. */
  ruleKeys: string[];
  customRule: string;
  locality: { suburb: string; state: string; postcode: string; countryCode?: string } | null;
  /** The Hub's country, also for a country-wide Hub with no town (defaults to Australia). */
  countryCode?: string;
  avatar: Blob | null;
  /** One key per create attempt, reused on retries, so a lost response never makes a second Hub. */
  idempotencyKey?: string;
  /** The cover slides, one photo each (a video's first frame on its slide; lib/cover-slides.ts). */
  covers: Blob[];
  /** The cover video's finished upload, and the slide it plays on. */
  coverVideoUploadId?: string;
  coverVideoPosition?: number;
  /** The opening welcome post. Left out, the API posts its suggested welcome (like older apps). */
  welcome?: { enabled: boolean; message: string };
};

export const HUB_WELCOME_MAX = 500;

/** Problems that stop a Hub being created, keyed by field, in the order the form shows them. */
export function newHubErrors(hub: NewHub): Partial<Record<"avatar" | "name" | "username" | "interests", string>> {
  const errors: Partial<Record<"avatar" | "name" | "username" | "interests", string>> = {};
  if (!hub.avatar) errors.avatar = "Add a Hub photo so people recognise it.";
  if (hub.name.trim().length < 3) errors.name = "Give your Hub a name of at least 3 characters.";
  if (!HUB_USERNAME_PATTERN.test(hub.username)) errors.username = "Use 3–40 lowercase letters, numbers, dots, underscores or hyphens, starting with a letter or number.";
  if (hub.interestIds.length < 1) errors.interests = "Choose at least one interest.";
  else if (hub.interestIds.length > 6) errors.interests = "Choose up to six interests.";
  return errors;
}

/** Multipart body for POST /community/create, the same fields the mobile app sends. */
export function newHubFormData(hub: NewHub): FormData {
  const form = new FormData();
  form.set("name", hub.name.trim());
  form.set("username", hub.username.trim());
  form.set("slogan", hub.slogan.trim());
  form.set("bio", hub.bio.trim());
  form.set("isPrivate", hub.isPrivate ? "true" : "false");
  form.set("interestIds", JSON.stringify([...new Set(hub.interestIds)]));
  const rules: HubRule[] = hub.ruleKeys.map((key) => ({ key, text: "" }));
  if (hub.customRule.trim()) rules.push({ key: "custom", text: hub.customRule.trim() });
  form.set("guidelines", JSON.stringify(rules));
  const country = hub.locality?.countryCode || hub.countryCode;
  if (country) form.set("countryCode", country);
  if (hub.locality) {
    form.set("suburb", hub.locality.suburb);
    if (hub.locality.state) form.set("state", hub.locality.state);
    if (hub.locality.postcode) form.set("postcode", hub.locality.postcode);
  }
  if (hub.avatar) form.set("avatar", hub.avatar);
  if (hub.idempotencyKey) form.set("idempotencyKey", hub.idempotencyKey);
  for (const cover of hub.covers) form.append("banner", cover);
  if (hub.coverVideoUploadId) {
    form.set("coverVideoUploadId", hub.coverVideoUploadId);
    form.set("coverVideoPosition", String(hub.coverVideoPosition ?? 0));
  }
  // Same fields as the app: off, or the creator's text (empty sends the API's suggestion).
  if (hub.welcome) {
    form.set("postWelcome", hub.welcome.enabled ? "true" : "false");
    if (hub.welcome.enabled && hub.welcome.message.trim()) form.set("welcomeMessage", hub.welcome.message.trim());
  }
  return form;
}
