"use client";
import { BrandLogo } from "../../components/brand-logo";
import { NotificationsWorkspace } from "./notifications-workspace";
import { type DetailedReport } from "./report-card";
import { Moderation, openReportCount } from "./moderation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import PricingManager from "./pricing-manager";
import SellerFees from "./seller-fees";
import PaymentCountries from "./payment-countries";
import Compliance from "./compliance";
import FeatureManager from "./feature-manager";
import { Escalations } from "./escalations";
import Link from "next/link";
import "./admin.css";
import { BrandedQrCode } from "../branded-qr-code";
import { adminAuthClient } from "./auth-client";
import { adminApiBase } from "./api-base";
import { PasswordInput } from "../../components/ui/password-input";
import { PAGE_SIZE, Pagination, usePagedList } from "../../components/ui/pagination";
import { SelectField } from "../../components/ui/select-field";

type Flag = {
  id: number;
  key: string;
  name: string;
  enabled: boolean;
  presentation: "hidden" | "coming_soon" | "maintenance";
  version: number;
  config?: { group?: string };
};
/** Labels for involvement tags (API: services/userInvolvement.ts). */
const INVOLVEMENT_LABELS: Record<string, string> = {
  event_organizer: "Event organiser",
  service_provider: "Service provider",
  seller: "Seller",
  business: "Business",
  employer: "Employer",
  hub_owner: "Hub owner",
  hub_moderator: "Hub moderator",
  customer: "Customer",
};
type Dashboard = {
  totals: Record<string, number>;
  /** Legal checklist items needing action (admin → Legal & compliance). */
  compliance?: { actionNeeded: number } | null;
  involvement?: { tag: string; label: string; users: number }[];
  health: Record<string, string>;
};
type Analytics = {
  generatedAt: string;
  audiences: Array<{ label: string; value: number }>;
  listings: Array<{ type: string; status: string; value: number }>;
  growth: Record<string, number>;
};
type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  accountType: "member" | "service_provider" | "business" | "company";
  isOrganizer?: boolean;
  isServiceProvider?: boolean;
  companyName?: string | null;
  /** What they're involved in (tivorah-api/src/services/userInvolvement.ts); several at once. */
  tags?: string[];
  itemCount: number;
  serviceCount: number;
  createdAt: string;
};
type UserPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};
type Report = DetailedReport;
type Broadcast = {
  id: number;
  title: string;
  category: string;
  status: string;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
};
type Delivery = {
  id: number;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  attemptedAt: string;
};
type Template = {
  id: number;
  key: string;
  name: string;
  category: string;
  title: string;
  body: string;
  active: boolean;
};
type Section =
  | "overview"
  | "analytics"
  | "features"
  | "payments"
  | "users"
  | "moderation"
  | "escalations"
  | "notifications"
  | "compliance";

type AdminResource = "dashboard" | "analytics" | "features" | "reports" | "broadcasts" | "deliveries" | "templates";
/** What each tab shows. Tabs not listed (users, payments, escalations) load their own data. */
const SECTION_RESOURCES: Partial<Record<Section, AdminResource[]>> = {
  overview: ["dashboard", "reports", "deliveries"],
  analytics: ["analytics"],
  features: ["features"],
  moderation: ["reports"],
  notifications: ["broadcasts", "deliveries", "templates"],
};
const sections: { id: Section; label: string; description: string }[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Monitor Tivorah’s activity and operational health.",
  },
  {
    id: "analytics",
    label: "Analytics",
    description:
      "Understand members, organisers, providers and marketplace growth.",
  },
  {
    id: "features",
    label: "Features",
    description: "Manage app availability with clear, feature-by-feature controls.",
  },
  {
    id: "payments",
    label: "Payments",
    description: "Set platform pricing for items, services and events.",
  },
  {
    id: "users",
    label: "Users",
    description: "Manage member accounts, participant status and staff access.",
  },
  {
    id: "moderation",
    label: "Moderation",
    description: "Review reports and keep Tivorah safe.",
  },
  {
    id: "escalations",
    label: "Escalations",
    description: "Review refund requests and complaints sent to Tivorah.",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Create templates and communicate with Tivorah members.",
  },
  {
    id: "compliance",
    label: "Legal & compliance",
    description: "Members by country and the legal tasks Tivorah must do.",
  },
];
/** The sidebar, in three groups (same pattern as the Business portal). */
const sectionGroups: { label: string; ids: Section[] }[] = [
  { label: "Insights", ids: ["overview", "analytics"] },
  { label: "People & safety", ids: ["users", "moderation", "escalations"] },
  { label: "Platform", ids: ["features", "payments", "notifications", "compliance"] },
];
const groupOf = (id: Section) => sectionGroups.find((group) => group.ids.includes(id))?.label ?? "Admin";
/**
 * Staff access: one level per person, controlling what they can do in this admin portal only.
 * (What people do in the app is shown separately as involvement tags, which can be several.)
 */
