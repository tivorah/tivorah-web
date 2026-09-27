import Link from "next/link";
import { BrandedQrCode } from "../../app/branded-qr-code";
import { siteOrigin } from "../../lib/site";
export function AppHandoff({
  appPath,
  webPath,
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
      <a className="product-primary" href={`tivorah://${appPath}`}>
        Open Tivorah
      </a>
      <div className="account-actions">
        {safeStore(ios) ? <a href={ios}>Download for iPhone</a> : null}
        {safeStore(android) ? <a href={android}>Download for Android</a> : null}
        {!safeStore(ios) && !safeStore(android) ? (
          <Link href="/#updates">Get app availability updates</Link>
        ) : null}
      </div>
      <details>
        <summary>Open this page on your phone</summary>
        <BrandedQrCode
          value={new URL(webPath, siteOrigin).href}
          ariaLabel="Scan to open this page on your phone"
        />
        <p>
          Scan, then choose Open Tivorah. If you need to install the app, keep
          this link to return here.
        </p>
      </details>
    </aside>
  );
}
