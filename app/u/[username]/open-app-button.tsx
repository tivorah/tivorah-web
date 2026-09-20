"use client";

type Props = {
  username: string;
  downloadUrl: string;
  iosUrl?: string;
  androidUrl?: string;
};

export function OpenAppButton({ username, downloadUrl, iosUrl, androidUrl }: Props) {
  const appUrl = `tivorah://u/${encodeURIComponent(username)}`;

  return <div className="profile-actions">
    <a className="button profile-open-button" href={appUrl}>Open in Tivorah <span aria-hidden="true">→</span></a>
    <div className="profile-store-links" aria-label="Download Tivorah">
      {iosUrl ? <a href={iosUrl}>Download for iPhone</a> : null}
      {androidUrl ? <a href={androidUrl}>Download for Android</a> : null}
      {!iosUrl && !androidUrl ? <a href={downloadUrl}>Download Tivorah</a> : null}
    </div>
  </div>;
}
