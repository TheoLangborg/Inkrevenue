/**
 * Svenska texter — referensspråket.
 *
 * en.js speglar den här strukturen. Saknas en nyckel i en.js faller t() tillbaka
 * hit, så sajten går aldrig sönder av en glömd översättning.
 *
 * OBS: värden som skickas till CRM:et (stil- och storleksvärden i
 * bokningsformuläret) översätts aldrig — backendens tidsberäkning matchar
 * svenska nyckelord i texten. Bara etiketterna kunden ser byter språk.
 */
export const sv = {
  common: {
    logoAlt: "Ink Revenue logotyp",
    loading: "Laddar...",
    close: "Stäng",
    back: "Tillbaka",
    next: "Nästa steg",
    seeAllStudios: "Se alla studios",
    exploreStudios: "Utforska studios"
  },

  languageSwitcher: {
    label: "Språk",
    sv: "Svenska",
    en: "English",
    svShort: "SV",
    enShort: "EN"
  },

  header: {
    nav: "Huvudnavigation",
    home: "Hem",
    studios: "Studios",
    faq: "FAQ",
    cta: "Boka gratis strategisamtal",
    ctaShort: "Boka samtal",
    openMenu: "Öppna meny",
    closeMenu: "Stäng meny"
  },

  footer: {
    home: "Hem",
    studios: "Studios",
    faq: "FAQ",
    strategy: "Boka strategisamtal",
    privacy: "Integritetspolicy",
    terms: "Användarvillkor",
    discoveryLabel: "Utforska tatueringar",
    cities: "Städer",
    styles: "Stilar",
    cityLink: "Tatuering i {{city}}",
    styleLink: "{{style}}-tatuering",
    contactHeading: "Kontakta oss:",
    phone: "Telefon:",
    email: "Mejl:",
    copyright: "Copyright 2026. Ink Revenue. All rights reserved.",
    credit: "Webbdesign av"
  },

  home: {
    metaTitle: "Fler kunder till din tatueringsstudio",
    metaDescription:
      "Ink Revenue tar hand om hela er marknadsföring — annonser, innehåll och kundförfrågningar från start till slut. Ni fokuserar på konsten. Vi fyller kalendern.",
    heroTitleLine1: "Fler bokningar. Mindre admin.",
    heroTitleLine2: "Vi sköter marknadsföringen åt er.",
    heroLeadBefore: "Ink Revenue tar hand om ",
    heroLeadBold: "hela er marknadsföring",
    heroLeadAfter:
      " — annonser, innehåll och kundförfrågningar från start till slut. Ni fokuserar på konsten. Vi fyller kalendern.",
    ctaStrategy: "Boka gratis strategisamtal",
    ctaTrial: "Testa gratis i 30 dagar",
    ctaNote:
      "Ingen bindning, inga dolda avgifter — testa själv utan betalkort eller låt oss sköta allt",
    audienceStudioEyebrow: "För studioägare",
    audienceStudioTitle: "Sluta jaga kunder. Låt dem hitta er.",
    audienceStudioText:
      "Vi sätter upp er studio-sida, kör annonser och hanterar förfrågningar — så ni kan hålla fokus på tatueringarna.",
    audienceStudioCta: "Se hur vi hjälper studios",
    audienceCustomerEyebrow: "För tatueringskunder",
    audienceCustomerTitle: "Hitta rätt studio för just din stil.",
    audienceCustomerText:
      "Bläddra studios efter stil, stad och känsla — se galleri och skicka förfrågan direkt. Enklare än hashtag-jakt.",

    howEyebrow: "För Studioägare",
    howTitle: "Så här fungerar Ink Revenue",
    howLead: "Tre enkla steg från att ni kontaktar oss till att förfrågningarna börjar komma in.",
    howStep1Title: "Boka ett strategisamtal",
    howStep1Text:
      "Vi lär känna er studio, era mål och vilken typ av kunder ni vill nå. Samtalet är gratis och utan förpliktelser.",
    howStep2Title: "Vi sätter upp allt åt er",
    howStep2Text:
      "Vi bygger er studio-sida, optimerar er profil och startar rätt marknadsföringskanaler. Ni godkänner — vi kör.",
    howStep3Title: "Förfrågningarna börjar komma in",
    howStep3Text:
      "Ni loggar in och ser förfrågningar, bokningar och statistik samlat på ett ställe. Vi sköter uppföljningen — ni tatuerar.",

    studiosEyebrow: "För Studioägare",
    studiosTitle: "Ni sköter tatueringarna. Vi sköter resten.",
    studiosLead:
      "De flesta studios tappar kunder för att de syns dåligt eller svarar för långsamt. Vi löser det åt er — ni behöver inte lära er ett enda marknadsföringsverktyg.",
    studiosBody:
      "Ni får en studio-sida som säljer, annonser som leder till bokade kunder och en person som faktiskt följer upp varje förfrågan.",
    studiosBadge1: "✓ Ni sköter inga annonser",
    studiosBadge2: "✓ Ni skriver inga texter",
    studiosBadge3: "✓ Vi hanterar inkorgen",
    studiosCard1Title: "Syns där kunderna letar",
    studiosCard1Text:
      "Vi ser till att ni syns på Google, i sociala medier och i vår studio-katalog — där kunderna redan letar.",
    studiosCard2Title: "En studio-sida som säljer er",
    studiosCard2Text:
      "Er sida lyfter stil, galleri och känsla — så att rätt kunder känner igen sig direkt och väljer just er.",
    studiosCard3Title: "Bättre förfrågningar från start",
    studiosCard3Text:
      "Kunder beskriver idé, placering och budget i förväg — ni slipper fram-och-tillbaka och kan svara med ett prisförslag direkt.",

    customersEyebrow: "För Tatueringskunder",
    customersTitle: "Hitta studios efter din stil — inte efter hashtags",
    customersLead:
      "Filtrera på stil, stad och känsla. Se galleri och läs om studion — skicka sedan en förfrågan direkt utan att behöva jaga DMs.",
    customersLoading: "Laddar studios...",
    customersEmptyTitle: "Fler studios kommer snart",
    customersEmptyText:
      "Vi fyller på katalogen löpande. Kom tillbaka snart för att upptäcka fler studios och tatuerare.",

    whyTitle: "Varför Ink Revenue Fungerar",
    whyCard1Title: "100% hanterad service",
    whyCard1Text:
      "Ni betalar för resultat, inte för att lära er verktyg. Vi är er marknadsföringsavdelning — ni behöver inte lyfta ett finger.",
    whyCard2Title: "Bättre matchning från start",
    whyCard2Text:
      "Kunder ser stil, plats och galleri tydligt — de hör av sig för att de redan har valt er, inte för att chansa.",
    whyCard3Title: "Ingen investering utan resultat",
    whyCard3Text:
      "Vi arbetar löpande och ni ser statistik i realtid. Inga dolda kostnader, ingen bindningstid — avsluta när ni vill.",
    trust1: "Ingen bindningstid",
    trust2: "Gratis strategisamtal",
    trust3: "Ni äger alltid er data",
    trust4: "Uppstart inom 1 vecka",

    plansEyebrow: "Upplägg & Priser",
    plansTitle: "Välj det som passar er",
    plansLead:
      "Vi har fyra upplägg — ni betalar bara för det ni faktiskt behöver. Exakta priser går vi igenom under strategisamtalet.",
    plan1Title: "Hemsidebygge",
    plan1Model: "Engångskostnad",
    plan1Text:
      "Vi bygger er en egen hemsida från grunden — professionell, mobilanpassad och redo att ta emot kunder.",
    plan2Title: "Marknadsföringsplan",
    plan2Model: "% per inkommen kund",
    plan2Text:
      "Vi kör er marknadsföring på sociala medier och annonser. Ni betalar en andel per kund vi genererar — ingen fast månadsavgift.",
    plan3Title: "Bokningsplan",
    plan3Model: "Månadsabonnemang",
    plan3Text:
      "Fast månadsavgift utan bindningstid. Ni får er studio-sida i katalogen, bokningsformulär och egen inloggning med full översikt. Testa 30 dagar först — inget betalkort.",
    plan3Link: "Testa gratis i 30 dagar",
    plan4Title: "Kombipaket",
    plan4Model: "% per inkommen kund",
    plan4Text:
      "Allt i ett — marknadsföring, studio-sida och bokningshantering. Ni betalar per kund vi levererar.",
    plansCta: "Boka gratis strategisamtal — vi går igenom priserna",

    faqEyebrow: "Vanliga frågor",
    faqTitle: "Svar på det ni undrar",

    bookingEyebrow: "För Studioägare",
    bookingTitle: "Redo att få fler bokningar?",
    bookingLead:
      "Boka ett gratis strategisamtal — 20 minuter. Vi går igenom era mål, vilka kunder ni vill nå och vilket upplägg som passar er bäst.",
    bookingBody: "Samtalet är utan förpliktelser. Ni bestämmer om ni vill gå vidare.",
    bookingBadge1: "✓ Gratis samtal",
    bookingBadge2: "✓ 20 minuter",
    bookingBadge3: "✓ Svar inom 24h",

    faqItems: [
      {
        q: "Behöver vi sköta något själva?",
        a: "Nej. Ni godkänner material och svarar på våra frågor — det är allt. Vi sköter annonser, innehåll, kundkontakt och uppföljning. Ju mer ni berättar om er stil, desto bättre blir resultatet."
      },
      {
        q: "Hur snabbt ser vi resultat?",
        a: "De flesta studios ser de första förfrågningarna inom 1–2 veckor efter uppstart. Volym och kvalitet ökar löpande de första 60–90 dagarna allteftersom vi optimerar era kanaler."
      },
      {
        q: "Vad är skillnaden mot att sköta Instagram eller Google själv?",
        a: "Att göra det själv tar tid och ger ofta ojämna resultat. Vi är specialiserade på tatueringsbranschen och vet vad som fungerar — ni får en hel marknadsföringsavdelning till en bråkdel av kostnaden."
      },
      {
        q: "Hur ser vår studio-sida ut?",
        a: "Varje studio får en skräddarsydd sida med er logotyp, galleri, stil-taggar, om-oss-text och ett anpassat förfrågningsformulär. Kunder kan filtrera på stil, stad och känsla — och skicka en förfrågan med sin idé och budget direkt."
      },
      {
        q: "Vad händer om vi vill avsluta?",
        a: "Ni kan avsluta månad för månad utan förklaring. Ni äger alltid er data, era bilder och era sociala medier-kanaler. Vi hjälper till med överlämning om ni önskar."
      },
      {
        q: "Fungerar det för soloartister också?",
        a: "Absolut. Ink Revenue passar lika bra för soloartister som för studios med flera konstnärer. Vi anpassar upplägg och budget efter er situation."
      },
      {
        q: "Hur snabbt kan vi komma igång?",
        a: "Uppstart sker normalt inom 1 vecka efter att ni godkänt upplägget. Vi sätter upp er studio-sida, startar rätt kanaler och ni kan börja ta emot förfrågningar nästan direkt."
      }
    ]
  },

  faqPage: {
    metaTitle: "Vanliga frågor om Ink Revenue",
    metaDescription:
      "Svar på vanliga frågor om Ink Revenue — hur tjänsten fungerar, vad det kostar, hur snabbt ni ser resultat och vad som händer om ni vill avsluta.",
    eyebrow: "Vanliga frågor",
    title: "Svar på det ni undrar",
    lead: "Allt ni behöver veta om hur Ink Revenue fungerar — innan ni bokar ett samtal.",
    ctaText: "Hittade du inte svar på din fråga?",
    ctaButton: "Boka ett gratis strategisamtal",
    pricingIntro: "Priset beror på vilken plan ni väljer. Vi erbjuder fyra upplägg:",
    pricingItems: [
      { term: "Hemsidebygge", text: " — engångskostnad" },
      {
        term: "Marknadsföringsplan",
        text: " — procentandel per inkommen kund, inget fast månadspris"
      },
      { term: "Bokningsplan", text: " — fast månadsabonnemang utan bindningstid" },
      {
        term: "Kombipaket",
        text: " — allt i ett (utom hemsidebygge), procentandel per inkommen kund"
      }
    ],
    pricingOutro: "Boka ett gratis strategisamtal så går vi igenom vilket upplägg som passar er bäst.",
    items: [
      {
        q: "Behöver vi sköta något själva?",
        a: "Nej. Ni godkänner material och svarar på våra frågor — det är allt. Vi sköter annonser, innehåll, kundkontakt och uppföljning. Ju mer ni berättar om er stil, desto bättre blir resultatet."
      },
      {
        q: "Hur snabbt ser vi resultat?",
        a: "De flesta studios ser de första förfrågningarna inom 1–2 veckor efter uppstart. Volym och kvalitet ökar löpande de första 60–90 dagarna allteftersom vi optimerar era kanaler."
      },
      {
        q: "Vad är skillnaden mot att sköta Instagram eller Google själv?",
        a: "Att göra det själv tar tid och ger ofta ojämna resultat. Vi är specialiserade på tatueringsbranschen och vet vad som fungerar — ni får en hel marknadsföringsavdelning till en bråkdel av kostnaden."
      },
      {
        q: "Hur ser vår studio-sida ut?",
        a: "Varje studio får en skräddarsydd sida med er logotyp, galleri, stil-taggar, om-oss-text och ett anpassat förfrågningsformulär. Kunder kan filtrera på stil, stad och känsla — och skicka en förfrågan med sin idé och budget direkt."
      },
      {
        q: "Vad händer om vi vill avsluta?",
        a: "Ni kan avsluta månad för månad utan förklaring. Ni äger alltid er data, era bilder och era sociala medier-kanaler. Vi hjälper till med överlämning om ni önskar."
      },
      {
        q: "Fungerar det för soloartister också?",
        a: "Absolut. Ink Revenue passar lika bra för soloartister som för studios med flera konstnärer. Vi anpassar upplägg och budget efter er situation."
      },
      {
        q: "Hur snabbt kan vi komma igång?",
        a: "Uppstart sker normalt inom 1 vecka efter att ni godkänt upplägget. Vi sätter upp er studio-sida, startar rätt kanaler och ni kan börja ta emot förfrågningar nästan direkt."
      },
      {
        q: "Vad kostar det?",
        a: "Priset beror på vilken plan ni väljer: Hemsidebygge (engångskostnad), Marknadsföringsplan (procentandel per inkommen kund), Bokningsplan (månadsabonnemang) eller Kombipaket (allt utom hemsidebygge, procentandel per kund). Boka ett gratis strategisamtal så går vi igenom vilket upplägg som passar er bäst.",
        rich: "pricing"
      },
      {
        q: "Hur kommer kunderna i kontakt med oss via Ink Revenue?",
        a: "På två sätt. Dels marknadsför vi er i era egna kanaler — Instagram, TikTok och Facebook — så att ni löpande får nya följare och förfrågningar därifrån. Dels syns ni i vår studio-katalog, där kunder filtrerar på stil och stad och skickar en förfrågan direkt via er studio-sida. Alla förfrågningar samlas hos er — vi svarar och bokar in."
      },
      {
        q: "Kan vi se hur många förfrågningar vi får?",
        a: "Ja. Ni loggar in och ser alla förfrågningar, bokningar och er statistik i realtid."
      }
    ]
  },

  directory: {
    metaTitleDefault: "Hitta tatueringsstudios i Sverige",
    metaTitleFiltered: "Tatueringsstudios {{parts}}",
    metaTitleCityPart: "i {{city}}",
    metaDescriptionBoth:
      "Hitta tatueringsstudios med {{style}} i {{city}}. Filtrera, se galleri och skicka din förfrågan direkt via Ink Revenue.",
    metaDescriptionStyle:
      "Tatueringsstudios specialiserade på {{style}}. Se galleri, läs om studion och skicka din förfrågan direkt.",
    metaDescriptionCity:
      "Tatueringsstudios i {{city}}. Filtrera på stil, se galleri och skicka förfrågan direkt via Ink Revenue.",
    metaDescriptionDefault:
      "Utforska tatueringsstudios i Sverige efter stil, stad och känsla. Filtrera fram en studio som passar din idé och skicka din förfrågan direkt.",
    eyebrow: "Hitta Rätt Studio",
    titleBoth: "{{style}}-tatueringar i {{city}}",
    titleStyle: "Tatueringsstudios — {{style}}",
    titleCity: "Tatueringsstudios i {{city}}",
    titleDefault: "Utforska tatueringsstudios i Sverige",
    leadFiltered: "Filtrera vidare efter stil, stad och känsla — skicka din förfrågan direkt.",
    leadDefault: "Filtrera efter stil, stad och känsla för att hitta en studio som passar din idé.",
    searchLabel: "Sök",
    searchPlaceholder: "Studio, stad eller stil",
    cityLabel: "Stad",
    allCities: "Alla städer",
    styleLabel: "Stil",
    allStyles: "Alla stilar",
    loading: "Laddar studios...",
    resultsHeading: "{{count}} studios matchar din filtrering",
    emptyTitle: "Inga studios matchade filtren",
    emptyText: "Prova att rensa sökningen eller välj en annan stil eller stad.",
    seoBothText:
      "Hitta de bästa {{style}}-tatuerarna i {{city}}. Skicka en förfrågan direkt till studion — beskriva din idé, stil och placering för att komma igång.",
    seoStyleTitle: "{{style}}-tatueringar i Sverige",
    seoStyleText:
      "Utforska tatueringsstudios specialiserade på {{style}} i hela Sverige. Varje studio har ett eget uttryck — filtrera vidare efter stad för att hitta rätt.",
    seoCityText:
      "Bläddra bland tatueringsstudios i {{city}}. Jämför stilar, se galleri och skicka din förfrågan direkt till studion som passar dig bäst.",
    showAllCities: "Visa alla städer",
    showAllStyles: "Visa alla stilar",
    styleInCity: "{{style}} i {{city}}",
    exploreTitle: "Utforska tatueringar efter stad och stil",
    exploreText:
      "Ink Revenue samlar tatueringsstudios från hela Sverige. Välj stad eller stil för att hitta rätt studio för din idé.",
    exploreCityLink: "Tatueringsstudio i {{city}}",
    exploreStyleLink: "{{style}}-tatuering",
    jsonLdName: "Tatueringsstudios på Ink Revenue",
    loadError: "Det gick inte att hämta studiorna just nu. Försök igen om en stund."
  },

  studioCard: {
    fallbackSummary: "Utforska studions stil, bilder och kontaktvägar här.",
    country: "Sverige",
    kind: "Tatueringsstudio",
    cta: "Se studio",
    ariaLabel: "Se studio {{name}}",
    logoAlt: "{{name}} logotyp"
  },

  studio: {
    metaFallbackTitle: "Studiosida",
    metaErrorTitle: "Studiosida kunde inte visas",
    metaDescriptionFallback:
      "Utforska tatueringsstudios och skicka din förfrågan direkt till studion.",
    metaDescriptionGenerated:
      "{{name}}{{city}} — tatueringsstudio på Ink Revenue{{styles}}. Skicka din förfrågan direkt.",
    metaCityPart: " i {{city}}",
    metaStylePart: ". Specialiserade på {{styles}}",
    loading: "Laddar studiosidan...",
    errorTitle: "Studiosidan kunde inte visas",
    errorText: "Den här studion kunde inte hittas.",
    backToDirectory: "Tillbaka till studios",
    kind: "Tatueringsstudio",
    sendRequest: "Skicka förfrågan",
    backToCatalog: "Tillbaka till katalogen",
    logoAlt: "{{name}} logotyp",
    location: "Plats",
    serviceArea: "Område",
    visitWebsite: "Besök hemsida",
    seeInstagram: "Se Instagram",
    aboutEyebrow: "Om Studion",
    aboutTitle: "Om studion",
    howEyebrow: "Så Går Det Till",
    howTitle: "Så funkar en första förfrågan",
    previewEyebrow: "Preview-läge",
    previewTitle: "Snabbtest utan full studio-setup",
    previewText:
      "Du behöver inte fylla i all information i CRM för att se designen. För en riktig end-to-end-test räcker det att teststudion har en slug, är aktiv och har publik sida påslagen.",
    previewMessageWithSlug:
      'Det här är en demosida med lokal testdesign, men formuläret skickas till CRM-studion "{{slug}}".',
    previewMessageNoSlug:
      "Det här är en lokal demosida för snabbtest. För att testa riktiga leads kan du öppna /studio-preview/din-slug.",
    cardEyebrow: "Katalogkort",
    cardTitle: "Så syns ni i katalogen",
    cardArea: "Område: {{area}}",
    trustEyebrow: "Bra Att Veta",
    trustTitle: "Innan du skickar",
    trustContactLabel: "Kontakt",
    trustContactValue: "Direkt till studion",
    trustContactText: "Din förfrågan går direkt till studion du har valt.",
    trustReplyLabel: "Svar",
    trustReplyValue: "E-post eller telefon",
    trustReplyText: "Lämna det som passar dig bäst så blir det enkelt att återkoppla.",
    trustGalleryLabel: "Galleri",
    trustGalleryValue: "{{count}} bilder att kika på",
    trustGalleryText: "Kika gärna igenom tidigare arbeten innan du skickar.",
    trustDetailsLabel: "Bra underlag",
    trustDetailsValue: "Stil, placering och budget",
    trustDetailsText:
      "Lite mer detaljer gör det lättare för studion att ge ett relevant första svar.",
    stepsFlowTitle1: "Berätta om din idé",
    stepsFlowText1:
      "Fyll i stil, placering, storlek och beskrivning så att studion får ett tydligt underlag direkt.",
    stepsFlowTitle2: "Skicka in din förfrågan",
    stepsFlowText2:
      "Lägg gärna till en inspirationsbild om du vill visa stil, känsla eller referenser tydligare.",
    stepsFlowTitle3: "Nästa steg blir tydligt",
    stepsFlowText3:
      "Du får rätt nästa steg utifrån studions upplägg, oavsett om det gäller bokning, återkoppling eller manuell genomgång.",
    stepsBasicTitle1: "Berätta kort om din idé",
    stepsBasicText1: "Beskriv motiv, stil, placering och gärna referenser eller inspiration.",
    stepsBasicTitle2: "Studion återkopplar",
    stepsBasicText2:
      "Du får svar om nästa steg, prisbild, konsultation eller bokning beroende på upplägget.",
    galleryEyebrow: "Galleri",
    galleryTitle: "Utvalda bilder från studion",
    relatedEyebrow: "Fler Studios",
    relatedTitle: "Liknande studios att utforska",
    reserveActionName: "Skicka förfrågan",
    photoDescription: "{{name}} — tatueringsarbete",
    mapsQuery: "tatueringsstudio {{name}} {{city}}"
  },

  themedStudio: {
    loading: "Laddar...",
    error: "Studiosidan kunde inte laddas.",
    bookNow: "Boka nu",
    instagram: "Instagram",
    website: "Hemsida",
    aboutLine1: "Om",
    aboutLine2: "studion",
    visitWebsite: "Besök hemsida",
    howTitle: "Hur det går till",
    step1Title: "Berätta om din idé",
    step1Text:
      "Fyll i stil, placering, storlek och en kort beskrivning. Bifoga gärna en inspirationsbild.",
    step2Title: "Studion återkopplar",
    step2Text:
      "Du hör från studion om prisuppskattning, konsultation eller direkt bokning — beroende på deras upplägg.",
    step3Title: "Dags för tatueringen",
    step3Text:
      "Kom till studion vid överenskommet tillfälle och förvandla din idé till bestående konst.",
    gallery: "Galleri",
    formTitle: "Skicka din förfrågan",
    formIntro:
      "Fyll i formuläret nedan — ju mer du berättar, desto lättare är det för studion att ge dig ett relevant svar direkt.",
    studioAlt: "{{name}} studio",
    imageAlt: "{{name}} — bild {{index}}",
    fallbackTitle: "Studio",
    cityKind: "{{city}} · Tatueringsstudio"
  },

  // Ghost Inks egen studiosida, pages/studios/GhostInkPage.jsx.
  ghostInk: {
    metaTitle: "{{artist}} – tatuerare på {{studio}} i {{city}}",
    metaDescription:
      "Boka tatuering eller konsultation hos {{artist}} på {{studio}} i {{city}}. Skicka din förfrågan med en referensbild. Åldersgräns 18 år.",
    // Raden under namnet i heron. Studion är en rad, inte rubriken.
    heroPlace: "Tatuerar på {{studio}} i {{city}}",
    ctaBook: "Boka tid",
    instagram: "Instagram",
    // Står under "Om Hampus" tills hans egen text finns i CRM:et. Skärps med
    // hans egna ord om stilen. Var han tatuerar står redan i heron.
    aboutFallback: "Han har en egen stil, och din idé är utgångspunkten. Här bokar du honom direkt.",
    workTitle: "Utvalda verk",
    slotWork: "Bild kommer",
    slotWorkHidden: "Portfoliobilderna publiceras snart.",
    workMore: "Fler verk på Instagram",
    aboutTitle: "Om {{artist}}",
    bookingTitle: "Boka tid",
    // Samma löfte som formulärets tackmeddelande (leadForm.success) och faqAfterA.
    // ⚠️ Ghost Inks sida visar CRM:ets "Intro ovanför formuläret" i första hand;
    // texten ligger där också sedan 2026-10-03.
    bookingLead:
      "Berätta om din idé i formuläret. Du får normalt svar inom 24 timmar, via e-post eller telefon.",
    rulesLabel: "Innan du bokar",
    ruleAgeTitle: "Du ska ha fyllt 18",
    ruleAgeText: "Åldersgränsen gäller alla tatueringar, oavsett storlek.",
    ruleImageTitle: "Skicka med en referensbild",
    ruleImageText:
      "En bild på motiv, stil eller placering säger mer än en lång beskrivning och gör det lättare att svara på din idé direkt.",
    // Läggs till när konsultationen går att boka utan bild.
    ruleImageNoImage: "Har du ingen bild? Välj konsultation.",
    ruleDepositTitle: "Deposition {{amount}} kr vid konsultation",
    ruleDepositText:
      "Gäller konsultationer, främst inför större tatueringar. Depositionen dras av från priset vid tatueringstillfället.",
    ruleFeeTitle: "Bokningsavgift {{amount}} kr vid konsultation",
    ruleFeeText:
      "Avgiften betalas när du bokar konsultationen och håller tiden reserverad för dig.",
    // Svar som gäller oavsett Hampus villkor. Eftervård, avbokning och pris i
    // kronor läggs till när han har svarat (tattoo-crm/docs/ghost-ink-studiosida.md).
    faqTitle: "Vanliga frågor",
    faqPriceQ: "Vad kostar en tatuering?",
    faqPriceA:
      "Priset beror på storlek, placering och hur detaljerat motivet är. Skriv gärna din budget i formuläret, så vet han vad du har tänkt dig.",
    faqUnsureQ: "Jag vet inte exakt vad jag vill ha. Kan jag boka ändå?",
    faqUnsureA:
      "Ja. Välj konsultation i formuläret och beskriv din idé, så går ni igenom den tillsammans.",
    faqWriteQ: "Vad ska jag skriva i förfrågan?",
    faqWriteA:
      "Välj stil, placering och storlek i listorna och beskriv motivet med egna ord. Bifoga en bild som visar vad du tänker dig. Ju mer du berättar, desto lättare är det att svara på din idé.",
    faqAfterQ: "Vad händer när jag har skickat förfrågan?",
    // Bekräftelsemejlet går bara ut när kunden har angett e-post
    // (sendLeadAutoReply i tattoo-crm). Samma 24 timmar som bookingLead.
    // "Vi" är InkRevenue, som svarar först (användaren 2026-09-18). Namnet
    // skrivs inte ut på sidan.
    faqAfterA:
      "Har du angett e-post får du en bekräftelse direkt, med en sammanfattning av förfrågan. Sedan hör vi av oss, normalt inom 24 timmar, via e-post eller telefon.",
    faqPrepareQ: "Hur förbereder jag mig inför tatueringen?",
    faqPrepareA:
      "Ät ordentligt innan och sov gott natten före. Undvik alkohol dygnet innan. Huden där tatueringen ska sitta ska vara hel och inte solbränd.",
    faqWhereQ: "Var ligger studion?",
    faqWhereA: "{{studio}} ligger på {{street}} i {{city}}.",
    // Sektionen Studion, med foton på arbetsrummet och väntrummet.
    studioTitle: "Studion",
    studioText: "Han tatuerar på {{studio}}, {{street}} i {{city}}.",
    studioMap: "Hitta hit",
    studioRoomAlt: "Arbetsrummet på {{studio}}",
    studioLoungeAlt: "Väntrummet på {{studio}}",
    stripLabel: "Kontakt"
  },

  artists: {
    eyebrow: "Tatuerarna",
    title: "Välj vem som tatuerar dig",
    intro: "Titta igenom varje tatuerares egna verk och boka direkt hos den som passar din idé.",
    workCount: "{{count}} verk i portföljen",
    workCountOne: "1 verk i portföljen",
    noWorks: "Portföljen kommer snart",
    seePortfolio: "Se portfölj",
    seePortfolioOf: "Se hela portföljen för {{name}}",
    bookWith: "Boka hos {{name}}",
    selectedBookWith: "Vald – gå till bokningen",
    selected: "Vald",
    portfolioAria: "Portfölj – {{name}}",
    imageAlt: "Tatuering av {{name}}, bild {{index}}"
  },

  gallery: {
    openImage: "Öppna bild {{index}} av {{total}}",
    imageAlt: "{{studio}} – tatuering {{index}}",
    imageCount: "{{count}} bilder",
    seePortfolio: "Se hela portföljen",
    portfolioAria: "Portfölj – {{studio}}",
    portfolioEyebrow: "Portfölj",
    portfolioSub: "Klicka på en bild för att se den i närbild.",
    closePortfolio: "Stäng portföljen",
    close: "Stäng",
    prevImage: "Föregående bild",
    nextImage: "Nästa bild",
    lightboxAria: "Bild {{index}} av {{total}}"
  },

  trial: {
    metaTitle: "Testa gratis i 30 dagar",
    metaDescription:
      "Skapa ett konto och testa Ink Revenue gratis i 30 dagar — utan betalkort. Egen studio-sida, smartare bokningsförfrågningar och allt samlat på ett ställe. Ingen bindningstid.",
    eyebrow: "För tatueringsstudior & artister",
    title: "Testa gratis i 30 dagar",
    lead: "Er egen studio-sida, bokningsförfrågningar med idé, placering och budget redan ifyllt — och allt samlat i en egen inloggning. Skapa kontot på några minuter.",
    ctaPrimary: "Kom igång gratis",
    ctaNote: "30 dagar gratis — inget betalkort, ingen bindningstid, avsluta när ni vill",
    badge1: "✓ Inget betalkort behövs",
    badge2: "✓ Klart på några minuter",
    badge3: "✓ Ni äger alltid er data",
    includedEyebrow: "Det här ingår",
    includedTitle: "Allt ni behöver för att ta emot fler bokningar",
    includedLead:
      "Testperioden ger er tillgång till hela bokningsplanen — samma verktyg som våra betalande studios använder varje dag.",
    included1Title: "Er egen studio-sida",
    included1Text:
      "Logotyp, galleri, stil-taggar och om-text — i vår katalog där kunder söker studio efter stil och stad.",
    included2Title: "Förfrågningar med substans",
    included2Text:
      "Kunder beskriver idé, placering och budget direkt i formuläret — ni slipper fram-och-tillbaka i DM och kan svara med ett prisförslag direkt.",
    included3Title: "Allt samlat på ett ställe",
    included3Text:
      "Förfrågningar, bokningar och statistik i er egen inloggning. Inga kalkylark, inga missade meddelanden.",
    startEyebrow: "Så kommer ni igång",
    startTitle: "Från konto till förfrågningar i tre steg",
    start1Title: "Skapa ert konto",
    start1Text:
      "Registrera studion på ett par minuter. Inget betalkort, inga säljsamtal — ni testar i er egen takt.",
    start2Title: "Sätt upp er sida",
    start2Text: "Ladda upp logotyp och galleri, välj era stilar och aktivera bokningsformuläret.",
    start3Title: "Ta emot förfrågningar",
    start3Text: "Dela er sida i bion och låt kunderna höra av sig — allt landar i er inkorg.",
    readyTitle: "Redo att testa?",
    readyText:
      "30 dagar räcker gott och väl för att sätta upp er sida och känna på flödet. Ni lägger aldrig in något betalkort, och perioden övergår inte automatiskt i ett abonnemang — vill ni fortsätta väljer ni upplägg själva. Gillar ni det inte kostar det er ingenting.",
    readyCta: "Testa gratis i 30 dagar",
    trust1: "30 dagar gratis",
    trust2: "Inget betalkort",
    trust3: "Ingen bindningstid",
    trust4: "Ni äger alltid er data",
    trust5: "Igång på några minuter",
    altEyebrow: "Vill ni hellre slippa allt själva?",
    altTitle: "Vi kan sköta hela marknadsföringen åt er",
    altText:
      "Annonser, innehåll och uppföljning av varje förfrågan — helt hanterat av oss. Boka ett gratis strategisamtal så går vi igenom vad som passar er studio bäst.",
    altCta: "Boka gratis strategisamtal"
  },

  notFound: {
    metaTitle: "Sidan kunde inte hittas",
    metaDescription:
      "Sidan du letar efter finns inte längre. Gå tillbaka till startsidan eller öppna studiokatalogen.",
    title: "Sidan kunde inte hittas",
    text: "Länken verkar vara fel eller så finns sidan inte längre. Du kan alltid gå tillbaka till startsidan eller öppna studiokatalogen.",
    home: "Till startsidan",
    studios: "Se studios"
  },

  // Ramen runt CRM-förhandsvisningen. Texten INUTI skärmarna översätts aldrig —
  // CRM:t finns bara på svenska, se kommentaren i components/CrmPreview.jsx.
  productPreview: {
    eyebrow: "Produkten",
    title: "Så ser det ut när ni loggar in",
    lead:
      "Förfrågningar, bokningar, väntelista och sociala medier på ett ställe. Klicka mellan vyerna nedan — det är samma skärmar som studios jobbar i varje dag.",
    tabsLabel: "Välj vy i CRM:t",
    note: "Vyerna visas med exempeldata. Er studio ser bara sin egen."
  },

  crmPreview: {
    waiting: "Väntar på live preview från CRM...",
    savedMessage:
      "Sparad publik sida för {{name}}. När previewn är inbäddad i CRM uppdateras den live medan du skriver.",
    fallbackStudio: "studion"
  },

  legal: {
    updated: "Senast uppdaterad: {{date}}",
    questions: "Frågor om hur vi hanterar dina uppgifter?",
    readAlso: "Läs även: {{name}}",
    openAsPage: "Öppna som egen sida",
    closeDocument: "Stäng dokumentet",
    // Visas bara på engelska: de engelska dokumenten är översättningar och den
    // svenska versionen är den juridiskt bindande.
    translationNotice: "",
    privacyLabel: "Integritetspolicy",
    termsLabel: "Användarvillkor"
  },

  consent: {
    eyebrow: "Samtycke",
    title: "Godkänner du våra villkor?",
    lead: "För att använda formulären behöver du godkänna vår integritetspolicy och våra användarvillkor.",
    privacy: "Integritetspolicy",
    terms: "Användarvillkor",
    decline: "Icke godkänn",
    accept: "Godkänn",
    notePrefix: "Genom att fortsätta godkänner du vår",
    notePrivacy: "integritetspolicy",
    noteMiddle: "och våra",
    noteTerms: "användarvillkor"
  },

  strategyForm: {
    note: "Berätta kort om nuläge och vad ni vill ha hjälp med, så kan vi göra första samtalet mer relevant.",
    name: "Namn",
    namePlaceholder: "Ditt namn",
    studio: "Studio",
    studioPlaceholder: "Studions namn",
    email: "E-post",
    emailPlaceholder: "namn@dinstudio.se",
    phone: "Telefonnummer",
    phonePlaceholder: "070-000 00 00",
    message: "Meddelande",
    messagePlaceholder: "Berätta kort om era mål och vilken typ av hjälp ni söker",
    honeypot: "Lämna detta fält tomt",
    submit: "Boka strategisamtalet",
    submitting: "Skickar...",
    errorName: "Fyll i ditt namn.",
    errorStudio: "Fyll i studions namn.",
    errorEmail: "Ange en giltig e-postadress.",
    errorConsent: "Godkänn integritetspolicy och villkor för att fortsätta.",
    errorFields: "Kontrollera fälten markerade i rött och försök igen.",
    sending: "Skickar din förfrågan...",
    success: "Tack! Vi har tagit emot din förfrågan och återkommer normalt inom 24 timmar.",
    errorGeneric:
      "Det gick inte att skicka just nu. Kontrollera dina uppgifter och försök igen lite senare."
  },

  leadForm: {
    // Kampanjbannern ovanför formuläret. Datumet formateras i studions tidszon av
    // formatCampaignDeadline — aldrig med new Date(endsAt).toLocaleDateString(),
    // som hade skrivit ut dagen innan för en kund i en västligare zon.
    campaign: {
      badge: "Erbjudande just nu",
      deadline: "Gäller t.o.m. {{date}}",
      deadlineToday: "Gäller till midnatt i kväll",
      note: "Du får erbjudandet automatiskt när du skickar in formuläret — ingen kod behövs.",
      appliesToTattoo: "Gäller tatueringspass.",
      appliesToConsultation: "Gäller konsultation.",
      granted: "Erbjudandet är kopplat till din förfrågan."
    },
    weekdays: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
    otherStyle: "Annat (stilen finns inte)",
    otherPlacement: "Annat (skriv själv)",
    fallbackStyles: [
      "Fineline / mycket detalj",
      "Black & grey realism",
      "Cover-up",
      "Ornamental / mycket mönster"
    ],
    sizeTiny: "Mycket liten (upp till {{cm}} cm)",
    sizeSmall: "Liten (upp till {{cm}} cm)",
    sizeMedium: "Mellanstor (upp till {{cm}} cm)",
    sizeLarge: "Stor (upp till {{cm}} cm)",
    sizeExtra: "Extra stor (över {{cm}} cm)",
    sizeExtraNoThreshold: "Extra stor / helarm / rygg",
    // Kort namn = det som syns i den stängda väljaren. Intervallet visas som
    // meta bredvid namnet i listan, så knappen aldrig behöver kapas.
    sizeTinyName: "Mycket liten",
    sizeSmallName: "Liten",
    sizeMediumName: "Mellanstor",
    sizeLargeName: "Stor",
    sizeExtraName: "Extra stor",
    sizeRangeUpTo: "upp till {{cm}} cm",
    sizeRangeOver: "över {{cm}} cm",
    sizeRangeNoThreshold: "helarm / rygg",

    stepTattooLabel: "Om tatueringen",
    stepTattooHeading: "Berätta om din tatuering",
    stepTimeLabel: "Välj tid",
    stepTimeHeading: "Välj en tid som passar",
    stepContactLabel: "Dina uppgifter",
    stepContactHeading: "Dina kontaktuppgifter",
    progressAria: "Steg {{current}} av {{total}}",
    progressLabel: "Steg {{current}} av {{total}}",

    honeypot: "Lämna detta fält tomt",
    typeTattoo: "Tatueringsbokning",
    typeConsultation: "Konsultation",
    typeHint:
      "Vet du vad du vill ha? Välj tatueringsbokning. Vill du prata igenom idén, eller är motivet stort, välj konsultation.",
    fallbackNote:
      "Stilen du sökte finns inte bland studions valbara stilar, så vi har växlat till en konsultation. Beskriv vad du vill ha så återkommer studion med ett förslag.",
    fallbackBack: "Tillbaka till stilarna",

    artistLabel: "Tatuerare",
    artistAnyOption: "Ingen preferens",
    artistAnyHint: "Studion väljer",
    styleLabel: "Stil",
    stylePlaceholder: "Välj stil...",
    placementLabel: "Placering",
    placementPlaceholder: "Välj placering...",
    placementFreeText: "Arm, rygg, ben...",
    placementUseList: "Välj från listan i stället",
    sizeLabel: "Storlek",
    sizePlaceholder: "Välj storlek...",
    sizeFreeText: "Liten, medium eller i cm",
    budgetLabel: "Budget",
    budgetPlaceholder: "T.ex. 3000-5000 kr",
    descriptionConsultation: "Vad vill du diskutera?",
    descriptionTattoo: "Berätta om din tatuering",
    descriptionPlaceholderConsultation:
      "Berätta kort om din idé, dina frågor eller vad du vill gå igenom under konsultationen.",
    descriptionPlaceholderTattoo:
      "Beskriv motiv, känsla, referenser och allt som är viktigt för studion att veta.",

    imageLabel: "Inspirationsbild",
    imageHint:
      "Valfritt. Ladda upp en bild om du vill visa stil, motiv eller referens tydligare. JPG, PNG eller WEBP, max {{max}} MB.",
    // Studion kräver bilden (requireInspirationImage).
    imageLabelRequired: "Referensbild",
    imageHintRequired:
      "Obligatoriskt. Visa motiv, stil eller placering. JPG, PNG eller WEBP, max {{max}} MB.",
    imageRequired: "Bifoga en referensbild för att gå vidare.",
    imageProcessing: "Bearbetar bilden...",
    imagePreviewAlt: "Förhandsvisning av inspirationsbild",
    imageRemove: "Ta bort bild",
    imageError:
      "Det gick inte att förbereda bilden för uppladdning. Försök igen.",
    // Fel när bilden förbereds i webbläsaren (prepareLeadImageUpload.js).
    imageTypeUnsupported: "Filformatet stöds inte. Ladda upp en bild i JPG-, PNG- eller WEBP-format.",
    imageTooLarge: "Bilden är för stor ({{size}} MB). Välj en fil på högst {{max}} MB.",
    imageUnreadable: "Bilden kunde inte läsas. Välj en annan fil.",
    imageCompressFailed: "Det gick inte att komprimera bilden. Försök igen med en annan fil.",
    imageTooDetailed:
      "Bilden är för detaljrik för att komprimeras tillräckligt. Prova en mindre bild eller en lägre upplösning.",

    checkingAvailability: "Kontrollerar lediga tider...",
    availabilityError: "Det gick inte att kontrollera lediga tider just nu.",
    availabilityStale:
      "Vi kunde inte uppdatera tiderna just nu. Tiderna nedan är från den senaste kontrollen, så vi kan inte boka dem direkt — välj en tid igen så skickas den som ett önskemål och studion bekräftar den.",
    // Granskning 4 punkt 3: svaret kom fram, men det fanns inga luckor att rita
    // (inga bokningsbara veckodagar, eller allt upptaget i fönstret). Utan den
    // här meningen stod kunden inför ett tomt steg med bara Tillbaka/Nästa.
    noSlots:
      "Vi har inga lediga tider att visa just nu. Gå vidare ändå — studion går igenom din förfrågan och återkommer med tider som passar.",
    // Luckor visas, men förfrågan får inte bokas direkt (eligibleForDirectBooking
    // falskt). Kalendern är då en önskelista, och det stod ingenstans — kunden
    // trodde att hon bokade.
    timesAreRequests:
      "Studion granskar förfrågan innan en tid bekräftas. Välj gärna en tid som passar — den skickas som ett önskemål och studion bekräftar den.",
    prevWeek: "Föregående vecka",
    nextWeek: "Nästa vecka",
    selectedTime: "Vald tid",
    selectedTimeValue: "{{date}} kl. {{time}}",
    pickTimeFirst: "Välj minst en ledig tid innan du fortsätter.",

    nameLabel: "Namn",
    namePlaceholder: "Ditt namn",
    emailLabel: "E-post",
    emailPlaceholder: "namn@mail.online",
    phoneLabel: "Telefonnummer",
    phonePlaceholder: "070-000 00 00",

    depositLabel: "Deposition krävs:",
    depositText: "{{amount}} kr betalas vid bokning och räknas av mot slutpriset.",
    feeLabel: "Bokningsavgift:",
    feeText:
      "{{amount}} kr är en administrativ avgift som betalas vid bokning och räknas inte av mot slutpriset.",
    stripeNote: "Betalning sker säkert via Stripe direkt till studion.",
    // Punkt 12: visas i stället för depositText/feeText när formuläret INTE
    // tar betalt (ingen direktbokning). "Du betalar inget nu" är meningen som
    // hindrar kunden från att tro att betalningen krånglade.
    depositLaterText:
      "Studion tar ut {{amount}} kr i deposition när tiden bekräftas. Du betalar inget nu.",
    feeLaterText:
      "Studion tar ut en bokningsavgift på {{amount}} kr när tiden bekräftas. Du betalar inget nu.",
    // Studion bokar tiden själv och skickar en betallänk. Nivåtexten är en
    // prisregel, inte ett tidsestimat.
    feeLinkText:
      "När studion bekräftat din tid får du en länk för att betala bokningsavgiften på {{amount}} kr.",
    feeLinkTiersText:
      "När studion bekräftat din tid får du en länk för att betala bokningsavgiften: {{short}} kr för pass under {{limit}}, annars {{standard}} kr.",
    depositLinkText:
      "När studion bekräftat din tid får du en länk för att betala depositionen på {{amount}} kr. Den dras av från priset.",
    depositLinkTiersText:
      "När studion bekräftat din tid får du en länk för att betala depositionen: {{short}} kr för pass under {{limit}}, annars {{standard}} kr. Den dras av från priset.",
    feeNotRefundable:
      "Avgiften dras inte av från priset och betalas inte tillbaka om du avbokar eller inte kommer.",
    payNothingNow: "Du betalar inget nu.",
    tierLimitHour: "en timme",
    tierLimitHours: "{{hours}} timmar",
    tierLimitMinutes: "{{minutes}} minuter",
    consultationFree: "Konsultationen är gratis att boka.",
    consultationFirstQuestion:
      "Vill du börja med en kort konsultation (ca {{minutes}} min) innan tatueringen?",
    consultationFirstYes: "Ja, gärna",
    consultationFirstNo: "Nej, jag vet vad jag vill ha",
    consultationFirstHint:
      "Konsultationen ligger direkt före tatueringen, i samma besök. Då hinner ni gå igenom motivet tillsammans först.",
    consultationFirstClose: "Stäng och fortsätt fylla i",
    consultationFirstSummaryLabel: "Din bokning:",
    consultationFirstSummary:
      "Konsultation (ca {{minutes}} min) + tatueringspass. Konsultationen ligger direkt före tatueringen, i samma besök.",
    consultationFirstChange: "Ändra",
    policyIntro: "Genom att skicka förfrågan godkänner du studions av- och ombokningsregler:",

    payHeading: "Betala {{amount}} kr",
    paySecure: "Säker betalning via Stripe",
    payButton: "Betala {{amount}} kr",
    payProcessing: "Bearbetar...",
    payFailed: "Betalningen misslyckades. Försök igen.",
    payUnconfirmed: "Betalningen bekräftades inte. Kontakta studion om beloppet dragits.",
    payPreparing: "Förbereder betalning...",
    payStartFailed: "Kunde inte starta betalningen. Försök igen.",
    payToPayment: "Gå till betalning — {{amount}} kr",
    payRegistering: "Registrerar din bokning...",
    paySavedFailed:
      "Betalningen gick igenom men bokningen kunde inte sparas. Försök registrera den igen nedan.",
    payRegisterRetryInfo:
      "Betalningen är genomförd. Förfrågan kunde inte registreras — försök igen nedan. Du debiteras inte en gång till.",
    payRegisterRetry: "Registrera förfrågan igen",

    paidTitle: "Betalning genomförd",
    paidAmount: "{{amount}} kr",
    paidMessageBefore: "Din förfrågan är skickad till ",
    paidMessageAfter:
      " och depositionsavgiften är betald. Du får en bekräftelse via e-post inom kort.",
    paidNewRequest: "Skicka ny förfrågan",
    paidFallbackStudio: "studion",

    successPreviewNote: "Förhandsvisning av tackmeddelandet som visas efter skickad förfrågan",
    previewNotice:
      "Preview-läge: koppla sidan till en CRM-slug för att testa att skicka riktiga leads.",
    previewDisabled: "Den här demosidan är inte kopplad till en riktig studio i CRM ännu.",
    // Förhandsvisningen körs mot en riktig studio, så meddelandet ovan stämmer
    // inte här: det finns en koppling, den är bara avstängd med flit.
    previewReadOnly:
      "Förhandsvisning: formuläret går inte att skicka in härifrån. Öppna er publika sida för att skicka en riktig förfrågan.",

    consentRequired: "Godkänn integritetspolicy och villkor för att fortsätta.",
    submitting: "Skickar...",
    submit: "Skicka förfrågan",
    sending: "Skickar din förfrågan...",
    sendFailed: "Det gick inte att skicka just nu. Försök igen lite senare.",
    // Visas när servern svarade att det var inspirationsbilden som fällde
    // inskickningen — bilden väljs på steg 1 och är inte alltid nåbar därifrån.
    imageUploadFailedInfo:
      "Inspirationsbilden kunde inte sparas. Du kan skicka förfrågan utan bilden — studion hör av sig och kan be om den sedan.",
    submitWithoutImage: "Skicka utan bild",
    success:
      "Tack! Din förfrågan är skickad. Vi återkopplar normalt inom 24 timmar via e-post eller telefon — dygnet runt, alla dagar.",

    errorStyle: "Fyll i tatueringsstil.",
    errorPlacement: "Fyll i placering.",
    errorSize: "Fyll i storlek.",
    errorDescriptionConsultation: "Berätta kort vad du vill diskutera.",
    errorDescriptionTattoo: "Beskriv motiv och önskemål.",
    errorName: "Fyll i ditt namn.",
    errorPhone: "Fyll i ditt telefonnummer, så att studion kan nå dig.",
    errorEmail: "Ange en giltig e-postadress."
  },
  // Betalsidan /betala/:token. Kunden kommer från en länk i mejl eller SMS
  // efter att studion bokat tiden.
  paymentPage: {
    metaTitle: "Betala din bokning",
    metaDescription: "Betala förskottet för en bokad tid.",
    loading: "Hämtar betalningen…",
    greeting: "Hej {{name}}!",
    greetingFallback: "Hej!",
    intro: "{{studio}} har bokat din tid.",
    typeLabel: "Typ",
    timeLabel: "Tid",
    consultationFirst:
      "Du börjar med en konsultation (ca {{minutes}} min). Tatueringen fortsätter direkt efter.",
    amountLabelBookingFee: "Bokningsavgift",
    amountLabelDeposit: "Deposition",
    payUntil: "Betala senast {{date}} för att behålla tiden.",
    policyHeading: "Av- och ombokningsregler",
    acceptLabel: "Jag har läst och godkänner reglerna ovan.",
    continueButton: "Gå till betalning, {{amount}} kr",
    preparing: "Förbereder betalningen…",
    payHeading: "Betala {{amount}} kr",
    paySecure: "Säker kortbetalning via Stripe, direkt till studion.",
    payButton: "Betala {{amount}} kr",
    paying: "Bearbetar…",
    payFailed: "Betalningen gick inte igenom. Försök igen.",
    payUnconfirmed: "Betalningen bekräftades inte. Kontakta studion om beloppet har dragits.",
    startFailed: "Kunde inte starta betalningen. Inga pengar har dragits. Försök igen.",
    back: "Tillbaka",
    paidTitle: "Tack, betalningen är klar",
    paidText: "{{studio}} har fått din betalning på {{amount}} kr. Ett besked kommer också via mejl.",
    alreadyPaidTitle: "Redan betald",
    alreadyPaidText: "Förskottet för den här tiden är redan betalt. Du behöver inte göra något mer.",
    expiredTitle: "Länken har gått ut",
    expiredText: "Hör av dig till studion så skickar de en ny länk.",
    cancelledTitle: "Bokningen är avbokad",
    cancelledText: "Det finns inget att betala.",
    closedTitle: "Inget att betala",
    closedText: "Det finns inget att betala via den här länken längre.",
    unavailableTitle: "Betalningen är inte tillgänglig just nu",
    unavailableText:
      "Studion kan inte ta emot kortbetalningar just nu. Inga pengar har dragits. Hör av dig till studion.",
    notFoundTitle: "Länken finns inte",
    notFoundText: "Kontrollera att du kopierat hela länken, eller hör av dig till studion."
  },

  // Erbjudandet om en ledig tid, /tid/:token. Kunden kommer från ett SMS.
  slotOffer: {
    metaTitle: "Din tid",
    metaDescription: "Tacka ja till en tid som blivit ledig.",
    loading: "Hämtar tiden…",
    eyebrow: "En tid har blivit ledig",
    greeting: "Hej {{name}}!",
    greetingFallback: "Hej!",
    withArtist: "hos {{artist}}",
    durationMinutes: "{{count}} minuter",
    durationHour: "1 timme",
    durationHours: "{{count}} timmar",
    accept: "Ja tack, jag tar tiden",
    accepting: "Bokar…",
    firstComeNote: "Först till kvarn — tiden är din så fort du tackat ja.",
    consentNote: "Genom att tacka ja godkänner du studions villkor ovan.",
    notBookable: "Tiden går tyvärr inte att boka längre.",
    unsubscribe: "Jag vill inte ha fler tidserbjudanden",
    unsubscribedTitle: "Avregistrerad",
    unsubscribedText: "Du får inga fler SMS om lediga tider. Hör av dig till studion om du ändrar dig.",
    bookedTitle: "Tiden är din",
    bookedText: "Studion har fått din bokning. Du får en bekräftelse inom kort.",
    goneTitle: "Länken gäller inte längre",
    goneText: "Erbjudandet finns inte kvar.",
    loadFailed: "Länken gäller inte längre.",
    acceptFailed: "Tiden gick tyvärr inte att boka.",
    unsubscribeFailed: "Kunde inte avregistrera dig.",
    // Nycklarna = `reason` från servern.
    reasons: {
      already_filled: "Någon annan hann tacka ja före dig.",
      slot_closed: "Tiden är inte längre tillgänglig.",
      offer_expired: "Erbjudandet har gått ut.",
      offer_revoked: "Det här erbjudandet gäller inte längre.",
      slot_in_past: "Tiden har redan passerat.",
      too_soon: "Tiden börjar för snart för att bokas här. Ring studion om du ändå vill ta den."
    },
    // slotOfferTerms.js. Följden av en sen avbokning nämns bara för depositionen.
    terms: {
      depositLabel: "Deposition",
      depositText: "{{amount}} kr. Studion tar ut den när tiden bekräftas — du betalar inget här.",
      bookingFeeLabel: "Bokningsavgift",
      bookingFeeText:
        "{{amount}} kr. Studion tar ut den när tiden bekräftas — du betalar inget här. Avgiften räknas inte av mot slutpriset.",
      cancellationLabel: "Avbokning",
      cancellationText: "Senast {{hours}} timmar innan tiden.",
      cancellationDepositText:
        "Senast {{hours}} timmar innan tiden. Avbokar du senare kan studion ta betalt för depositionen på {{amount}} kr."
    }
  },

  // Felgränsen i main.jsx. Den ligger utanför LanguageProvider och läser
  // språket ur adressen.
  errorBoundary: {
    title: "Något gick fel",
    text: "Ett oväntat fel uppstod. Ladda om sidan för att försöka igen.",
    reload: "Ladda om"
  },

  // API-klienten (publicSiteApi.js). På svenska visas serverns egna texter, så
  // det här används bara på andra språk.
  apiErrors: {
    rateLimited: "För många försök från samma anslutning. Vänta en stund och försök igen."
  }
};
