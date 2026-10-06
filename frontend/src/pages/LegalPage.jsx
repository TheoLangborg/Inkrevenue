import { getLegalDocuments } from "../data/legalContent";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Publik sida för integritetspolicy och användarvillkor.
 *
 * Måste gå att nå direkt på sin URL utan inloggning och utan att först klicka
 * runt i sajten — Googles OAuth-verifiering avvisar policylänkar som bara
 * öppnas som modal. Rutterna är därför också med i prerender.mjs.
 *
 * Den svenska texten är den juridiskt bindande. På engelska visas en
 * översättning, och en notis säger att svenskan gäller om de skiljer sig åt.
 */
export function LegalPage({ document: documentKey }) {
  const { t, isEnglish, language } = useLanguage();
  const documents = getLegalDocuments(language);
  const content = documents[documentKey];
  const other = Object.values(documents).find((doc) => doc.path !== content.path);
  const documentLabel = documentKey === "privacy" ? t("legal.privacyLabel") : t("legal.termsLabel");
  const otherLabel = documentKey === "privacy" ? t("legal.termsLabel") : t("legal.privacyLabel");

  usePageMetadata({
    title: buildPageTitle(documentLabel),
    description: content.lead,
    path: content.path
  });

  return (
    <div>
      <section className="page-hero page-hero--directory">
        <div className="container">
          <p className="eyebrow">{documentLabel}</p>
          <h1>{content.title}</h1>
          <p className="lead lead--dark">{content.lead}</p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container" style={{ maxWidth: 800 }}>
          {isEnglish ? (
            <p className="legal-page__language-notice">{t("legal.translationNotice")}</p>
          ) : null}

          <p className="legal-page__updated">{t("legal.updated", { date: content.updated })}</p>

          {content.groups.map((group, index) => (
            <section
              key={group.heading}
              className="legal-page__group"
              data-reveal="up"
              data-reveal-delay={Math.min(index, 2) || undefined}
            >
              <h2 className="legal-page__heading">{group.heading}</h2>
              {group.paragraphs.map((paragraph) => (
                <p key={paragraph} className="legal-page__text">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <div className="legal-page__footer" data-reveal="up">
            <p>
              {t("legal.questions")}{" "}
              <a href="mailto:info@inkrevenue.online">info@inkrevenue.online</a>
            </p>
            {other && (
              <SiteLink href={other.path}>{t("legal.readAlso", { name: otherLabel })}</SiteLink>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
