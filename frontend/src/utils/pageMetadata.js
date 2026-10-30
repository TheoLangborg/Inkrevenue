import { createContext, useContext, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { DEFAULT_LANGUAGE, HTML_LANG, LANGUAGES, OG_LOCALES, buildLanguagePath } from "../i18n/config";

const BRAND_NAME = "Ink Revenue";
// Sajten bor på www (apex 308:ar hit). Canonical, hreflang, sitemap och schema
// måste peka på www, annars pekar de på en omdirigering. Speglas i prerender.mjs
// och index.html.
export const SITE_URL = "https://www.inkrevenue.online";
const DEFAULT_IMAGE_PATH = "/og-image.png";

// Alltid mot SITE_URL, inte window.location: en förhandsdeploy eller localhost
// ska peka canonical på produktionsadressen.
function toAbsoluteUrl(value) {
  if (!value) {
    return "";
  }

  if (/^(https?:|data:)/i.test(value)) {
    return value;
  }

  return new URL(value, SITE_URL).toString();
}

function upsertMeta(attribute, key, content) {
  if (typeof document === "undefined") {
    return;
  }

  const selector = `meta[${attribute}="${key}"]`;
  const existingElement = document.head.querySelector(selector);

  if (!content) {
    existingElement?.remove();
    return;
  }

  const element = existingElement || document.createElement("meta");

  element.setAttribute(attribute, key);
  element.setAttribute("content", content);

  if (!existingElement) {
    document.head.appendChild(element);
  }
}

function upsertLink(rel, href) {
  if (typeof document === "undefined") {
    return;
  }

  const existingElement = document.head.querySelector(`link[rel="${rel}"]`);

  if (!href) {
    existingElement?.remove();
    return;
  }

  const element = existingElement || document.createElement("link");

  element.setAttribute("rel", rel);
  element.setAttribute("href", href);

  if (!existingElement) {
    document.head.appendChild(element);
  }
}

/**
 * hreflang-alternativ: en <link rel="alternate"> per språk plus x-default.
 * De märks med data-i18n-alt så att vi kan byta ut hela uppsättningen vid
 * navigering utan att röra andra <link rel="alternate">-taggar.
 */
function upsertAlternateLinks(entries) {
  if (typeof document === "undefined") {
    return;
  }

  document.head
    .querySelectorAll('link[data-i18n-alt="1"]')
    .forEach((element) => element.remove());

  entries.forEach(({ hrefLang, href }) => {
    const element = document.createElement("link");
    element.setAttribute("rel", "alternate");
    element.setAttribute("hreflang", hrefLang);
    element.setAttribute("href", href);
    element.setAttribute("data-i18n-alt", "1");
    document.head.appendChild(element);
  });
}

/**
 * Prerenderingen (entry-server.jsx) lägger ett tomt objekt här och läser sedan
 * sidans titel, beskrivning, robots-direktiv och schema, så att den statiska
 * HTML:en får sidans egna taggar på sidans språk. Länkförhandsvisare kör inte
 * JavaScript och såg annars startsidans svenska taggar även på /en. I
 * webbläsaren finns inget objekt.
 */
export const ServerMetadataContext = createContext(null);

/**
 * Strukturerad data för sidan. Under prerenderingen samlas schemat in i
 * ServerMetadataContext och skrivs in i den statiska HTML:en (märkt
 * data-prerendered, som main.jsx tar bort innan appen ritar sina egna).
 */
export function useJsonLd(schema) {
  const scriptRef = useRef(null);
  const serverMetadata = useContext(ServerMetadataContext);

  if (serverMetadata && schema) {
    serverMetadata.jsonLd = [...(serverMetadata.jsonLd || []), schema];
  }

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!schema) {
      scriptRef.current?.remove();
      scriptRef.current = null;
      return;
    }

    if (!scriptRef.current) {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      document.head.appendChild(el);
      scriptRef.current = el;
    }

    scriptRef.current.textContent = JSON.stringify(schema);

    return () => {
      scriptRef.current?.remove();
      scriptRef.current = null;
    };
  }, [schema]);
}

export function buildPageTitle(title) {
  return title ? `${title} | ${BRAND_NAME}` : BRAND_NAME;
}

export function usePageMetadata({
  title,
  description = "",
  image = DEFAULT_IMAGE_PATH,
  type = "website",
  path = "",
  noIndex = false
}) {
  const { language } = useLanguage();
  const serverMetadata = useContext(ServerMetadataContext);

  if (serverMetadata) {
    serverMetadata.title = title || BRAND_NAME;
    serverMetadata.description = String(description || "").trim();
    serverMetadata.noIndex = noIndex;
  }

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    // path skickas alltid språkfritt ("/studios") — prefixet läggs på här så
    // att canonical och hreflang pekar på rätt språkversion.
    const localizedPath = path ? buildLanguagePath(path, language) : "";
    const canonicalUrl = localizedPath
      ? toAbsoluteUrl(localizedPath)
      : toAbsoluteUrl(`${window.location.pathname}${window.location.search}`);
    const imageUrl = toAbsoluteUrl(image || DEFAULT_IMAGE_PATH);
    const resolvedTitle = title || BRAND_NAME;
    const resolvedDescription = String(description || "").trim();

    document.title = resolvedTitle;
    document.documentElement.setAttribute("lang", HTML_LANG[language] || HTML_LANG[DEFAULT_LANGUAGE]);

    upsertMeta("name", "description", resolvedDescription);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");
    upsertMeta("property", "og:locale", OG_LOCALES[language] || OG_LOCALES[DEFAULT_LANGUAGE]);
    upsertMeta("property", "og:site_name", BRAND_NAME);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", resolvedTitle);
    upsertMeta("property", "og:description", resolvedDescription);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", resolvedTitle);
    upsertMeta("name", "twitter:description", resolvedDescription);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:image:alt", resolvedTitle);
    upsertMeta("property", "og:image:alt", resolvedTitle);
    upsertLink("canonical", canonicalUrl);

    // hreflang bara på sidor som ska indexeras och som har en känd sökväg.
    // Preview-/404-sidor pekar ingenstans meningsfullt.
    if (path && !noIndex) {
      upsertAlternateLinks([
        ...LANGUAGES.map((code) => ({
          hrefLang: HTML_LANG[code],
          href: `${SITE_URL}${buildLanguagePath(path, code)}`
        })),
        { hrefLang: "x-default", href: `${SITE_URL}${buildLanguagePath(path, DEFAULT_LANGUAGE)}` }
      ]);
    } else {
      upsertAlternateLinks([]);
    }
  }, [description, image, language, noIndex, path, title, type]);
}
