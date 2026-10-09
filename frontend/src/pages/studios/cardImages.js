import ghostInkBanner from "../../assets/ghost-ink/hero-banner-840.webp";

// Katalogkortens foto, när det ligger i koden och inte i CRM:et. Går före
// CRM:ets omslagsbild (heroImageUrl) i PublicStudioCard, på alla ställen där
// korten visas. Egen modul, inte studioRegistry: registret drar med sig
// studiornas sidor, och startsidans kort ska inte ladda dem.
//
// narrowPosition: object-position i mobilens smala, stående ruta (≤480 px),
// som bara visar en tredjedel av ett liggande foto. Utan den: mitten.
export const studioCardImages = {
  // Samma banner som i heron på hans sida (GhostInkPage, STUDIO.heroBanner).
  // Mitten av bannern skär texten mitt itu; 84 % visar tatueraren.
  "ghost-ink": { src: ghostInkBanner, narrowPosition: "84% 50%" }
};