const STAFF_ACCESS: [string, string][] = [
  ["user", "No staff access"],
  ["tester", "Tester: early app features, no admin portal"],
  ["analyst", "Analyst: view and handle reports"],
  ["support", "Support: view and handle reports"],
  ["moderator", "Moderator: view and handle reports"],
  ["event_operations", "Event operations: view and handle reports"],
  ["finance", "Finance: view and handle reports"],
  ["admin", "Admin: full control (authenticator required)"],
  ["owner", "Owner: full control (authenticator required)"],
];
const staffRoles = new Set([
  "owner",
  "admin",
  "moderator",
  "support",
  "finance",
  "event_operations",
  "analyst",
]);
const adminSessionExpiredEvent = "tivorah:admin-session-expired";
function AdminIcon({ name }: { name: Section }) {
  const paths: Record<Section, React.ReactNode> = {
    compliance: (
      <>
        <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </>
    ),
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
        <path d="M2 21h22" />
      </>
    ),
    features: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
    payments: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M16 15h2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    moderation: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    escalations: (
      <>
        <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
        <path d="M21 3v5h-5M12 7v5l3 2" />
      </>
    ),
    notifications: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${adminApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...init.headers },
  });
  const json =
    response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (response.status === 401) {
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event(adminSessionExpiredEvent));
    throw new Error("Your secure session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(json.message ?? "Request failed");
  return json.data;
}
async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}
function ButtonContent({
  busy,
  label,
  busyLabel,
}: {
  busy: boolean;
  label: string;
  busyLabel: string;
}) {
  return (
    <>
      {busy && <span className="button-spinner" aria-hidden="true" />}
      <span>{busy ? busyLabel : label}</span>
    </>
  );
}

