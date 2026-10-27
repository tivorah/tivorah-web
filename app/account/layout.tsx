import type { Metadata } from "next";
import { AccountShell } from "../../components/account/shell";
export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
