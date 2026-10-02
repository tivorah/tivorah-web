"use client";

import { OpenInApp } from "../../../components/ui/open-in-app";

type Props = {
  username: string;
  downloadUrl: string;
  iosUrl?: string;
  androidUrl?: string;
};

export function OpenAppButton({ username, downloadUrl, iosUrl, androidUrl }: Props) {
  const appPath = `u/${encodeURIComponent(username)}`;

  return <div className="profile-actions">
    <OpenInApp className="button profile-open-button press-fx" appPath={appPath}>Open in Tivorah <span aria-hidden="true">→</span></OpenInApp>
    <div className="profile-store-links" aria-label="Download Tivorah">
      {iosUrl ? <a href={iosUrl}>Download for iPhone</a> : null}
      {androidUrl ? <a href={androidUrl}>Download for Android</a> : null}
      {!iosUrl && !androidUrl ? <a href={downloadUrl}>Get Tivorah updates</a> : null}
    </div>
  </div>;
}
