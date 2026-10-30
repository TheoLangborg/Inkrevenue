import { SITE_URL } from "./pageMetadata";
import { buildLanguagePath } from "../i18n/config";
import { getStudioTags } from "./studioTags";

/**
 * TattooShop-schema för en studiosida. Delas av StudioProfilePage,
 * ThemedStudioPage och de egna sidkomponenterna (GhostInkPage), så att alla
 * studiosidor beskriver studion likadant för Google.
 *
 * `@id` är språkfritt: /studio/x och /en/studio/x beskriver samma studio.
 * `extra` fyller på eller skriver över fält (gatuadress, tatuerare, karta).
 */
export function buildStudioJsonLd({ studio, slug, language, t, extra = {} }) {
  if (!studio) return null;

  const resolvedSlug = encodeURIComponent(studio.slug || slug);
  const pagePath = `/studio/${resolvedSlug}`;
  const pageUrl = `${SITE_URL}${buildLanguagePath(pagePath, language)}`;
  const tags = [...new Set(getStudioTags(studio))];
  const images = Array.isArray(studio.publicProfile?.galleryImageUrls)
    ? studio.publicProfile.galleryImageUrls.filter(Boolean)
    : [];
  const instagramUrl = studio.publicProfile?.instagramUrl || "";
  const websiteUrl = studio.publicProfile?.websiteUrl || "";
  const sameAs = [instagramUrl, websiteUrl].filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "TattooShop",
    "@id": `${SITE_URL}${pagePath}#studio`,
    "name": studio.name,
    "url": pageUrl,
    "description":
      studio.publicProfile?.intro || studio.publicProfile?.cardSummary || studio.description || undefined,
    "address": studio.city
      ? { "@type": "PostalAddress", "addressLocality": studio.city, "addressCountry": "SE" }
      : undefined,
    "image": [studio.heroImageUrl, studio.logoUrl, ...images].filter(Boolean).slice(0, 6),
    "logo": studio.logoUrl || undefined,
    "hasMap": studio.city
      ? `https://www.google.com/maps/search/${encodeURIComponent(t("studio.mapsQuery", { name: studio.name, city: studio.city }))}`
      : undefined,
    "knowsAbout": tags.length ? tags : undefined,
    "sameAs": sameAs.length ? sameAs : undefined,
    "potentialAction": {
      "@type": "ReserveAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${pageUrl}#studio-form` },
      "result": { "@type": "Reservation", "name": t("studio.reserveActionName") }
    },
    ...extra
  };

  if (!schema.image.length) delete schema.image;

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
}
