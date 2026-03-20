import { SiteLink } from "../utils/siteRouter";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer__content">
        <div className="brand-lockup brand-lockup--footer">
          <img
            className="brand-logo brand-logo--footer"
            src="/ink-revenue-logo.svg"
            alt="Ink Revenue logotyp"
          />
          <div className="brand-mark brand-mark--footer">Ink Revenue</div>
        </div>

        <div className="footer__links">
          <SiteLink href="/">Hem</SiteLink>
          <SiteLink href="/studios">Studios</SiteLink>
          <SiteLink href="/#bokning">Boka strategisamtal</SiteLink>
        </div>

        <div className="footer__contact">
          <p>Kontakta oss:</p>
          <p>
            Telefon: <a href="tel:+46732009483">+46732009483</a>
          </p>
          <p>
            Mejl: <a href="mailto:info@inkrevenue.se">info@inkrevenue.se</a>
          </p>
        </div>

        <div className="socials">
          <a
            className="social"
            href="https://www.facebook.com/profile.php?id=61561471121202"
            aria-label="Facebook"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M15 8h3V5h-3c-2 0-4 1.5-4 4v2H8v3h3v5h3v-5h3l1-3h-4V9c0-.6.4-1 1-1z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            className="social"
            href="https://www.instagram.com/ink_revenue/"
            aria-label="Instagram"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm5.2-3.1a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>

        <p className="footer__copy">Copyright 2026. Ink Revenue. All rights reserved.</p>
      </div>
    </footer>
  );
}
