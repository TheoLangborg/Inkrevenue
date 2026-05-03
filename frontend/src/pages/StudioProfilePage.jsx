import { useEffect, useMemo, useState } from "react";
import { buildPageTitle, useJsonLd, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";
import { getPublicStudioBySlug, getPublicStudios } from "../services/publicSiteApi";
import { StudioLeadFormEnhanced } from "../components/StudioLeadFormEnhanced";
import { PublicStudioCard } from "../components/PublicStudioCard";
import { getStudioTags } from "../utils/studioTags";
import { studioRegistry } from "./studios";

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

export function StudioProfilePage({ slug = "", studioOverride = null, previewMode = false }) {
  const [studio, setStudio] = useState(studioOverride);
  const [loading, setLoading] = useState(!studioOverride);
  const [error, setError] = useState("");
  const [allStudios, setAllStudios] = useState([]);

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
      return `Det här är en demosida med lokal testdesign, men formuläret skickas till CRM-studion "${studio.slug}".`;
    }

    return "Det här är en lokal demosida för snabbtest. För att testa riktiga leads kan du öppna /studio-preview/din-slug.";
  }, [previewMode, studio]);
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
  const trustHighlights = useMemo(
    () =>
      [
        {
          label: "Kontakt",
          value: "Direkt till studion",
          text: "Din förfrågan går direkt till studion du har valt."
        },
        {
          label: "Svar",
          value: "E-post eller telefon",
          text: "Lämna det som passar dig bäst så blir det enkelt att återkoppla."
        },
        galleryCount
          ? {
              label: "Galleri",
              value: `${galleryCount} bilder att kika på`,
              text: "Kika gärna igenom tidigare arbeten innan du skickar."
            }
          : {
              label: "Bra underlag",
              value: "Stil, placering och budget",
              text: "Lite mer detaljer gör det lättare för studion att ge ett relevant första svar."
            }
      ].filter(Boolean),
    [galleryCount]
  );
  const requestSteps = useMemo(
    () =>
      studio?.bookingFlow?.enabled
        ? [
            {
              title: "Berätta om din idé",
              text: "Fyll i stil, placering, storlek och beskrivning så att studion får ett tydligt underlag direkt."
            },
            {
              title: "Skicka in din förfrågan",
              text: "Lägg gärna till en inspirationsbild om du vill visa stil, känsla eller referenser tydligare."
            },
            {
              title: "Nästa steg blir tydligt",
              text: "Du får rätt nästa steg utifrån studions upplägg, oavsett om det gäller bokning, återkoppling eller manuell genomgång."
            }
          ]
        : [
      {
        title: "Berätta kort om din idé",
        text: "Beskriv motiv, stil, placering och gärna referenser eller inspiration."
      },
      {
        title: "Studion återkopplar",
        text: "Du får svar om nästa steg, prisbild, konsultation eller bokning beroende på upplägget."
      }
    ],
    [studio?.bookingFlow?.enabled]
  );
  const pageTitle = useMemo(() => {
    if (studio?.name) {
      const topStyles = studioTags.slice(0, 2).join(" & ");
      const suffix = [
        studio.city ? `i ${studio.city}` : "",
        topStyles ? `— ${topStyles}` : ""
      ].filter(Boolean).join(" ");
      return buildPageTitle(`${studio.name}${suffix ? ` ${suffix}` : ""}`);
    }

    if (error) {
      return buildPageTitle("Studiosida kunde inte visas");
    }

    return buildPageTitle("Studiosida");
  }, [error, studio, studioTags]);
  const pageDescription = useMemo(() => {
    if (!studio) {
      return "Utforska tatueringsstudios och skicka din förfrågan direkt till studion.";
    }

    const baseText =
      studio.publicProfile?.headline ||
      studio.publicProfile?.cardSummary ||
      studio.publicProfile?.intro ||
      studio.description;

    if (baseText) return truncateText(baseText);

    const topStyles = studioTags.slice(0, 3).join(", ");
    const cityPart = studio.city ? ` i ${studio.city}` : "";
    const stylePart = topStyles ? `. Specialiserade på ${topStyles}` : "";
    return truncateText(`${studio.name}${cityPart} — tatueringsstudio på Ink Revenue${stylePart}. Skicka din förfrågan direkt.`);
  }, [studio, studioTags]);
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
    const studioUrl = `https://inkrevenue.online/studio/${encodeURIComponent(resolvedSlug)}`;
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
        ? `https://www.google.com/maps/search/${encodeURIComponent(`tatueringsstudio ${studio.name} ${studio.city}`)}`
        : undefined,
      "knowsAbout": tags.length ? tags : undefined,
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${studioUrl}#studio-form` },
        "result": { "@type": "Reservation", "name": "Skicka förfrågan" }
      }
    };

    if (images.length) {
      schema.photo = images.map((url) => ({
        "@type": "ImageObject",
        "url": url,
        "contentUrl": url,
        "description": `${studio.name} — tatueringsarbete`
      }));
    }

    Object.keys(schema).forEach((key) => schema[key] === undefined && delete schema[key]);

    return schema;
  }, [previewMode, slug, studio]);

  useJsonLd(studioJsonLd);

  if (loading) {
    return (
      <section className="section section--white">
        <div className="container">
          <div className="loading-state">Laddar studiosidan...</div>
        </div>
      </section>
    );
  }

  if (error || !studio) {
    return (
      <section className="section section--white">
        <div className="container">
          <div className="empty-panel">
            <h2>Studiosidan kunde inte visas</h2>
            <p>{error || "Den här studion kunde inte hittas."}</p>
            <SiteLink className="btn btn-primary" href="/studios">
              Tillbaka till studios
            </SiteLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section
        className="page-hero page-hero--studio"
        style={
          studio.heroImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(10, 26, 47, 0.55), rgba(10, 26, 47, 0.75)), url(${studio.heroImageUrl})`
              }
            : undefined
        }
      >
        <div className="container studio-hero">
          <div className="studio-hero__content">
            <p className="eyebrow eyebrow--light">{studio.city || "Tatueringsstudio"}</p>
            <h1>{studio.name}</h1>
            {heroLeadText ? <p className="lead">{heroLeadText}</p> : null}

            {previewMode ? <p className="preview-banner">{previewMessage}</p> : null}

            <div className="cta-row cta-row--left">
              <SiteLink className="btn btn-primary" href="#studio-form">
                Skicka förfrågan
              </SiteLink>
              <SiteLink className="btn btn-secondary btn-secondary--light" href="/studios">
                Tillbaka till katalogen
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
            {studio.logoUrl ? <img src={studio.logoUrl} alt={`${studio.name} logotyp`} /> : null}
            <div className="studio-hero__details">
              <div>
                <strong>Plats</strong>
                <span>{studio.city || "-"}</span>
              </div>
              {serviceArea ? (
                <div>
                  <strong>Område</strong>
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
                  Besök hemsida
                </a>
              ) : null}
              {instagramUrl ? (
                <a
                  className="btn btn-secondary"
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Se Instagram
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <section className="section section--white">
        <div className="container studio-layout">
          <div className="studio-layout__main">
            {aboutText ? (
              <div className="info-panel">
                <p className="eyebrow">Om Studion</p>
                <h2>Om studion</h2>
                <p className="body">{aboutText}</p>
              </div>
            ) : null}

            <div className="info-panel">
              <p className="eyebrow">Så Går Det Till</p>
              <h2>Så funkar en första förfrågan</h2>
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
                <p className="eyebrow">Preview-läge</p>
                <h2>Snabbtest utan full studio-setup</h2>
                <p className="body">
                  Du behöver inte fylla i all information i CRM för att se designen. För en riktig
                  end-to-end-test räcker det att teststudion har en slug, är aktiv och har publik
                  sida påslagen.
                </p>
              </div>
            ) : null}
          </div>

          <div className="studio-layout__aside">
            {previewMode && (heroLeadText || cardSummary || serviceArea || studioTags.length) ? (
              <div className="info-panel">
                <p className="eyebrow">Katalogkort</p>
                <h2>Så syns ni i katalogen</h2>
                {heroLeadText ? <p className="body"><strong>{heroLeadText}</strong></p> : null}
                {cardSummary ? <p className="body">{cardSummary}</p> : null}
                {serviceArea ? <p className="body">Område: {serviceArea}</p> : null}
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
              <p className="eyebrow">Bra Att Veta</p>
              <h2>Innan du skickar</h2>
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
            />
          </div>
        </div>
      </section>

      {galleryImages.length ? (
        <section className="section section--lavender">
          <div className="container">
            <div className="section-heading section-heading--tight">
              <div>
                <p className="eyebrow">Galleri</p>
                <h2>Utvalda bilder från studion</h2>
              </div>
            </div>

            <div className="gallery-grid">
              {galleryImages.map((imageUrl) => (
                <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer">
                  <img src={imageUrl} alt={`${studio.name} galleri`} />
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {relatedStudios.length ? (
        <section className="section section--white">
          <div className="container">
            <div className="section-heading section-heading--tight">
              <div>
                <p className="eyebrow">Fler Studios</p>
                <h2>Liknande studios att utforska</h2>
              </div>
              <SiteLink className="btn btn-secondary" href={studio.city ? `/studios?city=${encodeURIComponent(studio.city)}` : "/studios"}>
                Se alla studios
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
