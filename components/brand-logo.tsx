import Image from "next/image";

/**
 * The Tivorah logo, light or dark. The logo artwork has navy lettering that disappears on a dark
 * page, so dark mode shows the colour mark with a light wordmark instead (like the app). Which one
 * shows is pure CSS (html[data-theme="dark"]), so there's no flash and no hydration difference.
 */
export function BrandLogo({ className, sizes, priority = false }: { className?: string; sizes?: string; priority?: boolean }) {
  return <>
    <Image className={["brand-logo-light", className].filter(Boolean).join(" ")} src="/tivorah-logo.png" alt="Tivorah" width={708} height={226} sizes={sizes} priority={priority} />
    <span className={["brand-logo-dark", className].filter(Boolean).join(" ")} aria-hidden="true">
      <Image src="/tivorah-mark.png" alt="" width={56} height={54} priority={priority} />
      <span>Tivorah</span>
    </span>
  </>;
}
