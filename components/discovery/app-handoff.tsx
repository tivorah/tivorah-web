import Link from "next/link";
import { OpenInApp } from "../ui/open-in-app";
export function AppHandoff({
  appPath,
  // The QR for desktop visitors now lives in the Open Tivorah button itself.
  webPath: _webPath,
  title = "Continue in Tivorah",
}: {
  appPath: string;
  webPath: string;
  title?: string;
}) {
  const ios = process.env.NEXT_PUBLIC_IOS_APP_URL;
  const android = process.env.NEXT_PUBLIC_ANDROID_APP_URL;
  const safeStore = (url?: string) =>
    url?.startsWith("https://") ? url : null;
  return (
    <aside className="app-handoff">
      <h2>{title}</h2>
      <p>Connections, conversations and Hub participation happen in the app.</p>
      <OpenInApp className="product-primary press-fx" appPath={appPath}>Open Tivorah</OpenInApp>
      <div className="account-actions">
        {safeStore(ios) ? <a href={ios}>Download for iPhone</a> : null}
        {safeStore(android) ? <a href={android}>Download for Android</a> : null}
        {!safeStore(ios) && !safeStore(android) ? (
          <Link href="/#updates">Get app availability updates</Link>
        ) : null}
      </div>
    </aside>
  );
}
