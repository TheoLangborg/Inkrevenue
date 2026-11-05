(() => {
  'use strict';

  /*
   * Prova din tatuering: kundvyn. Allt sker i webbläsaren, inget laddas upp.
   * Lägen: start (inget foto) -> needMotif (foto, ingen tatuering) -> place (placera) <-> edit (rensa tatueringen).
   * I place kan bilden också visas för sig i helskärm (S.zoom), där fingrarna förstorar i stället för att flytta.
   */

  let E = window.TryonEngine; // kan saknas om engine.js inte kom fram, se ensureEngine
  const T = window.TryonText.t; // texterna på kundens språk, se prova-text.js. Samma objekt även när språket byts.
  const $ =(sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const normDeg = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

  const BODY_MAX = 1600; // längsta sida på fotot: skarpt nog att spara, lätt nog för telefonen
  const BODY_MIN = 1200; // mindre foton skalas upp, så att tatueringen får plats med alla detaljer
  const MOTIF_MAX = 1000;
  const VIEW_MAX = 900;
  const PL0 = { x: 0.5, y: 0.5, scale: 0.38, rot: 0, flip: false, opacity: 0.9 };
  const TOUCH = matchMedia('(pointer: coarse)').matches;
  const HISTORY_MAX = 40;
  const TAP_PX = 6; // en tryckning som rör sig mer än så här är ett drag
  const ZOOM_MAX = 5;
  const MOTIFS_MAX = 5; // som bilderna i förfrågan
  const FILE_MB_MAX = 20; // samma gräns per bild som förfrågan har
  const FULL_BOX = { x0: 0, y0: 0, x1: 1, y1: 1 };
  const SEL_PAD = 6; // luft mellan motivet och ramen, i skärmens pixlar
  const SEL_MIN = 44; // så att krysset och handtaget inte hamnar på varandra
  // Inbäddad i studions förfrågan på inkrevenue (en iframe med ?inbaddad): Skicka lägger bilderna i formuläret.
  const host = new URLSearchParams(location.search).has('inbaddad') && window.parent !== window ? window.parent : null;
  // Stegen som studion ser antalet av i CRM:et (tryon:event): opened, photo, motif, added. Vart och ett en gång.
  const reported = new Set();
  const report = (event) => {
    if (!host || reported.has(event)) return;
    reported.add(event);
    host.postMessage({ type: 'tryon:event', event }, location.origin);
  };

  const S = {
    screen: 'start',
    body: null, // { raw, fixed, canvas, view }: fixed är fotot med rättat ljus, canvas det som visas, view kopian på skärmen
    autoLight: true,
    motifs: [], mi: -1, // alla tatueringar syns på fotot, var och en med sin placering (m.pl); mi är den valda
    sheet: null, // adjust | motif | photo
    tab: 'erase', // verktyget när tatueringen visas för sig: ring | erase | crop | white
    view: 'checker',
    brush: 4, // procent av tatueringens längsta sida
    coached: false,
    selected: false, // ramen med kryss och handtag runt tatueringen
    live: false, // 'move' medan tatueringen flyttas, nyps eller vrids, 'still' medan ett reglage dras: snabb ritning
    zoom: false,
  };
  const motif = () => S.motifs[S.mi];
  // S.pl är den valda tatueringens placering. Utan tatuering är den en kopia, så att PL0 aldrig ändras.
  Object.defineProperty(S, 'pl', {
    get: () => (motif() ? motif().pl : { ...PL0 }),
    set: (pl) => { if (motif()) motif().pl = pl; },
  });
  // Ett foto av en tatuering på hud, eller ett foto med mer än motivet, ger ingen varning: då öppnas Ringa in direkt.
  const motifWarning = (w) => (w === 'empty' ? T.warnEmpty : '');

  const app = $('#app');
  const stage = $('#stage');
  const cv = $('#cv');
  const ctx = cv.getContext('2d');

  let toastTimer = 0;
  function toast(message, ms = 3500) {
    const t = $('#toast');
    t.textContent = message;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }

  /* ================================================================ lägen och ark */

  function setScreen(name) {
    S.screen = name;
    app.dataset.screen = name;
    $$('[data-for]').forEach((n) => { n.hidden = !n.dataset.for.split(' ').includes(name); });
    if (name !== 'place') { hideCoach(); setZoom(false); }
    openSheet(null);
    $('#topTitle').textContent = name === 'edit' ? T.editTitles[S.tab] : T.title;
    if (name === 'edit') syncEdit();
    syncUndo();
    placeSel();
    placeSaveBtn();
    requestRender();
  }

  /*
   * Öppnar arket, eller stänger det om det redan är öppet. null stänger alla. Arket tar verktygens plats nedtill,
   * så att det aldrig täcker bilden. Bilden krymper lite i stället, och Klar tar tillbaka verktygen.
   */
  function openSheet(name) {
    S.sheet = name && S.sheet !== name ? name : null;
    $('#sheetAdjust').hidden = S.sheet !== 'adjust';
    $('#sheetMotif').hidden = S.sheet !== 'motif';
    $('#sheetPhoto').hidden = S.sheet !== 'photo';
    app.toggleAttribute('data-sheet', !!S.sheet); // på startskärmen syns dockan bara med ett ark, se prova.css
    $('#placeTools').hidden = S.screen !== 'place' || !!S.sheet;
    $('#needTools').hidden = S.screen !== 'needMotif' || !!S.sheet;
    $('#hPhoto').textContent = S.body ? T.changePhoto : T.choosePhoto;
    $('#photoNote').hidden = !motif();
    $('#tAdjust').setAttribute('aria-pressed', String(S.sheet === 'adjust'));
    $('#tMotif').setAttribute('aria-pressed', String(S.sheet === 'motif'));
    $('#tPhoto').setAttribute('aria-pressed', String(S.sheet === 'photo'));
    if (S.sheet) hideCoach();
    if (S.sheet === 'adjust') syncSettings();
    syncFocus(S.screen === 'place'); // Justera förstorar bilden runt tatueringen
  }

  /*
   * Visar tatueringen för sig, med ett verktyg: Sudda från verktygsraden, Ringa in, Beskär och Vitt bläck från
   * Justera. Ringa in visar först fotot som det laddades in, och efter inringningen resultatet.
   * Allt som görs här blir ett enda steg att ångra när kunden trycker Klar.
   */
  function openEdit(tab) {
    if (motif()) begin();
    S.tab = tab;
    stroke = null;
    cropBox = null;
    brushAt = null;
    ringPts = null;
    ringResult = false;
    setScreen('edit');
  }

  let coachTimer = 0;
  function showCoach() {
    if (S.coached) return;
    S.coached = true;
    $('#coach').hidden = false;
    coachTimer = setTimeout(hideCoach, 6000);
  }
  function hideCoach() {
    clearTimeout(coachTimer);
    $('#coach').hidden = true;
  }

  /* ================================================================ bilder in */

  const isImage = (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif|heic)$/i.test(f.name);

  async function busy(text, fn) {
    $('#busyText').textContent = text;
    $('#busy').hidden = false;
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r))); // låt spinnern synas innan avkodningen tar tråden
    try {
      return await fn();
    } finally {
      $('#busy').hidden = true;
    }
  }

  /* plats: var ett nytt motiv hamnar på ett exempelfoto, se placeOf. */
  async function setBody(file, plats = null) {
    if (!file) return;
    if (!isImage(file)) { toast(T.notImage); return; }
    let body;
    try {
      body = await busy(T.readingPhoto, async () => {
        await ensureEngine();
        const raw = await E.fileToCanvas(file, BODY_MAX, true, BODY_MIN);
        const fixed = E.autoExposure(raw); // null om ljuset redan är okej
        const b = { raw, fixed, plats };
        useLight(b);
        E.skinDetail(b.canvas); // hudens struktur räknas nu, medan spinnern syns, i stället för vid första ritningen
        return b;
      });
    } catch (err) {
      toast(T.photoFailed(whyNot(err)), 9000);
      return;
    }
    // Ett nytt foto går inte att ångra. Det gamla släpps direkt, så att telefonen inte får slut på minne för
    // bilder, och det som redan gjorts med tatueringen går fortfarande att ångra och göra om, på det nya fotot.
    const old = S.body;
    S.body = body;
    report('photo');
    for (const s of [...past, ...future]) s.body = body;
    if (pending) pending.body = body;
    if (old) [old.raw, old.fixed, old.view].forEach((c) => E.release(c));
    syncPics();
    setScreen(motif() ? 'place' : 'needMotif');
    changed();
    // Motiven som kunden redan har lagt i förfrågan läggs in direkt, så att det bara är att placera.
    if (!motif() && preset.length) {
      const files = preset;
      preset = [];
      addMotifs(files, true);
    }
  }

  /* Kort varför en bild inte gick att läsa, så att det går att felsöka från telefonen. */
  function whyNot(err) {
    const msg = String((err && err.message) || err || '');
    if (msg === 'decode') return T.whyDecode;
    if (msg === 'canvas') return T.whyCanvas;
    if (msg === 'engine') return T.whyEngine;
    if (msg.startsWith('engine: ')) return T.whyEngineBroken(msg.slice(8, 120));
    return `${(err && err.name) || 'Error'}: ${msg.slice(0, 90)}`;
  }

  /*
   * Bildmotorn (engine.js) saknas om filen inte kom fram, till exempel genom tunneln till telefonen, eller om
   * webbläsaren inte kunde köra den. Då hämtas den en gång till innan bilden läses. Kommer den ändå inte fram
   * säger felet vilket det var, och när den inte gick att köra även webbläsarens felmeddelande.
   */
  let engineError = '';
  window.addEventListener('error', (ev) => {
    if (String(ev.filename || '').includes('/engine.js')) engineError = `${ev.message} (${T.line} ${ev.lineno})`;
  });
  function ensureEngine() {
    if (E) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `engine.js?igen=${Date.now()}`; // relativt, så att det fungerar även under /tryon/ på inkrevenue
      s.onload = () => {
        E = window.TryonEngine;
        if (E) resolve();
        else reject(new Error(`engine: ${engineError || T.unknownError}`));
      };
      s.onerror = () => reject(new Error('engine'));
      document.head.append(s);
    });
  }

  /*
   * Fotot med eller utan rättat ljus. view är en kopia för skärmen: fotot läses med willReadFrequently och kan
   * då ligga i processorns minne, och skulle i så fall laddas upp till grafikkortet i varje bildruta.
   * Går kopian inte att skapa ritas fotot direkt, bara lite långsammare.
   */
  function useLight(b) {
    b.canvas = S.autoLight && b.fixed ? b.fixed : b.raw;
    if (b.viewOf === b.canvas) return;
    E.release(b.view);
    b.view = null;
    b.viewOf = b.canvas;
    const view = E.newCanvas(b.canvas.width, b.canvas.height);
    const x = view.getContext('2d');
    if (!x) return;
    x.drawImage(b.canvas, 0, 0);
    b.view = view;
  }

  /*
   * fromForm: motiven kom från förfrågan, så deras original skickas inte tillbaka dit en gång till.
   * keepSheet: motivet valdes bland studions motiv, och Motiv-arket står kvar så att kunden kan välja fler.
   * Högst MOTIFS_MAX motiv och FILE_MB_MAX per bild. Det som inte får plats läggs inte in, och toasten säger varför.
   */
  async function addMotifs(fileList, fromForm = false, keepSheet = false) {
    const images = [...fileList].filter(isImage);
    if (!images.length) { toast(T.notImage); return; }
    const big = images.filter((f) => f.size > FILE_MB_MAX * 1024 * 1024);
    const fits = images.filter((f) => !big.includes(f));
    const files = fits.slice(0, Math.max(0, MOTIFS_MAX - S.motifs.length));
    const notes = [];
    if (big.length === 1) notes.push(T.tooBig(big[0].name, Math.round(big[0].size / 1024 / 1024), FILE_MB_MAX));
    else if (big.length) notes.push(T.manyTooBig(big.length, FILE_MB_MAX));
    if (files.length < fits.length) notes.push(fullText());
    if (notes.length) toast(notes.join(' '), 7000);
    if (!files.length) return;
    const before = S.motifs.length;
    const was = snapshot();
    let warning = '';
    let skinAt = -1;
    await busy(T.readingMotif, async () => {
      for (const f of files) {
        try {
          await ensureEngine();
          const m = E.newMotif(f.name, await E.fileToCanvas(f, MOTIF_MAX));
          m.file = f; // originalet i full upplösning, som skickas med till tatueraren
          // Studions motiv har genomskinlig bakgrund. Till tatueraren skickas det på vitt, så att svart bläck syns i alla appar.
          if (libFiles.has(f)) m.file = (await onWhite(m.photo, f.name.replace(/\.png$/i, '.jpg'))) || f;
          m.fromForm = fromForm;
          m.print = fingerprint(m.photo); // så att samma bild bara skickas en gång, se originals
          m.o = E.autoPrepare(m); // pappret, skuggor, rensning, svarta linjer och tomma kanter ställs in automatiskt
          m.auto = { ...m.o }; // det automatiska, som Återställ tar tillbaka
          m.pl = { ...PL0 }; // tills alla är inlästa och får sin plats, se fitMotif
          cleanThumb(m); // rensar nu, medan spinnern syns, i stället för vid första ritningen
          S.motifs = [...S.motifs, m]; // en ny lista, eftersom ångra sparar den gamla
          if (m.warning === 'skin') skinAt = S.motifs.length - 1;
          else warning = m.warning || warning;
        } catch (err) {
          toast(T.motifFailed(f.name, whyNot(err)), 9000);
        }
      }
    });
    if (S.motifs.length === before) return;
    report('motif');
    remember(was);
    const added = S.motifs.slice(before);
    added.forEach((m, i) => { m.cell = cellOf(i, added.length); fitMotif(m); });
    S.mi = skinAt >= 0 ? skinAt : S.motifs.length - 1;
    S.selected = true; // ramen visar direkt att hörnen går att dra i
    syncAdjust();
    renderTray();
    syncSettings();
    changed();
    // Ett foto av en tatuering på hud, eller ett rörigt foto, går inte att rensa automatiskt. Kunden ringar in tatueringen direkt.
    if (skinAt >= 0) { openEdit('ring'); return; }
    if (warning) toast(motifWarning(warning), 7000);
    // Valt bland studions motiv: motivet syns på fotot ovanför arket, och arket står kvar (eller öppnas, från raden
    // i dockan) så att kunden kan prova fler. Tipset om att dra och nypa väntar tills arket är stängt.
    if (keepSheet && S.screen === 'place' && S.sheet === 'motif') { placeSel(); placeSaveBtn(); return; }
    if (S.screen === 'needMotif' || S.screen === 'place') setScreen('place');
    if (keepSheet && S.screen === 'place') openSheet('motif');
    else showCoach();
  }

  /*
   * Ny tatuering: mitt i bilden, högst 40 procent av bildens bredd och höjd. Läggs flera in på en gång, som
   * motiven från förfrågan, får de var sin ruta i ett rutnät, så att alla syns. Rutnätet är på höjden när
   * fotot är det, eftersom en arm då oftast går uppifrån och ner. Ett ensamt motiv på ett exempelfoto hamnar
   * där fotot säger (b.plats), till exempel mitt på armen och vridet längs den.
   */
  function cellOf(i, n) {
    const b = S.body;
    const p = b && b.plats;
    if (p && n === 1) return { x: p.x, y: p.y, w: 0.9, h: 0.8, rot: p.rot, max: p.scale };
    const k = Math.ceil(Math.sqrt(n));
    const cols = b && b.canvas.height > b.canvas.width ? Math.ceil(n / k) : k;
    const rows = Math.ceil(n / cols);
    const w = 0.9 / cols;
    const h = 0.8 / rows;
    return { x: 0.05 + w * ((i % cols) + 0.5), y: 0.1 + h * (Math.floor(i / cols) + 0.5), w, h };
  }

  /* Placeringen när tatueringen lades in, i sin ruta. Nollställ och en ny inringning tar tillbaka den. */
  function fitMotif(m = motif()) {
    if (!m) return;
    const b = S.body;
    const c = m.cell || cellOf(0, 1);
    let scale = PL0.scale;
    if (b) {
      const aspect = m.src.height / m.src.width;
      scale = Math.min(c.max || 0.4, 0.85 * c.w, (Math.min(0.4, 0.85 * c.h) * b.canvas.height) / (b.canvas.width * aspect));
    }
    m.pl = { ...PL0, x: c.x, y: c.y, rot: c.rot || 0, scale: clamp(scale, 0.05, 1) };
    if (m === motif()) syncAdjust();
  }

  /* ================================================================ förinställda bilder */

  /*
   * Studions motiv och exempelfoton att prova på, för den som inte har ett eget motiv eller ett foto till hands.
   * De ligger i forval/ bredvid kundvyn: forval/alla/ gäller alla studior och forval/<studio>/ studion i adressen
   * (?studio=<slug>). Varje mapp har en lista, forval.json. Motiven är redan rensade (PNG med genomskinlig
   * bakgrund), så de går samma väg som kundens egna bilder men utan papper att ta bort. Filerna görs med
   * npm run motiv och npm run kroppar i labbet (forval.js). Utan lista syns bara kundens egna bilder.
   */
  const STUDIO = (() => {
    const s = new URLSearchParams(location.search).get('studio');
    return s && s !== 'alla' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(s) ? s : null;
  })();
  const LIB_FILE = { motiv: /^motiv\/[a-z0-9][a-z0-9-]{0,80}\.png$/, kroppar: /^kroppar\/[a-z0-9][a-z0-9-]{0,80}\.jpg$/ };
  const LIB_THUMB = /^(motiv|kroppar)\/[a-z0-9][a-z0-9-]{0,80}\.jpg$/;
  const lib = { motiv: [], kroppar: [] }; // { namn, url, liten, ext, plats }
  const libFiles = new WeakSet(); // filerna som hämtats ur listan, se addMotifs

  /*
   * Studions motiv kan också ligga i databasen (tattoo-crm: tryOnMotifsService), hos inkrevenue via
   * /api/public/studios/<studio>/try-on-motifs. Bilderna kommer genom samma API. Motiv som bara är till för
   * test syns med nyckeln i ?provmotiv= (studiosidan skickar den vidare). Bara inbäddad (host), eftersom
   * API:t bara finns hos inkrevenue och inte i labbet.
   */
  const TEST_KEY = (() => {
    const k = new URLSearchParams(location.search).get('provmotiv');
    return k && /^[A-Za-z0-9_-]{16,128}$/.test(k) ? k : null;
  })();
  const MOTIF_ID = /^[a-z0-9][a-z0-9-]{0,80}$/;

  async function loadApiMotifs() {
    if (!STUDIO || !host) return [];
    const base = `/api/public/studios/${STUDIO}/try-on-motifs`;
    const qs = TEST_KEY ? `?key=${encodeURIComponent(TEST_KEY)}` : '';
    try {
      const res = await fetch(base + qs, { cache: 'no-cache' });
      if (!res.ok) return [];
      const list = (await res.json())?.data?.motiv;
      return (Array.isArray(list) ? list : []).filter((it) => it && MOTIF_ID.test(it.id)).map((it) => ({
        namn: String(it.namn || '').slice(0, 60),
        url: `${base}/${it.id}/bild${qs}`,
        liten: `${base}/${it.id}/liten${qs}`,
        ext: '.png',
        plats: null,
      }));
    } catch {
      return []; // inget API (labbet), eller ett nätfel: då syns bara motiven i forval/
    }
  }

  async function loadLibrary() {
    const dirs = STUDIO ? [STUDIO, 'alla'] : ['alla'];
    const apiMotifs = loadApiMotifs();
    const lists = await Promise.all(dirs.map(async (dir) => {
      try {
        const res = await fetch(`forval/${dir}/forval.json`, { cache: 'no-cache' });
        return res.ok ? { dir, list: await res.json() } : null;
      } catch {
        return null; // ingen lista, eller en webbsida i stället för en lista
      }
    }));
    for (const { dir, list } of lists.filter((l) => l && l.list && typeof l.list === 'object')) {
      for (const kind of ['motiv', 'kroppar']) {
        for (const it of Array.isArray(list[kind]) ? list[kind] : []) {
          if (!it || !LIB_FILE[kind].test(it.fil) || !LIB_THUMB.test(it.liten)) continue;
          lib[kind].push({ namn: String(it.namn || '').slice(0, 60), url: `forval/${dir}/${it.fil}`, liten: `forval/${dir}/${it.liten}`,
            ext: it.fil.slice(it.fil.lastIndexOf('.')), plats: placeOf(it.plats) });
        }
      }
    }
    lib.motiv.push(...await apiMotifs);
    renderLibrary();
  }

  /* Var ett nytt motiv hamnar på ett exempelfoto, till exempel längs armen: { x, y, rot, scale }, andelar och grader. */
  function placeOf(p) {
    const ok = (v, lo, hi) => typeof v === 'number' && v >= lo && v <= hi;
    if (!p || !ok(p.x, 0, 1) || !ok(p.y, 0, 1)) return null;
    return { x: p.x, y: p.y, rot: ok(p.rot, -180, 180) ? p.rot : 0, scale: ok(p.scale, 0.03, 1) ? p.scale : 0.4 };
  }

  function renderLibrary() {
    const bodies = lib.kroppar;
    $('#btnSampleBody').hidden = !bodies.length;
    if (bodies.length) $('#sampleBodyPic').src = bodies[0].liten;
    // Med exempelfoton öppnar Byt foto arket, där de finns bredvid Ta foto och Välj bild.
    $('#needPhotoFile').hidden = !!bodies.length;
    $('#needPhotoSheet').hidden = !bodies.length;
    fillLib($('#libBody'), $('#libBodyList'), bodies, true, pickBody);
    fillLib($('#libMotif'), $('#libMotifList'), lib.motiv, false, pickMotif);
    fillLib($('#libNeed'), $('#libNeedList'), lib.motiv, false, pickMotif);
    syncStrip();
  }

  /*
   * Raden med studions motiv rullar i sidled: med fingret, med reglaget under den, eller med hjulet på datorn.
   * Reglaget följer raden och syns bara när alla motiv inte får plats.
   */
  const strip = $('#libNeedList');
  const stripSlider = $('#libNeedSlider');
  function syncStrip() {
    const room = strip.scrollWidth - strip.clientWidth;
    stripSlider.hidden = room <= 1;
    if (room > 1) stripSlider.value = String(Math.round((strip.scrollLeft / room) * 1000));
  }
  strip.addEventListener('scroll', syncStrip, { passive: true });
  stripSlider.addEventListener('input', () => {
    strip.scrollLeft = (Number(stripSlider.value) / 1000) * (strip.scrollWidth - strip.clientWidth);
  });
  strip.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || strip.scrollWidth <= strip.clientWidth) return;
    e.preventDefault();
    strip.scrollLeft += e.deltaY;
  }, { passive: false });
  new ResizeObserver(syncStrip).observe(strip); // raden får sin bredd först när dockan visar den

  /* Rutor med en liten bild. Exempelfotona har namnet under, motiven bara bilden (namnet läses upp). */
  function fillLib(section, list, items, captions, pick) {
    section.hidden = !items.length;
    list.replaceChildren(...items.map((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = captions ? 'lib-tile photo' : 'lib-tile';
      b.title = it.namn;
      b.setAttribute('aria-label', it.namn || `${captions ? T.samplePhoto : T.motif} ${i + 1}`);
      const img = document.createElement('img');
      img.src = it.liten;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      b.append(img);
      if (captions && it.namn) {
        const s = document.createElement('span');
        s.textContent = it.namn;
        s.setAttribute('aria-hidden', 'true');
        b.append(s);
      }
      b.addEventListener('click', () => pick(it));
      return b;
    }));
  }

  /* Hämtar bilden som en fil, så att den går samma väg som en bild som kunden väljer själv. */
  async function fetchLib(it, text) {
    try {
      return await busy(text, async () => {
        const res = await fetch(it.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        return new File([blob], `${it.namn || T.image}${it.ext}`, { type: it.ext === '.png' ? 'image/png' : 'image/jpeg' });
      });
    } catch (err) {
      toast(T.fetchFailed(whyNot(err)), 7000);
      return null;
    }
  }

  async function pickBody(it) {
    const file = await fetchLib(it, T.fetchingPhoto);
    if (file) setBody(file, it.plats);
  }

  async function pickMotif(it) {
    if (S.motifs.length >= MOTIFS_MAX) { toast(fullText(), 7000); return; }
    const file = await fetchLib(it, T.fetchingMotif);
    if (!file) return;
    libFiles.add(file);
    addMotifs([file], false, true);
  }

  /* Motivet på vitt, som JPEG. null om det inte gick, då skickas det som det är. */
  async function onWhite(c, name) {
    const w = E.newCanvas(c.width, c.height);
    const x = w.getContext('2d');
    if (!x) return null;
    x.fillStyle = '#fff';
    x.fillRect(0, 0, w.width, w.height);
    x.drawImage(c, 0, 0);
    const blob = await new Promise((r) => w.toBlob(r, 'image/jpeg', 0.92));
    E.release(w);
    return blob ? new File([blob], name, { type: 'image/jpeg' }) : null;
  }

  /* ================================================================ rita */

  let raf = 0;
  function requestRender() {
    if (!raf) raf = requestAnimationFrame(paint);
  }

  function fitCanvas(W, H) {
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }
  }

  function paint() {
    raf = 0;
    const m = motif();
    if (S.screen === 'edit' && m && ringing()) {
      const { W, H } = E.viewSize(m, VIEW_MAX, m.photo);
      fitCanvas(W, H);
      E.drawRingView(ctx, m, ringPts || m.ring, W, H, !ringPts);
      return;
    }
    if (S.screen === 'edit' && m) {
      const { W, H } = E.viewSize(m, VIEW_MAX);
      fitCanvas(W, H);
      const brush = S.tab === 'erase' && brushAt ? { x: brushAt.x, y: brushAt.y, size: brushPx(m) } : null;
      E.drawMotifView(ctx, m, m.o, { view: S.view, cropBox, brush }, W, H);
      return;
    }
    if (!S.body) return;
    fitCanvas(S.body.canvas.width, S.body.canvas.height);
    drawComposite(ctx, S.live, S.body.view || S.body.canvas);
    painted = { rev, fast: !!S.live };
  }

  /*
   * Fotot med alla tatueringar. live (se S.live): medan något dras hoppar ritningen över hudens struktur för den
   * valda tatueringen, och medan den rör sig läggs den på som en färdig bild. De andra ändras inte under tiden,
   * så de ritas en gång i full kvalitet tillsammans med fotot (backdrop). Allt ritas i full kvalitet när fingret släpper.
   */
  function drawComposite(c2d, live, photo = S.body.canvas) {
    const { canvas } = S.body;
    c2d.imageSmoothingQuality = 'high';
    const under = live && S.motifs.length > 1 ? backdrop(photo) : null;
    c2d.drawImage(under || photo, 0, 0);
    S.motifs.forEach((m, i) => {
      const fast = !!live && i === S.mi;
      if (under && !fast) return;
      E.drawMotif(c2d, m, m.o, m.pl, canvas.width, canvas.height, { multiply: true, skin: canvas, fast, moving: fast && live === 'move' });
    });
  }

  let back = null; // { photo, mi, motifs, canvas }: fotot med alla tatueringar utom den valda
  function backdrop(photo) {
    if (back && back.photo === photo && back.mi === S.mi && back.motifs === S.motifs) return back.canvas;
    dropBackdrop();
    const { width, height } = S.body.canvas;
    const canvas = E.newCanvas(width, height);
    const c2d = canvas.getContext('2d');
    if (!c2d) return null; // då ritas alla som vanligt, bara långsammare
    c2d.imageSmoothingQuality = 'high';
    c2d.drawImage(photo, 0, 0);
    S.motifs.forEach((m, i) => {
      if (i !== S.mi) E.drawMotif(c2d, m, m.o, m.pl, width, height, { multiply: true, skin: S.body.canvas });
    });
    back = { photo, mi: S.mi, motifs: S.motifs, canvas };
    return canvas;
  }
  function dropBackdrop() {
    if (back) E.release(back.canvas);
    back = null;
  }

  /* Snabb ritning medan något dras: 'move', 'still' eller false. När det släpps ritas allt i full kvalitet. */
  let liveTimer = 0;
  function setLive(mode) {
    clearTimeout(liveTimer);
    if (S.live === mode) return;
    S.live = mode;
    if (!mode) dropBackdrop();
    requestRender();
  }

  /* ================================================================ spara */

  let rev = 0; // ökar vid varje ändring som syns i den sparade bilden
  let painted = { rev: -1, fast: true }; // vad som syns på skärmen just nu
  let ready = null; // { rev, file }: bilden förbereds i bakgrunden, så att Spara svarar direkt
  let prepTimer = 0;

  function changed() {
    rev++;
    requestRender();
    clearTimeout(prepTimer);
    prepTimer = setTimeout(prepare, 450);
  }

  function fileName() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${T.fileBase}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`;
  }

  /* Bilden som sparas. Visar skärmen redan den färdiga bilden används den, annars ritas den på nytt. */
  async function makeFile() {
    let c = cv;
    if (S.screen !== 'place' || painted.rev !== rev || painted.fast) {
      c = E.newCanvas(S.body.canvas.width, S.body.canvas.height);
      drawComposite(c.getContext('2d'), false);
    }
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    if (c !== cv) E.release(c);
    if (!blob) throw new Error('toBlob');
    return new File([blob], fileName(), { type: 'image/jpeg' });
  }

  async function prepare() {
    if (S.screen !== 'place' || !S.body || !motif()) return;
    if (S.live || pointers.size) { prepTimer = setTimeout(prepare, 450); return; } // inte mitt i en gest
    const at = rev;
    try {
      const file = await makeFile();
      if (at === rev) ready = { rev: at, file };
    } catch {
      /* görs om när du trycker på Spara */
    }
  }

  function download(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function currentFile() {
    if (ready && ready.rev === rev) return ready.file;
    try {
      return await makeFile();
    } catch {
      toast(T.makeFailed);
      return null;
    }
  }

  /* Ikonen på bilden. På telefonen öppnas delningsarket, där "Spara bild" lägger bilden i Bilder. Annars laddas den ner. */
  async function save() {
    if (!S.body || !motif()) return;
    const file = await currentFile();
    if (!file) return;
    if (TOUCH && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    download(file);
    toast(T.saved);
  }

  /*
   * Ett fingeravtryck av bilden som den laddades in: 24 x 24 i gråskala, och formen. Samma bild ger samma avtryck
   * även när den är omsparad eller förminskad, som bilderna från förfrågan. Två foton av samma ark, tagna
   * var för sig, skiljer sig mer än så och räknas som olika.
   */
  const PRINT = 24;
  function fingerprint(c) {
    const p = E.newCanvas(PRINT, PRINT);
    const x = p.getContext('2d', { willReadFrequently: true });
    if (!x) return null;
    x.imageSmoothingQuality = 'high';
    x.drawImage(c, 0, 0, PRINT, PRINT);
    const d = x.getImageData(0, 0, PRINT, PRINT).data;
    E.release(p);
    const gray = new Uint8Array(PRINT * PRINT);
    for (let i = 0; i < gray.length; i++) gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    return { aspect: c.width / c.height, gray };
  }

  function sameImage(a, b) {
    if (!a || !b || Math.abs(a.aspect - b.aspect) > 0.02 * a.aspect) return false;
    let diff = 0;
    for (let i = 0; i < a.gray.length; i++) diff += Math.abs(a.gray[i] - b.gray[i]);
    return diff / a.gray.length < 4;
  }

  /*
   * Originalen som skickas med: ett per bild. Har kunden lagt in samma bild flera gånger, till exempel för att
   * sudda fram olika motiv ur samma ark, räcker det med en. Bilder som redan finns i förfrågan skickas inte.
   */
  function uniqueOriginals() {
    const seen = S.motifs.filter((m) => m.fromForm).map((m) => m.print);
    const files = [];
    for (const m of S.motifs) {
      if (!m.file || m.fromForm || seen.some((p) => sameImage(p, m.print))) continue;
      seen.push(m.print);
      files.push(m.file);
    }
    return files;
  }

  const fullText = () => T.full(MOTIFS_MAX);

  /*
   * Skicka till tatueraren: bilden med tatueringarna på kroppen och originalen av motiven som kunden lade in.
   * Bilden visar placering och storlek, och originalen visar designen i full upplösning, utan rensning och hud.
   * Delningsarket öppnas, och kunden väljer själv hur och till vem (meddelande, Instagram, mejl). Tar appen inte
   * emot flera bilder skickas bara den första. Utan delningsark laddas alla ner.
   */
  async function send() {
    if (!S.body || !motif()) return;
    const file = await currentFile();
    if (!file) return;
    const originals = uniqueOriginals();
    if (host) {
      // I studions förfrågan läggs bilderna i formuläret som inspirationsbilder och följer med när kunden skickar.
      sent = snapshot();
      host.postMessage({ type: 'tryon:send', files: [file, ...originals] }, location.origin);
      report('added');
      return;
    }
    const tries = originals.length ? [[file, ...originals], [file]] : [[file]];
    for (const files of tries) {
      if (!navigator.canShare || !navigator.canShare({ files })) continue;
      try {
        await navigator.share({ files, text: T.sendText[Math.min(files.length, 3)] }); // efter antalet bilder: 1, 2 eller fler
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    tries[0].forEach(download);
    toast(T.downloaded(tries[0].length), 6000);
  }

  /*
   * Inbäddad i förfrågan: sidan runt omkring skickar motiven som kunden redan har bifogat (tryon:motifs), och
   * får tillbaka bilderna (tryon:send) eller ett besked om att kunden stängde (tryon:close). Provningen ligger
   * kvar om kunden öppnar den igen.
   */
  let preset = []; // motiven från förfrågan, som läggs in när fotot är taget
  function onHostMessage(e) {
    if (e.source !== host || e.origin !== location.origin) return;
    const d = e.data || {};
    if (d.type === 'tryon:motifs' && Array.isArray(d.files)) preset = d.files.filter((f) => f instanceof Blob);
  }

  /*
   * Krysset tar tillbaka formuläret, som står kvar bakom provningen precis som kunden lämnade det. Finns det en
   * bild som inte är lagd i förfrågan frågar det först, så att provningen inte försvinner av misstag.
   */
  let sent = null; // läget när bilderna senast lades i förfrågan
  const askClose = $('#askClose');
  function closeToForm() {
    const unsent = S.body && motif() && !(sent && samePicture(sent, snapshot()));
    if (unsent && typeof askClose.showModal === 'function') {
      askClose.showModal();
      return;
    }
    host.postMessage({ type: 'tryon:close' }, location.origin);
  }

  /* ================================================================ placera: dra, nyp, vrid och ramen */

  const pointers = new Map();
  let gesture = null; // drag | pinch | handle, med läget när gesten började
  let tap = null; // första fingret, tills det har rört sig: då är det en tryckning som väljer eller släpper tatueringen

  /*
   * Pekarens läge i bilden, 0 till 1. Fungerar även utanför bilden, så att det går att nypa på hela ytan.
   * r är canvasens läge på skärmen. Under en gest läses det en gång, så att varje rörelse slipper räkna om sidan.
   */
  function norm(e, r = cv.getBoundingClientRect()) {
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  /* Rakt, på sidan eller upp och ner: vridningen fastnar där när den är nära, så att det är lätt att få den rak. */
  const snapRot = (d) => [-180, -90, 0, 90, 180].find((t) => Math.abs(d - t) < 4) ?? d;

  /*
   * Den synliga delen av motivet m på skärmen (m.box): mitten, bredd och höjd i pixlar inom r (canvasens läge).
   * Motivet vrids och speglas runt hela bildens mitt, som när det ritas, så rutans mitt följer med.
   */
  function boxOn(m, r) {
    const { pl } = m;
    const b = m.box || FULL_BOX;
    const w = pl.scale * r.width;
    const h = (w * m.src.height) / m.src.width;
    const ox = ((b.x0 + b.x1) / 2 - 0.5) * w * (pl.flip ? -1 : 1);
    const oy = ((b.y0 + b.y1) / 2 - 0.5) * h;
    const a = (pl.rot * Math.PI) / 180;
    return {
      cx: pl.x * r.width + ox * Math.cos(a) - oy * Math.sin(a),
      cy: pl.y * r.height + ox * Math.sin(a) + oy * Math.cos(a),
      w: (b.x1 - b.x0) * w,
      h: (b.y1 - b.y0) * h,
    };
  }

  /* Är punkten p (0 till 1 i bilden) på tatueringen m? Med lite marginal, så att en smal tatuering går att träffa. */
  function onMotif(m, p, r) {
    if (!m) return false;
    const g = boxOn(m, r);
    const a = (-m.pl.rot * Math.PI) / 180;
    const dx = p.x * r.width - g.cx;
    const dy = p.y * r.height - g.cy;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(lx) <= Math.max(g.w, SEL_MIN) / 2 + 14 && Math.abs(ly) <= Math.max(g.h, SEL_MIN) / 2 + 14;
  }

  /* Tatueringen under punkten: den valda om den träffas, annars den som ligger överst. -1 om ingen. */
  function motifAt(p, r) {
    if (onMotif(motif(), p, r)) return S.mi;
    for (let i = S.motifs.length - 1; i >= 0; i--) if (onMotif(S.motifs[i], p, r)) return i;
    return -1;
  }

  function startGesture(rect, srect) {
    const pts = [...pointers.values()];
    if (pts.length === 1) {
      gesture = { type: 'drag', rect, srect, px: pts[0].x, py: pts[0].y, x0: S.pl.x, y0: S.pl.y };
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      const dx = (b.x - a.x) * cv.width;
      const dy = (b.y - a.y) * cv.height;
      gesture = {
        type: 'pinch', rect, srect, d0: Math.hypot(dx, dy) || 1, a0: Math.atan2(dy, dx),
        s0: S.pl.scale, r0: S.pl.rot, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, x0: S.pl.x, y0: S.pl.y,
      };
    }
  }

  function updateGesture() {
    if (!gesture) return;
    const pts = [...pointers.values()];
    if (gesture.type === 'drag') {
      S.pl.x = clamp(gesture.x0 + (pts[0].x - gesture.px), 0, 1);
      S.pl.y = clamp(gesture.y0 + (pts[0].y - gesture.py), 0, 1);
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      const dx = (b.x - a.x) * cv.width;
      const dy = (b.y - a.y) * cv.height;
      S.pl.scale = clamp(gesture.s0 * (Math.hypot(dx, dy) / gesture.d0), 0.03, 1);
      S.pl.rot = snapRot(normDeg(gesture.r0 + ((Math.atan2(dy, dx) - gesture.a0) * 180) / Math.PI));
      S.pl.x = clamp(gesture.x0 + ((a.x + b.x) / 2 - gesture.mx), 0, 1);
      S.pl.y = clamp(gesture.y0 + ((a.y + b.y) / 2 - gesture.my), 0, 1);
    }
    moved();
  }

  /* Placeringen har ändrats av en gest: snabb ritning, reglagen och ramen följer med. */
  function moved() {
    S.selected = true;
    setLive('move');
    syncAdjust();
    changed();
    placeSel(gesture && gesture.rect, gesture && gesture.srect);
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, label, input, .sel-handle')) return;
    if (S.zoom || focusOn) { zoomDown(e); return; }
    if (S.screen === 'edit') { editDown(e); return; }
    if (S.screen !== 'place' || !motif() || (gesture && gesture.type === 'handle')) return;
    hideCoach();
    stage.setPointerCapture(e.pointerId);
    const rect = gesture ? gesture.rect : cv.getBoundingClientRect();
    const srect = gesture ? gesture.srect : stage.getBoundingClientRect();
    if (!pointers.size) {
      // Fingret på en annan tatuering väljer den, så att det är den som flyttas. Bredvid alla flyttas den valda.
      const hit = motifAt(norm(e, rect), rect);
      if (hit >= 0 && hit !== S.mi) chooseMotif(hit);
      begin();
      tap = { x: e.clientX, y: e.clientY };
    } else {
      tap = null; // två fingrar är aldrig en tryckning
    }
    pointers.set(e.pointerId, norm(e, rect));
    startGesture(rect, srect);
  });
  stage.addEventListener('pointermove', (e) => {
    if (S.zoom || focusOn) { zoomMove(e); return; }
    if (S.screen === 'edit') { editMove(e); return; }
    if (!pointers.has(e.pointerId)) return;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) <= TAP_PX) return; // än så länge en tryckning
    tap = null;
    pointers.set(e.pointerId, norm(e, gesture.rect));
    updateGesture();
  });
  const endPointer = (e) => {
    if (S.zoom || focusOn) { zoomUp(e); return; }
    if (S.screen === 'edit') { editUp(e, e.type === 'pointerup'); return; }
    if (!pointers.delete(e.pointerId)) return;
    if (pointers.size) { startGesture(gesture.rect, gesture.srect); return; }
    // En tryckning på tatueringen visar ramen, en tryckning bredvid tar bort den, så att bilden syns ren.
    if (tap && e.type === 'pointerup') S.selected = onMotif(motif(), norm(e, gesture.rect), gesture.rect);
    tap = null;
    gesture = null;
    setLive(false);
    commit();
    placeSel();
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('contextmenu', (e) => { if (S.screen !== 'start') e.preventDefault(); });

  /*
   * Handtaget i hörnet: dra ut eller in för storleken, runt för att vrida. Räknas från mitten av det som syns
   * (ramens mitt), som står still, så att ramen följer fingret även när motivet inte sitter mitt i sin bild.
   */
  const handle = $('#selHandle');
  handle.addEventListener('pointerdown', (e) => {
    if (gesture || S.screen !== 'place' || !motif()) return;
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    hideCoach();
    begin();
    const rect = cv.getBoundingClientRect();
    const box = boxOn(motif(), rect);
    const cx = rect.left + box.cx;
    const cy = rect.top + box.cy;
    gesture = {
      type: 'handle', id: e.pointerId, rect, srect: stage.getBoundingClientRect(), cx, cy,
      // motivets mitt sett från ramens mitt, i skärmens pixlar
      px: rect.left + S.pl.x * rect.width - cx, py: rect.top + S.pl.y * rect.height - cy,
      d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, a0: Math.atan2(e.clientY - cy, e.clientX - cx), s0: S.pl.scale, r0: S.pl.rot,
    };
  });
  handle.addEventListener('pointermove', (e) => {
    if (!gesture || gesture.type !== 'handle' || gesture.id !== e.pointerId) return;
    const g = gesture;
    S.pl.scale = clamp(g.s0 * (Math.hypot(e.clientX - g.cx, e.clientY - g.cy) / g.d0), 0.03, 1);
    S.pl.rot = snapRot(normDeg(g.r0 + ((Math.atan2(e.clientY - g.cy, e.clientX - g.cx) - g.a0) * 180) / Math.PI));
    const k = S.pl.scale / g.s0;
    const a = ((S.pl.rot - g.r0) * Math.PI) / 180;
    S.pl.x = (g.cx - g.rect.left + k * (g.px * Math.cos(a) - g.py * Math.sin(a))) / g.rect.width;
    S.pl.y = (g.cy - g.rect.top + k * (g.px * Math.sin(a) + g.py * Math.cos(a))) / g.rect.height;
    moved();
  });
  const handleUp = (e) => {
    if (!gesture || gesture.type !== 'handle' || gesture.id !== e.pointerId) return;
    gesture = null;
    setLive(false);
    commit();
    placeSel();
  };
  handle.addEventListener('pointerup', handleUp);
  handle.addEventListener('pointercancel', handleUp);
  $('#selDelete').addEventListener('click', () => act(() => removeMotif(S.mi)));

  /*
   * Ramen runt tatueringen, med kryss och handtag. Den ligger ovanpå canvasen som vanliga element, så att den
   * inte kommer med när bilden sparas och inte behöver ritas om när den visas eller döljs.
   */
  const sel = $('#sel');
  function placeSel(r = null, s = null) {
    const m = motif();
    const show = S.screen === 'place' && S.selected && !!m && !!S.body && !S.zoom;
    sel.hidden = !show;
    if (!show) return;
    r = r || cv.getBoundingClientRect();
    s = s || stage.getBoundingClientRect();
    // Ramen sluter tätt kring det som syns av motivet, inte kring hela bilden det kom från.
    const g = boxOn(m, r);
    const w = Math.max(g.w + 2 * SEL_PAD, SEL_MIN);
    const h = Math.max(g.h + 2 * SEL_PAD, SEL_MIN);
    sel.style.width = `${w}px`;
    sel.style.height = `${h}px`;
    sel.style.transform = `translate(${r.left - s.left + g.cx - w / 2}px, ${r.top - s.top + g.cy - h / 2}px) rotate(${S.pl.rot}deg)`;
    sel.style.setProperty('--unrot', `${-S.pl.rot}deg`);
  }
  /* Spara-ikonen i bildens nedre högra hörn, ovanpå bilden men inte med i den sparade bilden. */
  const saveBtn = $('#btnSaveImg');
  const SAVE_INSET = 10;
  function placeSaveBtn() {
    const show = S.screen === 'place' && !!motif() && !!S.body && !S.zoom && !focusOn; // i fokus kan hörnet ligga utanför ytan
    saveBtn.hidden = !show;
    if (!show) return;
    const r = cv.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const x = r.right - s.left - saveBtn.offsetWidth - SAVE_INSET;
    const y = r.bottom - s.top - saveBtn.offsetHeight - SAVE_INSET;
    saveBtn.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  // Bilden ändrar storlek när fotot byts, ett ark öppnas eller telefonen vrids.
  const resized = new ResizeObserver(() => {
    if (S.zoom) { zv = { z: 1, x: 0, y: 0 }; applyZoom(); } // telefonen vreds: börja om från hela bilden
    else if (focusOn) syncFocus(false); // tatueringen hålls mitt i bild
    if (gliding) return;
    placeSel();
    placeSaveBtn();
  });
  resized.observe(stage);
  resized.observe(cv);

  // Datorn: skrolla för storlek, Shift och skrolla för vridning, eller penselstorlek när du suddar.
  let wheelTimer = 0;
  stage.addEventListener('wheel', (e) => {
    const dy = e.deltaY || e.deltaX;
    if (S.screen === 'edit' && S.tab === 'erase') {
      e.preventDefault();
      S.brush = clamp(S.brush - Math.sign(dy) * 0.5, 1, 15);
      syncEdit();
      requestRender();
      return;
    }
    if (S.zoom || focusOn) {
      // Helskärm och fokus: hjulet förstorar bilden där pekaren står, inte tatueringen.
      e.preventDefault();
      endGlide();
      zoomAt(zv.z * Math.exp(-dy * 0.0015), e.clientX, e.clientY);
      applyZoom();
      viewMoved();
      return;
    }
    if (S.screen !== 'place' || !motif()) return;
    e.preventDefault();
    begin();
    if (e.shiftKey || e.altKey) S.pl.rot = normDeg(S.pl.rot - Math.sign(dy) * 2);
    else S.pl.scale = clamp(S.pl.scale * Math.exp(-dy * 0.0012), 0.03, 1);
    moved();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { setLive(false); commit(); placeSel(); }, 250);
  }, { passive: false });

  /* ================================================================ placeringen: färgstyrkan och Spegla */

  /* Storlek och vridning har inga reglage: de görs med fingrarna, handtaget eller hjulet på bilden. */
  function syncAdjust() {
    const p = S.pl;
    const op = Math.round(p.opacity * 100);
    $('#rngOp').value = op;
    $('#outOp').textContent = T.percent(op);
    $('#tFlip').setAttribute('aria-pressed', String(p.flip));
  }

  /* ================================================================ Motiv-arket */

  /*
   * Miniatyren visar tatueringen som den blir, utan papper. Samtidigt räknas den synliga delen ut, för ramen,
   * och miniatyren visar bara den, så att två motiv ur samma ark går att skilja åt.
   */
  function cleanThumb(m) {
    const { art } = E.buildClean(m, m.o);
    m.box = inkBox(art);
    const b = m.box;
    const sx = Math.floor(b.x0 * art.width);
    const sy = Math.floor(b.y0 * art.height);
    const sw = Math.ceil(b.x1 * art.width) - sx;
    const sh = Math.ceil(b.y1 * art.height) - sy;
    const part = sw < art.width || sh < art.height ? E.newCanvas(sw, sh) : null;
    const x = part && part.getContext('2d');
    if (x) x.drawImage(art, sx, sy, sw, sh, 0, 0, sw, sh);
    m.cleanThumb = E.thumbOf(x ? part : art, 128, true);
    if (part) E.release(part);
  }

  /*
   * Den del av motivet där det syns något, i andelar av motivet: { x0, y0, x1, y1 }. Ramen och träffytan följer
   * den, så att ett motiv där det mesta är bortsuddat inte tar plats för de andra. Bläcket läggs på med multiply,
   * så det som syns är täckningen gånger hur mörk färgen är; pappersvitt utan rensning räknas alltså inte.
   * Räknas på en förminskad kopia, och ett dammkorn långt ut (en promille av bläcket) får hamna utanför.
   */
  const BOX_SIZE = 256;
  function inkBox(art) {
    const k = Math.min(1, BOX_SIZE / Math.max(art.width, art.height));
    const w = Math.max(1, Math.round(art.width * k));
    const h = Math.max(1, Math.round(art.height * k));
    const c = E.newCanvas(w, h);
    const x = c.getContext('2d', { willReadFrequently: true });
    if (!x) return FULL_BOX;
    x.drawImage(art, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data;
    E.release(c);
    const cols = new Float64Array(w);
    const rows = new Float64Array(h);
    let total = 0;
    for (let y = 0, i = 0; y < h; y++) {
      for (let xx = 0; xx < w; xx++, i += 4) {
        const v = d[i + 3] * (255 - Math.min(d[i], d[i + 1], d[i + 2]));
        if (v < 255 * 16) continue; // knappt synligt
        cols[xx] += v;
        rows[y] += v;
        total += v;
      }
    }
    if (!total) return FULL_BOX;
    const span = (sums) => {
      let a = 0;
      for (let acc = 0; a < sums.length - 1; a++) if ((acc += sums[a]) > total * 0.001) break;
      let b = sums.length - 1;
      for (let acc = 0; b > a; b--) if ((acc += sums[b]) > total * 0.001) break;
      return [a / sums.length, (b + 1) / sums.length];
    };
    const [x0, x1] = span(cols);
    const [y0, y1] = span(rows);
    return { x0, y0, x1, y1 };
  }

  function renderTray() {
    const tray = $('#motifTray');
    $$('.thumb', tray).forEach((n) => n.remove());
    const add = $('.tile.add', tray);
    S.motifs.forEach((m, i) => {
      const pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'pick';
      pick.setAttribute('aria-pressed', String(i === S.mi));
      pick.setAttribute('aria-label', T.tattooN(i + 1));
      const img = document.createElement('img');
      img.src = m.cleanThumb || m.thumb;
      img.alt = '';
      pick.append(img);
      pick.addEventListener('click', () => chooseMotif(i));
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'x';
      x.textContent = '×';
      x.setAttribute('aria-label', T.removeTattooN(i + 1));
      x.addEventListener('click', () => act(() => removeMotif(i)));
      const wrap = document.createElement('div');
      wrap.className = 'thumb';
      wrap.append(pick, x);
      tray.insertBefore(wrap, add);
    });
    // Vid max försvinner Lägg till, och texten under säger varför.
    const full = S.motifs.length >= MOTIFS_MAX;
    add.hidden = full;
    $('#motifNote').textContent = full ? T.trayFull(MOTIFS_MAX) : T.trayNote(MOTIFS_MAX);
    syncPics();
  }

  /* Byt motiv och Byt foto visar en liten bild av motivet och fotot, så att det syns vilken knapp som byter vad. */
  function syncPics() {
    const m = motif();
    const url = m && (m.cleanThumb || m.thumb);
    if (url && $('#motifPic').getAttribute('src') !== url) $('#motifPic').src = url;
    const b = S.body;
    if (b && b.picOf !== b.canvas) {
      b.picOf = b.canvas;
      $('#photoPic').src = E.thumbOf(b.canvas, 96);
    }
  }

  /* Väljer vilken tatuering verktygen gäller. Alla syns redan, så bilden ändras inte, och det är inget steg att ångra. */
  function chooseMotif(i) {
    S.mi = i;
    S.selected = true;
    renderTray();
    syncAdjust();
    syncSettings();
    placeSel();
  }

  function removeMotif(i) {
    S.motifs = S.motifs.filter((_, k) => k !== i); // en ny lista, eftersom ångra sparar den gamla
    if (!S.motifs.length) S.mi = -1;
    else if (i < S.mi || S.mi >= S.motifs.length) S.mi -= 1;
    S.selected = false;
    renderTray();
    syncSettings();
    if (!motif()) setScreen('needMotif');
    changed();
    placeSel();
  }

  /* ================================================================ ångra */

  /*
   * Ångra och gör om i placeringen: varje steg är en ögonblicksbild från innan kunden gjorde något. En gest, ett
   * drag i ett reglage och allt som görs i Sudda, Ringa in, Beskär och Vitt bläck blir ett steg var. Bilden av
   * tatueringen sparas som referenser (E.motifState), som motorn aldrig ändrar på plats (se pushUndo i engine.js).
   * Det som ångrats går att göra om tills kunden gör något nytt.
   * I Sudda och de andra verktygen ångrar och gör pilarna i stället om ett penseldrag i taget.
   */
  const past = [];
  const future = []; // det som ångrats, för Gör om
  let pending = null; // ögonblicksbilden från när något började, tills det är klart

  function snapshot() {
    return {
      body: S.body, autoLight: S.autoLight, mi: S.mi, motifs: S.motifs,
      states: S.motifs.map((m) => ({ o: { ...m.o }, auto: m.auto, pl: { ...m.pl }, rev: m.rev, eraseRev: m.eraseRev, content: E.motifState(m) })),
    };
  }

  /* Samma bild: samma foto och samma tatueringar, inställda och placerade likadant. same kräver också samma val. */
  const picture = (s) => JSON.stringify([s.autoLight, s.states.map((x) => [x.o, x.pl, x.rev, x.eraseRev])]);
  function samePicture(a, b) {
    return a.body === b.body && a.motifs.length === b.motifs.length && a.motifs.every((m, i) => m === b.motifs[i]) && picture(a) === picture(b);
  }
  const same = (a, b) => a.mi === b.mi && samePicture(a, b);

  function remember(s = snapshot()) {
    past.push(s);
    if (past.length > HISTORY_MAX) past.shift();
    future.length = 0; // något nytt är gjort, så det som ångrats går inte längre att göra om
    syncUndo();
  }
  function begin() {
    if (!pending) pending = snapshot();
  }
  function commit() {
    if (pending && !same(pending, snapshot())) remember(pending);
    pending = null;
  }
  function act(fn) {
    begin();
    fn();
    commit();
  }

  /* Ångra tar ett steg från past och gör om ett från future. Läget just nu sparas i den andra listan. */
  const undoLast = () => travel(past, future);
  const redoLast = () => travel(future, past);

  function travel(from, to) {
    const s = from.pop();
    if (!s) return;
    to.push(snapshot());
    pending = null;
    S.body = s.body;
    S.autoLight = s.autoLight;
    if (S.body) useLight(S.body);
    S.motifs = s.motifs;
    s.motifs.forEach((m, i) => {
      const was = s.states[i];
      const content = m.rev !== was.rev || m.eraseRev !== was.eraseRev;
      const settings = JSON.stringify(m.o) !== JSON.stringify(was.o);
      if (content) E.restoreMotif(m, was.content);
      m.o = { ...was.o };
      m.auto = was.auto;
      m.pl = { ...was.pl };
      if (content || settings) cleanThumb(m); // miniatyren visar rensningen, så den ritas om även när bara reglagen ändrats
    });
    S.mi = s.mi;
    dropBackdrop();
    const screen = motif() ? 'place' : 'needMotif';
    if (S.screen !== screen) setScreen(screen);
    renderTray();
    syncAdjust();
    syncSettings();
    syncUndo();
    changed();
    placeSel();
  }

  function syncUndo() {
    const m = motif();
    const edit = S.screen === 'edit';
    $('#btnUndo').disabled = edit ? !m || !m.undo.length || ringing() : !past.length;
    $('#btnRedo').disabled = edit ? !m || !m.redo.length || ringing() : !future.length;
  }

  /* ================================================================ tatueringen för sig: ringa in, sudda, beskär, vitt bläck */

  let cropBox = null; // rutan medan du drar, i tatueringens pixlar
  let stroke = null; // pågående penseldrag, beskärning eller inringning
  let brushAt = null; // var penselringen ritas
  let ringPts = null; // ringen medan du drar, i fotots pixlar
  let ringResult = false; // Ringa in visar resultatet i stället för fotot

  const brushPx = (m) => (S.brush / 100) * Math.max(m.src.width, m.src.height);
  const ringing = () => S.tab === 'ring' && !ringResult;

  /* Pekarens läge i tatueringens pixlar, eller i fotots när du ringar in. */
  function motifPoint(e) {
    const m = motif();
    const c = ringing() ? m.photo : m.src;
    const p = norm(e);
    return { x: p.x * c.width, y: p.y * c.height };
  }

  /* Ringen är klar: tatueringen plockas ut, och resultatet visas. */
  async function finishRing(m, pts) {
    const long = Math.max(m.photo.width, m.photo.height);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    if (Math.max(...xs) - Math.min(...xs) < long * 0.04 || Math.max(...ys) - Math.min(...ys) < long * 0.04) {
      toast(T.ringTooSmall);
      return;
    }
    const o = await busy(T.ringing, async () => E.ringMotif(m, pts));
    if (!o) return;
    m.o = o;
    m.auto = { ...o };
    cleanThumb(m);
    renderTray();
    syncSettings();
    fitMotif();
    changed();
    if (m.warning === 'empty') { toast(T.ringEmpty); return; }
    ringResult = true;
    syncEdit();
  }

  function editDown(e) {
    const m = motif();
    if (!m) return;
    const pt = motifPoint(e);
    if (ringing()) {
      if (stroke) return;
      stage.setPointerCapture(e.pointerId);
      stroke = { id: e.pointerId };
      ringPts = [pt];
      requestRender();
      return;
    }
    if (S.tab === 'white') { tapWhite(m, pt); return; }
    if (stroke || (S.tab !== 'crop' && S.tab !== 'erase')) return;
    stage.setPointerCapture(e.pointerId);
    if (S.tab === 'crop') {
      stroke = { id: e.pointerId, start: pt };
      cropBox = E.boxOf(pt, pt);
    } else {
      E.pushUndo(m);
      stroke = { id: e.pointerId, last: pt };
      brushAt = pt;
      E.paintErase(m, pt, pt, brushPx(m));
      syncEdit();
    }
    requestRender();
  }

  function editMove(e) {
    const m = motif();
    if (!m) return;
    const pt = motifPoint(e);
    if (ringing()) {
      if (!stroke || stroke.id !== e.pointerId) return;
      const last = ringPts[ringPts.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) < Math.max(m.photo.width, m.photo.height) / 300) return;
      ringPts.push(pt);
      requestRender();
      return;
    }
    if (e.pointerType === 'mouse' || stroke) brushAt = pt;
    if (stroke && stroke.id === e.pointerId) {
      if (S.tab === 'crop') cropBox = E.boxOf(stroke.start, pt);
      else { E.paintErase(m, stroke.last, pt, brushPx(m)); stroke.last = pt; }
    }
    if (stroke || S.tab === 'erase') requestRender();
  }

  function editUp(e, commit) {
    if (ringing()) {
      if (!stroke || stroke.id !== e.pointerId) return;
      const pts = ringPts;
      stroke = null;
      ringPts = null;
      requestRender();
      if (commit) finishRing(motif(), pts);
      return;
    }
    if (e.pointerType !== 'mouse') brushAt = null;
    if (stroke && stroke.id === e.pointerId) {
      if (commit && S.tab === 'crop' && cropBox && E.applyCrop(motif(), cropBox)) motifEdited();
      stroke = null;
      cropBox = null;
    }
    requestRender();
  }

  function tapWhite(m, pt) {
    const res = E.toggleWhite(m, pt, m.o);
    if (res === 'none') toast(T.whiteNone);
    else if (res === 'edge') toast(T.whiteEdge);
    else motifEdited();
  }

  function motifEdited() {
    renderTray();
    syncEdit();
    requestRender();
  }

  function syncEdit() {
    const m = motif();
    if (!m) return;
    $$('.tab-body').forEach((n) => { n.hidden = n.dataset.tab !== S.tab; });
    $$('.swatch').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
    $('.swatches').hidden = ringing(); // bakgrunden gäller tatueringen, inte fotot
    $('#ringHint').textContent = ringResult ? T.ringDone : T.ringHint;
    $('#ringActions').hidden = !ringResult;
    syncUndo();
    $('#rngBrush').value = S.brush;
    $('#outBrush').textContent = T.percent(S.brush);
  }

  /* ================================================================ helskärm: bara bilden */

  /*
   * Bilden för sig, utan verktyg. Här flyttar fingrarna inte tatueringen: nyp förstorar, ett finger flyttar
   * runt i den förstorade bilden och dubbeltryck växlar mellan hela bilden och 2,5 gånger. Förstoringen är en
   * CSS-transform på canvasen, så ingenting behöver ritas om.
   */
  let zv = { z: 1, x: 0, y: 0 }; // förstoringen och förskjutningen, i skärmens pixlar
  const zoomPointers = new Map();
  let zoomGesture = null;
  let lastTap = null;

  function setZoom(on) {
    if (S.zoom === on) return;
    S.zoom = on;
    app.toggleAttribute('data-zoom', on);
    $('#btnZoomClose').hidden = !on;
    zoomPointers.clear();
    zoomGesture = null;
    zv = { z: 1, x: 0, y: 0 };
    applyZoom();
    focusOn = false; // helskärmen börjar på hela bilden, och efteråt förstoras den runt tatueringen igen om arket är öppet
    if (!on) syncFocus(false);
    if (on) hideCoach();
    placeSel();
    placeSaveBtn();
  }

  /* Håller bilden på plats: mindre än skärmen hamnar den i mitten, större täcker den hela ytan. */
  function applyZoom() {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const fit = (t, size, off, room) => (size <= room ? (room - size) / 2 - off : clamp(t, room - size - off, -off));
    zv.x = fit(zv.x, cv.offsetWidth * zv.z, cv.offsetLeft, sw);
    zv.y = fit(zv.y, cv.offsetHeight * zv.z, cv.offsetTop, sh);
    cv.style.transform = zv.z === 1 ? '' : `translate(${zv.x}px, ${zv.y}px) scale(${zv.z})`;
  }

  /* Förstorar till z med punkten (px, py) på skärmen kvar där den var i from. */
  function zoomAt(z, px, py, from = zv) {
    const s = stage.getBoundingClientRect();
    const bx = s.left + cv.offsetLeft;
    const by = s.top + cv.offsetTop;
    const qx = (px - bx - from.x) / from.z;
    const qy = (py - by - from.y) / from.z;
    zv.z = clamp(z, 1, ZOOM_MAX);
    zv.x = px - bx - zv.z * qx;
    zv.y = py - by - zv.z * qy;
  }

  /*
   * Fokus på tatueringen: medan Justera är öppet förstoras bilden runt den valda tatueringen, så att det syns vad
   * som ändras. Fingrarna förstorar och flyttar då bilden som i helskärmen (hjulet på datorn), och reglagen i
   * arket ändrar tatueringen. Klar tar tillbaka hela bilden. Samma förstoring som helskärmen (zv).
   */
  const FOCUS_SHEETS = ['adjust'];
  const FOCUS_ROOM = 1.6; // tatueringen tar ungefär 1 / 1,6 av ytan
  const FOCUS_MAX = 3;
  let focusOn = false; // bilden är förstorad runt tatueringen
  let focusTouched = false; // kunden har själv förstorat eller flyttat bilden sedan dess
  let gliding = 0; // medan bilden glider in eller ut står ramen still, och ritas på plats efteråt

  const viewing = () => S.screen === 'place' && FOCUS_SHEETS.includes(S.sheet) && !!motif() && !!S.body && !S.zoom;

  /* När ett ark öppnas eller stängs, och när ytan ändrar storlek. animate: glid in eller ut. */
  function syncFocus(animate) {
    const want = viewing();
    if (want !== focusOn) {
      focusOn = want;
      focusTouched = false;
      zv = want ? focusView() : { z: 1, x: 0, y: 0 };
      glide(animate);
    } else if (want && !focusTouched) {
      zv = focusView(); // ytan ändrade storlek: tatueringen hålls mitt i bild
      applyZoom();
    } else if (want) {
      applyZoom(); // kundens egen förstoring, bara hållen inom kanterna
    }
    if (!gliding) { placeSel(); placeSaveBtn(); }
  }

  /* Tillbaka till tatueringen, efter Nollställ som flyttar den. */
  function refocus() {
    if (!focusOn) return;
    focusTouched = false;
    zv = focusView();
    glide(true);
  }

  /* Förstoringen som visar den valda tatueringen mitt i ytan, med luft runt om. */
  function focusView() {
    const m = motif();
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const g = boxOn(m, { width: cv.offsetWidth, height: cv.offsetHeight });
    const a = (m.pl.rot * Math.PI) / 180;
    const bw = Math.abs(g.w * Math.cos(a)) + Math.abs(g.h * Math.sin(a)) || 1;
    const bh = Math.abs(g.w * Math.sin(a)) + Math.abs(g.h * Math.cos(a)) || 1;
    const z = clamp(Math.min(sw / (bw * FOCUS_ROOM), sh / (bh * FOCUS_ROOM)), 1, FOCUS_MAX);
    return { z, x: sw / 2 - cv.offsetLeft - z * g.cx, y: sh / 2 - cv.offsetTop - z * g.cy };
  }

  /*
   * Ramen ritas på plats när bilden har glidit klart (transitionend), inte efter en fast tid: går glidningen
   * långsammare blev ramen annars stående mitt i rörelsen. Reservtiden gäller när ingen glidning startar
   * (samma vy som förut). glideId gör att ett gammalt transitionend inte avslutar en nyare glidning.
   */
  let glideId = 0;
  function glide(animate) {
    endGlide();
    const smooth = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    cv.classList.toggle('glide', smooth);
    applyZoom();
    if (!smooth) return;
    sel.hidden = true;
    saveBtn.hidden = true;
    const id = ++glideId;
    const done = () => { if (id === glideId) endGlide(); };
    cv.addEventListener('transitionend', done, { once: true });
    gliding = setTimeout(done, 600);
  }
  /* Avslutar glidningen direkt (bilden hoppar till målet) och ritar ramen och ikonen. */
  function endGlide() {
    if (!gliding) return;
    clearTimeout(gliding);
    gliding = 0;
    cv.classList.remove('glide');
    placeSel();
    placeSaveBtn();
  }

  /* Kunden förstorade eller flyttade bilden i fokus: den vyn behålls, och ramen följer med. */
  function viewMoved() {
    if (!focusOn) return;
    focusTouched = true;
    placeSel();
  }

  function zoomStart() {
    const pts = [...zoomPointers.values()];
    const [a, b] = pts;
    zoomGesture = b
      ? { from: { ...zv }, d0: Math.hypot(b.x - a.x, b.y - a.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      : { from: { ...zv }, px: a.x, py: a.y };
  }

  function zoomDown(e) {
    endGlide(); // ett finger mitt i glidningen tar över därifrån
    stage.setPointerCapture(e.pointerId);
    zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    zoomStart();
    if (zoomPointers.size > 1) { lastTap = null; return; }
    const now = performance.now();
    if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
      if (zv.z > 1) zv = { z: 1, x: 0, y: 0 };
      else zoomAt(2.5, e.clientX, e.clientY);
      applyZoom();
      viewMoved();
      lastTap = null;
      zoomStart();
      return;
    }
    lastTap = { t: now, x: e.clientX, y: e.clientY };
  }

  function zoomMove(e) {
    if (!zoomPointers.has(e.pointerId) || !zoomGesture) return;
    zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = zoomGesture;
    const [a, b] = [...zoomPointers.values()];
    if (b && g.d0) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      zoomAt(g.from.z * (Math.hypot(b.x - a.x, b.y - a.y) / g.d0), g.mx, g.my, g.from);
      zv.x += mx - g.mx;
      zv.y += my - g.my;
      applyZoom();
      viewMoved();
    } else if (!b && g.px !== undefined && zv.z > 1) {
      zv.x = g.from.x + (a.x - g.px);
      zv.y = g.from.y + (a.y - g.py);
      applyZoom();
      viewMoved();
    }
  }

  function zoomUp(e) {
    if (!zoomPointers.delete(e.pointerId)) return;
    if (zoomPointers.size) zoomStart();
    else zoomGesture = null;
  }

  /* ================================================================ Justera: färgerna och rensningen */

  function syncSettings() {
    const m = motif();
    if (!m) return;
    $('#swClean').checked = m.o.clean;
    $('#swFlatten').checked = m.o.flatten;
    $('#rngCut').value = m.o.cut;
    $('#outCut').textContent = String(m.o.cut);
    $('#swClean').disabled = m.hasAlpha;
    $('#swFlatten').disabled = m.hasAlpha || !m.o.clean;
    $('#rngCut').disabled = m.hasAlpha || !m.o.clean;
    $('#alphaHint').hidden = !m.hasAlpha;
    $('#swLight').checked = S.autoLight;
    const gray = !!m.o.black || !!m.o.gray; // Färger i Justera
    $$('input[name="ink"]').forEach((r) => { r.checked = r.value === (gray ? 'gray' : 'color'); });
  }

  /*
   * Färger i Justera: som bilden, eller svartgrått. En penna eller stencil som automatiken gjorde svart
   * (o.black) får samma svarta igen. Andra motiv blir gråskala med samma rensning (o.gray).
   * auto: det automatiska, för Nollställ och Återställ.
   */
  function setInk(gray, auto = false) {
    const m = motif();
    const black = m.auto ? m.auto.black : m.o.black;
    m.o.black = gray || auto ? black : false;
    if (gray && !black) m.o.gray = true;
    else delete m.o.gray;
    paperChanged(true);
  }

  /* Rensningen ändrad: bilden ritas om direkt, miniatyren när reglaget släpps. */
  function paperChanged(done) {
    if (done) { cleanThumb(motif()); renderTray(); }
    syncSettings();
    changed();
  }

  /* ================================================================ koppla ihop */

  function pickFile(input, fn) {
    input.addEventListener('change', () => {
      const files = [...input.files];
      input.value = '';
      if (files.length) fn(files);
    });
  }
  // Varje knapp som väljer en bild har en egen filväljare inuti sig: data-pick säger om det är fotot eller motiv.
  $$('input[data-pick]').forEach((input) => pickFile(input, (files) => (input.dataset.pick === 'motif' ? addMotifs(files) : setBody(files[0]))));

  // Släppa filer på datorn: första gången blir det fotot, sedan tatueringar.
  const hasFiles = (e) => [...((e.dataTransfer && e.dataTransfer.types) || [])].includes('Files');
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (S.screen === 'edit') return;
    if (!S.body) setBody(e.dataTransfer.files[0]);
    else addMotifs(e.dataTransfer.files);
  });

  $('#tMotif').addEventListener('click', () => openSheet('motif'));
  $('#tPhoto').addEventListener('click', () => openSheet('photo'));
  $('#needPhotoSheet').addEventListener('click', () => openSheet('photo'));
  // Ett exempelfoto läggs in direkt. Finns flera väljer kunden i arket.
  $('#btnSampleBody').addEventListener('click', () => (lib.kroppar.length === 1 ? pickBody(lib.kroppar[0]) : openSheet('photo')));
  $('#tAdjust').addEventListener('click', () => openSheet('adjust'));
  $('#tFlip').addEventListener('click', () => act(() => { S.pl.flip = !S.pl.flip; syncAdjust(); changed(); }));
  $('#tClean').addEventListener('click', () => openEdit('erase'));
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => openSheet(null)));
  $('#btnZoom').addEventListener('click', () => setZoom(true));
  $('#btnZoomClose').addEventListener('click', () => setZoom(false));
  $('#btnRing').addEventListener('click', () => openEdit('ring'));
  $('#btnCrop').addEventListener('click', () => openEdit('crop'));
  $('#btnWhite').addEventListener('click', () => openEdit('white'));
  $('#btnRingAgain').addEventListener('click', () => { ringResult = false; syncEdit(); requestRender(); });
  $('#btnRingErase').addEventListener('click', () => openEdit('erase'));
  $('#btnSaveImg').addEventListener('click', save);
  $('#btnSend').addEventListener('click', send);

  /*
   * Reglagen: medan ett reglage dras ritas bilden snabbt, och ett helt drag blir ett steg att ångra. 'change'
   * kommer när fingret släpper. Står reglaget still en stund ritas allt ändå, så att hudens struktur syns.
   */
  function slider(input, mode, apply, done) {
    input.addEventListener('input', () => {
      begin();
      setLive(mode);
      liveTimer = setTimeout(() => setLive(false), 400);
      apply(Number(input.value));
    });
    input.addEventListener('change', () => {
      setLive(false);
      if (done) done();
      commit();
    });
  }
  slider($('#rngOp'), 'still', (v) => { S.pl.opacity = v / 100; syncAdjust(); changed(); });
  slider($('#rngCut'), 'still', (v) => { motif().o.cut = v; paperChanged(false); }, () => paperChanged(true));
  // Nollställ i Justera: placeringen och färgerna, som när tatueringen lades in.
  $('#btnResetPl').addEventListener('click', () => act(() => {
    fitMotif();
    const m = motif();
    if (m && m.auto && (m.o.gray || m.o.black !== m.auto.black)) setInk(false, true);
    changed();
    placeSel();
    refocus(); // tatueringen flyttade sig: bilden följer med
  }));
  $$('input[name="ink"]').forEach((r) => r.addEventListener('change', () => { if (motif()) act(() => setInk(r.value === 'gray')); }));

  $('#btnDone').addEventListener('click', () => {
    const m = motif();
    if (m) cleanThumb(m);
    renderTray();
    setScreen('place');
    changed();
    commit(); // allt som gjordes i verktyget blir ett steg att ångra
    if (m && m.warning === 'skin') toast(T.notRinged, 6000);
    else showCoach();
  });
  $('#btnUndo').addEventListener('click', () => {
    if (S.screen !== 'edit') { undoLast(); return; }
    const m = motif();
    if (m && E.undo(m)) motifEdited();
  });
  $('#btnRedo').addEventListener('click', () => {
    if (S.screen !== 'edit') { redoLast(); return; }
    const m = motif();
    if (m && E.redo(m)) motifEdited();
  });
  $$('.swatch').forEach((b) => b.addEventListener('click', () => { S.view = b.dataset.view; syncEdit(); requestRender(); }));
  const toggle = (input, fn) => input.addEventListener('change', () => act(() => fn(input.checked)));
  toggle($('#swClean'), (on) => { motif().o.clean = on; paperChanged(true); });
  toggle($('#swFlatten'), (on) => { motif().o.flatten = on; paperChanged(true); });
  toggle($('#swLight'), (on) => {
    S.autoLight = on;
    if (S.body) useLight(S.body);
    syncPics();
    changed();
  });
  $('#rngBrush').addEventListener('input', (e) => { S.brush = Number(e.target.value); syncEdit(); });

  /*
   * Återställ tatueringen: rensningen, brytarna, färgerna, färgstyrkan, ljuset i fotot och det som gjorts i Sudda,
   * Beskär och Vitt bläck går tillbaka till det som ställdes in automatiskt. En inringning står kvar, eftersom den
   * visar vilken tatuering det är; den görs om med Ringa in. Är inget ändrat säger den det.
   */
  function resetMotif() {
    const m = motif();
    const auto = m.auto || m.o;
    const settings = JSON.stringify(m.o) !== JSON.stringify(auto) || S.pl.opacity !== PL0.opacity || !S.autoLight;
    if (!E.reset(m) && !settings) {
      toast(T.nothingToReset);
      return;
    }
    m.o = { ...auto };
    S.pl.opacity = PL0.opacity;
    S.autoLight = true;
    if (S.body) useLight(S.body);
    syncPics();
    syncAdjust();
    paperChanged(true);
    toast(T.resetDone);
  }
  $('#btnResetMotif').addEventListener('click', () => { if (motif()) act(resetMotif); });

  // Ctrl+Z ångrar och Ctrl+Y gör om (Cmd+Z och Cmd+Shift+Z på Mac), som pilarna. Esc lämnar helskärmen.
  window.addEventListener('keydown', (e) => {
    if (askClose.open) return; // frågan vid krysset sköter sina egna tangenter
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (key === 'z' || key === 'y')) {
      const b = $(key === 'y' || e.shiftKey ? '#btnRedo' : '#btnUndo');
      if (S.zoom || b.hidden || b.disabled) return;
      e.preventDefault();
      b.click();
    } else if (e.key === 'Escape' && S.zoom) {
      setZoom(false);
    }
  });
  $('#btnFindWhite').addEventListener('click', () => {
    const m = motif();
    if (!m) return;
    const found = E.findWhite(m, m.o);
    if (!found) { toast(T.noWhite); return; }
    motifEdited();
    toast(T.whiteFound(found));
  });

  // Inbäddad i förfrågan: Skicka heter det den gör där, och texten om bilden säger vart den går.
  function hostTexts() {
    $('#privacyNote').textContent = T.privacyForm;
    $('#btnSend span').textContent = T.addToForm;
  }

  /*
   * SV och EN uppe till höger på startskärmen, som på inkrevenue. prova-text.js byter texterna i prova.html, och
   * här skrivs det om som prova.js har skrivit: rubrikerna, texterna under arken, reglagens värden och rutornas
   * namn. Byts språket på plats (setLang), så skrivs allt om oavsett läge. Inbäddad följer kundvyn sidans språk,
   * så där finns ingen växlare.
   */
  const langSwitch = $('#langSwitch');
  function syncLang() {
    $$('button', langSwitch).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === window.TryonText.lang)));
  }
  function relabel() {
    $('#topTitle').textContent = S.screen === 'edit' ? T.editTitles[S.tab] : T.title;
    $('#hPhoto').textContent = S.body ? T.changePhoto : T.choosePhoto;
    $('#toast').hidden = true; // står på det gamla språket
    if (host) hostTexts();
    syncLang();
    syncAdjust();
    if (S.screen === 'edit') syncEdit(); // annars visar den verktygens delar utanför verktyget
    if (S.motifs.length) renderTray(); // utan motiv står texten under arket i prova.html
    renderLibrary();
  }
  $$('button', langSwitch).forEach((b) => b.addEventListener('click', () => window.TryonText.setLang(b.dataset.lang)));
  window.TryonText.onChange(relabel);
  syncLang();

  // Inbäddad i förfrågan: krysset tar tillbaka formuläret.
  if (host) {
    $('#btnClose').hidden = false;
    $('#btnClose').addEventListener('click', closeToForm);
    $('#askSend').addEventListener('click', () => { askClose.close(); send(); });
    $('#askDiscard').addEventListener('click', () => { askClose.close(); host.postMessage({ type: 'tryon:close' }, location.origin); });
    $('#askStay').addEventListener('click', () => askClose.close());
    hostTexts();
    window.addEventListener('message', onHostMessage);
    host.postMessage({ type: 'tryon:ready' }, location.origin);
    report('opened');
  } else {
    langSwitch.hidden = false;
  }

  syncAdjust();
  setScreen('start');
  loadLibrary();
  if (!E) ensureEngine().catch(() => {}); // hämtas igen direkt, så att den finns när kunden har tagit fotot
})();
