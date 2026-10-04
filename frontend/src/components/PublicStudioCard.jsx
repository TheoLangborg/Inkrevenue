import { SiteLink } from "../utils/siteRouter";
import { getStudioTags } from "../utils/studioTags";
import { getArtistInitials } from "../utils/artistShowcase";
import { useT } from "../i18n/LanguageContext";
import { StudioImage } from "./StudioImage";

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
  // Svag toning, lite mörkare nertill bakom loggan. Bilden ska synas: den
  // tidigare (20–60 %, temana upp till 92 %) gjorde fotona nästan svarta
  // (användaren 2026-10-04).
  const shadeStyle = {
    backgroundImage:
      cardTheme?.gradient ||
      "linear-gradient(180deg, rgba(10, 26, 47, 0.04) 0%, rgba(10, 26, 47, 0.32) 100%)"
  };
  // Utan logga får kortet samma vita bricka med studions initialer, så att alla
  // kort ser likadana ut (användaren 2026-10-04). Har studion valt att dölja
  // loggan visas ingen bricka alls.
  const logoHidden = studio.publicProfile?.logoPlacement === "hidden";
  const city = studio.city || t("studioCard.country");
  // Andra raden är verksamhetsområdet. Står där samma sak som staden (eller
  // inget) visas staden en gång i stället för "Finspång Finspång". Utan stad
  // står "Sverige · Tatueringsstudio" som förut.
  const serviceArea = String(studio.publicProfile?.serviceArea || "").trim();
  const area =
    serviceArea && serviceArea !== studio.city
      ? serviceArea
      : studio.city
        ? ""
        : t("studioCard.kind");

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
            <StudioImage
              className="studio-card__photo"
              src={mediaImageUrl}
              widths={[480, 1024]}
              sizes="(max-width: 700px) 100vw, 420px"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span className="studio-card__shade" style={shadeStyle} aria-hidden="true" />
          </>
        ) : null}
        {logoHidden ? null : studio.logoUrl ? (
          <StudioImage
            className="studio-card__logo"
            src={studio.logoUrl}
            variant={480}
            alt={t("studioCard.logoAlt", { name: studio.name })}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="studio-card__logo studio-card__logo--initials" aria-hidden="true">
            {getArtistInitials(studio.name)}
          </span>
        )}
      </div>

      <div className="studio-card__body">
        <div className="studio-card__meta">
          <span>{city}</span>
          {area ? <span>{area}</span> : null}
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
