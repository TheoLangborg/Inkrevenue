import { SiteLink } from "../utils/siteRouter";

export function SiteHeader({ currentPath }) {
  const strategyHref = currentPath === "/" ? "#bokning" : "/#bokning";
  const isStudiosSection =
    currentPath === "/studios" || currentPath.startsWith("/studio/");

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <SiteLink className="site-brand" href="/">
          <img src="/ink-revenue-logo.svg" alt="Ink Revenue logotyp" />
          <span>Ink Revenue</span>
        </SiteLink>

        <nav className="site-nav" aria-label="Huvudnavigation">
          <SiteLink
            className={`site-nav__link ${currentPath === "/" ? "site-nav__link--active" : ""}`}
            href="/"
          >
            Hem
          </SiteLink>
          <SiteLink
            className={`site-nav__link ${isStudiosSection ? "site-nav__link--active" : ""}`}
            href="/studios"
          >
            Studios
          </SiteLink>
          <SiteLink className="btn btn-primary site-header__cta" href={strategyHref}>
            Boka strategisamtal
          </SiteLink>
        </nav>
      </div>
    </header>
  );
}
