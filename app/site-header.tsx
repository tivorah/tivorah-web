"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DiscoveryLinks } from "../components/discovery/features";
import { memberAuth } from "../lib/auth/client";

export const signedInHintKey = "tivorah-signed-in";

export function SiteHeader() {
  const path = usePathname();
  const { data: session, isPending } = memberAuth.useSession();
  const accountLink = !!session;
  const active = path.startsWith("/events")
    ? "events"
    : /^\/shops?(\/|$)/.test(path)
      ? "items"
      : path.startsWith("/services")
        ? "services"
        : path.startsWith("/hubs")
          ? "hubs"
          : undefined;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

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

  if (path.startsWith("/auth") || path.startsWith("/admin")) return null;

  return (
    <header
      className={`nav${/^\/(events|shop|shops|services|hubs|account|auth|business)(\/|$)/.test(path) ? " nav-product" : ""}${scrolled ? " nav-scrolled" : ""}`}
    >
      <div className="page-shell nav-inner">
        <Link className="brand" href="/" aria-label="Tivorah home">
          <Image
            src="/tivorah-logo.png"
            alt="Tivorah"
            width={708}
            height={226}
            sizes="(max-width: 600px) 116px, (max-width: 850px) 146px, 154px"
            priority
          />
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
        <nav
          id={menuId}
          className={`site-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Primary navigation"
        >
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
      </div>
    </header>
  );
}