export default function AdminPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [staffUserId, setStaffUserId] = useState<number | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<Section, string>>>({});
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [features, setFeatures] = useState<Flag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<UserPagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [userPage, setUserPage] = useState(1);
  const [userQuery, setUserQuery] = useState("");
  const [userSegment, setUserSegment] = useState("all");
  const [userStatus, setUserStatus] = useState("all");
  const [usersBusy, setUsersBusy] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState(false);
  const [enrollment, setEnrollment] = useState<{
    secret: string;
    totpURI: string;
    backupCodes: string[];
  } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  // Admin lists page at 10, the shared web list size.
  const [featureBusy, setFeatureBusy] = useState<number | null>(null);
  const [featureHistory, setFeatureHistory] = useState<Record<number, any[]>>(
    {},
  );
  const [loginBusy, setLoginBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<
    "verify" | "enroll" | "copy-secret" | "copy-recovery" | "sign-out" | null
  >(null);
  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  // Each tab loads only what it shows, the first time it's opened (Refresh reloads just that tab).
  // Opening the page used to fetch all seven at once, which could exceed a small database's
  // connection limit and is wasted work for tabs nobody opens.
  const loadedResources = useRef(new Set<AdminResource>());
  const loadSection = useCallback(async (target: Section, force = false) => {
    const needed = (SECTION_RESOURCES[target] ?? []).filter((resource) => force || !loadedResources.current.has(resource));
    if (!needed.length) return;
    const fetchers: Record<AdminResource, () => Promise<void>> = {
      dashboard: () => request("/api/v1/admin/dashboard").then(setDashboard),
      analytics: () => request("/api/v1/admin/analytics").then(data => {
        const totals = new Map<string, number>();
        for (const row of data.audiences ?? []) totals.set(row.label, (totals.get(row.label) ?? 0) + Number(row.value));
        setAnalytics({ ...data, audiences: Array.from(totals, ([label, value]) => ({ label, value })) });
      }),
      features: () => request("/api/v1/admin/features").then(setFeatures),
      reports: () => request("/api/v1/admin/reports?pageSize=100").then(setReports),
      broadcasts: () => request("/api/v1/admin/broadcasts").then(setBroadcasts),
      deliveries: () => request("/api/v1/admin/push-deliveries").then(setDeliveries),
      templates: () => request("/api/v1/admin/notification-templates").then(setTemplates),
    };
    try {
      setDashboardBusy(true);
      setError("");
      const results = await Promise.allSettled(needed.map((resource) => fetchers[resource]().then(() => { loadedResources.current.add(resource); })));
      const messages = results.flatMap((result) => result.status === "rejected" ? [result.reason instanceof Error ? result.reason.message : "This section could not load."] : []);
      setSectionErrors((current) => ({ ...current, [target]: messages.length ? [...new Set(messages)].join(" ") : undefined }));
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load dashboard");
    } finally {
      setDashboardBusy(false);
    }
  }, []);
  useEffect(() => { if (signedIn) void loadSection(section); }, [signedIn, section, loadSection]);
  /** Reloads the open tab. */
  const load = useCallback(() => loadSection(section, true), [section, loadSection]);
  const loadUsers = useCallback(async () => {
    try {
      setUsersBusy(true);
      setError("");
      const params = new URLSearchParams({
        page: String(userPage),
        pageSize: String(PAGE_SIZE),
      });
      if (userQuery.trim()) params.set("query", userQuery.trim());
      if (userSegment !== "all") params.set("segment", userSegment);
      if (userStatus !== "all") params.set("status", userStatus);
      const result = await request(`/api/v1/admin/users?${params}`);
      setUsers(result.users);
      setUserPagination(result.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Users could not be loaded");
    } finally {
      setUsersBusy(false);
    }
  }, [userPage, userQuery, userSegment, userStatus]);
  useEffect(() => {
    if (!signedIn || section !== "users") return;
    const timer = window.setTimeout(
      () => void loadUsers(),
      userQuery ? 250 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [signedIn, section, loadUsers, userQuery]);
  useEffect(() => {
    const expire = () => {
      setSignedIn(false);
      setMfaChallenge(false);
      setEnrollment(null);
      setRecoveryCodes([]);
      setError("Your secure session expired. Sign in again.");
      // Do not race a fresh login with a delayed sign-out request from an older failed read.
    };
    window.addEventListener(adminSessionExpiredEvent, expire);
    return () => window.removeEventListener(adminSessionExpiredEvent, expire);
  }, []);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const result = await adminAuthClient.getSession();
        if (!result.data?.session) return;
        const current = await request("/api/v1/user/identity");
        const user = current?.user;
        if (!user || !staffRoles.has(user.role))
          throw new Error("This account does not have staff access");
        if (!mounted) return;
        if ((user.role === 'owner' || user.role === 'admin') && !user.twoFactorEnabled) {
          setError('Sign in with your password to finish authenticator setup.');
          return;
        }
        setStaffUserId(Number(user.id));
        setSignedIn(true);
      } catch (e) {
        if (mounted)
          setError(
            e instanceof Error ? e.message : "Sign in again to continue",
          );
      } finally {
        if (mounted) setSessionReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    try {
      setLoginBusy(true);
      setError("");
      const result = await adminAuthClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);
      if (
        (result.data as { twoFactorRedirect?: boolean } | null)
          ?.twoFactorRedirect
      ) {
        setMfaChallenge(true);
        return;
      }
      const current = await request("/api/v1/user/identity");
      const user = current?.user;
      if (!user || !staffRoles.has(user.role))
        throw new Error("This account does not have staff access");
      if (
        (user.role === "owner" || user.role === "admin") &&
        !user.twoFactorEnabled
      ) {
        const setup = await adminAuthClient.twoFactor.enable({
          password,
          issuer: "Tivorah",
          method: "totp",
        });
        if (setup.error || setup.data?.method !== "totp")
          throw new Error(setup.error?.message ?? "Unable to start MFA setup");
        const uri = setup.data.totpURI;
        setEnrollment({
          secret: new URL(uri).searchParams.get("secret") ?? uri,
          totpURI: uri,
          backupCodes: setup.data.backupCodes,
        });
        return;
      }
      setStaffUserId(Number(user.id));
      setSignedIn(true);
    } catch (e) {
      setSignedIn(false);
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoginBusy(false);
    }
  }
  async function copySecret() {
    if (!enrollment) return;
    try {
      setActionBusy("copy-secret");
      await copyText(enrollment.secret);
      setSecretCopied(true);
      window.setTimeout(() => setSecretCopied(false), 1800);
    } catch {
      setError("Could not copy the setup key. Select and copy it manually.");
    } finally {
      setActionBusy(null);
    }
  }
  async function copyRecoveryCodes() {
    try {
      setActionBusy("copy-recovery");
      await copyText(recoveryCodes.join("\n"));
      setRecoveryCopied(true);
      window.setTimeout(() => setRecoveryCopied(false), 1800);
    } catch {
      setError(
        "Could not copy the recovery codes. Select and copy them manually.",
      );
    } finally {
      setActionBusy(null);
    }
  }
  async function verifyMfa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "").trim();
    try {
      setActionBusy("verify");
      setError("");
      const result = useRecoveryCode
        ? await adminAuthClient.twoFactor.verifyBackupCode({
            code,
            trustDevice: false,
          })
        : await adminAuthClient.twoFactor.verifyTotp({
            code,
            trustDevice: false,
          });
      if (result.error) {
        if (/two factor cookie/i.test(result.error.message ?? "")) {
          setMfaChallenge(false);
          setUseRecoveryCode(false);
          throw new Error(
            "Your verification session expired. Sign in again to request a fresh code challenge.",
          );
        }
        throw new Error(result.error.message);
      }
      setMfaChallenge(false);
      setUseRecoveryCode(false);
      const identity = await request('/api/v1/user/identity');
      if (!staffRoles.has(identity?.user?.role)) throw new Error('Your authenticator code was accepted, but this account no longer has staff access. An authorised administrator needs to restore your role.');
      setStaffUserId(Number(identity.user.id));
      setSignedIn(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "MFA verification failed");
    } finally {
      setActionBusy(null);
    }
  }
  async function confirmEnrollment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      setActionBusy("enroll");
      setError("");
      const result = await adminAuthClient.twoFactor.verifyTotp({
        code: String(form.get("code") ?? ""),
        trustDevice: false,
      });
      if (result.error) throw new Error(result.error.message);
      const identity = await request('/api/v1/user/identity');
      if (!staffRoles.has(identity?.user?.role)) throw new Error('This account does not have staff access');
      setStaffUserId(Number(identity.user.id));
      setRecoveryCodes(enrollment?.backupCodes ?? []);
      setEnrollment(null);
      setSignedIn(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "MFA enrollment failed");
    } finally {
      setActionBusy(null);
    }
  }
  async function signOut() {
    try {
      setActionBusy("sign-out");
      await adminAuthClient.signOut();
      setSignedIn(false);
    } finally {
      setActionBusy(null);
    }
  }
  async function updateFlag(flag: Flag, patch: Partial<Flag>) {
    if (
      !window.confirm(
        `${patch.enabled === true ? "Enable" : patch.enabled === false ? "Disable" : "Change"} ${flag.name}? This change will apply to the mobile app and API immediately.`,
      )
    )
      return;
    try {
      setFeatureBusy(flag.id);
      setError("");
      const updated = await request(`/api/v1/admin/features/${flag.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setFeatures((all) =>
        all.map((item) => (item.id === flag.id ? updated : item)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setFeatureBusy(null);
    }
  }
  async function toggleHistory(flag: Flag) {
    if (featureHistory[flag.id]?.length) {
      setFeatureHistory((all) => ({ ...all, [flag.id]: [] }));
      return;
    }
    try {
      const rows = await request(`/api/v1/admin/features/${flag.id}/history`);
      setFeatureHistory((all) => ({ ...all, [flag.id]: rows }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "History failed");
    }
  }
  async function updateUser(user: User, patch: Partial<User>) {
    try {
      const updated = await request(`/api/v1/admin/users/${user.id}/access`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setUsers((all) =>
        all.map((item) =>
          item.id === user.id ? { ...item, ...updated } : item,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }
  async function updateReport(report: Report, status: string, resolution?: string) {
    try {
      await request(`/api/v1/admin/reports/${report.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(resolution ? { resolution } : {}) }),
      });
      // Reload the detailed list: the update response is the bare report, without people or evidence.
      setReports(await request("/api/v1/admin/reports?pageSize=100"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
      throw e;
    }
  }
  // A failure belongs to the screen it happened on; switching sections starts clean.
  const goTo = (next: Section) => { setError(""); setSection(next); };
  const visibleError = error || sectionErrors[section];
  if (recoveryCodes.length)
    return (
      <main className="admin admin-auth-page">
        <div className="content admin-security">
          <div className="admin-auth-brand"><BrandLogo priority /></div>
          <span className="eyebrow">Security complete</span>
          <h1>Save your recovery codes</h1>
          <p className="admin-signin-intro">
            These one-time codes let Tivorah staff regain access if the company
            authenticator is lost, replaced or unavailable.
          </p>
          <section
            className="panel admin-signin-form admin-recovery-form"
            aria-busy={actionBusy !== null}
          >
            <div className="recovery-guidance">
              <strong>Store these in Tivorah’s company password manager</strong>
              <p>
                Each code works once. Treat them like passwords and do not store
                them in email, chat or an unsecured note.
              </p>
            </div>
            <div className="recovery-block" aria-label="Recovery codes">
              <pre>{recoveryCodes.join("\n")}</pre>
            </div>
            <div className="recovery-actions">
              <button
                type="button"
                disabled={actionBusy !== null}
                onClick={copyRecoveryCodes}
              >
                <ButtonContent
                  busy={actionBusy === "copy-recovery"}
                  label={recoveryCopied ? "Copied" : "Copy all codes"}
                  busyLabel="Copying…"
                />
              </button>
            </div>
            <button
              type="button"
              disabled={actionBusy !== null}
              onClick={() => setRecoveryCodes([])}
            >
              I have stored these safely
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
          <Link className="admin-auth-home" href="/">Return to Tivorah home</Link>
        </div>
      </main>
    );
  if (mfaChallenge)
    return (
      <main className="admin admin-auth-page">
        <div className="content admin-signin">
          <div className="admin-auth-brand"><BrandLogo priority /></div>
          <span className="eyebrow">Identity check</span>
          <h1>
            {useRecoveryCode
              ? "Use a recovery code"
              : "Enter your verification code"}
          </h1>
          <p className="admin-signin-intro">
            {useRecoveryCode
              ? "Enter one of the one-time recovery codes saved when Tivorah’s authenticator was connected."
              : "Open Tivorah’s authenticator and enter the current six-digit code."}
          </p>
          <form
            className="panel admin-signin-form"
            onSubmit={verifyMfa}
            aria-busy={actionBusy === "verify"}
          >
            <label htmlFor="mfa-code">
              {useRecoveryCode
                ? "Recovery code"
                : "Six-digit authenticator code"}
            </label>
            <input
              key={useRecoveryCode ? "recovery" : "totp"}
              id="mfa-code"
              name="code"
              inputMode={useRecoveryCode ? "text" : "numeric"}
              autoComplete="one-time-code"
              pattern={useRecoveryCode ? "[0-9A-Fa-f-]{6,32}" : "[0-9]{6}"}
              maxLength={useRecoveryCode ? 32 : 6}
              placeholder={useRecoveryCode ? "Enter recovery code" : "000 000"}
              autoFocus
              required
            />
            <button disabled={actionBusy === "verify"}>
              <ButtonContent
                busy={actionBusy === "verify"}
                label="Verify and continue"
                busyLabel="Verifying…"
              />
            </button>
            <div className="mfa-options">
              <button
                type="button"
                disabled={actionBusy === "verify"}
                onClick={() => {
                  setError("");
                  setUseRecoveryCode((value) => !value);
                }}
              >
                {useRecoveryCode
                  ? "Use authenticator instead"
                  : "Authenticator unavailable? Use a recovery code"}
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </form>
          <p className="mfa-reset-note">
            If Tivorah was never added to an authenticator and no recovery code
            is available, an authorised server administrator must reset MFA
            before a new QR code can be issued.
          </p>
          <Link className="admin-auth-home" href="/">Return to Tivorah home</Link>
        </div>
      </main>
    );
  if (enrollment)
    return (
      <main className="admin admin-auth-page">
        <div className="content admin-security">
          <div className="admin-auth-brand"><BrandLogo priority /></div>
          <span className="eyebrow">One-time setup</span>
          <h1>Protect your account</h1>
          <p className="admin-signin-intro">
            Scan this QR code with Google Authenticator, Microsoft
            Authenticator, 1Password or another TOTP app.
          </p>
          <form
            className="panel admin-signin-form admin-mfa-form"
            onSubmit={confirmEnrollment}
            aria-busy={actionBusy !== null}
          >
            <div className="totp-setup">
              <div className="totp-qr">
                <BrandedQrCode
                  value={enrollment.totpURI}
                  size={210}
                  ariaLabel="Scan to add Tivorah to your authenticator app"
                />
              </div>
              <div className="totp-steps">
                <strong>Scan, then confirm</strong>
                <ol>
                  <li>Open your authenticator app.</li>
                  <li>Scan the QR code.</li>
                  <li>Enter the six-digit code below.</li>
                </ol>
                <button
                  className="manual-toggle"
                  type="button"
                  disabled={actionBusy !== null}
                  aria-expanded={showManualSetup}
                  onClick={() => setShowManualSetup((value) => !value)}
                >
                  {showManualSetup
                    ? "Hide manual setup"
                    : "Cannot scan? Use a setup key"}
                </button>
                {showManualSetup && (
                  <div className="manual-secret">
                    <code>{enrollment.secret}</code>
                    <button
                      type="button"
                      disabled={actionBusy !== null}
                      onClick={copySecret}
                    >
                      <ButtonContent
                        busy={actionBusy === "copy-secret"}
                        label={secretCopied ? "Copied" : "Copy"}
                        busyLabel="Copying…"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <label htmlFor="setup-code">Six-digit authenticator code</label>
            <input
              id="setup-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000 000"
              autoFocus
              required
            />
            <button disabled={actionBusy !== null}>
              <ButtonContent
                busy={actionBusy === "enroll"}
                label="Confirm and secure account"
                busyLabel="Confirming…"
              />
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </form>
          <Link className="admin-auth-home" href="/">Return to Tivorah home</Link>
        </div>
      </main>
    );
  if (!sessionReady)
    return (
      <main className="admin admin-auth-page">
        <div className="content admin-signin">
          <div className="admin-auth-brand"><BrandLogo priority /></div>
          <div className="admin-session-loading" role="status">
            <span />
            <p>Checking your secure session…</p>
          </div>
        </div>
      </main>
    );
  if (!signedIn)
    return (
      <main className="admin admin-auth-page">
        <div className="content admin-signin">
          <div className="admin-auth-brand"><BrandLogo priority /></div>
          <form
            className="panel admin-signin-form"
            onSubmit={login}
            aria-busy={loginBusy}
          >
            <span className="eyebrow">TIVORAH STAFF</span>
            <h1>Welcome back.</h1>
            <p className="admin-signin-intro">Sign in to your staff workspace.</p>
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              required
            />
            <label htmlFor="admin-password">Password</label>
            <PasswordInput
              id="admin-password"
              fieldLabel="Password"
              name="password"
              autoComplete="current-password"
              required
            />
            <button disabled={loginBusy}>
              <ButtonContent
                busy={loginBusy}
                label="Sign in"
                busyLabel="Signing in…"
              />
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <p className="login-security-note">
              Multi-factor authentication is required for owner and admin
              accounts.
            </p>
          </form>
          <Link className="admin-auth-home" href="/">Return to Tivorah home</Link>
        </div>
      </main>
    );
  return (
    <main className="admin admin-dashboard">
      {/* The same frame as Your account and Business: site header, page width, sidebar card. */}
      <div className="product-page page-shell business-shell admin-portal">
      <div className="business-workspace">
        <aside className="business-sidebar admin-portal-sidebar" aria-label="Admin navigation">
          <Link className="business-sidebar-account" href="/account">← Your account</Link>
          <div className="business-sidebar-title"><p className="product-eyebrow">TIVORAH STAFF</p><strong>Admin</strong></div>
          {sectionGroups.map((group) => (
            <div key={group.label} className="business-sidebar-group">
              <p>{group.label}</p>
              {group.ids.map((id) => {
                const item = sections.find((entry) => entry.id === id)!;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-current={section === id ? "page" : undefined}
                    onClick={() => goTo(id)}
                  >
                    <AdminIcon name={id} />
                    <span>{item.label}</span>
                    {id === "moderation" && openReportCount(reports) > 0 ? <b className="admin-nav-count" aria-label={`${openReportCount(reports)} reports to review`}>{openReportCount(reports)}</b> : null}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="admin-portal-session">
            <span className="status-dot" aria-hidden="true" />
            <span>Secure staff session</span>
          </div>
        </aside>
        <div className="business-workspace-main admin-workspace">
          {/* Phones: back link and a section picker instead of the sidebar. */}
          <nav className="business-mobile-controls admin-mobile-controls" aria-label="Admin navigation on phones">
            <Link className="business-mobile-account" href="/account"><span aria-hidden="true">←</span> Your account</Link>
            <SelectField
              label="Admin section"
              value={section}
              onChange={(value) => goTo(value as Section)}
              options={sectionGroups.flatMap((group) => group.ids.map((id) => ({ value: id, label: `${group.label} · ${sections.find((entry) => entry.id === id)!.label}` })))}
            />
          </nav>
          <header className="account-heading admin-heading">
            <div>
              <p className="product-eyebrow">{groupOf(section).toUpperCase()}</p>
              <h1>{sections.find((item) => item.id === section)?.label}</h1>
              <p>{sections.find((item) => item.id === section)?.description}</p>
            </div>
            <div className="admin-heading-actions">
              {section !== "payments" ? <button
                type="button"
                className="product-secondary"
                disabled={dashboardBusy}
                onClick={() => {
                  void load();
                  if (section === "users") void loadUsers();
                }}
              >
                <ButtonContent
                  busy={dashboardBusy}
                  label="Refresh"
                  busyLabel="Refreshing…"
                />
              </button> : null}
              <button
                type="button"
                className="product-secondary"
                disabled={actionBusy === "sign-out"}
                onClick={signOut}
              >
                <ButtonContent
                  busy={actionBusy === "sign-out"}
                  label="Sign out"
                  busyLabel="Signing out…"
                />
              </button>
            </div>
          </header>
          {lastUpdated && (
            <p className="admin-updated" aria-live="polite">
              Updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
          {visibleError && (
            <div className="admin-error" role="alert">
              <div>
                <strong>Unable to complete that request</strong>
                <p>{visibleError}</p>
              </div>
              <button onClick={() => void load()}>Try again</button>
            </div>
          )}
          {section === "overview" && (
            <div className="admin-overview">
              {dashboard?.compliance?.actionNeeded ? (
                <div className="compliance-alert" role="status">
                  <strong>{dashboard.compliance.actionNeeded} legal {dashboard.compliance.actionNeeded === 1 ? "task needs" : "tasks need"} action</strong>
                  <span>Registrations, representatives and launch checks Tivorah must complete.</span>
                  <button type="button" onClick={() => goTo("compliance")}>Open Legal &amp; compliance</button>
                </div>
              ) : null}
              {!dashboard && dashboardBusy ? (
                <section
                  className="metric-grid"
                  aria-label="Loading dashboard totals"
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <div className="metric-card metric-skeleton" key={index}>
                      <span />
                      <strong />
                    </div>
                  ))}
                </section>
              ) : (
                <section className="metric-grid" aria-label="Tivorah totals">
                  {Object.entries(dashboard?.totals ?? {}).filter(([key]) => !["activeUsers", "suspendedUsers"].includes(key)).map(
                    ([key, value], index) => (
                      <article className="metric-card" key={key}>
                        <div
                          className={`metric-icon metric-icon-${index % 4}`}
                          aria-hidden="true"
                        >
                          {humanize(key).charAt(0)}
                        </div>
                        <div>
                          <span>{humanize(key)}</span>
                          <strong>{value.toLocaleString()}</strong>
                        </div>
                      </article>
                    ),
                  )}
                </section>
              )}
              {dashboard?.involvement?.length ? (
                <section className="involvement-summary" aria-label="People by what they do">
                  <header>
                    <h2>People by what they do</h2>
                    <p>One person can be several of these, so the numbers don’t add up to the user total.</p>
                  </header>
                  <div className="metric-grid">
                    {dashboard.involvement.map((row, index) => (
                      <button key={row.tag} type="button" className="metric-card" onClick={() => { setUserSegment(row.tag); setUserPage(1); goTo("users"); }} aria-label={`${row.label}s: ${row.users}. Show them in Users`}>
                        <div className={`metric-icon metric-icon-${index % 4}`} aria-hidden="true">{row.label.charAt(0)}</div>
                        <div>
                          <span>{row.label}s</span>
                          <strong>{row.users.toLocaleString()}</strong>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <div className="overview-grid">
                <section className="dashboard-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Live status</span>
                      <h2>System health</h2>
                    </div>
                    <span className="health-summary">
                      <i />
                      Operational
                    </span>
                  </div>
                  {Object.entries(dashboard?.health ?? {}).length === 0 ? (
                    <p className="admin-empty">
                      No health checks are available.
                    </p>
                  ) : (
                    <div className="health-list">
                      {Object.entries(dashboard?.health ?? {}).map(
                        ([key, value]) => (
                          <div key={key}>
                            <span>
                              <i
                                className={
                                  String(value).toLowerCase().includes("ok") ||
                                  String(value)
                                    .toLowerCase()
                                    .includes("healthy")
                                    ? "healthy"
                                    : "warning"
                                }
                              />
                              {humanize(key)}
                            </span>
                            <strong>{humanize(String(value))}</strong>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </section>
                <section className="dashboard-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Priority queue</span>
                      <h2>Needs attention</h2>
                    </div>
                  </div>
                  <div className="attention-list">
                    <button onClick={() => goTo("moderation")}>
                      <span>
                        <b>{openReportCount(reports)}</b>
                        <small>Open reports</small>
                      </span>
                      <em>Review</em>
                    </button>
                    <button onClick={() => goTo("users")}>
                      <span>
                        <b>{dashboard?.totals.suspendedUsers ?? 0}</b>
                        <small>Suspended users</small>
                      </span>
                      <em>Manage</em>
                    </button>
                    <button onClick={() => goTo("notifications")}>
                      <span>
                        <b>
                          {
                            deliveries.filter(
                              (item) => item.status === "failed",
                            ).length
                          }
                        </b>
                        <small>Failed deliveries</small>
                      </span>
                      <em>Inspect</em>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}
          {section === "analytics" && (
            <div className="analytics-layout">
              <section
                className="analytics-growth"
                aria-label="Growth in the last 30 days"
              >
                {Object.entries(analytics?.growth ?? {}).map(([key, value]) => (
                  <article key={key}>
                    <span>{humanize(key)}</span>
                    <strong>{value.toLocaleString()}</strong>
                  </article>
                ))}
              </section>
              <div className="analytics-grid">
                <section className="dashboard-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Audience</span>
                      <h2>Who uses Tivorah</h2>
                    </div>
                  </div>
                  <div className="bar-chart">
                    {(analytics?.audiences ?? []).map((row) => {
                      const max = Math.max(
                        ...(analytics?.audiences ?? []).map((item) =>
                          Number(item.value),
                        ),
                        1,
                      );
                      return (
                        <div className="bar-row" key={row.label}>
                          <div>
                            <span>{humanize(row.label)}</span>
                            <strong>
                              {Number(row.value).toLocaleString()}
                            </strong>
                          </div>
                          <span className="bar-track" aria-hidden="true">
                            <i
                              style={{
                                width: `${Math.max(4, (Number(row.value) / max) * 100)}%`,
                              }}
                            />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="dashboard-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="panel-kicker">Marketplace</span>
                      <h2>Listings by status</h2>
                    </div>
                  </div>
                  <div className="listing-analysis">
                    {(analytics?.listings ?? []).map((row) => (
                      <div key={`${row.type}-${row.status}`}>
                        <span>
                          <b>{humanize(row.type)}</b>
                          <small>{humanize(row.status)}</small>
                        </span>
                        <strong>{Number(row.value).toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
          {section === "features" && <FeatureManager flags={features} loading={dashboardBusy} busy={featureBusy} update={updateFlag} history={featureHistory} toggleHistory={toggleHistory} />}
          {section === "payments" && <><PaymentCountries request={request} /><PricingManager request={request} /><SellerFees request={request} /></>}
          {section === "compliance" && <Compliance request={request} />}
          {section === "users" && (
            <section className="panel user-directory" aria-busy={usersBusy}>
              <div className="directory-heading">
                <div>
                  <h3>People and organisations</h3>
                  <p>
                    <strong>Involved in</strong> shows everything a person does in the app (they can have several, such as Event organiser, Service provider and Hub moderator).{" "}
                    <strong>Staff access</strong> is separate: it only controls what someone can do in this admin portal, so each person has one level.
                  </p>
                </div>
                <strong>
                  {userPagination.total.toLocaleString()} accounts
                </strong>
              </div>
              <div className="directory-controls">
                <label>
                  <span>Search accounts</span>
                  <input
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Name, username or email"
                  />
                </label>
                <label>
                  <span>Involved in</span>
                  <SelectField
                    label="Involved in"
                    value={userSegment}
                    onChange={(value) => {
                      setUserSegment(value);
                      setUserPage(1);
                    }}
                    options={[
                      { value: "all", label: "Everyone" },
                      ...Object.entries(INVOLVEMENT_LABELS).map(([value, label]) => ({ value, label: `${label}s` })),
                      { value: "none", label: "Not involved in anything yet" },
                    ]}
                  />
                </label>
                <label>
                  <span>Status</span>
                  <SelectField
                    label="Status"
                    value={userStatus}
                    onChange={(value) => {
                      setUserStatus(value);
                      setUserPage(1);
                    }}
                    options={[
                      { value: "all", label: "All statuses" },
                      { value: "active", label: "Active" },
                      { value: "suspended", label: "Suspended" },
                    ]}
                  />
                </label>
              </div>
              {usersBusy && !users.length ? (
                <div className="directory-loading" role="status">
                  <span className="button-spinner" />
                  Loading accounts…
                </div>
              ) : users.length === 0 ? (
                <p className="admin-empty">No accounts match these filters.</p>
              ) : (
                <div
                  className="user-table"
                  role="table"
                  aria-label="Tivorah accounts"
                >
                  <div className="user-table-head" role="row">
                    <span>Account</span>
                    <span>Involved in</span>
                    <span>Listings</span>
                    <span>Staff access</span>
                    <span>Account status</span>
                  </div>
                  {users.map((user) => (
                    <div className="user-table-row" role="row" key={user.id}>
                      <div>
                        <strong>
                          {[user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(" ") || user.username}
                        </strong>
                        <small>
                          {user.companyName || `@${user.username}`} ·{" "}
                          {user.email}
                        </small>
                      </div>
                      {/* Every role they've taken on (a person can be several at once). */}
                      <span className="involvement-tags">
                        {(user.tags?.length ? user.tags : ["member"]).map((tag) => (
                          <span key={tag} className={`account-badge involvement-${tag}`}>
                            {INVOLVEMENT_LABELS[tag] ?? "Member"}
                          </span>
                        ))}
                      </span>
                      <small>
                        {user.itemCount} items · {user.serviceCount} services
                      </small>
                      <SelectField
                        label={`Staff access for ${user.username}`}
                        disabled={staffUserId === null || user.id === staffUserId}
                        title={user.id === staffUserId ? "Another administrator must change your staff access" : undefined}
                        value={user.role}
                        onChange={(role) => updateUser(user, { role })}
                        options={STAFF_ACCESS.map(([role, label]) => ({ value: role, label }))}
                      />
                      <button
                        disabled={staffUserId === null || user.id === staffUserId}
                        title={user.id === staffUserId ? "You cannot suspend your own account" : undefined}
                        className={
                          user.isActive ? "status-active" : "status-suspended"
                        }
                        onClick={() =>
                          updateUser(user, { isActive: !user.isActive })
                        }
                      >
                        {user.isActive ? "Active" : "Suspended"}
                        <small>{user.isActive ? "Suspend" : "Restore"}</small>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="pagination" aria-label="User pages">
                <button
                  disabled={usersBusy || userPage <= 1}
                  onClick={() => setUserPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {userPagination.page} of {userPagination.totalPages}
                </span>
                <button
                  disabled={usersBusy || !userPagination.hasMore}
                  onClick={() => setUserPage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            </section>
          )}
          {section === "moderation" && (
            <Moderation reports={reports} request={request} onUpdate={updateReport} />
          )}
          {section === "escalations" && <Escalations request={request} />}
          {section === "notifications" && (
            <NotificationsWorkspace request={request} templates={templates} broadcasts={broadcasts} deliveries={deliveries} onChanged={load} />
          )}
        </div>
      </div>
      </div>
    </main>
  );
}
