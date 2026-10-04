import { useEffect, useId, useMemo, useState } from "react";
import { buildPageTitle, usePageMetadata } from "../../utils/pageMetadata";
import { SiteLink } from "../../utils/siteRouter";
import { getPublicStudioBySlug } from "../../services/publicSiteApi";
import { StudioLeadFormEnhanced } from "../../components/StudioLeadFormEnhanced";
import { RollingGallery } from "../../components/RollingGallery";
import { StudioImage } from "../../components/StudioImage";
import { buildShowcaseArtists } from "../../utils/artistShowcase";
import { useLanguage } from "../../i18n/LanguageContext";
import heroWide1280 from "../../assets/ghost-ink/studio-hero-wide-1280.webp";
import heroWide1920 from "../../assets/ghost-ink/studio-hero-wide-1920.webp";
import heroWide2560 from "../../assets/ghost-ink/studio-hero-wide-2560.webp";
import heroTall640 from "../../assets/ghost-ink/studio-hero-tall-640.webp";
import heroTall960 from "../../assets/ghost-ink/studio-hero-tall-960.webp";
import heroTall1280 from "../../assets/ghost-ink/studio-hero-tall-1280.webp";
import loungeTall480 from "../../assets/ghost-ink/studio-lounge-tall-480.webp";
import loungeTall720 from "../../assets/ghost-ink/studio-lounge-tall-720.webp";
import loungeTall960 from "../../assets/ghost-ink/studio-lounge-tall-960.webp";

/**
 * Hampus Wardhoffs sida, på Ghost Ink.
 *
 * Sidan är byggd kring tatueraren: namnet är rubriken, och verken, Instagram
 * och kontakten är hans. Studions namn och adress står på en rad och ligger i
 * STUDIO nedan (namnet i första hand från CRM:et).
 * Öppna punkter: tattoo-crm/docs/ghost-ink-studiosida.md.
 *
 * ⚠️ Studiosidan finns nu i TRE komponenter: StudioProfilePage,
 * ThemedStudioPage och den här. Det som ska gälla alla studiosidor måste in
 * på alla tre. Stilarna ligger i .gi-blocket sist i App.css.
 *
 * Sidan ligger i InkRevenues ram (sidhuvud och sidfot från AppShell), precis
 * som de andra studiosidorna. Mallen följer Royalkaves (ThemedStudioPage):
 * mörk hero med namnet, "Om" i två kolumner, verken, en mörk numrerad sektion,
 * formuläret under ett mörkt huvud och en mörk remsa sist. Färgerna och
 * typsnitten är Ghost Inks, och rubriken är Hampus namn, inte studions. En
 * tidigare version hade eget sidhuvud och egen sidfot; den såg ut som hans
 * privata hemsida, så användaren valde bort den 2026-09-18.
 *
 * Sidan visas bara när CRM:et lämnar ut studion, alltså när "Ta emot publika
 * förfrågningar via vår hemsida" är påslaget. Innan dess får besökaren samma
 * laddning och fel som för vilken dold studio som helst — ingenting på sidan
 * avslöjar Ghost Ink eller Hampus. Katalogen styrs för sig av "Visa studion i
 * InkRevenue-katalogen".
 *
 * Det vi redan vet (namn, kontakt, Instagram, adress, bokningsvillkor,
 * studions bilder) står här; resten kommer från CRM:et: porträtt, galleri och
 * presentation. Tills bilderna finns står platshållare på deras platser.
 *
 * CRM:ets fält går först där det finns ett: Instagram, intro ("Om Hampus"),
 * rubrikraden i heron (headline), formulärets rubrik och ingress, omslagsbilden
 * och dess fokus. 2026-10-03 fylldes de i med sidans egna texter, så att de går
 * att ändra i CRM:et. Texterna här är reserven när ett fält töms.
 *
 * Namnet står i heron, i rubriken "Om Hampus" och i remsan, inte i varje
 * text. Användaren 2026-09-18: det ska inte stå "Hampus" överallt. De andra
 * texterna säger "han" eller talar direkt till kunden.
 */

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600&family=Krona+One&display=swap";

