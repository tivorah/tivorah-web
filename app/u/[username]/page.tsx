import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
};

type ProfileResult = { profile: PublicProfile | null; unavailable: boolean };

const decodeUsername = (value: string) => {
  try { return decodeURIComponent(value); } catch { return ""; }
};

async function getProfile(username: string): Promise<ProfileResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiUrl || !/^[a-zA-Z0-9._-]{3,40}$/.test(username)) return { profile: null, unavailable: false };

  try {
    const response = await fetch(`${apiUrl}/api/v1/public/profiles/${encodeURIComponent(username)}`, { next: { revalidate: 60 } });
    if (response.status === 404 || response.status === 400) return { profile: null, unavailable: false };
    if (!response.ok) return { profile: null, unavailable: true };
    const payload = await response.json() as { data?: { profile?: PublicProfile } };
    return { profile: payload.data?.profile ?? null, unavailable: false };
  } catch {
    return { profile: null, unavailable: true };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = decodeUsername(rawUsername);
  const { profile } = await getProfile(username);
  if (!profile) return { title: "Tivorah profile", robots: { index: false, follow: false } };
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || `@${profile.username}`;
  const description = profile.bio?.trim() || `View ${name}'s public profile on Tivorah.`;
  return {
    title: `${name} on Tivorah`,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `/u/${encodeURIComponent(profile.username)}` },
    openGraph: { type: "profile", title: `${name} on Tivorah`, description, images: profile.photo?.url ? [{ url: profile.photo.url, alt: name }] : undefined },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const username = decodeUsername(rawUsername);
  const { profile, unavailable } = await getProfile(username);

  if (!profile) {
    return <section className="profile-page profile-state">
      <div className="profile-state-mark" aria-hidden="true">T</div>
      <h1>{unavailable ? "Profile temporarily unavailable" : "Profile not found"}</h1>
      <p>{unavailable ? "Tivorah could not load this profile just now. Please try again shortly." : "This link may be incorrect, or the account is no longer available."}</p>
      <Link className="button" href={unavailable ? `/u/${encodeURIComponent(username)}` : "/"}>{unavailable ? "Try again" : "Go to Tivorah"}</Link>
    </section>;
  }

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username;
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const downloadUrl = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "/#download";

  return <section className="profile-page">
    <div className="profile-shell">
      <div className="profile-context"><span className="eyebrow">Shared Tivorah profile</span><p>Connect with people through trusted Hubs across Australia.</p></div>
      <article className="public-profile-card">
        <div className="profile-avatar">
          {profile.photo?.url ? <Image src={profile.photo.url} alt={`${name}'s profile photo`} width={112} height={112} sizes="112px" /> : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
        </div>
        <h1>{name}</h1>
        <strong>@{profile.username}</strong>
        {location ? <p className="profile-location"><span aria-hidden="true">⌖</span>{location}</p> : null}
        <p className="profile-bio">{profile.bio || "Connect through Tivorah and find the communities you share."}</p>
        <OpenAppButton username={profile.username} downloadUrl={downloadUrl} iosUrl={process.env.NEXT_PUBLIC_IOS_APP_URL} androidUrl={process.env.NEXT_PUBLIC_ANDROID_APP_URL} />
      </article>
      <div className="profile-privacy"><span aria-hidden="true">✓</span><p><strong>Public profile only.</strong> Contact details, private Hubs and account information are never shown here.</p></div>
    </div>
  </section>;
}
