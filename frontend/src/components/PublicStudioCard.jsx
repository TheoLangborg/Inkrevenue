import { SiteLink } from "../utils/siteRouter";

function getStudioTags(studio) {
  return [
    ...(Array.isArray(studio.styles) ? studio.styles : []),
    ...(Array.isArray(studio.publicProfile?.artworkTags)
      ? studio.publicProfile.artworkTags
      : [])
  ].filter(Boolean);
}

export function PublicStudioCard({ studio, compact = false }) {
  const tags = [...new Set(getStudioTags(studio))].slice(0, compact ? 3 : 5);
  const summary =
    studio.publicProfile?.cardSummary ||
    studio.publicProfile?.headline ||
    studio.description ||
    "Utforska studions stil, bilder och kontaktvägar här.";

  return (
    <article className={`studio-card ${compact ? "studio-card--compact" : ""}`}>
      <div
        className="studio-card__media"
        style={
          studio.heroImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(10, 26, 47, 0.2), rgba(10, 26, 47, 0.6)), url(${studio.heroImageUrl})`
              }
            : undefined
        }
      >
        {studio.logoUrl ? (
          <img className="studio-card__logo" src={studio.logoUrl} alt={`${studio.name} logotyp`} />
        ) : null}
      </div>

      <div className="studio-card__body">
        <div className="studio-card__meta">
          <span>{studio.city || "Sverige"}</span>
          <span>{studio.publicProfile?.serviceArea || studio.city || "Tatueringsstudio"}</span>
        </div>

        <h3>{studio.name}</h3>
        <p>{summary}</p>

        {tags.length ? (
          <div className="badge-row">
            {tags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <SiteLink className="btn btn-primary studio-card__cta" href={`/studio/${studio.slug}`}>
          Se studio
        </SiteLink>
      </div>
    </article>
  );
}
