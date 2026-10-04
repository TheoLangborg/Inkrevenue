import { useState } from "react";
import { getImageSrcSet, getImageVariantUrl } from "../utils/imageVariants";

/**
 * <img> för studiobilder från CRM:et, med småversionerna i stället för
 * originalet (utils/imageVariants.js, tattoo-crm/docs/bildprestanda.md steg 5).
 *
 * - `widths` + `sizes`: srcset, så att webbläsaren väljer storlek själv.
 * - `variant`: en enda mindre version, för loggor och små profilbilder.
 *
 * Saknas versionen (en bild från innan versionerna fanns, eller storage.rules
 * som inte är deployad) visas originalet i stället. Allt annat skickas vidare
 * till <img>. `sizes` och `srcSet` står efter `loading`, så att lata bilder
 * inte börjar hämtas innan webbläsaren vet att de är lata.
 */
export function StudioImage({ src, widths, sizes, variant, onError, ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const fallback = failedSrc === src;
  const srcSet = !fallback && widths ? getImageSrcSet(src, widths) : undefined;
  const single = !fallback && !srcSet && variant ? getImageVariantUrl(src, variant) : src;
  const usesVariant = Boolean(srcSet) || single !== src;

  return (
    <img
      {...rest}
      sizes={srcSet ? sizes : undefined}
      srcSet={srcSet}
      src={single}
      onError={(event) => {
        if (usesVariant) {
          setFailedSrc(src);
          return;
        }
        onError?.(event);
      }}
    />
  );
}
