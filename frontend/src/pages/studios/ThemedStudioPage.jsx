import { useEffect, useMemo, useState } from "react";
import { buildPageTitle, usePageMetadata } from "../../utils/pageMetadata";
import { getPublicStudioBySlug } from "../../services/publicSiteApi";
import { StudioLeadFormEnhanced } from "../../components/StudioLeadFormEnhanced";
import { RollingGallery } from "../../components/RollingGallery";
import { ArtistShowcase } from "../../components/ArtistShowcase";
import { buildShowcaseArtists, shouldShowArtistShowcase } from "../../utils/artistShowcase";
import { getStudioTags } from "../../utils/studioTags";
import { useLanguage } from "../../i18n/LanguageContext";

/**
 * @typedef {Object} StudioTheme
 * @property {string} [bg]
 * @property {string} [bgAlt]
 * @property {string} [bgDark]
 * @property {string} [text]
 * @property {string} [textLight]
 * @property {string} [textMuted]
 * @property {string} [accent]
 * @property {string} [accentText]
 * @property {string} [heroOverlay]
 * @property {string} [fontHeading]
 * @property {string} [fontBody]
 * @property {string} [googleFonts]
 * @property {'uppercase'|'none'} [headingTransform]
 * @property {number} [headingWeight]
 * @property {number|string} [borderRadius]
 */

export const DEFAULT_THEME = {
  bg: "#ffffff",
  bgAlt: "#f5f5f5",
  bgDark: "#111111",
  text: "#111111",
  textLight: "#ffffff",
  textMuted: "#555555",
  accent: "#111111",
  accentText: "#ffffff",
  heroOverlay: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)",
  fontHeading: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
  fontBody: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  googleFonts:
    "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Inter:wght@400;500&display=swap",
  headingTransform: "uppercase",
  headingWeight: 900,
  borderRadius: 999,
};

function resolveTheme(partial = {}) {
  return { ...DEFAULT_THEME, ...partial };
}

// Default "how it works" steps — studio can override via formIntro in CRM
function buildDefaultSteps(t) {
  return [
    { n: "01", title: t("themedStudio.step1Title"), text: t("themedStudio.step1Text") },
    { n: "02", title: t("themedStudio.step2Title"), text: t("themedStudio.step2Text") },
    { n: "03", title: t("themedStudio.step3Title"), text: t("themedStudio.step3Text") },
  ];
}