// Tatueraren: namn och kontakt.
const ARTIST = {
  firstName: "Hampus",
  lastName: "Wardhoff",
  name: "Hampus Wardhoff",
  email: "wardhofftattoo@gmail.com",
  instagram: "https://www.instagram.com/wardhoffink/"
};

// Studion: namn, adress och lokalernas bilder (src/assets/ghost-ink).
// Utan heroImage står röken i heron, utan photos försvinner sektionen Studion.
const ROOM_TALL = `${heroTall640} 640w, ${heroTall960} 960w, ${heroTall1280} 1280w`;
const STUDIO = {
  name: "Ghost Ink",
  street: "Hyttvägen 7A",
  city: "Finspång",
  // Arbetsrummet. Liggande band på dator, stående på mobil. CRM:ets
  // omslagsbild går först.
  heroImage: {
    wide: `${heroWide1280} 1280w, ${heroWide1920} 1920w, ${heroWide2560} 2560w`,
    tall: ROOM_TALL,
    src: heroTall960
  },
  // Sektionen Studion: två stående foton bredvid varandra.
  photos: [
    {
      srcSet: `${loungeTall480} 480w, ${loungeTall720} 720w, ${loungeTall960} 960w`,
      src: loungeTall480,
      altKey: "ghostInk.studioLoungeAlt"
    },
    { srcSet: ROOM_TALL, src: heroTall640, altKey: "ghostInk.studioRoomAlt" }
  ]
};

const WORK_SLOTS = ["01", "02", "03", "04", "05"];

// Bokningstyperna där formuläret kräver en referensbild. Konsultationen går
// att boka utan bild, eftersom den som bokar en konsultation ofta saknar en.
// ⚠️ Förslaget i docs-listan, ännu inte bekräftat av Hampus. Vill han ha bild
// även till konsultationen läggs "consultation" till här; regeltexten följer
// med av sig själv.
const IMAGE_REQUIRED_FOR = ["tattoo_session"];

// Vad kunden faktiskt betalar för en konsultation, från samma karta som
// formuläret läser (prepaymentByBookingType). ⚠️ Ingen fallback på 500 kr:
// står det inget i CRM:et säger formuläret "Du betalar inget nu", och då får
// regeln inte påstå motsatsen. Regeln visas i stället inte alls.
function getConsultationPrepayment(studio) {
  const prepayment = studio?.payment?.prepaymentByBookingType?.consultation;
  const amountSek = Number(prepayment?.amountSek) || 0;
  return amountSek > 0 && prepayment?.kind ? { kind: prepayment.kind, amountSek } : null;
}

// Den fasta bokningsknappen på mobil visas när hero-knappen är ur bild och
// formuläret ännu inte syns — annars konkurrerar den med formulärets egen
// knapp. ⚠️ Det är formuläret som räknas, inte hela bokningssektionen.
function useStickyCtaVisible(ready) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready || typeof IntersectionObserver === "undefined") return undefined;
    const heroActions = document.querySelector(".gi-hero__actions");
    const form = document.querySelector(".gi-form");
    if (!heroActions || !form) return undefined;

    const seen = { hero: true, form: false };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroActions) seen.hero = entry.isIntersecting;
        else seen.form = entry.isIntersecting;
      }
      setVisible(!seen.hero && !seen.form);
    });
    observer.observe(heroActions);
    observer.observe(form);
    return () => observer.disconnect();
  }, [ready]);

  return visible;
}

// Number(null) är 0 — ett saknat värde ska ge mitten, inte vänsterkanten.
function getHeroFocus(value) {
  if (value === null || value === undefined || value === "") return 50;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 50;
}

function getInstagramHandle(url) {
  const match = String(url || "").match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return match ? `@${match[1]}` : "";
}

