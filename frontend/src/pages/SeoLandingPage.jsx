import { useMemo } from "react";
import { SITE_URL, buildPageTitle, useJsonLd, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";
import { useLanguage } from "../i18n/LanguageContext";
import { buildLanguagePath } from "../i18n/config";

/**
 * Landningssidor för det studioägare söker på ("bokningssystem tatuerare",
 * "marknadsföring tatueringsstudio"). Startsidan säljer helheten; de här
 * sidorna svarar på en sökning var.
 *
 * Texterna ligger i sv.js/en.js under landing.<key>. Frågorna längst ner syns
 * på sidan och står ordagrant i FAQPage-schemat: Google kräver att schemats
 * frågor går att läsa på sidan.
 *
 * En ny sida kräver: en post här, texterna i båda ordböckerna, rutten i
 * prerender.mjs (ROUTES) och en länk i sidfoten.
 */
export const LANDING_PAGES = {
  "/bokningssystem-for-tatuerare": {
    key: "bookingSystem",
    primaryHref: "/testa-gratis",
    secondaryHref: "/#bokning",
    related: ["/marknadsforing-for-tatueringsstudior", "/studios", "/faq"]
  },
  "/marknadsforing-for-tatueringsstudior": {
    key: "marketing",
    primaryHref: "/#bokning",
    secondaryHref: "/testa-gratis",
    related: ["/bokningssystem-for-tatuerare", "/studios", "/faq"]
  }
};

// Länktexterna i "Läs också", per väg.
const RELATED_LABEL_KEYS = {
  "/bokningssystem-for-tatuerare": "landing.relatedBookingSystem",
  "/marknadsforing-for-tatueringsstudior": "landing.relatedMarketing",
  "/studios": "landing.relatedStudios",
  "/faq": "landing.relatedFaq"
};

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SeoLandingPage({ path }) {
  const { t, tList, language } = useLanguage();
  const page = LANDING_PAGES[path];
  const prefix = `landing.${page.key}`;
  const features = tList(`${prefix}.features`);
  const steps = tList(`${prefix}.steps`);
  const faq = tList(`${prefix}.faq`);

  usePageMetadata({
    title: buildPageTitle(t(`${prefix}.metaTitle`)),
    description: t(`${prefix}.metaDescription`),
    path
  });

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${SITE_URL}${buildLanguagePath(path, language)}#webpage`,
          "url": `${SITE_URL}${buildLanguagePath(path, language)}`,
          "name": t(`${prefix}.metaTitle`),
          "description": t(`${prefix}.metaDescription`),
          "inLanguage": language === "sv" ? "sv-SE" : "en",
          "isPartOf": { "@id": `${SITE_URL}/#website` },
          "about": { "@id": `${SITE_URL}/#organization` }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Ink Revenue",
              "item": `${SITE_URL}${buildLanguagePath("/", language)}`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": t(`${prefix}.breadcrumb`),
              "item": `${SITE_URL}${buildLanguagePath(path, language)}`
            }
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": faq.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a }
          }))
        }
      ]
    }),
    [faq, language, path, prefix, t]
  );

  useJsonLd(jsonLd);

  return (
    <div>
      <section className="page-hero page-hero--directory">
        <div className="container">
          <p className="eyebrow">{t(`${prefix}.eyebrow`)}</p>
          <h1>{t(`${prefix}.title`)}</h1>
          <p className="lead lead--dark">{t(`${prefix}.lead`)}</p>
          <div className="cta-row">
            <SiteLink className="btn btn-primary" href={page.primaryHref}>
              {t(`${prefix}.ctaPrimary`)}
            </SiteLink>
            <SiteLink className="btn btn-secondary" href={page.secondaryHref}>
              {t(`${prefix}.ctaSecondary`)}
            </SiteLink>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container" style={{ maxWidth: 760 }} data-reveal="up">
          <h2>{t(`${prefix}.introTitle`)}</h2>
          {tList(`${prefix}.introParagraphs`).map((paragraph) => (
            <p key={paragraph} className="body" style={{ fontSize: "1.05rem" }}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="section section--lavender">
        <div className="container">
          <div data-reveal="up" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 52px" }}>
            <p className="eyebrow">{t(`${prefix}.featuresEyebrow`)}</p>
            <h2>{t(`${prefix}.featuresTitle`)}</h2>
          </div>
          <div className="card-grid">
            {features.map(({ title, text }, index) => (
              <div key={title} className="card" data-reveal="up" data-reveal-delay={(index % 3) + 1}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div data-reveal="up" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 52px" }}>
            <p className="eyebrow">{t(`${prefix}.stepsEyebrow`)}</p>
            <h2>{t(`${prefix}.stepsTitle`)}</h2>
          </div>
          <div className="steps" data-reveal="fade">
            {steps.map(({ title, text }, index) => (
              <div key={title} className="step" data-reveal="up" data-reveal-delay={index + 1}>
                <div className="step__number">{index + 1}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--lavender">
        <div className="container" style={{ maxWidth: 760 }} data-reveal="up">
          <h2>{t(`${prefix}.fitTitle`)}</h2>
          {tList(`${prefix}.fitParagraphs`).map((paragraph) => (
            <p key={paragraph} className="body" style={{ fontSize: "1.05rem" }}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="section section--white">
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 data-reveal="up" style={{ textAlign: "center" }}>
            {t(`${prefix}.faqTitle`)}
          </h2>
          <dl className="faq-page__list">
            {faq.map(({ q, a }, index) => (
              <div key={q} className="faq-page__item" data-reveal="up" data-reveal-delay={Math.min(index, 2) || undefined}>
                <dt className="faq-page__q">{q}</dt>
                <dd className="faq-page__a">{a}</dd>
              </div>
            ))}
          </dl>
          <nav className="landing-related" aria-label={t("landing.relatedTitle")} data-reveal="up">
            <p className="landing-related__title">{t("landing.relatedTitle")}</p>
            {page.related.map((href) => (
              <SiteLink key={href} href={href}>
                {t(RELATED_LABEL_KEYS[href])}
              </SiteLink>
            ))}
          </nav>
        </div>
      </section>

      <section className="section section--blue">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-title" data-reveal="fade">
            <div className="line" />
            <h2>{t(`${prefix}.ctaTitle`)}</h2>
            <div className="line" />
          </div>
          <div data-reveal="up" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <p className="body" style={{ fontSize: "1.05rem" }}>
              {t(`${prefix}.ctaText`)}
            </p>
            <div className="cta-row" style={{ marginTop: 28 }}>
              <SiteLink className="btn btn-primary" href={page.primaryHref}>
                {t(`${prefix}.ctaPrimary`)}
              </SiteLink>
            </div>
          </div>
          <div className="trust-bar" data-reveal="up">
            {tList(`${prefix}.trust`).map((item) => (
              <div key={item} className="trust-item">
                <CheckIcon />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