export function ThemedStudioPage({ slug, theme: themePartial = {} }) {
  const { t: translate } = useLanguage();
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t = useMemo(() => resolveTheme(themePartial), [themePartial]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublicStudioBySlug(slug)
      .then((data) => { if (active) setStudio(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const profile = studio?.publicProfile || {};
  const headingImageUrl = String(profile.headingImageUrl || "").trim();
  const galleryImages = useMemo(
    () => (Array.isArray(profile.galleryImageUrls) ? profile.galleryImageUrls.filter(Boolean) : []),
    [profile.galleryImageUrls]
  );
  const tags = useMemo(() => (studio ? [...new Set(getStudioTags(studio))] : []), [studio]);
  // Samma par som i StudioProfilePage: "Boka hos …" → formuläret, och
  // formulärets val tillbaka hit för att markera kortet.
  const [artistRequest, setArtistRequest] = useState(null);
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const showcaseArtists = useMemo(() => buildShowcaseArtists(studio?.artistOptions), [studio]);

  const pageTitle = useMemo(
    () =>
      buildPageTitle(
        studio?.name
          ? `${studio.name}${studio.city ? translate("studio.metaCityPart", { city: studio.city }) : ""}`
          : translate("themedStudio.fallbackTitle")
      ),
    [studio, translate]
  );

  usePageMetadata({
    title: pageTitle,
    description: profile.headline || profile.cardSummary || profile.intro || studio?.description || "",
    image: studio?.heroImageUrl || studio?.logoUrl || "/ink-revenue-logo.svg",
    path: `/studio/${slug}`,
  });

  if (loading) {
    return (
      <div style={{ background: t.bg, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.fontBody, color: t.textMuted }}>
        {translate("themedStudio.loading")}
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div style={{ background: t.bg, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.fontBody, color: t.textMuted }}>
        {translate("themedStudio.error")}
      </div>
    );
  }

  const aboutText = profile.intro || studio.description || "";
  const hasHeroImage = Boolean(studio.heroImageUrl);

  // Hero: fullscreen with photo if available, dark graphic fallback
  const heroStyle = {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundImage: hasHeroImage
      ? `url(${studio.heroImageUrl})`
      : `linear-gradient(160deg, ${t.bgDark} 0%, #2a2a2a 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    overflow: "hidden",
  };

  // "Book now" pill button — white on dark hero
  const heroBtnStyle = {
    display: "inline-block",
    background: t.accentText,  // white
    color: t.accent,           // black (accent)
    fontFamily: t.fontHeading,
    fontWeight: t.headingWeight,
    fontSize: "1rem",
    letterSpacing: "0.12em",
    textTransform: t.headingTransform,
    padding: "1rem 3rem",
    borderRadius: t.borderRadius,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
  };

  // Accent button (dark, used in about section)
  const accentBtnStyle = {
    display: "inline-block",
    background: t.accent,
    color: t.accentText,
    fontFamily: t.fontHeading,
    fontWeight: t.headingWeight,
    fontSize: "0.95rem",
    letterSpacing: "0.1em",
    textTransform: t.headingTransform,
    padding: "0.85rem 2.2rem",
    borderRadius: t.borderRadius,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    marginTop: "2rem",
  };

  const headingStyle = (extra = {}) => ({
    fontFamily: t.fontHeading,
    fontWeight: t.headingWeight,
    textTransform: t.headingTransform,
    letterSpacing: "0.05em",
    margin: 0,
    ...extra,
  });

  return (
    <>
      {t.googleFonts && <style>{`@import url('${t.googleFonts}');`}</style>}
      <div style={{ background: t.bg, color: t.text, fontFamily: t.fontBody, margin: 0, padding: 0 }}>

        {/* ── HERO ── */}
        <section style={heroStyle}>
          {/* Gradient overlay — always present for text legibility */}
          <div style={{ position: "absolute", inset: 0, background: t.heroOverlay }} />

          {/* No-photo fallback: decorative RK monogram pattern */}
          {!hasHeroImage && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0.06, fontSize: "40vw", fontFamily: t.fontHeading, fontWeight: 900,
              color: "#fff", userSelect: "none", letterSpacing: "-0.05em", lineHeight: 1,
            }}>
              {(studio.name || "").slice(0, 2).toUpperCase()}
            </div>
          )}

          <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 1.5rem 5rem", width: "100%", maxWidth: 860 }}>
            {/* Symbolen visas bara när det inte finns en rubrikbild — en wordmark
                innehåller oftast samma märke, och då blir det dubbelt. */}
            {studio.logoUrl && !headingImageUrl && (
              <img
                src={studio.logoUrl}
                alt={studio.name}
                style={{ height: 80, objectFit: "contain", marginBottom: "1.5rem", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
              />
            )}
            {headingImageUrl ? (
              <>
                {/* Rubrikbilden ersätter studionamnet visuellt. h1:an finns kvar dold
                    för sökmotorer och skärmläsare, därför är bilden dekorativ. */}
                <img
                  src={headingImageUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: 720,
                    height: "auto",
                    maxHeight: 200,
                    objectFit: "contain",
                    margin: "0 auto 0.75rem",
                    filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.45))",
                  }}
                />
                <h1 className="visually-hidden">{studio.name}</h1>
              </>
            ) : (
              <h1 style={headingStyle({
                fontSize: "clamp(3.5rem, 12vw, 7rem)",
                color: t.textLight,
                lineHeight: 1,
                marginBottom: "0.75rem",
              })}>
                {studio.name}
              </h1>
            )}
            {profile.headline && (
              <p style={{
                fontSize: "1rem", color: "rgba(255,255,255,0.72)", letterSpacing: "0.18em",
                textTransform: "uppercase", marginBottom: "2.5rem", fontFamily: t.fontBody,
              }}>
                {profile.headline}
              </p>
            )}
            {!profile.headline && studio.city && (
              <p style={{
                fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", letterSpacing: "0.2em",
                textTransform: "uppercase", marginBottom: "2.5rem",
              }}>
                {translate("themedStudio.cityKind", { city: studio.city })}
              </p>
            )}
            <a
              href="#ts-booking"
              style={heroBtnStyle}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("ts-booking")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {translate("themedStudio.bookNow")}
            </a>
            {(profile.instagramUrl || profile.websiteUrl) && (
              <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", marginTop: "1.5rem" }}>
                {profile.instagramUrl && (
                  <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    color: "rgba(255,255,255,0.75)", textDecoration: "none",
                    fontSize: "0.85rem", letterSpacing: "0.05em", fontFamily: t.fontBody,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                    </svg>
                    {translate("themedStudio.instagram")}
                  </a>
                )}
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    color: "rgba(255,255,255,0.75)", textDecoration: "none",
                    fontSize: "0.85rem", letterSpacing: "0.05em", fontFamily: t.fontBody,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    {translate("themedStudio.website")}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── OM STUDION — split layout med bild ── */}
        {aboutText && (
          <section style={{ display: "grid", gridTemplateColumns: galleryImages[0] ? "1fr 1fr" : "1fr" }}>
            {galleryImages[0] && (
              <img
                src={galleryImages[0]}
                alt={translate("themedStudio.studioAlt", { name: studio.name })}
                style={{ width: "100%", minHeight: 500, objectFit: "cover", display: "block" }}
              />
            )}
            <div style={{
              padding: "5rem 4rem", display: "flex", flexDirection: "column",
              justifyContent: "center", background: t.bg,
            }}>
              <h2 style={headingStyle({
                fontSize: "clamp(2.5rem, 5vw, 4rem)", color: t.text,
                marginBottom: "1.5rem", lineHeight: 1.05,
              })}>
                {translate("themedStudio.aboutLine1")}<br />{translate("themedStudio.aboutLine2")}
              </h2>
              <p style={{ fontSize: "1.05rem", lineHeight: 1.85, color: t.textMuted, maxWidth: 500 }}>
                {aboutText}
              </p>
              {tags.length > 0 && (
                <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {tags.map((tag) => (
                    <span key={tag} style={{
                      padding: "0.3rem 0.9rem", borderRadius: 999,
                      border: `1px solid ${t.accent}`, fontSize: "0.8rem",
                      letterSpacing: "0.05em", color: t.accent,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" style={accentBtnStyle}>
                  {translate("themedStudio.visitWebsite")}
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── HUR DET GÅR TILL ── */}
        <section style={{ background: t.bgDark, padding: "5rem 2rem" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={headingStyle({
              fontSize: "clamp(2rem, 5vw, 3.5rem)", color: t.textLight,
              marginBottom: "3rem", textAlign: "center",
            })}>
              {translate("themedStudio.howTitle")}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2.5rem" }}>
              {buildDefaultSteps(translate).map((step) => (
                <div key={step.n}>
                  <div style={headingStyle({
                    fontSize: "3.5rem", color: t.accent === "#111111" ? "rgba(255,255,255,0.12)" : t.accent,
                    marginBottom: "0.75rem", lineHeight: 1,
                  })}>
                    {step.n}
                  </div>
                  <h3 style={headingStyle({
                    fontSize: "1.2rem", color: t.textLight, marginBottom: "0.6rem",
                  })}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GALLERI ── */}
        {galleryImages.length > 1 && (
          <section style={{ background: t.bgAlt, padding: "5rem 1.5rem" }}>
            <h2 style={headingStyle({
              fontSize: "clamp(2rem, 5vw, 3.5rem)", color: t.text,
              marginBottom: "2.5rem", textAlign: "center",
            })}>
              {translate("themedStudio.gallery")}
            </h2>
            {/* Rullande band med ALLA bilder. Rutnätet visade slice(1) eftersom
                bild 0 används som stor bild längre upp — fem bilder i CRM:et blev
                därför fyra här, vilket såg ut som att en bild försvunnit. */}
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <RollingGallery images={galleryImages} studioName={studio.name} />
            </div>
          </section>
        )}

        {/* ── TATUERARNA — direkt ovanför formuläret ── */}
        {shouldShowArtistShowcase(showcaseArtists) && (
          <section style={{ background: t.bg, padding: "5rem 1.5rem 1rem" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <h2 style={headingStyle({
                fontSize: "clamp(2rem, 5vw, 3.5rem)", color: t.text,
                marginBottom: "0.75rem", textAlign: "center",
              })}>
                {translate("artists.title")}
              </h2>
              <p style={{
                fontSize: "1rem", color: t.textMuted, lineHeight: 1.7,
                textAlign: "center", maxWidth: 560, margin: "0 auto 2.5rem",
              }}>
                {translate("artists.intro")}
              </p>
              {/* Studions tema in i kortens CSS-variabler (.artist-showcase i App.css). */}
              <ArtistShowcase
                artists={showcaseArtists}
                selectedArtistId={selectedArtistId}
                onChooseArtist={(id) => setArtistRequest({ id, nonce: Date.now() })}
                centered
                style={{
                  "--as-surface": t.bg,
                  "--as-text": t.text,
                  "--as-muted": t.textMuted,
                  "--as-border": `color-mix(in srgb, ${t.text} 14%, transparent)`,
                  "--as-accent": t.accent,
                  "--as-accent-text": t.accentText,
                  "--as-placeholder": t.bgAlt,
                  "--as-heading-font": t.fontHeading,
                  "--as-heading-transform": t.headingTransform,
                  "--as-button-radius":
                    typeof t.borderRadius === "number" ? `${t.borderRadius}px` : t.borderRadius,
                }}
              />
            </div>
          </section>
        )}

        {/* ── BOKNINGSFORMULÄR ── */}
        <section id="ts-booking" style={{ background: t.bg, padding: "5.5rem 1.5rem" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            {/* CTA-rubrik med tydlig kontrast. Biolänk-besökare scrollas hit, se useBookingFormAutoScroll. */}
            <div data-booking-anchor style={{
              background: t.bgDark, borderRadius: 16, padding: "2.5rem 2.5rem 0",
              marginBottom: "-1rem",
            }}>
              <h2 style={headingStyle({
                fontSize: "clamp(2rem, 5vw, 3rem)", color: t.textLight, marginBottom: "0.75rem",
              })}>
                {profile.formTitle || translate("themedStudio.formTitle")}
              </h2>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", marginBottom: "2rem", lineHeight: 1.7 }}>
                {profile.formIntro || translate("themedStudio.formIntro")}
              </p>
            </div>

            {/* Formulär med temanpassade CSS-variabler */}
            <div style={{
              "--accent": t.accent,
              "--lav-100": `color-mix(in srgb, ${t.accent} 12%, #fff)`,
            }}>
              <StudioLeadFormEnhanced
                studio={studio}
                titleText=""
                introText=""
                artistRequest={artistRequest}
                onPreferredArtistChange={setSelectedArtistId}
              />
            </div>
          </div>
        </section>

        {/* ── FOOTER STRIP ── */}
        <div style={{
          background: t.bgDark,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "1.75rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}>
          <span style={headingStyle({ fontSize: "1rem", letterSpacing: "0.15em", color: t.textLight })}>
            {studio.name}{studio.city ? ` · ${studio.city}` : ""}
          </span>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            {profile.instagramUrl && (
              <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
                {translate("themedStudio.instagram")}
              </a>
            )}
            {profile.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
                {translate("themedStudio.website")}
              </a>
            )}
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>inkrevenue.se</span>
          </div>
        </div>

      </div>
    </>
  );
}
