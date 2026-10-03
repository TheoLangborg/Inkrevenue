/**
 * MALL FÖR CUSTOM STUDIO-SIDA
 * ─────────────────────────────────────────────────────────────────────────────
 * Kopiera den här filen, döp om den till t.ex. "BlackAnchorPage.jsx",
 * anpassa tema + sektioner efter kundhemsidan, och registrera sluggen i index.js.
 *
 * Steg:
 *   1. Kopiera filen: cp ExampleCustomPage.jsx BlackAnchorPage.jsx
 *   2. Byt ut THEME-värdena (färger, font) mot kundhemsidans stil
 *   3. Bygg ut sektionerna nedan (hero, om, galleri, etc.)
 *   4. I index.js: lägg till  "studio-slug": BlackAnchorPage
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from "react";
import { usePageMetadata, buildPageTitle } from "../../utils/pageMetadata";
import { getPublicStudioBySlug } from "../../services/publicSiteApi";
import { StudioLeadFormEnhanced } from "../../components/StudioLeadFormEnhanced";

// ── TEMA ─────────────────────────────────────────────────────────────────────
// Ändra dessa värden för att matcha kundhemsidans utseende.
const THEME = {
  bg: "#0d0d0d",           // sidans bakgrundsfärg
  text: "#f0f0f0",         // primär textfärg
  accent: "#c9a96e",       // accentfärg (knappar, highlights)
  muted: "#888",           // dämpad text
  fontHeading: "'Bebas Neue', sans-serif",   // rubriktypsnitt
  fontBody: "'Inter', sans-serif",           // brödtexttypsnitt
  // Google Fonts-länk för typsnitten ovan (klistra in i <style> nedan):
  googleFonts: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500&display=swap",
};
// ─────────────────────────────────────────────────────────────────────────────

export function ExampleCustomPage({ slug }) {
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublicStudioBySlug(slug)
      .then((data) => { if (active) setStudio(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const pageTitle = useMemo(
    () => buildPageTitle(studio?.name ? `${studio.name}${studio.city ? ` i ${studio.city}` : ""}` : "Studio"),
    [studio]
  );

  usePageMetadata({
    title: pageTitle,
    description: studio?.publicProfile?.headline || studio?.description || "",
    image: studio?.heroImageUrl || studio?.logoUrl || "/ink-revenue-logo.svg",
    path: `/studio/${slug}`,
  });

  const profile = studio?.publicProfile || {};
  const galleryImages = Array.isArray(profile.galleryImageUrls) ? profile.galleryImageUrls.filter(Boolean) : [];

  if (loading) {
    return (
      <div style={{ background: THEME.bg, color: THEME.text, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: THEME.fontBody }}>
        Laddar...
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div style={{ background: THEME.bg, color: THEME.text, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: THEME.fontBody }}>
        Studiosidan kunde inte laddas.
      </div>
    );
  }

  return (
    <>
      {/* Ladda fonterna — byt URL mot kundspecifika typsnitt */}
      <style>{`@import url('${THEME.googleFonts}');`}</style>

      <div style={{ background: THEME.bg, color: THEME.text, fontFamily: THEME.fontBody }}>

        {/* ── HERO ── */}
        <section
          style={{
            position: "relative",
            minHeight: "70vh",
            display: "flex",
            alignItems: "flex-end",
            overflow: "hidden",
          }}
        >
          {/* Omslaget som <img>, inte CSS-bakgrund: det är sidans största element
              (LCP) och ska hämtas först (docs/bildprestanda.md, steg 3). */}
          {studio.heroImageUrl && (
            <img
              src={studio.heroImageUrl}
              alt=""
              fetchpriority="high"
              style={{ position: "absolute", inset: 0, width: "100%", maxWidth: "none", height: "100%", objectFit: "cover" }}
            />
          )}

          {/* mörkt overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%)" }} />

          <div style={{ position: "relative", padding: "3rem 2rem", maxWidth: 800 }}>
            {studio.logoUrl && (
              <img src={studio.logoUrl} alt={studio.name} style={{ height: 64, marginBottom: "1.5rem", objectFit: "contain" }} />
            )}
            <h1 style={{ fontFamily: THEME.fontHeading, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", margin: "0 0 0.5rem", letterSpacing: "0.02em" }}>
              {studio.name}
            </h1>
            {profile.headline && (
              <p style={{ fontSize: "1.1rem", color: THEME.muted, margin: 0, maxWidth: 560 }}>{profile.headline}</p>
            )}
          </div>
        </section>

        {/* ── OM STUDION ── */}
        {(profile.intro || studio.description) && (
          <section style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem" }}>
            <h2 style={{ fontFamily: THEME.fontHeading, fontSize: "2rem", color: THEME.accent, marginBottom: "1rem" }}>
              Om studion
            </h2>
            <p style={{ lineHeight: 1.75, fontSize: "1.05rem", color: THEME.text }}>
              {profile.intro || studio.description}
            </p>
          </section>
        )}

        {/* ── GALLERI ── */}
        {galleryImages.length > 0 && (
          <section style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontFamily: THEME.fontHeading, fontSize: "2rem", color: THEME.accent, marginBottom: "1.5rem" }}>
              Galleri
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
              {galleryImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${studio.name} — bild ${i + 1}`}
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── BOKNINGSFORMULÄR ── */}
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem" }}>
          <h2 style={{ fontFamily: THEME.fontHeading, fontSize: "2rem", color: THEME.accent, marginBottom: "1rem" }}>
            {profile.formTitle || "Skicka en förfrågan"}
          </h2>
          {profile.formIntro && (
            <p style={{ color: THEME.muted, marginBottom: "2rem" }}>{profile.formIntro}</p>
          )}
          <StudioLeadFormEnhanced studio={studio} />
        </section>

      </div>
    </>
  );
}
