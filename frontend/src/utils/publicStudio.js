import { createContext, useContext, useEffect, useState } from "react";
import { getPublicStudioBySlug } from "../services/publicSiteApi";

/**
 * Studiodata som prerender.mjs hämtade vid bygget, per slug. Under
 * prerenderingen kommer den från den här kontexten. I webbläsaren ligger den i
 * window.__PRERENDERED_STUDIO__, som prerender.mjs skrev in på studiosidan.
 *
 * Utan den prerendrades studiosidorna i laddningsläget: Google och
 * länkförhandsvisare fick en sida utan rubrik, text eller bilder.
 */
export const PrerenderedStudiosContext = createContext(null);

function readBrowserStudio(slug) {
  if (typeof window === "undefined") return null;
  const data = window.__PRERENDERED_STUDIO__;
  return data && data.slug === slug ? data : null;
}

/**
 * En publik studio: { studio, loading, error }. Finns byggets data visas den
 * direkt (ingen laddningsruta ovanpå en färdig sida), och studion hämtas ändå
 * på nytt i bakgrunden. Svarar CRM:et med samma data behålls objektet, så att
 * formulärets effekter inte körs om. Har studion dolts sedan bygget ger
 * hämtningen ett fel, och sidan visar felet precis som förut.
 */
export function usePublicStudio(slug, { skip = false } = {}) {
  const serverStudios = useContext(PrerenderedStudiosContext);
  const [state, setState] = useState(() => {
    const seed = skip ? null : serverStudios ? serverStudios[slug] || null : readBrowserStudio(slug);
    return { slug, studio: seed, loading: !skip && !seed, error: null };
  });

  useEffect(() => {
    if (skip) return undefined;

    let active = true;

    setState((previous) => {
      if (previous.slug === slug && previous.studio) return previous;
      const seed = readBrowserStudio(slug);
      return { slug, studio: seed, loading: !seed, error: null };
    });

    getPublicStudioBySlug(slug)
      .then((studio) => {
        if (!active) return;
        setState((previous) =>
          previous.slug === slug &&
          previous.studio &&
          JSON.stringify(previous.studio) === JSON.stringify(studio)
            ? previous
            : { slug, studio, loading: false, error: null }
        );
      })
      .catch((error) => {
        if (active) setState({ slug, studio: null, loading: false, error });
      });

    return () => {
      active = false;
    };
  }, [slug, skip]);

  return state;
}
