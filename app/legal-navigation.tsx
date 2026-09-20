import Link from "next/link";

const links = [
  ["Legal & trust", "/legal"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Partner agreement", "/marketplace-partner-agreement"],
  ["Community guidelines", "/community-guidelines"],
  ["Safety centre", "/safety"],
  ["Child safety", "/child-safety"],
  ["Cookies", "/cookies"],
] as const;

export function LegalNavigation() {
  return (
    <nav className="legal-navigation" aria-label="Legal and trust pages">
      {links.map(([label, href]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
