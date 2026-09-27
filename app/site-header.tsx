"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DiscoveryLinks } from "../components/discovery/features";
import { memberAuth } from "../lib/auth/client";

export function SiteHeader() {
  const path = usePathname();
  const { data: session, isPending } = memberAuth.useSession();
  const accountLink = isPending || !!session;
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

  const closeMenu = () => setMenuOpen(false);

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
          <Link
            className="site-nav-primary"
            href={accountLink ? "/account" : "/auth/signin"}
            onClick={closeMenu}
          >
            {accountLink ? "Your account" : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
