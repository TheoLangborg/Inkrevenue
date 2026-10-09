import ghostInkBanner from "../../assets/ghost-ink/hero-banner-840.webp";
import testStudioCard from "../../assets/test-studio/card-888.webp";
import testStudioHero from "../../assets/test-studio/hero.svg";

// Studiobilder som ligger i koden och inte i CRM:et. De går före CRM:ets
// omslagsbild (heroImageUrl). Egen modul, inte studioRegistry: registret drar
// med sig studiornas sidor, och startsidans kort ska inte ladda dem.
//
// card:               katalogkortets foto (PublicStudioCard, alla ställen där
//                     korten visas).
// cardNarrowPosition: object-position i mobilens smala, stående kortruta
//                     (≤480 px), som bara visar en tredjedel av ett liggande
//                     foto. Utan den: mitten.
// hero:               bakgrunden i heron på StudioProfilePage, i naturlig
//                     storlek och centrerad (.page-hero__media--natural), så
//                     ritad för det: se test-studio/hero.svg. Byter bara
//                     bilden; delningsbilden (og:image) är fortfarande CRM:ets.
//                     Ghost Inks hero ligger i GhostInkPage (STUDIO.heroBanner).
//
// ⚠️ Med en bild här syns en ny omslagsbild från CRM:et inte på den platsen,
// inte heller i CRM:ets förhandsvisning, förrän raden tas bort.
export const studioImages = {
  // Samma banner som i heron på hans sida. Mitten av bannern skär texten
  // mitt itu i den smala rutan; 84 % visar tatueraren.
  "ghost-ink": { card: ghostInkBanner, cardNarrowPosition: "84% 50%" },
  // CRM:ets omslagsbild är delningsbilden (1200×630, mycket text). Kortet
  // klippte texten och loggbrickan låg ovanpå, och heron förstorade den bakom
  // sidans rubrik (användaren 2026-10-09). Kortet är samma bild omritad för
  // kortet (card.svg → card-888.webp), heron samma färger och märke utan
  // delningstext. På mobil syns märket till höger i kortet. I heron stod märket
  // först bakom infokortet och syntes inte; nu står det i luckan mellan
  // rubriken och kortet (se hero.svg).
  "inkrevenue-test-studio": {
    card: testStudioCard,
    cardNarrowPosition: "100% 50%",
    hero: testStudioHero
  }
};
