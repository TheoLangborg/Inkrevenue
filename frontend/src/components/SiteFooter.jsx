import { SiteLink } from "../utils/siteRouter";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

const FOOTER_CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala"];
const FOOTER_STYLES = ["Fineline", "Blackwork", "Traditionell", "Realism", "Dotwork"];

// Filtervärdet är studiornas egen (svenska) stil-tagg och ändras aldrig; bara
// länktexten översätts. Övriga stilar heter likadant på engelska.
const STYLE_LABELS_EN = { Traditionell: "Traditional" };

export function SiteFooter() {
  const { t, isEnglish } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer__content" data-reveal="fade">
        <div className="brand-lockup brand-lockup--footer">
          <img
            className="brand-logo brand-logo--footer"
            src="/ink-revenue-logo.svg"
            alt={t("common.logoAlt")}
          />
          <div className="brand-mark brand-mark--footer">Ink Revenue</div>
        </div>

        <div className="footer__links">
          <SiteLink href="/">{t("footer.home")}</SiteLink>
          <SiteLink href="/studios">{t("footer.studios")}</SiteLink>
          <SiteLink href="/faq">{t("footer.faq")}</SiteLink>
          <SiteLink href="/#bokning">{t("footer.strategy")}</SiteLink>
          {/* Riktiga länkar, inte modal — Googles OAuth-granskare måste hitta
              integritetspolicyn från startsidan och kunna öppna den på sin URL. */}
          <SiteLink href="/integritetspolicy">{t("footer.privacy")}</SiteLink>
          <SiteLink href="/anvandarvillkor">{t("footer.terms")}</SiteLink>
        </div>

        <nav className="footer__discovery" aria-label={t("footer.discoveryLabel")}>
          <div className="footer__discovery-col">
            <p className="footer__discovery-heading">{t("footer.cities")}</p>
            {FOOTER_CITIES.map((city) => (
              <SiteLink key={city} href={`/studios?city=${encodeURIComponent(city)}`}>
                {t("footer.cityLink", { city })}
              </SiteLink>
            ))}
          </div>
          <div className="footer__discovery-col">
            <p className="footer__discovery-heading">{t("footer.styles")}</p>
            {FOOTER_STYLES.map((style) => (
              <SiteLink key={style} href={`/studios?style=${encodeURIComponent(style)}`}>
                {t("footer.styleLink", { style: (isEnglish && STYLE_LABELS_EN[style]) || style })}
              </SiteLink>
            ))}
          </div>
        </nav>

        <div className="footer__contact">
          <p>{t("footer.contactHeading")}</p>
          <p>
            {t("footer.phone")} <a href="tel:+46732009483">+46732009483</a>
          </p>
          <p>
            {t("footer.email")} <a href="mailto:info@inkrevenue.online">info@inkrevenue.online</a>
          </p>
        </div>

        <LanguageSwitcher className="lang-switch--footer" />

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

        <p className="footer__copy">{t("footer.copyright")}</p>
        <p className="footer__credit">
          {t("footer.credit")}{" "}
          <a href="https://webwork.se/" target="_blank" rel="noopener">
            webwork.se
          </a>
        </p>
      </div>
    </footer>
  );
}
