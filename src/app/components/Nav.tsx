"use client";

import { useState, useEffect, useCallback } from "react";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      setMenuOpen(false);
      const target = document.querySelector(href);
      if (target) {
        const navHeight = document.querySelector(".navbar")?.clientHeight ?? 0;
        window.scrollTo({
          top: (target as HTMLElement).offsetTop - navHeight,
          behavior: "smooth",
        });
      }
    },
    []
  );

  const links = [
    { href: "#hero", label: "Home" },
    { href: "#gallery", label: "Gallery" },
    { href: "#features", label: "Features" },
    { href: "#specs", label: "Specs" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="container">
        <h1 className="logo">Premium Overlander Sprinter Van</h1>
        <ul className={`nav-links${menuOpen ? " active" : ""}`}>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => handleClick(e, l.href)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className={`mobile-menu-toggle${menuOpen ? " active" : ""}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
