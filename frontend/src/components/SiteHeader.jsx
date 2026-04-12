import { useState, useEffect, useRef } from "react";
import { SiteLink } from "../utils/siteRouter";

export function SiteHeader({ currentPath }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const strategyHref = currentPath === "/" ? "#bokning" : "/#bokning";
  const isStudiosSection =
    currentPath === "/studios" || currentPath.startsWith("/studio/");

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="site-header" ref={navRef}>
      <div className="container site-header__inner">
        <SiteLink className="site-brand" href="/">
          <img src="/ink-revenue-logo.svg" alt="Ink Revenue logotyp" />
          <span>Ink Revenue</span>
        </SiteLink>

        <nav
          className={`site-nav${menuOpen ? " site-nav--open" : ""}`}
          aria-label="Huvudnavigation"
        >
          <SiteLink
            className={`site-nav__link ${currentPath === "/" ? "site-nav__link--active" : ""}`}
            aria-current={currentPath === "/" ? "page" : undefined}
            href="/"
            onClick={() => setMenuOpen(false)}
          >
            Hem
          </SiteLink>
          <SiteLink
            className={`site-nav__link ${isStudiosSection ? "site-nav__link--active" : ""}`}
            aria-current={isStudiosSection ? "page" : undefined}
            href="/studios"
            onClick={() => setMenuOpen(false)}
          >
            Studios
          </SiteLink>
          <SiteLink
            className="btn btn-primary site-header__cta"
            href={strategyHref}
            onClick={() => setMenuOpen(false)}
          >
            Boka strategisamtal
          </SiteLink>
        </nav>

        <button
          className={`site-burger${menuOpen ? " site-burger--open" : ""}`}
          aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
