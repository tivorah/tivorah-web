"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`nav${scrolled ? " nav-scrolled" : ""}`}>
      <div className="page-shell nav-inner">
        <Link className="brand" href="/" aria-label="Tivorah home">
          <Image
            src="/tivorah-logo.png"
            alt="Tivorah"
            width={708}
            height={226}
            sizes="(max-width: 360px) 116px, (max-width: 850px) 146px, 154px"
            priority
          />
        </Link>
        <button
          className="nav-menu-button"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
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
          <Link href="/about" onClick={closeMenu}>About</Link>
          <Link href="/why-tivorah" onClick={closeMenu}>Why Tivorah</Link>
          <Link href="/#features" onClick={closeMenu}>Features</Link>
          <Link className="site-nav-primary" href="/#updates" onClick={closeMenu}>
            Join waitlist
          </Link>
        </nav>
      </div>
    </header>
  );
}
