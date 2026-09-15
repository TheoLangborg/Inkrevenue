import { useEffect, useMemo, useState } from "react";
import { buildPageTitle, useJsonLd, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";
import { getPublicStudioBySlug, getPublicStudios } from "../services/publicSiteApi";
import { StudioLeadFormEnhanced } from "../components/StudioLeadFormEnhanced";
import { PublicStudioCard } from "../components/PublicStudioCard";
import { RollingGallery } from "../components/RollingGallery";
import { ArtistShowcase } from "../components/ArtistShowcase";
import { buildShowcaseArtists, shouldShowArtistShowcase } from "../utils/artistShowcase";
import { getStudioTags } from "../utils/studioTags";
import { studioRegistry } from "./studios";
import { useLanguage } from "../i18n/LanguageContext";

const LOGO_PLACEMENTS = ["panel", "heading", "hidden"];
const LOGO_FITS = ["contain", "cover"];
const LOGO_BACKDROPS = ["light", "dark", "none"];
const HERO_HEIGHTS = ["compact", "standard", "tall"];

function pickOption(value, allowed, fallback) {
  const trimmed = String(value || "").trim();
  return allowed.includes(trimmed) ? trimmed : fallback;
}

function clampNumber(value, min, max, fallback) {
  // Number(null) och Number("") är 0 — utan vakten blir saknade fält 0 % i stället
  // för default (t.ex. bildfokus i hörnet på studios som aldrig rört inställningen).
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Math.round(Number(value));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function truncateText(value, maxLength = 160) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function StudioProfilePage({
  slug = "",
  studioOverride = null,
  previewMode = false,
  // Skickas vidare till formuläret. Se kommentaren i StudioLeadFormEnhanced:
  // en förhandsvisning får inte skapa riktiga leads om den inte uttryckligen
  // finns för det.
  allowPreviewSubmit = false
}) {
  const { t, language } = useLanguage();
  const [studio, setStudio] = useState(studioOverride);
  const [loading, setLoading] = useState(!studioOverride);
  const [error, setError] = useState("");
  const [allStudios, setAllStudios] = useState([]);
  // "Boka hos …" i tatuerarsektionen → formuläret, och formulärets val tillbaka
  // hit så att rätt kort är markerat. Samma par i ThemedStudioPage.
  const [artistRequest, setArtistRequest] = useState(null);
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const showcaseArtists = useMemo(() => buildShowcaseArtists(studio?.artistOptions), [studio]);

  useEffect(() => {
    if (studioOverride) {
      setStudio(studioOverride);
      setLoading(false);
      setError("");
      return undefined;
    }

    let active = true;

    setLoading(true);
    setError("");

    getPublicStudioBySlug(slug)
      .then((response) => {
        if (active) {
          setStudio(response);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError.message);
          setStudio(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug, studioOverride]);

  useEffect(() => {
    if (previewMode) return;
    let active = true;
    getPublicStudios()
      .then((response) => {
        if (active) setAllStudios(Array.isArray(response) ? response.filter(Boolean) : []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [previewMode]);

  const relatedStudios = useMemo(() => {
    if (!studio || !allStudios.length) return [];
    const currentSlug = studio.slug || slug;
    const currentTags = new Set(getStudioTags(studio).map((t) => t.toLowerCase()));
    return allStudios
      .filter((s) => s.slug !== currentSlug)
      .map((s) => ({
        studio: s,
        score:
          (s.city === studio.city ? 2 : 0) +
          getStudioTags(s).filter((t) => currentTags.has(t.toLowerCase())).length
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ studio: s }) => s);
  }, [allStudios, slug, studio]);

  const studioTags = useMemo(() => (studio ? [...new Set(getStudioTags(studio))] : []), [studio]);
  const previewMessage = useMemo(() => {
    if (studio?.previewMessage) {
      return studio.previewMessage;
    }

    if (!previewMode || !studio) {
      return "";
    }

    if (studio.slug) {
      return t("studio.previewMessageWithSlug", { slug: studio.slug });
    }

    return t("studio.previewMessageNoSlug");
  }, [previewMode, studio, t]);
  const publicProfile = studio?.publicProfile || {};
  const heroLeadText = String(publicProfile.headline || "").trim();
  const cardSummary = String(publicProfile.cardSummary || "").trim();
  const aboutText = String(publicProfile.intro || studio?.description || "").trim();
  const serviceArea = String(publicProfile.serviceArea || "").trim();
  const websiteUrl = String(publicProfile.websiteUrl || "").trim();
  const instagramUrl = String(publicProfile.instagramUrl || "").trim();
  const formTitle = String(publicProfile.formTitle || "").trim();
  const formIntro = String(publicProfile.formIntro || "").trim();
  const successPreviewText = String(publicProfile.successMessage || "").trim();
  const galleryImages = Array.isArray(publicProfile.galleryImageUrls)
    ? publicProfile.galleryImageUrls.filter(Boolean)
    : [];
  const galleryCount = galleryImages.length;

  // Presentationsval som studion styr från CRM:et. Värdena clampas i backend, men
  // defaultas även här — äldre cachade svar saknar fälten helt.
  const logoPlacement = pickOption(publicProfile.logoPlacement, LOGO_PLACEMENTS, "panel");
  const logoWidthPercent = clampNumber(publicProfile.logoWidthPercent, 20, 100, 100);
  const logoFit = pickOption(publicProfile.logoFit, LOGO_FITS, "contain");
  const logoBackdrop = pickOption(publicProfile.logoBackdrop, LOGO_BACKDROPS, "light");
  const heroHeight = pickOption(publicProfile.heroHeight, HERO_HEIGHTS, "standard");
  const heroFocusX = clampNumber(publicProfile.heroFocusX, 0, 100, 50);
  const heroFocusY = clampNumber(publicProfile.heroFocusY, 0, 100, 50);
  const heroOverlay = clampNumber(publicProfile.heroOverlayPercent, 0, 90, 65) / 100;
  const hasLogo = Boolean(studio?.logoUrl) && logoPlacement !== "hidden";
  const headingImageUrl = String(publicProfile.headingImageUrl || "").trim();
  const logoAsHeading = hasLogo && logoPlacement === "heading";
  const trustHighlights = useMemo(
    () =>
      [
        {
          label: t("studio.trustContactLabel"),
          value: t("studio.trustContactValue"),
          text: t("studio.trustContactText")
        },
        {
          label: t("studio.trustReplyLabel"),
          value: t("studio.trustReplyValue"),
          text: t("studio.trustReplyText")
        },
        galleryCount
          ? {
              label: t("studio.trustGalleryLabel"),
              value: t("studio.trustGalleryValue", { count: galleryCount }),
              text: t("studio.trustGalleryText")
            }
          : {
              label: t("studio.trustDetailsLabel"),
              value: t("studio.trustDetailsValue"),
              text: t("studio.trustDetailsText")
            }
      ].filter(Boolean),
    [galleryCount, t]
  );
  const requestSteps = useMemo(
    () =>
      studio?.bookingFlow?.enabled
        ? [
            {
              title: t("studio.stepsFlowTitle1"),
              text: t("studio.stepsFlowText1")
            },
            {
              title: t("studio.stepsFlowTitle2"),
              text: t("studio.stepsFlowText2")
            },
            {
              title: t("studio.stepsFlowTitle3"),
              text: t("studio.stepsFlowText3")
            }
          ]
        : [
            {
              title: t("studio.stepsBasicTitle1"),
              text: t("studio.stepsBasicText1")
            },
            {
              title: t("studio.stepsBasicTitle2"),
              text: t("studio.stepsBasicText2")
            }
          ],
    [studio?.bookingFlow?.enabled, t]
  );
  const pageTitle = useMemo(() => {
    if (studio?.name) {
      const topStyles = studioTags.slice(0, 2).join(" & ");
      const suffix = [
        studio.city ? t("studio.metaCityPart", { city: studio.city }).trim() : "",
        topStyles ? `— ${topStyles}` : ""
      ].filter(Boolean).join(" ");
      return buildPageTitle(`${studio.name}${suffix ? ` ${suffix}` : ""}`);
    }

    if (error) {
      return buildPageTitle(t("studio.metaErrorTitle"));
    }

    return buildPageTitle(t("studio.metaFallbackTitle"));
  }, [error, studio, studioTags, t]);
  const pageDescription = useMemo(() => {
    if (!studio) {
      return t("studio.metaDescriptionFallback");
    }

    const baseText =
      studio.publicProfile?.headline ||
      studio.publicProfile?.cardSummary ||
      studio.publicProfile?.intro ||
      studio.description;

    if (baseText) return truncateText(baseText);

    const topStyles = studioTags.slice(0, 3).join(", ");
    return truncateText(
      t("studio.metaDescriptionGenerated", {
        name: studio.name,
        city: studio.city ? t("studio.metaCityPart", { city: studio.city }) : "",
        styles: topStyles ? t("studio.metaStylePart", { styles: topStyles }) : ""
      })
    );
  }, [studio, studioTags, t]);
  const pagePath = useMemo(() => {
    const resolvedSlug = studio?.slug || slug;

    if (previewMode) {
      return resolvedSlug ? `/studio-preview/${encodeURIComponent(resolvedSlug)}` : "/studio-preview";
    }

    return resolvedSlug ? `/studio/${encodeURIComponent(resolvedSlug)}` : "/studios";
  }, [previewMode, slug, studio]);

  usePageMetadata({
    title: pageTitle,
    description: pageDescription,
    image: studio?.heroImageUrl || studio?.logoUrl || "/ink-revenue-logo.svg",
    path: pagePath,
    noIndex: previewMode
  });

  const studioJsonLd = useMemo(() => {
    if (!studio || previewMode) return null;

    const resolvedSlug = studio.slug || slug;
    const languagePrefix = language === "sv" ? "" : `/${language}`;
    const studioUrl = `https://inkrevenue.online${languagePrefix}/studio/${encodeURIComponent(resolvedSlug)}`;
    const tags = [...new Set(getStudioTags(studio))];
    const images = Array.isArray(studio.publicProfile?.galleryImageUrls)
      ? studio.publicProfile.galleryImageUrls.filter(Boolean)
      : [];

    const schema = {
      "@context": "https://schema.org",
      "@type": "TattooShop",
      "@id": studioUrl,
      "name": studio.name,
      "url": studioUrl,
      "description": studio.publicProfile?.intro || studio.description || undefined,
      "address": studio.city
        ? { "@type": "PostalAddress", "addressLocality": studio.city, "addressCountry": "SE" }
        : undefined,
      "image": studio.heroImageUrl || studio.logoUrl || undefined,
      "logo": studio.logoUrl || undefined,
      "hasMap": studio.city
        ? `https://www.google.com/maps/search/${encodeURIComponent(t("studio.mapsQuery", { name: studio.name, city: studio.city }))}`
        : undefined,
      "knowsAbout": tags.length ? tags : undefined,
      "inLanguage": language === "sv" ? "sv-SE" : "en",
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${studioUrl}#studio-form` },
        "result": { "@type": "Reservation", "name": t("studio.reserveActionName") }
      }
    };

    if (images.length) {
      schema.photo = images.map((url) => ({
        "@type": "ImageObject",
        "url": url,
        "contentUrl": url,
        "description": t("studio.photoDescription", { name: studio.name })
      }));
    }

    Object.keys(schema).forEach((key) => schema[key] === undefined && delete schema[key]);

    return schema;
  }, [previewMode, slug, studio, language, t]);

  useJsonLd(studioJsonLd);

  if (loading) {
    return (
      <section className="section section--white">
        <div className="container">
          <div className="loading-state">{t("studio.loading")}</div>
        </div>
      </section>
    );
  }

  if (error || !studio) {
    return (
      <section className="section section--white">
        <div className="container">
          <div className="empty-panel">
            <h2>{t("studio.errorTitle")}</h2>
            <p>{error || t("studio.errorText")}</p>
            <SiteLink className="btn btn-primary" href="/studios">
              {t("studio.backToDirectory")}
            </SiteLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className={`page-hero page-hero--studio page-hero--studio-${heroHeight}`}>
        {/* Fokuspunkten styr två saker: background-position (som bara biter på den
            axel där bilden faktiskt sticker ut) och transform-origin för zoomen i
            CSS:en (som biter på den flush-axel där background-position är verkningslös).
            Tillsammans ger de rörelse på båda axlarna oavsett bildens proportioner. */}
        {studio.heroImageUrl ? (
          <>
            <div
              className="page-hero__media"
              style={{
                backgroundImage: `url(${studio.heroImageUrl})`,
                backgroundPosition: `${heroFocusX}% ${heroFocusY}%`,
                transformOrigin: `${heroFocusX}% ${heroFocusY}%`
              }}
            />
            <div
              className="page-hero__scrim"
              style={{
                backgroundImage: `linear-gradient(rgba(10, 26, 47, ${Math.max(
                  0,
                  heroOverlay - 0.1
                ).toFixed(2)}), rgba(10, 26, 47, ${Math.min(0.95, heroOverlay + 0.1).toFixed(2)}))`
              }}
            />
          </>
        ) : null}
        <div className="container studio-hero">
          <div className="studio-hero__content">
            <p className="eyebrow eyebrow--light">{studio.city || t("studio.kind")}</p>
            {/* Rubriken kan vara tre saker, i fallande prioritet: en egen rubrikbild,
                loggan i rubrikläge, eller studionamnet som text. I bildfallen finns
                h1:an kvar dold för sökmotorer och skärmläsare, och bilden är
                dekorativ (alt="") så namnet inte läses upp två gånger. */}
            {headingImageUrl ? (
              <>
                <span className="studio-hero__heading-image" aria-hidden="true">
                  <img src={headingImageUrl} alt="" />
                </span>
                <h1 className="visually-hidden">{studio.name}</h1>
              </>
            ) : logoAsHeading ? (
              <>
                <span
                  className={`studio-hero__plate studio-hero__plate--heading studio-hero__plate--${logoBackdrop} studio-hero__plate--contain`}
                  style={{ maxWidth: `${logoWidthPercent}%` }}
                  aria-hidden="true"
                >
                  <img className="studio-hero__logo" src={studio.logoUrl} alt="" />
                </span>
                <h1 className="visually-hidden">{studio.name}</h1>
              </>
            ) : (
              <h1>{studio.name}</h1>
            )}
            {heroLeadText ? <p className="lead">{heroLeadText}</p> : null}

            {previewMode ? <p className="preview-banner">{previewMessage}</p> : null}

            <div className="cta-row cta-row--left">
              <SiteLink className="btn btn-primary" href="#studio-form">
                {t("studio.sendRequest")}
              </SiteLink>
              <SiteLink className="btn btn-secondary btn-secondary--light" href="/studios">
                {t("studio.backToCatalog")}
              </SiteLink>
            </div>

            {studioTags.length ? (
              <div className="badge-row badge-row--light">
                {studioTags.map((tag) => (
                  <span key={tag} className="badge badge--light">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="studio-hero__panel">
            {hasLogo && logoPlacement === "panel" ? (
              <span
                className={`studio-hero__plate studio-hero__plate--panel studio-hero__plate--${logoBackdrop} studio-hero__plate--${logoFit}`}
                style={{ maxWidth: `${logoWidthPercent}%` }}
              >
                <img
                  className="studio-hero__logo"
                  src={studio.logoUrl}
                  alt={t("studio.logoAlt", { name: studio.name })}
                />
              </span>
            ) : null}
            <div className="studio-hero__details">
              <div>
                <strong>{t("studio.location")}</strong>
                <span>{studio.city || "-"}</span>
              </div>
              {serviceArea ? (
                <div>
                  <strong>{t("studio.serviceArea")}</strong>
                  <span>{serviceArea}</span>
                </div>
              ) : null}
            </div>

            <div className="studio-hero__actions">
              {websiteUrl ? (
                <a
                  className="btn btn-secondary"
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("studio.visitWebsite")}
                </a>
              ) : null}
              {instagramUrl ? (
                <a
                  className="btn btn-secondary"
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("studio.seeInstagram")}
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      {/* Ovanför formuläret: kunden ser tatuerarnas verk först och väljer sedan. */}
      {shouldShowArtistShowcase(showcaseArtists) ? (
        <section className="section section--lavender">
          <div className="container">
            <div className="section-heading section-heading--tight">
              <div>
                <p className="eyebrow">{t("artists.eyebrow")}</p>
                <h2>{t("artists.title")}</h2>
                <p className="body">{t("artists.intro")}</p>
              </div>
            </div>
            <ArtistShowcase
              artists={showcaseArtists}
              selectedArtistId={selectedArtistId}
              onChooseArtist={(id) => setArtistRequest({ id, nonce: Date.now() })}
            />
          </div>
        </section>
      ) : null}

      <section className="section section--white">
        <div className="container studio-layout">
          <div className="studio-layout__main">
            {aboutText ? (
              <div className="info-panel">
                <p className="eyebrow">{t("studio.aboutEyebrow")}</p>
                <h2>{t("studio.aboutTitle")}</h2>
                <p className="body">{aboutText}</p>
              </div>
            ) : null}

            <div className="info-panel">
              <p className="eyebrow">{t("studio.howEyebrow")}</p>
              <h2>{t("studio.howTitle")}</h2>
              <div className="steps-list">
                {requestSteps.map((step, index) => (
                  <article key={step.title} className="step-item">
                    <div className="step-item__number">{index + 1}</div>
                    <div>
                      <h3>{step.title}</h3>
                      <p className="body">{step.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            {previewMode ? (
              <div className="info-panel">
                <p className="eyebrow">{t("studio.previewEyebrow")}</p>
                <h2>{t("studio.previewTitle")}</h2>
                <p className="body">{t("studio.previewText")}</p>
              </div>
            ) : null}
          </div>

          <div className="studio-layout__aside">
            {previewMode && (heroLeadText || cardSummary || serviceArea || studioTags.length) ? (
              <div className="info-panel">
                <p className="eyebrow">{t("studio.cardEyebrow")}</p>
                <h2>{t("studio.cardTitle")}</h2>
                {heroLeadText ? <p className="body"><strong>{heroLeadText}</strong></p> : null}
                {cardSummary ? <p className="body">{cardSummary}</p> : null}
                {serviceArea ? <p className="body">{t("studio.cardArea", { area: serviceArea })}</p> : null}
                {studioTags.length ? (
                  <div className="badge-row">
                    {studioTags.map((tag) => (
                      <span key={tag} className="badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="info-panel trust-panel">
              <p className="eyebrow">{t("studio.trustEyebrow")}</p>
              <h2>{t("studio.trustTitle")}</h2>
              <div className="trust-grid">
                {trustHighlights.map((item) => (
                  <article key={item.label} className="trust-card">
                    <span className="trust-card__label">{item.label}</span>
                    <strong className="trust-card__value">{item.value}</strong>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
            <StudioLeadFormEnhanced
              studio={studio}
              titleText={formTitle}
              introText={formIntro}
              successPreviewText={successPreviewText}
              previewMode={previewMode}
              allowPreviewSubmit={allowPreviewSubmit}
              artistRequest={artistRequest}
              onPreferredArtistChange={setSelectedArtistId}
            />
          </div>
        </div>
      </section>

      {galleryImages.length ? (
        <section className="section section--lavender">
          <div className="container">
            <div className="section-heading section-heading--tight">
              <div>
                <p className="eyebrow">{t("studio.galleryEyebrow")}</p>
                <h2>{t("studio.galleryTitle")}</h2>
              </div>
            </div>

            <RollingGallery images={galleryImages} studioName={studio.name} />
          </div>
        </section>
      ) : null}

      {relatedStudios.length ? (
        <section className="section section--white">
          <div className="container">
            <div className="section-heading section-heading--tight">
              <div>
                <p className="eyebrow">{t("studio.relatedEyebrow")}</p>
                <h2>{t("studio.relatedTitle")}</h2>
              </div>
              <SiteLink className="btn btn-secondary" href={studio.city ? `/studios?city=${encodeURIComponent(studio.city)}` : "/studios"}>
                {t("common.seeAllStudios")}
              </SiteLink>
            </div>
            <div className="studio-grid">
              {relatedStudios.map((s) => (
                <PublicStudioCard
                  key={s.id}
                  studio={s}
                  compact
                  cardTheme={studioRegistry[s.slug]?.cardTheme ?? null}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
