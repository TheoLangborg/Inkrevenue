import { useT } from "../i18n/LanguageContext";

// Bildrutan i startsidans hero. Lägg ett foto som src/assets/home/hero.webp
// (eller .jpg/.png) så visas det här automatiskt, utan kodändring. Stående
// format runt 4:5, ca 1000 px brett och under 250 KB. Uppdatera alt-texten
// home.heroPhotoAlt i sv.js och en.js så att den beskriver fotot.
// Utan foto ritas varumärkets romb som linjeteckning i stället.
const heroPhotos = import.meta.glob("../assets/home/hero.{webp,jpg,jpeg,png}", {
  eager: true,
  import: "default"
});
const HERO_PHOTO = Object.values(heroPhotos)[0] || null;

// Rombens linjer, inifrån och ut: sidan och hur synlig linjen är.
const DIAMOND_LINES = [56, 92, 128, 164, 200, 236, 272, 308].map((size, index) => ({
  size,
  opacity: Math.max(0.07, 0.62 - index * 0.08)
}));

function DiamondArt() {
  return (
    <svg className="hero-visual__art" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
      <g transform="translate(200 250) rotate(45)">
        {DIAMOND_LINES.map(({ size, opacity }) => (
          <rect
            key={size}
            x={-size / 2}
            y={-size / 2}
            width={size}
            height={size}
            fill="none"
            stroke="#8fb3ea"
            strokeOpacity={opacity}
            strokeWidth={size === 56 ? 3 : 1.2}
          />
        ))}
      </g>
    </svg>
  );
}

// Korten ovanpå är små utdrag ur CRM:et med dess färger och statusord.
// Texten är alltid svensk, även på /en: CRM:et finns bara på svenska.
export function HomeHeroVisual() {
  const t = useT();

  return (
    <figure className={`hero-visual${HERO_PHOTO ? " hero-visual--photo" : ""}`}>
      <div className="hero-visual__frame">
        {HERO_PHOTO ? (
          <img
            className="hero-visual__photo"
            src={HERO_PHOTO}
            alt={t("home.heroPhotoAlt")}
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <DiamondArt />
        )}
      </div>

      <div className="hero-chip hero-chip--lead" aria-hidden="true">
        <span className="hero-chip__avatar">EL</span>
        <span className="hero-chip__text">
          <strong>Ny förfrågan</strong>
          <span>Emma Lindqvist · Blackwork, underarm</span>
        </span>
        <span className="hero-chip__badge hero-chip__badge--info">Ny</span>
      </div>

      <div className="hero-chip hero-chip--booking" aria-hidden="true">
        <span className="hero-chip__date">
          <small>tors</small>
          14
        </span>
        <span className="hero-chip__text">
          <strong>Sara Ahmed</strong>
          <span>Realism, överarm · 14:00</span>
        </span>
        <span className="hero-chip__badge hero-chip__badge--booked">Bokad</span>
      </div>
    </figure>
  );
}
