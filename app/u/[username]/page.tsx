import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { pageMetadata, socialImage } from "../../../lib/site";
import Image from "next/image";
import { OpenAppButton } from "./open-app-button";
import "./profile.css";

type PublicProfile = {
  id: number;
  username: string;
  firstName: string;
  lastName?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  photo?: { url?: string } | null;
  memberSince?: string | null;
  /** True when they have a shop worth visiting (items, services or events). */
  shopAvailable?: boolean;
};

type ProfileResult = { profile: PublicProfile | null; unavailable: boolean };

const decodeUsername = (value: string) => {
  try { return decodeURIComponent(value); } catch { return ""; }
};

const getProfile = cache(async (username: string): Promise<ProfileResult> => {
  // Rendered on the server: use the API origin the web server can reach (as lib/api/server-features.ts does).
  const apiUrl = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "");
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) return { profile: null, unavailable: false };
  if (!apiUrl) return { profile: null, unavailable: true };

  try {
    const response = await fetch(`${apiUrl}/api/v1/public/profiles/${encodeURIComponent(username)}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(10000) });
    if (response.status === 404 || response.status === 400) return { profile: null, unavailable: false };
    if (!response.ok) return { profile: null, unavailable: true };
    const payload = await response.json() as { data?: { profile?: PublicProfile } };
    return { profile: payload.data?.profile ?? null, unavailable: false };
  } catch {
    return { profile: null, unavailable: true };
  }
});

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = decodeUsername(rawUsername);
  const { profile } = await getProfile(username);
  if (!profile) return { title: "Tivorah profile", robots: { index: false, follow: false } };
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || `@${profile.username}`;
  const description = profile.bio?.trim() || `View ${name}'s public profile on Tivorah.`;
  const metadata = pageMetadata(`${name} on Tivorah`, description, `/u/${encodeURIComponent(profile.username)}`);
  const images = profile.photo?.url ? [{ url: profile.photo.url, alt: name }] : [socialImage];
  return {
    ...metadata,
    robots: { index: false, follow: false },
    openGraph: { ...metadata.openGraph, type: "profile", images },
    twitter: { ...metadata.twitter, images },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const username = decodeUsername(rawUsername);
  const { profile, unavailable } = await getProfile(username);

  if (!profile && !unavailable) notFound();
  if (!profile) {
    return <section className="profile-page profile-state">
      <div className="profile-state-mark" aria-hidden="true">T</div>
      <h1>{unavailable ? "Profile temporarily unavailable" : "Profile not found"}</h1>
      <p>{unavailable ? "Tivorah could not load this profile just now. Please try again shortly." : "This link may be incorrect, or the account is no longer available."}</p>
      <a className="button" href={`/u/${encodeURIComponent(username)}`}>Try again</a>
    </section>;
  }

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username;
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const downloadUrl = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "/#download";

  const joined = profile.memberSince ? new Date(profile.memberSince).toLocaleDateString("en-AU", { month: "long", year: "numeric" }) : null;
  // Laid out like the app's profile screen (tivorah-mobile app/profile/friend.tsx): photo beside the
  // name, the bio, the main action, then Details one fact per row with the app's icons.
  const details: { icon: string; text: string; caption?: string; href?: string }[] = [
    ...(location ? [{ icon: icons.place, text: `Lives in ${location}` }] : []),
    ...(joined ? [{ icon: icons.joined, text: `Joined Tivorah ${joined}` }] : []),
    // The profile is about the person; what they sell, offer and host lives on their shop.
    ...(profile.shopAvailable ? [{ icon: icons.shop, text: `${profile.firstName || `@${profile.username}`}’s shop`, caption: "Items, services and events", href: `/shops/${encodeURIComponent(profile.username)}` }] : []),
  ];

  return <section className="profile-page profile-page-app">
    <div className="profile-shell">
      <article className="public-profile-card">
        <div className="profile-identity">
          <div className="profile-avatar">
            {profile.photo?.url ? <Image src={profile.photo.url} alt={`${name}'s profile photo`} width={88} height={88} sizes="88px" /> : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="profile-identity-copy"><h1>{name}</h1><strong>@{profile.username}</strong></div>
        </div>
        {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
        <OpenAppButton username={profile.username} downloadUrl={downloadUrl} iosUrl={process.env.NEXT_PUBLIC_IOS_APP_URL} androidUrl={process.env.NEXT_PUBLIC_ANDROID_APP_URL} />
        {details.length ? <section className="profile-details" aria-labelledby="profile-details-title">
          <h2 id="profile-details-title">Details</h2>
          <ul>{details.map((row) => {
            const content = <><Icon path={row.icon} /><span className="profile-detail-copy"><span>{row.text}</span>{row.caption ? <small>{row.caption}</small> : null}</span>{row.href ? <Icon path={icons.chevron} /> : null}</>;
            return <li key={row.text}>{row.href ? <a className="profile-detail is-link" href={row.href}>{content}</a> : <span className="profile-detail">{content}</span>}</li>;
          })}</ul>
        </section> : null}
      </article>
      <div className="profile-privacy"><span aria-hidden="true">✓</span><p><strong>Public profile only.</strong> Contact details, private Hubs and account information are never shown here.</p></div>
    </div>
  </section>;
}

// The app's icons (Material Design Icons, Apache-2.0), so the Details rows look the same.
const icons = {
  place: "M12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5M12,2A7,7 0 0,1 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9A7,7 0 0,1 12,2M12,4A5,5 0 0,0 7,9C7,10 7,12 12,18.71C17,12 17,10 17,9A5,5 0 0,0 12,4Z",
  joined: "M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.9 20.11 3 19 3M19 19H5V9H19V19M19 7H5V5H19V7Z",
  shop: "M5.06 3C4.63 3 4.22 3.14 3.84 3.42S3.24 4.06 3.14 4.5L2.11 8.91C1.86 10 2.06 10.95 2.72 11.77L3 12.05V19C3 19.5 3.2 20 3.61 20.39S4.5 21 5 21H19C19.5 21 20 20.8 20.39 20.39S21 19.5 21 19V12.05L21.28 11.77C21.94 10.95 22.14 10 21.89 8.91L20.86 4.5C20.73 4.06 20.5 3.7 20.13 3.42C19.77 3.14 19.38 3 18.94 3H5.06M18.89 4.97L19.97 9.38C20.06 9.81 19.97 10.2 19.69 10.55C19.44 10.86 19.13 11 18.75 11C18.44 11 18.17 10.9 17.95 10.66C17.73 10.43 17.61 10.16 17.58 9.84L16.97 5L18.89 4.97M5.06 5H7.03L6.42 9.84C6.3 10.63 5.91 11 5.25 11C4.84 11 4.53 10.86 4.31 10.55C4.03 10.2 3.94 9.81 4.03 9.38L5.06 5M9.05 5H11V9.7C11 10.05 10.89 10.35 10.64 10.62C10.39 10.88 10.08 11 9.7 11C9.36 11 9.07 10.88 8.84 10.59S8.5 10 8.5 9.66V9.5L9.05 5M13 5H14.95L15.5 9.5C15.58 9.92 15.5 10.27 15.21 10.57C14.95 10.87 14.61 11 14.2 11C13.89 11 13.61 10.88 13.36 10.62C13.11 10.35 13 10.05 13 9.7V5M7.45 12.05C8.08 12.67 8.86 13 9.8 13C10.64 13 11.38 12.67 12 12.05C12.69 12.67 13.45 13 14.3 13C15.17 13 15.92 12.67 16.55 12.05C17.11 12.67 17.86 13 18.8 13H19.03V19H5V13H5.25C6.16 13 6.89 12.67 7.45 12.05Z",
  chevron: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
};

function Icon({ path }: { path: string }) {
  return <svg className="profile-detail-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={path} fill="currentColor" /></svg>;
}
