import { useEffect, useRef } from "react";

const BRAND_NAME = "Ink Revenue";
const SITE_URL = "https://inkrevenue.online";
const DEFAULT_IMAGE_PATH = "/og-image.png";

function toAbsoluteUrl(value) {
  if (!value) {
    return "";
  }

  if (typeof window === "undefined") {
    return value;
  }

  if (/^(https?:|data:)/i.test(value)) {
    return value;
  }

  return new URL(value, window.location.origin).toString();
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

export function useJsonLd(schema) {
  const scriptRef = useRef(null);

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
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const canonicalUrl = path ? toAbsoluteUrl(path) : window.location.href;
    const imageUrl = toAbsoluteUrl(image || DEFAULT_IMAGE_PATH);
    const resolvedTitle = title || BRAND_NAME;
    const resolvedDescription = String(description || "").trim();

    document.title = resolvedTitle;

    upsertMeta("name", "description", resolvedDescription);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");
    upsertMeta("property", "og:locale", "sv_SE");
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
  }, [description, image, noIndex, path, title, type]);
}
