"use client";

import Link from "next/link";
import { useAccount } from "../../hooks/use-account";
import { isEventOrganiser } from "../../lib/event-detail";
import { OpenInApp } from "../ui/open-in-app";

// "Manage …" shortcut shown only to the signed-in owner, matching "Manage event" on event pages.
// It only reveals a link; every workspace authorises reads and changes on the API.
export function OwnerManage({ ownerUsername, href, appPath, label }: { ownerUsername?: string | null; href?: string; appPath?: string; label: string }) {
  const { account } = useAccount();
  if (!isEventOrganiser(account?.username, ownerUsername)) return null;
  const icon = <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>;
  return <div className="owner-manage">
    {href ? <Link className="owner-manage-link" href={href}>{icon}{label}</Link>
      : appPath ? <OpenInApp className="owner-manage-link" appPath={appPath}>{icon}{label}</OpenInApp> : null}
  </div>;
}
