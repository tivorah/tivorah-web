"use client";
import Link from "next/link";
import { useDiscoveryFeatures } from "./features";
import type { DiscoveryKind } from "../../lib/api/discovery";
import { usePathname } from "next/navigation";
const destinations = [
  ["/events", "Events", "▦"],
  ["/shop", "Shop", "◇"],
  ["/services", "Services", "✳"],
  ["/hubs", "Hubs", "◎"],
  ["/account", "Account", "○"],
] as const;
export function MobileProductNav() {
  const path = usePathname();
  const { enabled } = useDiscoveryFeatures();
  if (path.startsWith("/auth") || path.startsWith("/admin")) return null;
  if (
    !destinations.some(
      ([href]) => path === href || path.startsWith(`${href}/`),
    ) &&
    !path.startsWith("/business") &&
    !path.startsWith("/shops/")
  )
    return null;
  return (
    <nav className="mobile-product-nav" aria-label="Explore and account">
      {destinations
        .filter(
          ([href]) =>
            href === "/account" ||
            enabled(
              (href === "/shop" ? "items" : href.slice(1)) as DiscoveryKind,
            ),
        )
        .map(([href, label, icon]) => (
          <Link
            key={href}
            href={href}
            aria-current={
              path === href ||
              path.startsWith(`${href}/`) ||
              (href === "/shop" && path.startsWith("/shops/"))
                ? "page"
                : undefined
            }
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </Link>
        ))}
    </nav>
  );
}
