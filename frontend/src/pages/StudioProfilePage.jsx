import { useEffect, useMemo, useState } from "react";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";
import { getPublicStudioBySlug } from "../services/publicSiteApi";
import { StudioLeadForm } from "../components/StudioLeadForm";

function getStudioTags(studio) {
  return [
    ...(Array.isArray(studio.styles) ? studio.styles : []),
    ...(Array.isArray(studio.publicProfile?.artworkTags)
      ? studio.publicProfile.artworkTags
      : [])
  ].filter(Boolean);
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

export function StudioProfilePage({ slug = "", studioOverride = null, previewMode = false }) {
  const [studio, setStudio] = useState(studioOverride);
  const [loading, setLoading] = useState(!studioOverride);
  const [error, setError] = useState("");

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

  const studioTags = useMemo(() => (studio ? [...new Set(getStudioTags(studio))] : []), [studio]);
  const previewMessage = useMemo(() => {
    if (!previewMode || !studio) {
      return "";
    }

    if (studio.slug) {
      return `Det här är en demosida med lokal testdesign, men formuläret skickas till CRM-studion "${studio.slug}".`;
    }

    return "Det här är en lokal demosida för snabbtest. För att testa riktiga leads kan du öppna /studio-preview/din-slug.";
  }, [previewMode, studio]);
  const galleryCount = studio?.publicProfile?.galleryImageUrls?.length || 0;
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
    () => [
      {
        title: "Berätta kort om din idé",
        text: "Beskriv motiv, stil, placering och gärna referenser eller inspiration."
      },
      {
        title: "Studion återkopplar",
        text: "Du får svar om nästa steg, prisbild, konsultation eller bokning beroende på upplägget."
      }
    ],
    []
  );
  const pageTitle = useMemo(() => {
    if (studio?.name) {
      return buildPageTitle(`${studio.name}${studio.city ? ` i ${studio.city}` : ""}`);
    }

    if (error) {
      return buildPageTitle("Studiosida kunde inte visas");
    }

    return buildPageTitle("Studiosida");
  }, [error, studio]);
  const pageDescription = useMemo(() => {
    if (!studio) {
      return "Utforska tatueringsstudios och skicka din förfrågan direkt till studion.";
    }

    return truncateText(
      studio.publicProfile?.headline ||
        studio.publicProfile?.cardSummary ||
        studio.publicProfile?.intro ||
        studio.description ||
        "Utforska en tatueringsstudio på Ink Revenue."
    );
  }, [studio]);
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
            <p className="lead">
              {studio.publicProfile?.headline ||
                studio.publicProfile?.intro ||
                studio.description ||
                "Skicka din förfrågan direkt till studion."}
            </p>

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
              <div>
                <strong>Område</strong>
                <span>{studio.publicProfile?.serviceArea || studio.city || "-"}</span>
              </div>
            </div>

            <div className="studio-hero__actions">
              {studio.publicProfile?.websiteUrl ? (
                <a
                  className="btn btn-secondary"
                  href={studio.publicProfile.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Besök hemsida
                </a>
              ) : null}
              {studio.publicProfile?.instagramUrl ? (
                <a
                  className="btn btn-secondary"
                  href={studio.publicProfile.instagramUrl}
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
            <div className="info-panel">
              <p className="eyebrow">Om Studion</p>
              <h2>Om studion</h2>
              <p className="body">
                {studio.publicProfile?.intro ||
                  studio.description ||
                  "Studion har ännu inte lagt till en längre presentation."}
              </p>
            </div>

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
            <StudioLeadForm studio={studio} introText={studio.publicProfile?.formIntro || ""} />
          </div>
        </div>
      </section>

      <section className="section section--lavender">
        <div className="container">
          <div className="section-heading section-heading--tight">
            <div>
              <p className="eyebrow">Galleri</p>
              <h2>Utvalda bilder från studion</h2>
            </div>
          </div>

          {studio.publicProfile?.galleryImageUrls?.length ? (
            <div className="gallery-grid">
              {studio.publicProfile.galleryImageUrls.map((imageUrl) => (
                <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer">
                  <img src={imageUrl} alt={`${studio.name} galleri`} />
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <h3>Galleri kommer snart</h3>
              <p>Studion har ännu inte lagt upp några galleribilder på sin publika sida.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
