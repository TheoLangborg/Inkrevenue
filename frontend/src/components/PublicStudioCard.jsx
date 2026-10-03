import { SiteLink } from "../utils/siteRouter";
import { getStudioTags } from "../utils/studioTags";
import { useT } from "../i18n/LanguageContext";

export function PublicStudioCard({ studio, compact = false, cardTheme = null, revealDelay }) {
  const t = useT();
  const tags = [...new Set(getStudioTags(studio))].slice(0, compact ? 3 : 5);
  const studioHref = `/studio/${studio.slug}`;
  const summary =
    studio.publicProfile?.cardSummary ||
    studio.publicProfile?.headline ||
    studio.description ||
    t("studioCard.fallbackSummary");

  // Kortets foto är ett lat <img>, inte en CSS-bakgrund: en bakgrund hämtades
  // direkt för varje kort i katalogen, även långt under skärmkanten
  // (docs/bildprestanda.md, steg 4). Toningen ligger som ett eget lager ovanpå.
  const mediaImageUrl = studio.heroImageUrl || studio.publicProfile?.galleryImageUrls?.[0] || null;
  const shadeStyle = {
    backgroundImage:
      cardTheme?.gradient || "linear-gradient(rgba(10, 26, 47, 0.2), rgba(10, 26, 47, 0.6))"
  };

  return (
    <SiteLink
      className={`studio-card ${compact ? "studio-card--compact" : ""}`}
      href={studioHref}
      aria-label={t("studioCard.ariaLabel", { name: studio.name })}
      data-reveal="scale"
      data-reveal-delay={revealDelay || undefined}
    >
      <div className="studio-card__media">
        {mediaImageUrl ? (
          <>
            <img
              className="studio-card__photo"
              src={mediaImageUrl}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span className="studio-card__shade" style={shadeStyle} aria-hidden="true" />
          </>
        ) : null}
        {studio.logoUrl && studio.publicProfile?.logoPlacement !== "hidden" ? (
          <img
            className="studio-card__logo"
            src={studio.logoUrl}
            alt={t("studioCard.logoAlt", { name: studio.name })}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>

      <div className="studio-card__body">
        <div className="studio-card__meta">
          <span>{studio.city || t("studioCard.country")}</span>
          <span>{studio.publicProfile?.serviceArea || studio.city || t("studioCard.kind")}</span>
        </div>

        <h3>{studio.name}</h3>
        <p>{summary}</p>

        {tags.length ? (
          <div className="badge-row">
            {tags.map((tag) => (
              <span
                key={tag}
                className="badge"
                style={
                  cardTheme?.badgeBg
                    ? { background: cardTheme.badgeBg, color: cardTheme.badgeText || "#fff", borderColor: cardTheme.badgeBg }
                    : undefined
                }
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <span
          className="btn btn-primary studio-card__cta"
          style={
            cardTheme?.ctaBg
              ? { background: cardTheme.ctaBg, color: cardTheme.ctaText || "#fff", borderColor: cardTheme.ctaBg }
              : undefined
          }
        >
          {t("studioCard.cta")}
        </span>
      </div>
    </SiteLink>
  );
}
