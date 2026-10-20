import { useEffect, useState } from "react";
import { CrmPreview } from "../components/CrmPreview";
import { HomeHeroVisual } from "../components/HomeHeroVisual";
import { PublicStudioCard } from "../components/PublicStudioCard";
import { StrategyCallForm } from "../components/StrategyCallForm";
import { getPublicStudios } from "../services/publicSiteApi";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";
import { useLanguage } from "../i18n/LanguageContext";

function FaqItem({ q, a, revealDelay }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`faq-item${open ? " faq-item--open" : ""}`}
      data-reveal="up"
      data-reveal-delay={revealDelay || undefined}
    >
      <button
        className="faq-item__q"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {q}
        <span className="faq-item__icon" aria-hidden="true">+</span>
      </button>
      <div className="faq-item__a">
        <div className="faq-item__a-inner">{a}</div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { t, tList } = useLanguage();
  const [featuredStudios, setFeaturedStudios] = useState([]);
  const [loadingStudios, setLoadingStudios] = useState(true);
  const faqItems = tList("home.faqItems");

  usePageMetadata({
    title: buildPageTitle(t("home.metaTitle")),
    description: t("home.metaDescription"),
    path: "/"
  });

  useEffect(() => {
    let active = true;

    getPublicStudios()
      .then((studios) => {
        if (active) setFeaturedStudios(studios.slice(0, 3));
      })
      .catch(() => {
        if (active) setFeaturedStudios([]);
      })
      .finally(() => {
        if (active) setLoadingStudios(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      {/* Två kolumner: budskapet till vänster, bildrutan till höger. Loggan
          står redan i sidhuvudet, så heron upprepar den inte. */}
      <section className="hero hero--home" id="top">
        <div className="container hero__content">
          <div className="hero-home__copy">
            <p className="hero-home__eyebrow">{t("home.heroEyebrow")}</p>
            <h1>
              {t("home.heroTitleLine1")}{" "}
              <span className="hero-home__title-soft">{t("home.heroTitleLine2")}</span>
            </h1>
            <p className="lead">
              {t("home.heroLeadBefore")}<strong>{t("home.heroLeadBold")}</strong>
              {t("home.heroLeadAfter")}
            </p>

            <div className="cta-row">
              <SiteLink className="btn btn-primary" href="#bokning">
                {t("home.ctaStrategy")}
                <svg className="btn__icon" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SiteLink>
              <SiteLink className="btn btn-secondary btn-secondary--hero" href="/testa-gratis">
                <span>{t("home.ctaTrial")}</span>
                <svg className="btn__icon" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SiteLink>
            </div>

            <ul className="hero-points">
              {[t("home.heroPoint1"), t("home.heroPoint2"), t("home.heroPoint3")].map((point) => (
                <li key={point}>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>

            {/* Tatueringskunderna får en lugn rad i stället för ett eget kort. */}
            <p className="hero-home__customers">
              {t("home.heroCustomersPrompt")}{" "}
              <SiteLink href="/studios">
                {t("common.exploreStudios")}
                <svg className="btn__icon" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SiteLink>
            </p>
          </div>

          <HomeHeroVisual />
        </div>
      </section>

      {/* ── Så här fungerar det ── */}
      <section className="section section--white" id="sa-funkar-det">
        <div className="container">
          <div data-reveal="up" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 52px" }}>
            <p className="eyebrow">{t("home.howEyebrow")}</p>
            <h2>{t("home.howTitle")}</h2>
            <p className="body" style={{ fontSize: "1.05rem" }}>
              {t("home.howLead")}
            </p>
          </div>

          <div className="steps" data-reveal="fade">
            <div className="step" data-reveal="up" data-reveal-delay="1">
              <div className="step__number">1</div>
              <h3>{t("home.howStep1Title")}</h3>
              <p>{t("home.howStep1Text")}</p>
            </div>
            <div className="step" data-reveal="up" data-reveal-delay="2">
              <div className="step__number">2</div>
              <h3>{t("home.howStep2Title")}</h3>
              <p>{t("home.howStep2Text")}</p>
            </div>
            <div className="step" data-reveal="up" data-reveal-delay="3">
              <div className="step__number">3</div>
              <h3>{t("home.howStep3Title")}</h3>
              <p>{t("home.howStep3Text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── För studioägare ── */}
      <section className="section section--lavender" id="for-studios">
        <div className="container">
          <div className="grid-2">
            <div data-reveal="left">
              <p className="eyebrow">{t("home.studiosEyebrow")}</p>
              <h2>{t("home.studiosTitle")}</h2>
              <p className="body" style={{ fontSize: "1.05rem" }}>
                {t("home.studiosLead")}
              </p>
              <p className="body">
                {t("home.studiosBody")}
              </p>
              <div className="badge-row" style={{ marginTop: 18 }}>
                <span className="badge">{t("home.studiosBadge1")}</span>
                <span className="badge">{t("home.studiosBadge2")}</span>
                <span className="badge">{t("home.studiosBadge3")}</span>
              </div>
            </div>

            <div className="card-grid card-grid--single" style={{ gap: 16 }}>
              <div className="card" data-reveal="right" data-reveal-delay="1">
                <div className="card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h3>{t("home.studiosCard1Title")}</h3>
                <p>{t("home.studiosCard1Text")}</p>
              </div>
              <div className="card" data-reveal="right" data-reveal-delay="2">
                <div className="card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <h3>{t("home.studiosCard2Title")}</h3>
                <p>{t("home.studiosCard2Text")}</p>
              </div>
              <div className="card" data-reveal="right" data-reveal-delay="3">
                <div className="card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>{t("home.studiosCard3Title")}</h3>
                <p>{t("home.studiosCard3Text")}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Produkten: förhandsvisning av CRM:t ──
          Ligger direkt efter studioägar-pitchen: löftet ovanför, beviset här. */}
      <CrmPreview />

      {/* ── För kunder ── */}
      <section className="section section--white" id="for-customers">
        <div className="container">
          <div className="section-heading" data-reveal="up">
            <div>
              <p className="eyebrow">{t("home.customersEyebrow")}</p>
              <h2>{t("home.customersTitle")}</h2>
              <p className="body" style={{ maxWidth: 560, fontSize: "1.02rem" }}>
                {t("home.customersLead")}
              </p>
            </div>
            <SiteLink className="btn btn-secondary" href="/studios" style={{ whiteSpace: "nowrap" }}>
              {t("common.seeAllStudios")}
            </SiteLink>
          </div>

          {loadingStudios ? (
            <div className="loading-state">{t("home.customersLoading")}</div>
          ) : featuredStudios.length ? (
            <div className="studio-grid">
              {featuredStudios.map((studio, index) => (
                <PublicStudioCard key={studio.id} studio={studio} compact revealDelay={index + 1} />
              ))}
              {/* Färre än tre studior: platsen som blir över bjuder in nästa studio
                  i stället för att stå tom. */}
              {featuredStudios.length < 3 ? (
                <SiteLink
                  className="studio-card studio-card--compact studio-card--invite"
                  href="#bokning"
                  data-reveal="scale"
                  data-reveal-delay={featuredStudios.length + 1}
                >
                  <div className="studio-card__media" aria-hidden="true">
                    <span className="studio-card__invite-mark">+</span>
                  </div>
                  <div className="studio-card__body">
                    <div className="studio-card__meta">
                      <span>{t("home.customersInviteEyebrow")}</span>
                    </div>
                    <h3>{t("home.customersInviteTitle")}</h3>
                    <p>{t("home.customersInviteText")}</p>
                    <span className="btn btn-secondary studio-card__cta">{t("home.customersInviteCta")}</span>
                  </div>
                </SiteLink>
              ) : null}
            </div>
          ) : (
            <div className="empty-panel" data-reveal="up">
              <h3>{t("home.customersEmptyTitle")}</h3>
              <p>{t("home.customersEmptyText")}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Varför Ink Revenue fungerar ── */}
      <section className="section section--blue">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-title" data-reveal="fade">
            <div className="line" />
            <h2>{t("home.whyTitle")}</h2>
            <div className="line" />
          </div>

          <div className="card-grid">
            <div className="card" data-reveal="up" data-reveal-delay="1">
              <div className="card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>{t("home.whyCard1Title")}</h3>
              <p>{t("home.whyCard1Text")}</p>
            </div>

            <div className="card" data-reveal="up" data-reveal-delay="2">
              <div className="card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>{t("home.whyCard2Title")}</h3>
              <p>{t("home.whyCard2Text")}</p>
            </div>

            <div className="card" data-reveal="up" data-reveal-delay="3">
              <div className="card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>{t("home.whyCard3Title")}</h3>
              <p>{t("home.whyCard3Text")}</p>
            </div>
          </div>

          <div className="trust-bar" data-reveal="up">
            <div className="trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {t("home.trust1")}
            </div>
            <div className="trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {t("home.trust2")}
            </div>
            <div className="trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {t("home.trust3")}
            </div>
            <div className="trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {t("home.trust4")}
            </div>
          </div>
        </div>
      </section>

      {/* ── Planer ── */}
      <section className="section section--white" id="planer">
        <div className="container">
          <div data-reveal="up" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 52px" }}>
            <p className="eyebrow">{t("home.plansEyebrow")}</p>
            <h2>{t("home.plansTitle")}</h2>
            <p className="body" style={{ fontSize: "1.05rem" }}>
              {t("home.plansLead")}
            </p>
          </div>

          <div className="card-grid card-grid--4">
            <div className="card" data-reveal="up" data-reveal-delay="1">
              <h3>{t("home.plan1Title")}</h3>
              <p className="card__price-model">{t("home.plan1Model")}</p>
              <p>{t("home.plan1Text")}</p>
            </div>
            <div className="card" data-reveal="up" data-reveal-delay="2">
              <h3>{t("home.plan2Title")}</h3>
              <p className="card__price-model">{t("home.plan2Model")}</p>
              <p>{t("home.plan2Text")}</p>
            </div>
            <div className="card" data-reveal="up" data-reveal-delay="3">
              <h3>{t("home.plan3Title")}</h3>
              <p className="card__price-model">{t("home.plan3Model")}</p>
              <p>{t("home.plan3Text")}</p>
              <SiteLink className="card__link" href="/testa-gratis">
                {t("home.plan3Link")}
                <svg className="btn__icon" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SiteLink>
            </div>
            <div className="card card--featured" data-reveal="up" data-reveal-delay="4">
              <h3>{t("home.plan4Title")}</h3>
              <p className="card__price-model">{t("home.plan4Model")}</p>
              <p>{t("home.plan4Text")}</p>
            </div>
          </div>

          <div data-reveal="up" style={{ textAlign: "center", marginTop: 40 }}>
            <SiteLink className="btn btn-primary" href="#bokning">
              {t("home.plansCta")}
              <svg className="btn__icon" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 10h12M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </SiteLink>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section section--lavender" id="faq">
        <div className="container">
          <div data-reveal="up" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 44px" }}>
            <p className="eyebrow">{t("home.faqEyebrow")}</p>
            <h2>{t("home.faqTitle")}</h2>
          </div>

          <div className="faq" style={{ maxWidth: 760, margin: "0 auto" }}>
            {faqItems.map((item, index) => (
              <FaqItem key={item.q} q={item.q} a={item.a} revealDelay={Math.min(index, 5)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bokningsformulär ── */}
      <section className="section section--lavender" id="bokning">
        <div className="container booking">
          <div data-reveal="left">
            <p className="eyebrow">{t("home.bookingEyebrow")}</p>
            <h2>{t("home.bookingTitle")}</h2>
            <p className="body" style={{ fontSize: "1.05rem" }}>
              {t("home.bookingLead")}
            </p>
            <p className="body">{t("home.bookingBody")}</p>
            <div className="badge-row" style={{ marginTop: 24 }}>
              <span className="badge">{t("home.bookingBadge1")}</span>
              <span className="badge">{t("home.bookingBadge2")}</span>
              <span className="badge">{t("home.bookingBadge3")}</span>
            </div>
          </div>

          <StrategyCallForm />
        </div>
      </section>
    </div>
  );
}
