import { useState, useEffect, useRef } from "react";
import { SiteLink } from "../utils/siteRouter";
import { useT } from "../i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader({ currentPath }) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const strategyHref = currentPath === "/" ? "#bokning" : "/#bokning";
  const isStudiosSection =
    currentPath === "/studios" || currentPath.startsWith("/studio/");
  const isFaq = currentPath === "/faq";

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  // Deepen the header surface once the page is scrolled
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header className={`site-header${scrolled ? " site-header--scrolled" : ""}`} ref={navRef}>
      <div className="container site-header__inner">
        <SiteLink className="site-brand" href="/">
          <img src="/ink-revenue-logo.svg" alt={t("common.logoAlt")} />
          <span>Ink Revenue</span>
        </SiteLink>

        <nav
          className={`site-nav${menuOpen ? " site-nav--open" : ""}`}
          aria-label={t("header.nav")}
        >
          {/* Döljs på smal mobil (App.css), där loggan är länken hem. */}
          <SiteLink
            className={`site-nav__link site-nav__link--home ${currentPath === "/" ? "site-nav__link--active" : ""}`}
            aria-current={currentPath === "/" ? "page" : undefined}
            href="/"
            onClick={() => setMenuOpen(false)}
          >
            {t("header.home")}
          </SiteLink>
          <SiteLink
            className={`site-nav__link ${isStudiosSection ? "site-nav__link--active" : ""}`}
            aria-current={isStudiosSection ? "page" : undefined}
            href="/studios"
            onClick={() => setMenuOpen(false)}
          >
            {t("header.studios")}
          </SiteLink>
          <SiteLink
            className={`site-nav__link ${isFaq ? "site-nav__link--active" : ""}`}
            aria-current={isFaq ? "page" : undefined}
            href="/faq"
            onClick={() => setMenuOpen(false)}
          >
            {t("header.faq")}
          </SiteLink>
          <LanguageSwitcher onNavigate={() => setMenuOpen(false)} />
          <SiteLink
            className="btn btn-primary site-header__cta"
            href={strategyHref}
            onClick={() => setMenuOpen(false)}
          >
            {/* Bara en av texterna visas åt gången (App.css). Den långa får inte
                plats bredvid loggan på en smal mobil. */}
            <span className="site-header__cta-full">{t("header.cta")}</span>
            <span className="site-header__cta-short">{t("header.ctaShort")}</span>
          </SiteLink>
        </nav>

        <button
          className={`site-burger${menuOpen ? " site-burger--open" : ""}`}
          aria-label={menuOpen ? t("header.closeMenu") : t("header.openMenu")}
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
