"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import "./admin.css";
import { BrandedQrCode } from "../branded-qr-code";
import { adminAuthClient } from "./auth-client";

type Flag = {
  id: number;
  key: string;
  name: string;
  enabled: boolean;
  presentation: "hidden" | "coming_soon" | "maintenance";
  version: number;
  config?: { group?: string };
};
type Dashboard = {
  totals: Record<string, number>;
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
  companyName?: string | null;
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
type Report = {
  id: number;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  status: string;
};
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
type PlatformFee = {
  id: number;
  feature: "item" | "service" | "event";
  percentageBps: number;
  fixedFeeCents: number;
  chargedTo: "buyer" | "provider";
  active: boolean;
  version: number;
};
type Section =
  | "overview"
  | "analytics"
  | "features"
  | "payments"
  | "users"
  | "moderation"
  | "notifications";
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
      "Understand members, providers, businesses and marketplace growth.",
  },
  {
    id: "features",
    label: "Features",
    description: "Control what is available across the mobile app and API.",
  },
  {
    id: "payments",
    label: "Payments",
    description: "Set platform pricing for items, services and events.",
  },
  {
    id: "users",
    label: "Users",
    description: "Manage members, providers, businesses, companies and staff access.",
  },
  {
    id: "moderation",
    label: "Moderation",
    description: "Review reports and keep Tivorah safe.",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Create templates and communicate with Tivorah members.",
  },
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
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
const API = process.env.NEXT_PUBLIC_API_URL ?? "";
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
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
  const [sessionReady, setSessionReady] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [features, setFeatures] = useState<Flag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<UserPagination>({
    page: 1,
    pageSize: 20,
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
  const [platformFees, setPlatformFees] = useState<PlatformFee[]>([]);
  const [feeBusy, setFeeBusy] = useState<PlatformFee["feature"] | null>(null);
  const [featureSearch, setFeatureSearch] = useState("");
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
  const load = useCallback(async () => {
    try {
      setDashboardBusy(true);
      setError("");
      const [d, a, f, r, b, p, t, fees] = await Promise.all([
        request("/api/v1/admin/dashboard"),
        request("/api/v1/admin/analytics"),
        request("/api/v1/admin/features"),
        request("/api/v1/admin/reports"),
        request("/api/v1/admin/broadcasts"),
        request("/api/v1/admin/push-deliveries"),
        request("/api/v1/admin/notification-templates"),
        request("/api/v1/admin/payment-fees"),
      ]);
      setDashboard(d);
      setAnalytics(a);
      setFeatures(f);
      setReports(r);
      setBroadcasts(b);
      setDeliveries(p);
      setTemplates(t);
      setPlatformFees(fees);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load dashboard");
    } finally {
      setDashboardBusy(false);
    }
  }, []);
  const loadUsers = useCallback(async () => {
    try {
      setUsersBusy(true);
      setError("");
      const params = new URLSearchParams({
        page: String(userPage),
        pageSize: "20",
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
      void adminAuthClient.signOut();
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
        const current = await request("/api/v1/user/me");
        const user = current?.user;
        if (!user || !staffRoles.has(user.role))
          throw new Error("This account does not have staff access");
        if (!mounted) return;
        setSignedIn(true);
        await load();
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
      const current = await request("/api/v1/user/me");
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
      setSignedIn(true);
      await load();
    } catch (e) {
      await adminAuthClient.signOut();
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
      setSignedIn(true);
      await load();
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
      setRecoveryCodes(enrollment?.backupCodes ?? []);
      setEnrollment(null);
      setSignedIn(true);
      await load();
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
    if (featureHistory[flag.id]) {
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
  async function updateReport(report: Report, status: string) {
    try {
      const updated = await request(`/api/v1/admin/reports/${report.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setReports((all) =>
        all.map((item) => (item.id === report.id ? updated : item)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }
  async function createBroadcast(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await request("/api/v1/admin/broadcasts", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          body: form.get("body"),
          category: form.get("category"),
          deepLink: form.get("deepLink") || undefined,
          targetRoles: form.getAll("roles"),
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Broadcast was not queued");
    }
  }
  async function saveTemplate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await request("/api/v1/admin/notification-templates", {
        method: "POST",
        body: JSON.stringify({
          key: form.get("key"),
          name: form.get("name"),
          category: form.get("category"),
          title: form.get("title"),
          body: form.get("body"),
          deepLink: form.get("deepLink") || undefined,
          active: true,
        }),
      });
      e.currentTarget.reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Template was not saved");
    }
  }
  async function savePlatformFee(
    e: FormEvent<HTMLFormElement>,
    fee: PlatformFee,
  ) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = {
      percentageBps: Math.round(Number(form.get("percentage")) * 100),
      fixedFeeCents: Math.round(Number(form.get("fixedDollars")) * 100),
      chargedTo: String(form.get("chargedTo")) as PlatformFee["chargedTo"],
      active: form.get("active") === "on",
    };
    if (
      !window.confirm(
        `Apply this ${fee.feature} fee to new checkouts? Existing bookings keep their original fee.`,
      )
    )
      return;
    try {
      setFeeBusy(fee.feature);
      setError("");
      const updated = await request(
        `/api/v1/admin/payment-fees/${fee.feature}`,
        { method: "PATCH", body: JSON.stringify(next) },
      );
      setPlatformFees((rows) =>
        rows.map((row) => (row.feature === fee.feature ? updated : row)),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Payment fee was not saved",
      );
    } finally {
      setFeeBusy(null);
    }
  }
  const groupedFeatures = features
    .filter((flag) =>
      `${flag.name} ${flag.key}`
        .toLowerCase()
        .includes(featureSearch.toLowerCase()),
    )
    .reduce<Record<string, Flag[]>>((groups, flag) => {
      const group = flag.config?.group ?? "Other";
      (groups[group] ??= []).push(flag);
      return groups;
    }, {});
  if (recoveryCodes.length)
    return (
      <main className="admin">
        <div className="content admin-security">
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
        </div>
      </main>
    );
  if (mfaChallenge)
    return (
      <main className="admin">
        <div className="content admin-signin">
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
        </div>
      </main>
    );
  if (enrollment)
    return (
      <main className="admin">
        <div className="content admin-security">
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
        </div>
      </main>
    );
  if (!sessionReady)
    return (
      <main className="admin">
        <div className="content admin-signin">
          <div className="admin-session-loading" role="status">
            <span />
            <p>Checking your secure session…</p>
          </div>
        </div>
      </main>
    );
  if (!signedIn)
    return (
      <main className="admin">
        <div className="content admin-signin">
          <span className="eyebrow">Staff only</span>
          <h1>Admin sign in</h1>
          <p className="admin-signin-intro">
            Manage Tivorah features and community operations.
          </p>
          <form
            className="panel admin-signin-form"
            onSubmit={login}
            aria-busy={loginBusy}
          >
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="Admin email"
              autoFocus
              required
            />
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
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
        </div>
      </main>
    );
  return (
    <main className="admin admin-dashboard">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <Image
              src="/tivorah-logo.png"
              alt="Tivorah"
              width={708}
              height={226}
              priority
            />
            <span>Admin portal</span>
          </div>
          <nav className="admin-navigation" aria-label="Admin sections">
            {sections.map((item) => (
              <button
                className={section === item.id ? "active" : ""}
                key={item.id}
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => setSection(item.id)}
              >
                <AdminIcon name={item.id} />
                <span>{item.label}</span>
                {item.id === "moderation" && reports.length > 0 ? (
                  <b>{reports.length}</b>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="admin-sidebar-foot">
            <span className="status-dot" />
            Secure staff session
          </div>
        </aside>
        <section className="admin-workspace">
          <header className="admin-topbar">
            <div>
              <span className="eyebrow">Tivorah operations</span>
              <h1>{sections.find((item) => item.id === section)?.label}</h1>
              <p>{sections.find((item) => item.id === section)?.description}</p>
            </div>
            <div className="admin-topbar-actions">
              <button
                className="admin-refresh"
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
              </button>
              <button
                className="admin-action-button"
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
          {error && (
            <div className="admin-error" role="alert">
              <div>
                <strong>Unable to complete that request</strong>
                <p>{error}</p>
              </div>
              <button onClick={() => void load()}>Try again</button>
            </div>
          )}
          {section === "overview" && (
            <div className="admin-overview">
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
                    <button onClick={() => setSection("moderation")}>
                      <span>
                        <b>{reports.length}</b>
                        <small>Open reports</small>
                      </span>
                      <em>Review</em>
                    </button>
                    <button onClick={() => setSection("users")}>
                      <span>
                        <b>{dashboard?.totals.suspendedUsers ?? 0}</b>
                        <small>Suspended users</small>
                      </span>
                      <em>Manage</em>
                    </button>
                    <button onClick={() => setSection("notifications")}>
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
          {section === "features" && (
            <section className="panel">
              <h3>Feature controls</h3>
              <p>
                Changes apply immediately and are enforced by both the API and
                mobile navigation.
              </p>
              <input
                className="feature-search"
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                placeholder="Search feature name or key"
              />
              {features.length === 0 ? (
                <p>
                  No feature flags have been configured for this environment.
                </p>
              ) : (
                Object.entries(groupedFeatures).map(([group, flags]) => (
                  <div key={group}>
                    <h4 className="feature-group">{group}</h4>
                    {flags.map((flag) => (
                      <div key={flag.id}>
                        <div className="feature">
                          <div>
                            <strong>{flag.name}</strong>
                            <small>
                              <br />
                              {flag.key} · v{flag.version}
                            </small>
                          </div>
                          <label>
                            <input
                              disabled={featureBusy === flag.id}
                              type="checkbox"
                              checked={flag.enabled}
                              onChange={(e) =>
                                updateFlag(flag, { enabled: e.target.checked })
                              }
                            />{" "}
                            Enabled
                          </label>
                          <select
                            disabled={featureBusy === flag.id}
                            value={flag.presentation}
                            onChange={(e) =>
                              updateFlag(flag, {
                                presentation: e.target
                                  .value as Flag["presentation"],
                              })
                            }
                          >
                            <option value="hidden">Hidden</option>
                            <option value="coming_soon">Coming soon</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                          <span>
                            <button onClick={() => toggleHistory(flag)}>
                              History
                            </button>
                          </span>
                        </div>
                        {featureHistory[flag.id]?.length ? (
                          <div className="feature-history">
                            {featureHistory[flag.id].slice(0, 8).map((row) => (
                              <small key={row.id}>
                                v{row.version} · {row.action} ·{" "}
                                {new Date(row.createdAt).toLocaleString()}
                                <br />
                              </small>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </section>
          )}
          {section === "payments" && (
            <section className="panel">
              <h3>Platform pricing</h3>
              <p>
                Each saved rate applies only to new checkouts. Existing orders
                retain the exact fee and version shown when they were created.
              </p>
              <div className="payment-fee-grid">
                {platformFees.length === 0 ? (
                  <p>
                    No payment fee configuration is available. Paid checkouts
                    remain protected until pricing is configured.
                  </p>
                ) : (
                  platformFees.map((fee) => (
                    <form
                      key={fee.feature}
                      className="payment-fee-card"
                      onSubmit={(event) => savePlatformFee(event, fee)}
                      aria-busy={feeBusy === fee.feature}
                    >
                      <div>
                        <strong>{humanize(fee.feature)}</strong>
                        <small>Version {fee.version}</small>
                      </div>
                      <label>
                        Percentage fee
                        <input
                          name="percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={(fee.percentageBps / 100).toFixed(2)}
                          required
                        />
                        <span>%</span>
                      </label>
                      <label>
                        Fixed fee
                        <input
                          name="fixedDollars"
                          type="number"
                          min="0"
                          max="1000"
                          step="0.01"
                          defaultValue={(fee.fixedFeeCents / 100).toFixed(2)}
                          required
                        />
                        <span>AUD</span>
                      </label>
                      <label>
                        Charged to
                        <select name="chargedTo" defaultValue={fee.chargedTo}>
                          <option value="provider">Provider / organiser</option>
                          <option value="buyer">Buyer</option>
                        </select>
                      </label>
                      <label className="payment-fee-toggle">
                        <input
                          name="active"
                          type="checkbox"
                          defaultChecked={fee.active}
                        />{" "}
                        Charge this fee
                      </label>
                      <p className="payment-fee-example">
                        On A$100: A$
                        {(
                          (fee.percentageBps + fee.fixedFeeCents) /
                          100
                        ).toFixed(2)}{" "}
                        platform fee, currently paid by the {fee.chargedTo}.
                      </p>
                      <button disabled={feeBusy === fee.feature}>
                        <ButtonContent
                          busy={feeBusy === fee.feature}
                          label="Save pricing"
                          busyLabel="Saving…"
                        />
                      </button>
                    </form>
                  ))
                )}
              </div>
              <div className="payment-safety-note">
                <strong>Settlement model</strong>
                <p>
                  Stripe Connect Express onboards recipients and handles
                  identity and bank details. Tivorah records the fee snapshot,
                  retains refund and dispute controls, and names the connected
                  provider or organiser as settlement merchant for supported
                  destination charges.
                </p>
              </div>
            </section>
          )}
          {section === "users" && (
            <section className="panel user-directory" aria-busy={usersBusy}>
              <div className="directory-heading">
                <div>
                  <h3>People and organisations</h3>
                  <p>
                    Search and manage member, provider, business and company
                    accounts independently.
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
                  <span>Account type</span>
                  <select
                    value={userSegment}
                    onChange={(e) => {
                      setUserSegment(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="all">All account types</option>
                    <option value="member">Members</option>
                    <option value="service_provider">Service providers</option>
                    <option value="business">Business sellers</option>
                    <option value="company">Companies</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={userStatus}
                    onChange={(e) => {
                      setUserStatus(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
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
                    <span>Type</span>
                    <span>Activity</span>
                    <span>Role</span>
                    <span>Status</span>
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
                      <span
                        className={`account-badge account-${user.accountType}`}
                      >
                        {humanize(user.accountType)}
                      </span>
                      <small>
                        {user.itemCount} items · {user.serviceCount} services
                      </small>
                      <select
                        aria-label={`Role for ${user.username}`}
                        value={user.role}
                        onChange={(e) =>
                          updateUser(user, { role: e.target.value })
                        }
                      >
                        {[
                          "user",
                          "tester",
                          "moderator",
                          "support",
                          "finance",
                          "event_operations",
                          "analyst",
                          "admin",
                          "owner",
                        ].map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                      <button
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
            <section className="panel">
              <h3>Moderation queue</h3>
              {reports.length === 0 ? (
                <p>No open reports.</p>
              ) : (
                reports.map((report) => (
                  <div className="feature" key={report.id}>
                    <div>
                      <strong>{report.reason}</strong>
                      <small>
                        <br />
                        {report.targetType} #{report.targetId} ·{" "}
                        {report.details}
                      </small>
                    </div>
                    <span>{report.status}</span>
                    <button onClick={() => updateReport(report, "reviewing")}>
                      Review
                    </button>
                    <button onClick={() => updateReport(report, "resolved")}>
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </section>
          )}
          {section === "notifications" && (
            <>
              <section className="panel">
                <h3>Notification template</h3>
                <form onSubmit={saveTemplate}>
                  <p>
                    <input
                      name="key"
                      placeholder="Key, e.g. order.shipped"
                      pattern="[a-z0-9_.-]+"
                      required
                    />{" "}
                    <input name="name" placeholder="Template name" required />
                  </p>
                  <p>
                    <select name="category">
                      {[
                        "activity",
                        "chat",
                        "communities",
                        "events",
                        "marketplace",
                        "safety",
                        "marketing",
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </p>
                  <p>
                    <input name="title" placeholder="Title" required />
                  </p>
                  <p>
                    <textarea name="body" placeholder="Message body" required />
                  </p>
                  <p>
                    <input
                      name="deepLink"
                      placeholder="Optional internal path"
                    />
                  </p>
                  <button>Save template</button>
                </form>
                {templates.map((item) => (
                  <div className="feature" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        <br />
                        {item.key} · {item.category}
                      </small>
                    </div>
                    <span>{item.active ? "Active" : "Inactive"}</span>
                  </div>
                ))}
              </section>
              <section className="panel">
                <h3>Queue broadcast</h3>
                <form onSubmit={createBroadcast}>
                  <p>
                    <input
                      name="title"
                      placeholder="Notification title"
                      maxLength={100}
                      required
                    />
                  </p>
                  <p>
                    <textarea
                      name="body"
                      placeholder="Message"
                      maxLength={1000}
                      required
                    />
                  </p>
                  <p>
                    <select name="category" defaultValue="activity">
                      {[
                        "activity",
                        "chat",
                        "communities",
                        "events",
                        "marketplace",
                        "safety",
                        "marketing",
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </p>
                  <p>
                    <input
                      name="deepLink"
                      placeholder="Optional internal path, e.g. /notifications/notifications"
                    />
                  </p>
                  <fieldset>
                    <legend>Audience (none means all active users)</legend>
                    {[
                      "user",
                      "tester",
                      "moderator",
                      "support",
                      "finance",
                      "event_operations",
                      "analyst",
                      "admin",
                      "owner",
                    ].map((role) => (
                      <label key={role}>
                        <input type="checkbox" name="roles" value={role} />{" "}
                        {role}{" "}
                      </label>
                    ))}
                  </fieldset>
                  <button>Queue broadcast</button>
                </form>
              </section>
              <section className="panel">
                <h3>Broadcast history</h3>
                {broadcasts.map((item) => (
                  <div className="feature" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>
                        <br />
                        {item.category} ·{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <span>{item.status}</span>
                    <span>
                      {item.deliveredCount}/{item.recipientCount} devices ·{" "}
                      {item.failedCount} failed
                    </span>
                  </div>
                ))}
              </section>
              <section className="panel">
                <h3>Recent delivery attempts</h3>
                {deliveries.slice(0, 50).map((item) => (
                  <div className="feature" key={item.id}>
                    <span>{item.status}</span>
                    <small>
                      {item.errorCode} {item.errorMessage}
                    </small>
                    <small>{new Date(item.attemptedAt).toLocaleString()}</small>
                  </div>
                ))}
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