// Samma mönster som ThemedStudioPage: länken scrollar själv i stället för att
// låta routern tolka hashen. Rörelsekänsliga får hoppet utan animation.
function scrollToSection(id) {
  return (event) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Rök i heron när det inte finns någon omslagsbild — Ghost Inks motsvarighet
// till monogrammet i Royalkaves hero. Filtret räknas ut en gång; rörelsen
// ligger som transform på hela SVG:n (.gi-smoke), så att filtret inte räknas
// om för varje bildruta.
function GhostSmoke() {
  const id = `gi-smoke-${useId().replace(/[^\w-]/g, "")}`;

  return (
    <svg
      className="gi-smoke"
      viewBox="0 0 600 760"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id={`${id}-warp`}
          x="-40%"
          y="-20%"
          width="180%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0032 0.0065"
            numOctaves="2"
            seed="4"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="230"
            xChannelSelector="R"
            yChannelSelector="G"
            result="warped"
          />
          <feGaussianBlur in="warped" stdDeviation="11" />
        </filter>
        <radialGradient id={`${id}-glow`} cx="50%" cy="100%" r="70%">
          <stop offset="0" stopColor="#C8B8A3" stopOpacity="0.22" />
          <stop offset="1" stopColor="#C8B8A3" stopOpacity="0" />
        </radialGradient>
        {/* Röken löses upp mot toppen. */}
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#111111" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#111111" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="600" height="760" fill={`url(#${id}-glow)`} />
      <g filter={`url(#${id}-warp)`} fill="none" strokeLinecap="round">
        <path
          d="M300 860 C 250 700 360 600 300 470 S 220 260 310 80"
          stroke="#C8B8A3"
          strokeOpacity="0.2"
          strokeWidth="120"
        />
        <path
          d="M230 860 C 180 740 250 660 210 560 S 130 420 190 300"
          stroke="#C8B8A3"
          strokeOpacity="0.16"
          strokeWidth="40"
        />
        <path
          d="M270 860 C 220 690 330 610 280 480 S 190 300 250 120"
          stroke="#F2EEE7"
          strokeOpacity="0.18"
          strokeWidth="28"
        />
        <path
          d="M340 860 C 400 700 290 620 350 500 S 450 320 380 160"
          stroke="#F7F5F1"
          strokeOpacity="0.14"
          strokeWidth="16"
        />
        <path
          d="M380 860 C 430 760 360 690 400 600"
          stroke="#F2EEE7"
          strokeOpacity="0.1"
          strokeWidth="60"
        />
      </g>
      <rect width="600" height="760" fill={`url(#${id}-fade)`} />
    </svg>
  );
}

export function GhostInkPage({ slug }) {
  const { t } = useLanguage();
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    getPublicStudioBySlug(slug)
      .then((data) => {
        if (active) setStudio(data);
      })
      .catch((error) => {
        if (!active) return;
        setStudio(null);
        setLoadError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // Lokalt (vite dev) visas sidan ändå när CRM:et inte lämnar ut studion, så att
  // den går att bygga vidare på medan kontot är dolt. import.meta.env.DEV är
  // false i produktionsbygget, så grenen finns inte där.
  const isDevPreview = import.meta.env.DEV && !studio && Boolean(loadError);
  // Lokalt lämnar CRM-backenden ut kortet trots att kontot är dolt när slugen
  // står i PUBLIC_PREVIEW_HIDDEN_STUDIOS i dess .env. Då syns CRM:ets riktiga
  // data (galleri, texter, omslagsbild) med en markering om att kontot är dolt.
  const isHiddenPreview = import.meta.env.DEV && studio?.publicProfile?.enabled === false;

  const profile = studio?.publicProfile || {};
  const studioName = String(studio?.name || "").trim() || STUDIO.name;
  const city = String(studio?.city || "").trim() || STUDIO.city;
  const heroImageUrl = String(studio?.heroImageUrl || "").trim();
  const intro = String(profile.intro || studio?.description || "").trim();
  // CRM:ets fält går först, så att han kan byta konto själv. Ett tomt fält ger
  // hans eget konto, inte ingen länk alls.
  const instagramUrl = String(profile.instagramUrl || "").trim() || ARTIST.instagram;
  const instagramLabel = getInstagramHandle(instagramUrl) || t("ghostInk.instagram");
  const galleryImages = useMemo(
    () => (Array.isArray(profile.galleryImageUrls) ? profile.galleryImageUrls.filter(Boolean) : []),
    [profile.galleryImageUrls]
  );
  const portraitUrl = useMemo(
    () => buildShowcaseArtists(studio?.artistOptions).find((artist) => artist.photoUrl)?.photoUrl || "",
    [studio]
  );
  const consultationPrepayment = getConsultationPrepayment(studio);
  const names = { artist: ARTIST.name, studio: studioName, street: STUDIO.street, city };
  // Raden under namnet och bokningens rubrik och ingress går att ändra i CRM:et
  // (fliken Publik sida), precis som på Royalkaves sida. Tomt fält ger sidans egen
  // text på besökarens språk; ett ifyllt fält visas på båda språken.
  const heroLine = String(profile.headline || "").trim() || t("ghostInk.heroPlace", names);
  const bookingTitle = String(profile.formTitle || "").trim() || t("ghostInk.bookingTitle");
  const bookingLead = String(profile.formIntro || "").trim() || t("ghostInk.bookingLead");
  // Fokusreglagen i CRM:et styr vilken del av omslagsbilden som syns.
  const heroObjectPosition = `${getHeroFocus(profile.heroFocusX)}% ${getHeroFocus(profile.heroFocusY)}%`;
  const showStickyCta = useStickyCtaVisible(!loading && Boolean(studio || isDevPreview));
  const address = `${STUDIO.street}, ${city}`;
  // Bara adressen, inte studionamnet: Google matchar "Ghost Ink" mot Three
  // Monkey Tattoo, en annan studio som är nedlagd (användaren 2026-10-03).
  // Byt till länken till hans Google-profil när den finns.
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${address}, Sverige`
  )}`;

  // Förhandsvisningen saknar studio; utan slug kan formuläret inte skicka något.
  // Samma objekt mellan renderingarna — formulärets effekter hänger på studion.
  const formStudio = useMemo(
    () => studio || { name: STUDIO.name, slug: "", publicProfile: {} },
    [studio]
  );

  // Flikens titel och beskrivning säger inget om Ghost Ink eller Hampus förrän
  // CRM:et lämnat ut studion.
  usePageMetadata({
    title: buildPageTitle(
      studio
        ? t("ghostInk.metaTitle", names)
        : t(loadError ? "studio.metaErrorTitle" : "studio.metaFallbackTitle")
    ),
    description: studio ? t("ghostInk.metaDescription", names) : t("studio.metaDescriptionFallback"),
    image: portraitUrl || heroImageUrl || studio?.logoUrl || "/ink-revenue-logo.svg",
    path: `/studio/${slug}`,
    noIndex: !studio
  });

  // Laddning och fel: exakt samma markup som StudioProfilePage, inuti samma ram.
  if (loading || (!studio && !isDevPreview)) {
    return (
      <section className="section section--white">
        <div className="container">
          {loading ? (
            <div className="loading-state">{t("studio.loading")}</div>
          ) : (
            <div className="empty-panel">
              <h2>{t("studio.errorTitle")}</h2>
              <p>{loadError?.message || t("studio.errorText")}</p>
              <SiteLink className="btn btn-primary" href="/studios">
                {t("studio.backToDirectory")}
              </SiteLink>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Rubriken "Om Hampus" tar förnamnet, inte hela namnet.
  const firstNameVars = { ...names, artist: ARTIST.firstName };

  // Utan bildkrav för konsultationen får regeln en utväg för den som saknar
  // bild. Annars ger kunden upp redan vid regellistan.
  const imageRuleText = IMAGE_REQUIRED_FOR.includes("consultation")
    ? t("ghostInk.ruleImageText")
    : `${t("ghostInk.ruleImageText")} ${t("ghostInk.ruleImageNoImage")}`;
  const rules = [
    { title: t("ghostInk.ruleAgeTitle"), text: t("ghostInk.ruleAgeText") },
    { title: t("ghostInk.ruleImageTitle"), text: imageRuleText }
  ];

  if (consultationPrepayment) {
    const isDeposit = consultationPrepayment.kind === "deposit";
    rules.push({
      title: t(isDeposit ? "ghostInk.ruleDepositTitle" : "ghostInk.ruleFeeTitle", {
        amount: consultationPrepayment.amountSek
      }),
      text: t(isDeposit ? "ghostInk.ruleDepositText" : "ghostInk.ruleFeeText")
    });
  }

  // "Om Hampus" är CRM:ets presentation, med beskrivningen som reserv precis
  // som på de andra studiosidorna. Radbrytningar i CRM-fältet blir stycken.
  // Utan text står en kort reservtext. Var han tatuerar står redan i heron.
  const aboutParagraphs = intro
    ? intro
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [t("ghostInk.aboutFallback")];

  // Bara frågor vars svar gäller oavsett vad Hampus bestämmer. Eftervård,
  // avbokning och pris i kronor läggs till när han har svarat, se docs-listan.
  // Svaren bygger på det som faktiskt händer: formulärets fält, och ett
  // bekräftelsemejl som bara går ut när kunden har angett e-post.
  const faqItems = [
    { id: "price", q: t("ghostInk.faqPriceQ"), a: t("ghostInk.faqPriceA") },
    { id: "unsure", q: t("ghostInk.faqUnsureQ"), a: t("ghostInk.faqUnsureA") },
    { id: "write", q: t("ghostInk.faqWriteQ"), a: t("ghostInk.faqWriteA") },
    { id: "after", q: t("ghostInk.faqAfterQ"), a: t("ghostInk.faqAfterA") },
    { id: "prepare", q: t("ghostInk.faqPrepareQ"), a: t("ghostInk.faqPrepareA") },
    { id: "where", q: t("ghostInk.faqWhereQ"), a: t("ghostInk.faqWhereA", names) }
  ];

  return (
    <div className="gi">
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      {isDevPreview || isHiddenPreview ? (
        <p
          role="status"
          style={{
            margin: 0,
            padding: "10px 16px",
            background: "#a23b1e",
            color: "#f7f5f1",
            fontSize: "0.85rem",
            textAlign: "center"
          }}
        >
          {isHiddenPreview
            ? "Lokal förhandsvisning med CRM:ets data. Kontot är dolt i CRM:et, så i produktion visas felsidan och formuläret tar inte emot förfrågningar."
            : `Lokal förhandsvisning. CRM:et svarar: "${loadError.message}" I produktion visas felsidan i stället.`}
        </p>
      ) : null}

      {/* ── HERO ── Som Royalkaves, men lugnare: lägre, och namnet i vanlig
          rubrikstorlek. Bakom texten: CRM:ets omslagsbild, annars studions
          eget foto, annars röken. */}
      <section
        className={`gi-hero${heroImageUrl || STUDIO.heroImage ? " gi-hero--photo" : ""}`}
        aria-labelledby="gi-title"
      >
        {heroImageUrl ? (
          <StudioImage
            className="gi-hero__bg"
            src={heroImageUrl}
            widths={[1024, 2048]}
            sizes="100vw"
            alt=""
            style={{ objectPosition: heroObjectPosition }}
            fetchpriority="high"
          />
        ) : STUDIO.heroImage ? (
          // Stående beskärning på mobil, där heron är högre än bred.
          <picture className="gi-hero__picture">
            <source media="(min-width: 700px)" srcSet={STUDIO.heroImage.wide} sizes="100vw" />
            <img
              className="gi-hero__bg"
              src={STUDIO.heroImage.src}
              srcSet={STUDIO.heroImage.tall}
              sizes="100vw"
              alt=""
              fetchpriority="high"
            />
          </picture>
        ) : (
          <GhostSmoke />
        )}
        <div className="gi-hero__inner">
          <h1 id="gi-title" className="gi-hero__name">
            {ARTIST.name}
          </h1>
          <p className="gi-hero__place">{heroLine}</p>
          <div className="gi-hero__actions">
            <a className="gi-button gi-button--light" href="#gi-booking" onClick={scrollToSection("gi-booking")}>
              {t("ghostInk.ctaBook")}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
            </a>
            {instagramUrl ? (
              <a className="gi-hero__social" href={instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                {instagramLabel}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── OM HAMPUS ── Två kolumner som Royalkaves "Om studion": porträttet
          till vänster, texten till höger. */}
      <section className="gi-about" aria-labelledby="gi-about-title">
        <div className="gi-about__media">
          {portraitUrl ? (
            <StudioImage
              src={portraitUrl}
              widths={[480, 1024]}
              sizes="(max-width: 900px) 100vw, 50vw"
              alt={ARTIST.name}
            />
          ) : (
            <div className="gi-frame gi-frame--sand" aria-hidden="true">
              <span className="gi-frame__label">{t("ghostInk.slotPortrait")}</span>
            </div>
          )}
        </div>
        <div className="gi-about__body" data-reveal>
          <h2 id="gi-about-title" className="gi-heading">
            {t("ghostInk.aboutTitle", firstNameVars)}
          </h2>
          {aboutParagraphs.map((paragraph, position) => (
            <p key={position} className="gi-about__text">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* ── VERK ── */}
      <section className="gi-work" aria-labelledby="gi-work-title">
        <div className="gi-container">
          <h2 id="gi-work-title" className="gi-heading" data-reveal>
            {t("ghostInk.workTitle")}
          </h2>
        </div>
        {galleryImages.length ? (
          // Riktiga bilder: plattformens galleri med ALLA bilder och närbild.
          // Bandet ligger utanför .gi-container och går kant i kant, med
          // större kort (size="large", användaren 2026-10-04).
          <div className="gi-gallery">
            <RollingGallery images={galleryImages} studioName={ARTIST.name} size="large" />
          </div>
        ) : null}
        <div className="gi-container">
          {galleryImages.length ? null : (
            <>
              <p className="visually-hidden">{t("ghostInk.slotWorkHidden")}</p>
              <div className="gi-work__mosaic">
                {WORK_SLOTS.map((index, position) => (
                  <div
                    key={index}
                    className={`gi-frame gi-work__slot gi-work__slot--${position + 1}`}
                    aria-hidden="true"
                    data-reveal
                    data-reveal-delay={String(position + 1)}
                  >
                    <span className="gi-frame__index">{index}</span>
                    <span className="gi-frame__label">{t("ghostInk.slotWork")}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Instagram är beviset tills det finns omdömen att visa. */}
          {instagramUrl ? (
            <p className="gi-work__more" data-reveal>
              <a className="gi-textlink" href={instagramUrl} target="_blank" rel="noopener noreferrer">
                {t("ghostInk.workMore")}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      {/* ── STUDION ── Samma två kolumner som Om Hampus, spegelvända, med två
          stående foton i bildkolumnen. Hör till STUDIO: utan foton ritas
          sektionen inte. */}
      {STUDIO.photos?.length ? (
        <section className="gi-about gi-about--flip" aria-labelledby="gi-studio-title">
          <div className="gi-about__media gi-about__media--pair">
            {STUDIO.photos.map((photo) => (
              <div key={photo.src} className="gi-about__photo">
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes="(min-width: 900px) 25vw, 50vw"
                  alt={t(photo.altKey, names)}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
          <div className="gi-about__body" data-reveal>
            <h2 id="gi-studio-title" className="gi-heading">
              {t("ghostInk.studioTitle")}
            </h2>
            <p className="gi-about__text">{t("ghostInk.studioText", names)}</p>
            <p className="gi-about__link">
              <a className="gi-textlink" href={mapUrl} target="_blank" rel="noopener noreferrer">
                {t("ghostInk.studioMap")}
              </a>
            </p>
          </div>
        </section>
      ) : null}

      {/* ── INNAN DU BOKAR ── Mörk och numrerad, som Royalkaves "Hur det går
          till", men med Hampus regler. */}
      <section className="gi-steps" aria-labelledby="gi-steps-title">
        <div className="gi-container">
          <h2 id="gi-steps-title" className="gi-heading gi-heading--light" data-reveal>
            {t("ghostInk.rulesLabel")}
          </h2>
          <ol className="gi-steps__list">
            {rules.map((rule, position) => (
              <li key={rule.title} className="gi-step" data-reveal data-reveal-delay={String(position + 1)}>
                <span className="gi-step__index" aria-hidden="true">
                  {String(position + 1).padStart(2, "0")}
                </span>
                <h3 className="gi-step__title">{rule.title}</h3>
                <p className="gi-step__text">{rule.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── BOKNING ── Mörkt huvud ovanpå formuläret, som hos Royalkave.
          Biolänk-besökare scrollas till ankaret, se useBookingFormAutoScroll. */}
      <section id="gi-booking" className="gi-booking" aria-labelledby="gi-booking-title">
        <div className="gi-booking__inner">
          <div className="gi-booking__head" data-booking-anchor>
            <h2 id="gi-booking-title" className="gi-heading gi-heading--light">
              {bookingTitle}
            </h2>
            {/* Vad som händer efter förfrågan. Samma löfte som formulärets
                tackmeddelande och bekräftelsemejlet: svar inom 24 timmar.
                ⚠️ Texten ligger nu även i CRM:ets "Intro ovanför formuläret" —
                ändras löftet, ändra där också. */}
            <p className="gi-booking__lead">{bookingLead}</p>
          </div>
          <div className="gi-form">
            {/* Stil, placering och storlek är listor ur studions bokningsregler i
                CRM:et, precis som på de andra studiosidorna. */}
            <StudioLeadFormEnhanced
              studio={formStudio}
              titleText=""
              introText=""
              requireInspirationImage={IMAGE_REQUIRED_FOR}
            />
          </div>
        </div>
      </section>

      {/* ── VANLIGA FRÅGOR ── */}
      <section className="gi-faq" aria-labelledby="gi-faq-title">
        <div className="gi-faq__inner">
          <h2 id="gi-faq-title" className="gi-heading" data-reveal>
            {t("ghostInk.faqTitle")}
          </h2>
          {/* Utfällbara, som InkRevenues egna frågor på startsidan. <details>
              fungerar utan JS och läses rätt av skärmläsare. */}
          <ul className="gi-faq__list">
            {faqItems.map((item) => (
              <li key={item.id} className="gi-faq__item" data-reveal>
                <details className="gi-faq__details">
                  <summary className="gi-faq__q">
                    <span>{item.q}</span>
                    <span className="gi-faq__icon" aria-hidden="true" />
                  </summary>
                  <p className="gi-faq__a">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── REMSA ── Som Royalkaves sista rad, med kontaktuppgifterna. E-posten
          står här i liten stil: den ger förfrågningar utan bild, deposition
          och CRM, så formuläret går först. */}
      <div className="gi-strip">
        <div className="gi-container gi-strip__inner">
          <div>
            <p className="gi-strip__name">{ARTIST.name}</p>
            <a className="gi-strip__place" href={mapUrl} target="_blank" rel="noopener noreferrer">
              {studioName} · {address}
            </a>
          </div>
          <ul className="gi-strip__links" aria-label={t("ghostInk.stripLabel")}>
            {instagramUrl ? (
              <li>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  {instagramLabel}
                </a>
              </li>
            ) : null}
            <li>
              <a href={`mailto:${ARTIST.email}`}>{ARTIST.email}</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Fast bokningsknapp på mobil. Döljs över 900 px och när formuläret syns. */}
      <div className={`gi-sticky${showStickyCta ? " gi-sticky--visible" : ""}`} aria-hidden={!showStickyCta}>
        <a
          className="gi-button gi-sticky__cta"
          href="#gi-booking"
          onClick={scrollToSection("gi-booking")}
          tabIndex={showStickyCta ? undefined : -1}
        >
          {t("ghostInk.ctaBook")}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </a>
      </div>
    </div>
  );
}
