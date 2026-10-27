"use client";

import { BrandLogo } from "../components/brand-logo";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DiscoveryLinks } from "../components/discovery/features";
import { memberAuth } from "../lib/auth/client";
import { SectionMenuLinks, useSection } from "../components/ui/section-nav";

/** On phones and tablets, Your account and the business workspace put their side nav at the top of the menu. */
function MenuSection({ onNavigate }: { onNavigate: () => void }) {
  const section = useSection();
  return section ? <SectionMenuLinks section={section} onNavigate={onNavigate} /> : null;
}

export const signedInHintKey = "tivorah-signed-in";

export function SiteHeader() {
  const path = usePathname();
  const { data: session, isPending } = memberAuth.useSession();
  const accountLink = !!session;
  const active = path.startsWith("/events")
    ? "events"
    : /^\/(shops?|shop)(\/|$)/.test(path)
      ? "items"
      : path.startsWith("/services")
        ? "services"
        : path.startsWith("/hubs")
          ? "hubs"
          : undefined;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Phones and tablets: the menu slides in from the right. It's rendered at the end of the page, not in
  // the header, because the header moves while scrolling and would carry a fixed panel with it.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 850px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    // The menu slides in from the right on phones: the page behind stays put, and focus moves in.
    // Locked on <html>, not <body>: with <body> locked the sticky header scrolls away (html clips sideways).
    const root = document.documentElement;
    const overflow = root.style.overflow;
    if (window.matchMedia("(max-width: 850px)").matches) root.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => (document.getElementById(menuId)?.querySelector("a") as HTMLElement | null)?.focus());
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      root.style.overflow = overflow;
      cancelAnimationFrame(frame);
    };
  }, [menuOpen, menuId]);

  // Remember only whether this browser is signed in (no account data) so the
  // next page load can show the right button before the session check returns.
  useEffect(() => {
    if (isPending) return;
    const root = document.documentElement;
    try {
      if (session) localStorage.setItem(signedInHintKey, "1");
      else localStorage.removeItem(signedInHintKey);
    } catch {
      /* Storage can be disabled; the session check still decides. */
    }
    if (session) root.setAttribute("data-signed-in", "");
    else root.removeAttribute("data-signed-in");
  }, [isPending, session]);

  const closeMenu = () => setMenuOpen(false);

  if (path.startsWith("/auth")) return null;

  const menu = <>
    {/* Phones: tapping beside the sliding menu closes it (pointer only: the menu button and Escape
        close it for keyboards and screen readers, so they don't meet a second close button). */}
    {menuOpen ? <button type="button" className="site-nav-backdrop" aria-hidden="true" tabIndex={-1} onClick={closeMenu} /> : null}
    <nav
      id={menuId}
      className={`site-nav${menuOpen ? " is-open" : ""}`}
      aria-label="Primary navigation"
    >
      {narrow ? <Suspense fallback={null}><MenuSection onNavigate={closeMenu} /></Suspense> : null}
      <DiscoveryLinks onClick={closeMenu} active={active} />
      {isPending ? (
        // Until the session check finishes, render both choices; the
        // pre-paint script in the root layout reveals the likely one from
        // the remembered sign-in hint, so the button never pops in.
        <>
          <Link className="site-nav-primary nav-when-signed-out" href="/auth/signin" onClick={closeMenu}>
            Sign in
          </Link>
          <Link className="site-nav-primary nav-when-signed-in" href="/account" onClick={closeMenu}>
            Your account
          </Link>
        </>
      ) : (
        <Link
          className="site-nav-primary"
          href={accountLink ? "/account" : "/auth/signin"}
          onClick={closeMenu}
        >
          {accountLink ? "Your account" : "Sign in"}
        </Link>
      )}
    </nav>
  </>;

  return (
    <header
      className={`nav${/^\/(events|shop|shops|services|hubs|account|auth|business|admin)(\/|$)/.test(path) ? " nav-product" : ""}${scrolled ? " nav-scrolled" : ""}`}
    >
      <div className="page-shell nav-inner">
        <Link className="brand" href="/" aria-label="Tivorah home">
          <BrandLogo sizes="(max-width: 600px) 116px, (max-width: 850px) 146px, 154px" priority />
        </Link>
        <button
          ref={menuButton}
          className="nav-menu-button"
          type="button"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-controls={menuId}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        {narrow ? createPortal(menu, document.body) : menu}
      </div>
    </header>
  );
}
