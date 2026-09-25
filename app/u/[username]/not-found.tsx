import Link from "next/link";
export default function ProfileNotFound() {
  return <section className="content recovery-state">
    <h1>Profile not found</h1>
    <p>This link may be incorrect, or the account is no longer available.</p>
    <Link className="button" href="/">Go to Tivorah</Link>
  </section>;
}
