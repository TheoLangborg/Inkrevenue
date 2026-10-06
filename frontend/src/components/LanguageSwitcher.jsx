import { useLanguage } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/config";
import { rememberLanguageChoice } from "../i18n/languagePreference";
import { navigateTo, useSiteLocation } from "../utils/siteRouter";

/**
 * SV/EN-växlare. Byter språk på plats: samma sida, samma filter (query) och
 * samma sektion (hash) — bara språkprefixet ändras.
 *
 * Länkarna renderas som riktiga <a href> så att de går att öppna i ny flik och
 * så att crawlers ser vägen till det andra språket.
 *
 * Valet sparas och går sedan före webbläsarens språk (se skriptet i
 * index.html). Det sparas även vid klick till ny flik, annars skulle den nya
 * fliken byta tillbaka till webbläsarens språk.
 */
export function LanguageSwitcher({ className = "", onNavigate }) {
  const { language, t, pathForLanguage } = useLanguage();
  const location = useSiteLocation();

  return (
    <div
      className={`lang-switch${className ? ` ${className}` : ""}`}
      role="group"
      aria-label={t("languageSwitcher.label")}
    >
      {LANGUAGES.map((code) => {
        const isActive = code === language;
        const href = pathForLanguage(code, {
          search: location.search,
          hash: location.hash
        });

        return (
          <a
            key={code}
            className={`lang-switch__option${isActive ? " lang-switch__option--active" : ""}`}
            href={href}
            hrefLang={code}
            lang={code}
            aria-current={isActive ? "true" : undefined}
            title={t(`languageSwitcher.${code}`)}
            onAuxClick={(event) => {
              if (event.button === 1) rememberLanguageChoice(code);
            }}
            onClick={(event) => {
              rememberLanguageChoice(code);

              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }

              event.preventDefault();
              onNavigate?.();
              navigateTo(href);
            }}
          >
            {t(`languageSwitcher.${code}Short`)}
          </a>
        );
      })}
    </div>
  );
}
