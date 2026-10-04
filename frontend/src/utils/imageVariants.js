/**
 * Småversionerna av studiobilderna (tattoo-crm/docs/bildprestanda.md, steg 5).
 *
 * Varje bild som CRM:et laddar upp till studios/<mapp>/<namn>.<ändelse> har tre
 * mindre versioner i samma mapp: <namn>__w480.webp, <namn>__w1024.webp och
 * <namn>__w2048.webp (bredd i pixlar, aldrig förstorad). CRM:et skapar dem vid
 * uppladdningen, och `npm run backfill:image-variants` i tattoo-crm/backend
 * skapar dem för äldre bilder. storage.rules tillåter läsning utan token under
 * studios/, så versionens länk kan räknas fram ur originalets.
 *
 * Saknas en version (en bild från innan, eller en GIF) faller StudioImage
 * tillbaka på originalet. Samma namnregel finns i CRM:et
 * (frontend/src/utils/studioImageVariants.js) och i backend.
 */

export const IMAGE_VARIANT_WIDTHS = [480, 1024, 2048];

const STORAGE_HOST = "firebasestorage.googleapis.com";
const STUDIO_FOLDERS = new Set(["logos", "headings", "hero", "gallery"]);

/**
 * Länken till en mindre version av en studiobild, eller `url` oförändrad när
 * bilden inte är en av CRM:ets uppladdningar (en inklistrad länk, en egen fil i
 * sajten, en GIF som ska behålla animationen).
 */
export function getImageVariantUrl(url, width) {
  if (typeof url !== "string" || !url || !IMAGE_VARIANT_WIDTHS.includes(width)) return url;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== STORAGE_HOST) return url;

  const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/([^/]+)$/);
  if (!match) return url;

  let path;
  try {
    path = decodeURIComponent(match[2]);
  } catch {
    return url;
  }

  const [root, folder, name, ...rest] = path.split("/");
  if (root !== "studios" || !STUDIO_FOLDERS.has(folder) || !name || rest.length) return url;
  if (/\.gif$/i.test(name) || /__w\d+\.webp$/i.test(name)) return url;

  const base = name.replace(/\.[^.]+$/, "");
  const variantPath = `studios/${folder}/${base}__w${width}.webp`;
  return `https://${STORAGE_HOST}/v0/b/${match[1]}/o/${encodeURIComponent(variantPath)}?alt=media`;
}

/** `srcset` med de angivna bredderna, eller undefined när bilden saknar versioner. */
export function getImageSrcSet(url, widths) {
  const candidates = [];
  for (const width of widths) {
    const variant = getImageVariantUrl(url, width);
    if (variant === url) return undefined;
    candidates.push(`${variant} ${width}w`);
  }
  return candidates.length ? candidates.join(", ") : undefined;
}
