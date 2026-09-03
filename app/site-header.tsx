"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`nav${scrolled ? " nav-scrolled" : ""}`}>
      <div className="page-shell nav-inner">
        <Link className="brand" href="/" aria-label="Tivorah home">
          <Image
            src="/tivorah-logo.png"
            alt="Tivorah"
            width={708}
            height={226}
            priority
          />
        </Link>
        <nav>
          <Link href="/#about">About</Link>
          <Link href="/#different">Why Tivorah</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#waitlist">Join waitlist</Link>
        </nav>
      </div>
    </header>
  );
}
