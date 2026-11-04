(() => {
  'use strict';

  /*
   * Kundvyns språk: svenska eller engelska. Som på inkrevenue: ?lang=sv|en i adressen först (inkrevenue skickar
   * sidans språk så, se TryOnLauncher), sedan kundens eget val med SV och EN (sparat), och annars webbläsaren:
   * svenska om svenska finns någonstans bland kundens språk, annars engelska.
   *
   * Laddas i <head> före allt annat, så att sidan aldrig hinner visas på fel språk. Texterna i prova.html står på
   * svenska med den engelska bredvid (data-en, data-en-label, data-en-title, data-en-alt), och byts här när
   * sidan är inläst, innan prova.js körs. Texterna som prova.js skriver står nedan, på båda språken.
   * setLang byter språk på plats, utan att ladda om, och prova.js skriver då om sina texter (onChange).
   * Ett nytt språk: lägg till det i LANGS och TEXT, och data-<språk> i prova.html.
   */
  const LANGS = ['sv', 'en'];
  const SAVED = 'tryon-language';

  function pickLang() {
    const asked = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(asked)) return asked;
    try {
      const saved = localStorage.getItem(SAVED);
      if (LANGS.includes(saved)) return saved;
    } catch {
      /* ingen lagring, till exempel i privat läge: då väljer webbläsaren */
    }
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean);
    if (!list.length) return 'sv';
    return list.some((l) => /^sv(-|$)/i.test(l)) ? 'sv' : 'en';
  }

  const TEXT = {
    sv: {
      title: 'Prova din tatuering',
      editTitles: { ring: 'Ringa in', erase: 'Sudda', crop: 'Beskär', white: 'Vitt bläck' },
      changePhoto: 'Byt foto',
      choosePhoto: 'Välj foto',
      warnEmpty: 'Hittade ingen tatuering i bilden. Prova en tydligare bild med tatueringen mot vit bakgrund.',
      notImage: 'Det där ser inte ut som en bild.',
      readingPhoto: 'Läser fotot',
      photoFailed: (why) => `Fotot gick inte att läsa (${why}). Prova igen, eller välj fotot från bilderna.`,
      whyDecode: 'bildformatet går inte att läsa här',
      whyCanvas: 'telefonens minne för bilder tog slut',
      whyEngine: 'bildmotorn kom inte fram, ladda om sidan',
      whyEngineBroken: (msg) => `bildmotorn startade inte: ${msg}`,
      unknownError: 'okänt fel',
      line: 'rad',
      tooBig: (name, mb, max) => `${name} är för stor (${mb} MB). Högst ${max} MB per bild.`,
      manyTooBig: (n, max) => `${n} bilder är större än ${max} MB och lades inte in.`,
      readingMotif: 'Läser tatueringen',
      motifFailed: (name, why) => `Kunde inte läsa ${name} (${why}). Prova att spara den som JPG eller PNG.`,
      samplePhoto: 'Exempelfoto',
      motif: 'Motiv',
      image: 'bild',
      fetchFailed: (why) => `Kunde inte hämta bilden (${why}). Kontrollera nätet och försök igen.`,
      fetchingPhoto: 'Hämtar fotot',
      fetchingMotif: 'Hämtar motivet',
      fileBase: 'tatuering',
      makeFailed: 'Kunde inte skapa bilden. Försök igen.',
      saved: 'Bilden är sparad.',
      full: (max) => `Du kan ha högst ${max} motiv. Ta bort ett för att lägga till ett annat.`,
      sendText: {
        1: 'Hej! Så här vill jag ha tatueringen.',
        2: 'Hej! Så här vill jag ha tatueringen. Första bilden visar placering och storlek, den andra är originalet av motivet.',
        3: 'Hej! Så här vill jag ha tatueringarna. Första bilden visar placering och storlek, de andra är originalen av motiven.',
      },
      downloaded: (n) => (n > 1
        ? `Bilden och ${n > 2 ? 'originalen' : 'originalet'} är nedladdade. Skicka dem till tatueraren.`
        : 'Bilden är nedladdad. Skicka den till tatueraren.'),
      tattooN: (i) => `Tatuering ${i}`,
      removeTattooN: (i) => `Ta bort tatuering ${i}`,
      trayFull: (max) => `Du har ${max} motiv, det är max. Ta bort ett med krysset för att lägga till ett annat.`,
      trayNote: (max) => `Alla motiv syns på fotot. Tryck på ett för att flytta och justera det, eller lägg till ett till, upp till ${max}.`,
      ringTooSmall: 'Dra med fingret runt hela tatueringen.',
      ringing: 'Plockar ut tatueringen',
      ringEmpty: 'Hittade ingen tatuering innanför ringen. Försök igen.',
      whiteNone: 'Tryck på en vit yta inuti tatueringen.',
      whiteEdge: 'Det där är bakgrunden. Bara vita ytor som tatueringen omsluter kan bli vitt bläck.',
      ringDone: 'Så här blir tatueringen. Blev något fel kan du ringa in igen eller sudda bort rester.',
      ringHint: 'Dra med fingret runt tatueringen. Allt utanför tas bort.',
      notRinged: 'Tatueringen är inte inringad, så det runt omkring följer med. Ringa in finns under Justera.',
      nothingToReset: 'Inget att återställa. Tatueringen är som den ställdes in automatiskt.',
      resetDone: 'Tatueringen är återställd.',
      noWhite: 'Hittade inga små vita ytor inuti tatueringen.',
      whiteFound: (n) => `${n === 1 ? 'En vit yta' : `${n} vita ytor`} blev vitt bläck. Tryck på en yta för att ändra.`,
      privacyForm: 'Bilden stannar i din telefon tills du lägger den i förfrågan till studion.',
      addToForm: 'Lägg till i förfrågan',
      percent: (n) => `${String(n).replace('.', ',')} %`,
    },
    en: {
      title: 'Try on your tattoo',
      editTitles: { ring: 'Circle', erase: 'Erase', crop: 'Crop', white: 'White ink' },
      changePhoto: 'Change photo',
      choosePhoto: 'Choose photo',
      warnEmpty: "Couldn't find a tattoo in the picture. Try a clearer picture with the tattoo on a white background.",
      notImage: "That doesn't look like a picture.",
      readingPhoto: 'Reading the photo',
      photoFailed: (why) => `The photo couldn't be read (${why}). Try again, or choose the photo from your pictures.`,
      whyDecode: "this image format can't be read here",
      whyCanvas: 'the phone ran out of memory for pictures',
      whyEngine: "the image engine didn't load, reload the page",
      whyEngineBroken: (msg) => `the image engine didn't start: ${msg}`,
      unknownError: 'unknown error',
      line: 'line',
      tooBig: (name, mb, max) => `${name} is too large (${mb} MB). At most ${max} MB per picture.`,
      manyTooBig: (n, max) => `${n} pictures are larger than ${max} MB and weren't added.`,
      readingMotif: 'Reading the tattoo',
      motifFailed: (name, why) => `Couldn't read ${name} (${why}). Try saving it as JPG or PNG.`,
      samplePhoto: 'Sample photo',
      motif: 'Design',
      image: 'image',
      fetchFailed: (why) => `Couldn't load the picture (${why}). Check your connection and try again.`,
      fetchingPhoto: 'Loading the photo',
      fetchingMotif: 'Loading the design',
      fileBase: 'tattoo',
      makeFailed: "Couldn't create the picture. Try again.",
      saved: 'The picture is saved.',
      full: (max) => `You can have at most ${max} designs. Remove one to add another.`,
      sendText: {
        1: "Hi! This is how I'd like the tattoo.",
        2: "Hi! This is how I'd like the tattoo. The first picture shows placement and size, the second is the original design.",
        3: "Hi! This is how I'd like the tattoos. The first picture shows placement and size, the others are the original designs.",
      },
      downloaded: (n) => (n > 1
        ? `The picture and ${n > 2 ? 'the originals' : 'the original'} are downloaded. Send them to the tattoo artist.`
        : 'The picture is downloaded. Send it to the tattoo artist.'),
      tattooN: (i) => `Tattoo ${i}`,
      removeTattooN: (i) => `Remove tattoo ${i}`,
      trayFull: (max) => `You have ${max} designs, that's the maximum. Remove one with the cross to add another.`,
      trayNote: (max) => `All designs show on the photo. Tap one to move and adjust it, or add another, up to ${max}.`,
      ringTooSmall: 'Drag your finger all the way around the tattoo.',
      ringing: 'Cutting out the tattoo',
      ringEmpty: "Couldn't find a tattoo inside the circle. Try again.",
      whiteNone: 'Tap a white area inside the tattoo.',
      whiteEdge: "That's the background. Only white areas enclosed by the tattoo can become white ink.",
      ringDone: "This is how the tattoo will look. If something's wrong, circle it again or erase what's left over.",
      ringHint: 'Drag your finger around the tattoo. Everything outside is removed.',
      notRinged: "The tattoo isn't circled, so what's around it comes along. Circle is under Adjust.",
      nothingToReset: 'Nothing to reset. The tattoo is as it was set automatically.',
      resetDone: 'The tattoo is reset.',
      noWhite: "Couldn't find any small white areas inside the tattoo.",
      whiteFound: (n) => `${n === 1 ? 'One white area' : `${n} white areas`} became white ink. Tap an area to change it.`,
      privacyForm: 'The picture stays on your phone until you add it to your request to the studio.',
      addToForm: 'Add to request',
      percent: (n) => `${n}%`,
    },
  };

  let lang = pickLang();
  const t = { ...TEXT[lang] }; // samma objekt hela tiden, så att prova.js kan hålla kvar det när språket byts
  const listeners = [];
  const root = document.documentElement;
  root.lang = lang;
  // Sidan är dold tills texterna är bytta (prova.css), om webbläsaren skulle visa en del av den medan den läses in.
  if (lang !== 'sv') root.setAttribute('data-translating', '');

  const ATTRS = { label: 'aria-label', title: 'title', alt: 'alt' };
  const key = (l, attr) => `data-${l}${attr ? `-${attr}` : ''}`;

  /* Svenskan står i prova.html. Den sparas bredvid engelskan (data-sv) innan något byts, så att det går att byta tillbaka. */
  function keepSwedish() {
    document.querySelectorAll('[data-en]').forEach((el) => el.setAttribute('data-sv', el.textContent));
    for (const [attr, name] of Object.entries(ATTRS)) {
      document.querySelectorAll(`[${key('en', attr)}]`).forEach((el) => el.setAttribute(key('sv', attr), el.getAttribute(name) || ''));
    }
  }

  /* Byter texterna i prova.html till språket som gäller. */
  function translate() {
    document.querySelectorAll(`[${key(lang)}]`).forEach((el) => { el.textContent = el.getAttribute(key(lang)); });
    for (const [attr, name] of Object.entries(ATTRS)) {
      document.querySelectorAll(`[${key(lang, attr)}]`).forEach((el) => el.setAttribute(name, el.getAttribute(key(lang, attr))));
    }
  }

  function loaded() {
    try {
      keepSwedish();
      if (lang !== 'sv') translate();
    } finally {
      root.removeAttribute('data-translating');
    }
  }

  // Sidan är inläst ('interactive') före de uppskjutna skripten och innan något har visats.
  if (document.readyState === 'loading') {
    document.addEventListener('readystatechange', () => { if (document.readyState === 'interactive') loaded(); }, { once: true });
  } else {
    loaded();
  }

  /*
   * Kundens eget val (SV och EN): byter på plats och sparas, så att det gäller nästa gång också. Adressen får
   * samma ?lang=, så att en omladdning inte byter tillbaka.
   */
  function setLang(to) {
    if (!LANGS.includes(to) || to === lang) return;
    lang = to;
    root.lang = to;
    Object.assign(t, TEXT[to]);
    translate();
    try {
      localStorage.setItem(SAVED, to);
    } catch {
      /* gäller bara den här gången */
    }
    const url = new URL(location.href);
    url.searchParams.set('lang', to);
    history.replaceState(history.state, '', url);
    listeners.forEach((fn) => fn(to));
  }

  window.TryonText = {
    get lang() { return lang; },
    t,
    setLang,
    onChange: (fn) => listeners.push(fn),
  };
})();
