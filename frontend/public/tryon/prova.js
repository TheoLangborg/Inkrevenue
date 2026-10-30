(() => {
  'use strict';

  /*
   * Prova din tatuering: kundvyn. Allt sker i webbläsaren, inget laddas upp.
   * Lägen: start (inget foto) -> needMotif (foto, ingen tatuering) -> place (placera) <-> edit (rensa tatueringen).
   * I place kan bilden också visas för sig i helskärm (S.zoom), där fingrarna förstorar i stället för att flytta.
   */

  let E = window.TryonEngine; // kan saknas om engine.js inte kom fram, se ensureEngine
  const $ = (sel, root = document) => root.querySelector(sel);
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
  // Inbäddad i studions förfrågan på inkrevenue (en iframe med ?inbaddad): Skicka lägger bilderna i formuläret.
  const host = new URLSearchParams(location.search).has('inbaddad') && window.parent !== window ? window.parent : null;

  const S = {
    screen: 'start',
    body: null, // { raw, fixed, canvas, view }: fixed är fotot med rättat ljus, canvas det som visas, view kopian på skärmen
    autoLight: true,
    motifs: [], mi: -1,
    pl: { ...PL0 },
    sheet: null, // adjust | motif | photo | advanced
    tab: 'erase', // verktyget när tatueringen visas för sig: ring | erase | crop | white
    view: 'checker',
    brush: 4, // procent av tatueringens längsta sida
    coached: false,
    selected: false, // ramen med kryss och handtag runt tatueringen
    live: false, // 'move' medan tatueringen flyttas, nyps eller vrids, 'still' medan ett reglage dras: snabb ritning
    zoom: false,
  };
  const motif = () => S.motifs[S.mi];
  const EDIT_TITLES = { ring: 'Ringa in', erase: 'Sudda', crop: 'Beskär', white: 'Vitt bläck' };
  // Ett foto av en tatuering på hud, eller ett foto med mer än motivet, ger ingen varning: då öppnas Ringa in direkt.
  const MOTIF_WARNINGS = {
    empty: 'Hittade ingen tatuering i bilden. Prova en tydligare bild med tatueringen mot vit bakgrund.',
  };

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
    $('#topTitle').textContent = name === 'edit' ? EDIT_TITLES[S.tab] : 'Prova din tatuering';
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
    $('#sheetAdvanced').hidden = S.sheet !== 'advanced';
    $('#placeTools').hidden = S.screen !== 'place' || !!S.sheet;
    $('#tAdjust').setAttribute('aria-pressed', String(S.sheet === 'adjust'));
    $('#tMotif').setAttribute('aria-pressed', String(S.sheet === 'motif'));
    $('#tPhoto').setAttribute('aria-pressed', String(S.sheet === 'photo'));
    if (S.sheet) hideCoach();
    if (S.sheet === 'advanced') syncAdvanced();
  }

  /*
   * Visar tatueringen för sig, med ett verktyg: Sudda från verktygsraden, Ringa in, Beskär och Vitt bläck från
   * Avancerat. Ringa in visar först fotot som det laddades in, och efter inringningen resultatet.
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

  async function setBody(file) {
    if (!file) return;
    if (!isImage(file)) { toast('Det där ser inte ut som en bild.'); return; }
    let body;
    try {
      body = await busy('Läser fotot', async () => {
        await ensureEngine();
        const raw = await E.fileToCanvas(file, BODY_MAX, true, BODY_MIN);
        const fixed = E.autoExposure(raw); // null om ljuset redan är okej
        const b = { raw, fixed };
        useLight(b);
        E.skinDetail(b.canvas); // hudens struktur räknas nu, medan spinnern syns, i stället för vid första ritningen
        return b;
      });
    } catch (err) {
      toast(`Fotot gick inte att läsa (${whyNot(err)}). Prova igen, eller välj fotot från bilderna.`, 9000);
      return;
    }
    // Ett nytt foto går inte att ångra. Det gamla släpps direkt, så att telefonen inte får slut på minne för
    // bilder, och det som redan gjorts med tatueringen går fortfarande att ångra och göra om, på det nya fotot.
    const old = S.body;
    S.body = body;
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
    if (msg === 'decode') return 'bildformatet går inte att läsa här';
    if (msg === 'canvas') return 'telefonens minne för bilder tog slut';
    if (msg === 'engine') return 'bildmotorn kom inte fram, ladda om sidan';
    if (msg.startsWith('engine: ')) return `bildmotorn startade inte: ${msg.slice(8, 120)}`;
    return `${(err && err.name) || 'Error'}: ${msg.slice(0, 90)}`;
  }

  /*
   * Bildmotorn (engine.js) saknas om filen inte kom fram, till exempel genom tunneln till telefonen, eller om
   * webbläsaren inte kunde köra den. Då hämtas den en gång till innan bilden läses. Kommer den ändå inte fram
   * säger felet vilket det var, och när den inte gick att köra även webbläsarens felmeddelande.
   */
  let engineError = '';
  window.addEventListener('error', (ev) => {
    if (String(ev.filename || '').includes('/engine.js')) engineError = `${ev.message} (rad ${ev.lineno})`;
  });
  function ensureEngine() {
    if (E) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `/engine.js?igen=${Date.now()}`;
      s.onload = () => {
        E = window.TryonEngine;
        if (E) resolve();
        else reject(new Error(`engine: ${engineError || 'okänt fel'}`));
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

  /* fromForm: motiven kom från förfrågan, så deras original skickas inte tillbaka dit en gång till. */
  async function addMotifs(fileList, fromForm = false) {
    const files = [...fileList].filter(isImage);
    if (!files.length) { toast('Det där ser inte ut som en bild.'); return; }
    const before = S.motifs.length;
    const was = snapshot();
    let warning = '';
    let skinAt = -1;
    await busy('Läser tatueringen', async () => {
      for (const f of files) {
        try {
          await ensureEngine();
          const m = E.newMotif(f.name, await E.fileToCanvas(f, MOTIF_MAX));
          m.file = f; // originalet i full upplösning, som skickas med till tatueraren
          m.fromForm = fromForm;
          m.o = E.autoPrepare(m); // pappret, skuggor, rensning, svarta linjer och tomma kanter ställs in automatiskt
          m.auto = { ...m.o }; // det automatiska, som Återställ tar tillbaka
          cleanThumb(m); // rensar nu, medan spinnern syns, i stället för vid första ritningen
          S.motifs = [...S.motifs, m]; // en ny lista, eftersom ångra sparar den gamla
          if (m.warning === 'skin') skinAt = S.motifs.length - 1;
          else warning = m.warning || warning;
        } catch (err) {
          toast(`Kunde inte läsa ${f.name} (${whyNot(err)}). Prova att spara den som JPG eller PNG.`, 9000);
        }
      }
    });
    if (S.motifs.length === before) return;
    remember(was);
    S.mi = skinAt >= 0 ? skinAt : S.motifs.length - 1;
    S.selected = true; // ramen visar direkt att hörnen går att dra i
    fitMotif();
    renderTray();
    syncAdvanced();
    changed();
    // Ett foto av en tatuering på hud, eller ett rörigt foto, går inte att rensa automatiskt. Kunden ringar in tatueringen direkt.
    if (skinAt >= 0) { openEdit('ring'); return; }
    if (warning) toast(MOTIF_WARNINGS[warning], 7000);
    if (S.screen === 'needMotif' || S.screen === 'place') setScreen('place');
    showCoach();
  }

  /* Ny tatuering: mitt i bilden, högst 40 procent av bildens bredd och höjd. */
  function fitMotif() {
    const m = motif();
    const b = S.body;
    let scale = PL0.scale;
    if (m && b) {
      const aspect = m.src.height / m.src.width;
      scale = Math.min(0.4, (0.4 * b.canvas.height) / (b.canvas.width * aspect));
    }
    S.pl = { ...PL0, scale: clamp(scale, 0.05, 1) };
    syncAdjust();
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
   * Fotot med tatueringen. live (se S.live): medan något dras hoppar ritningen över hudens struktur, och medan
   * tatueringen rör sig läggs den på som en färdig bild. Allt ritas i full kvalitet när fingret släpper.
   */
  function drawComposite(c2d, live, photo = S.body.canvas) {
    const { canvas } = S.body;
    c2d.imageSmoothingQuality = 'high';
    c2d.drawImage(photo, 0, 0);
    const m = motif();
    if (m) E.drawMotif(c2d, m, m.o, S.pl, canvas.width, canvas.height, { multiply: true, skin: canvas, fast: !!live, moving: live === 'move' });
  }

  /* Snabb ritning medan något dras: 'move', 'still' eller false. När det släpps ritas allt i full kvalitet. */
  let liveTimer = 0;
  function setLive(mode) {
    clearTimeout(liveTimer);
    if (S.live === mode) return;
    S.live = mode;
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
    return `tatuering-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`;
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
      toast('Kunde inte skapa bilden. Försök igen.');
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
    toast('Bilden är sparad.');
  }

  const SEND_TEXT = {
    1: 'Hej! Så här vill jag ha tatueringen.',
    2: 'Hej! Så här vill jag ha tatueringen. Första bilden visar placering och storlek, den andra är originalet av motivet.',
  };

  /*
   * Skicka till tatueraren: bilden med tatueringen på kroppen och originalet av motivet som kunden lade in.
   * Bilden visar placering och storlek, och originalet visar designen i full upplösning, utan rensning och hud.
   * Delningsarket öppnas, och kunden väljer själv hur och till vem (meddelande, Instagram, mejl). Tar appen inte
   * emot två bilder skickas bara den första. Utan delningsark laddas båda ner.
   */
  async function send() {
    const m = motif();
    if (!S.body || !m) return;
    const file = await currentFile();
    if (!file) return;
    if (host) {
      // I studions förfrågan läggs bilderna i formuläret som inspirationsbilder och följer med när kunden skickar.
      host.postMessage({ type: 'tryon:send', files: m.file && !m.fromForm ? [file, m.file] : [file] }, location.origin);
      return;
    }
    const tries = m.file ? [[file, m.file], [file]] : [[file]];
    for (const files of tries) {
      if (!navigator.canShare || !navigator.canShare({ files })) continue;
      try {
        await navigator.share({ files, text: SEND_TEXT[files.length] });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    tries[0].forEach(download);
    toast(tries[0].length > 1 ? 'Bilden och originalet är nedladdade. Skicka dem till tatueraren.' : 'Bilden är nedladdad. Skicka den till tatueraren.', 6000);
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

  /* Är punkten p (0 till 1 i bilden) på tatueringen? Med lite marginal, så att en smal tatuering går att träffa. */
  function onMotif(p, r) {
    const m = motif();
    if (!m) return false;
    const w = S.pl.scale * r.width;
    const h = (w * m.src.height) / m.src.width;
    const a = (-S.pl.rot * Math.PI) / 180;
    const dx = (p.x - S.pl.x) * r.width;
    const dy = (p.y - S.pl.y) * r.height;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(lx) <= w / 2 + 14 && Math.abs(ly) <= h / 2 + 14;
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
    if (S.zoom) { zoomDown(e); return; }
    if (S.screen === 'edit') { editDown(e); return; }
    if (S.screen !== 'place' || !motif() || (gesture && gesture.type === 'handle')) return;
    hideCoach();
    stage.setPointerCapture(e.pointerId);
    const rect = gesture ? gesture.rect : cv.getBoundingClientRect();
    const srect = gesture ? gesture.srect : stage.getBoundingClientRect();
    if (!pointers.size) {
      begin();
      tap = { x: e.clientX, y: e.clientY };
    } else {
      tap = null; // två fingrar är aldrig en tryckning
    }
    pointers.set(e.pointerId, norm(e, rect));
    startGesture(rect, srect);
  });
  stage.addEventListener('pointermove', (e) => {
    if (S.zoom) { zoomMove(e); return; }
    if (S.screen === 'edit') { editMove(e); return; }
    if (!pointers.has(e.pointerId)) return;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) <= TAP_PX) return; // än så länge en tryckning
    tap = null;
    pointers.set(e.pointerId, norm(e, gesture.rect));
    updateGesture();
  });
  const endPointer = (e) => {
    if (S.zoom) { zoomUp(e); return; }
    if (S.screen === 'edit') { editUp(e, e.type === 'pointerup'); return; }
    if (!pointers.delete(e.pointerId)) return;
    if (pointers.size) { startGesture(gesture.rect, gesture.srect); return; }
    // En tryckning på tatueringen visar ramen, en tryckning bredvid tar bort den, så att bilden syns ren.
    if (tap && e.type === 'pointerup') S.selected = onMotif(norm(e, gesture.rect), gesture.rect);
    tap = null;
    gesture = null;
    setLive(false);
    commit();
    placeSel();
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('contextmenu', (e) => { if (S.screen !== 'start') e.preventDefault(); });

  // Handtaget i hörnet: dra ut eller in för storleken, runt för att vrida. Räknas från tatueringens mitt.
  const handle = $('#selHandle');
  handle.addEventListener('pointerdown', (e) => {
    if (gesture || S.screen !== 'place' || !motif()) return;
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    hideCoach();
    begin();
    const rect = cv.getBoundingClientRect();
    const cx = rect.left + S.pl.x * rect.width;
    const cy = rect.top + S.pl.y * rect.height;
    gesture = {
      type: 'handle', id: e.pointerId, rect, srect: stage.getBoundingClientRect(), cx, cy,
      d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, a0: Math.atan2(e.clientY - cy, e.clientX - cx), s0: S.pl.scale, r0: S.pl.rot,
    };
  });
  handle.addEventListener('pointermove', (e) => {
    if (!gesture || gesture.type !== 'handle' || gesture.id !== e.pointerId) return;
    const g = gesture;
    S.pl.scale = clamp(g.s0 * (Math.hypot(e.clientX - g.cx, e.clientY - g.cy) / g.d0), 0.03, 1);
    S.pl.rot = snapRot(normDeg(g.r0 + ((Math.atan2(e.clientY - g.cy, e.clientX - g.cx) - g.a0) * 180) / Math.PI));
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
    const w = S.pl.scale * r.width;
    const h = (w * m.src.height) / m.src.width;
    sel.style.width = `${w}px`;
    sel.style.height = `${h}px`;
    sel.style.transform = `translate(${r.left - s.left + S.pl.x * r.width - w / 2}px, ${r.top - s.top + S.pl.y * r.height - h / 2}px) rotate(${S.pl.rot}deg)`;
    sel.style.setProperty('--unrot', `${-S.pl.rot}deg`);
  }
  /* Spara-ikonen i bildens nedre högra hörn, ovanpå bilden men inte med i den sparade bilden. */
  const saveBtn = $('#btnSaveImg');
  const SAVE_INSET = 10;
  function placeSaveBtn() {
    const show = S.screen === 'place' && !!motif() && !!S.body && !S.zoom;
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
    if (S.screen !== 'place' || !motif() || S.zoom) return;
    e.preventDefault();
    begin();
    if (e.shiftKey || e.altKey) S.pl.rot = normDeg(S.pl.rot - Math.sign(dy) * 2);
    else S.pl.scale = clamp(S.pl.scale * Math.exp(-dy * 0.0012), 0.03, 1);
    moved();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { setLive(false); commit(); placeSel(); }, 250);
  }, { passive: false });

  /* ================================================================ Justera-arket */

  function syncAdjust() {
    const p = S.pl;
    const size = Math.round(p.scale * 100);
    const rot = Math.round(p.rot);
    const op = Math.round(p.opacity * 100);
    $('#rngScale').value = size;
    $('#rngRot').value = rot;
    $('#rngOp').value = op;
    $('#outScale').textContent = `${size} %`;
    $('#outRot').textContent = `${rot}°`;
    $('#outOp').textContent = `${op} %`;
    $('#tFlip').setAttribute('aria-pressed', String(p.flip));
  }

  /* ================================================================ Motiv-arket */

  /* Miniatyren visar tatueringen som den blir, utan papper. */
  function cleanThumb(m) {
    m.cleanThumb = E.thumbOf(E.buildClean(m, m.o).art, 128, true);
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
      pick.setAttribute('aria-label', `Tatuering ${i + 1}`);
      const img = document.createElement('img');
      img.src = m.cleanThumb || m.thumb;
      img.alt = '';
      pick.append(img);
      pick.addEventListener('click', () => act(() => chooseMotif(i)));
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'x';
      x.textContent = '×';
      x.setAttribute('aria-label', `Ta bort tatuering ${i + 1}`);
      x.addEventListener('click', () => act(() => removeMotif(i)));
      const wrap = document.createElement('div');
      wrap.className = 'thumb';
      wrap.append(pick, x);
      tray.insertBefore(wrap, add);
    });
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

  function chooseMotif(i) {
    S.mi = i;
    S.selected = true;
    renderTray();
    syncAdvanced();
    changed();
    placeSel();
  }

  function removeMotif(i) {
    S.motifs = S.motifs.filter((_, k) => k !== i); // en ny lista, eftersom ångra sparar den gamla
    if (!S.motifs.length) S.mi = -1;
    else if (i < S.mi || S.mi >= S.motifs.length) S.mi -= 1;
    S.selected = false;
    renderTray();
    syncAdvanced();
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
      body: S.body, autoLight: S.autoLight, mi: S.mi, pl: { ...S.pl }, motifs: S.motifs,
      states: S.motifs.map((m) => ({ o: { ...m.o }, auto: m.auto, rev: m.rev, eraseRev: m.eraseRev, content: E.motifState(m) })),
    };
  }

  const signature = (s) => JSON.stringify([s.autoLight, s.mi, s.pl, s.states.map((x) => [x.o, x.rev, x.eraseRev])]);
  function same(a, b) {
    return a.body === b.body && a.motifs.length === b.motifs.length && a.motifs.every((m, i) => m === b.motifs[i]) && signature(a) === signature(b);
  }

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
      if (content || settings) cleanThumb(m); // miniatyren visar rensningen, så den ritas om även när bara reglagen ändrats
    });
    S.mi = s.mi;
    S.pl = { ...s.pl };
    const screen = motif() ? 'place' : 'needMotif';
    if (S.screen !== screen) setScreen(screen);
    renderTray();
    syncAdjust();
    syncAdvanced();
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
      toast('Dra med fingret runt hela tatueringen.');
      return;
    }
    const o = await busy('Plockar ut tatueringen', async () => E.ringMotif(m, pts));
    if (!o) return;
    m.o = o;
    m.auto = { ...o };
    cleanThumb(m);
    renderTray();
    syncAdvanced();
    fitMotif();
    changed();
    if (m.warning === 'empty') { toast('Hittade ingen tatuering innanför ringen. Försök igen.'); return; }
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
    if (res === 'none') toast('Tryck på en vit yta inuti tatueringen.');
    else if (res === 'edge') toast('Det där är bakgrunden. Bara vita ytor som tatueringen omsluter kan bli vitt bläck.');
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
    $('#ringHint').textContent = ringResult
      ? 'Så här blir tatueringen. Blev något fel kan du ringa in igen eller sudda bort rester.'
      : 'Dra med fingret runt tatueringen. Allt utanför tas bort.';
    $('#ringActions').hidden = !ringResult;
    syncUndo();
    $('#rngBrush').value = S.brush;
    $('#outBrush').textContent = `${String(S.brush).replace('.', ',')} %`;
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

  function zoomStart() {
    const pts = [...zoomPointers.values()];
    const [a, b] = pts;
    zoomGesture = b
      ? { from: { ...zv }, d0: Math.hypot(b.x - a.x, b.y - a.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      : { from: { ...zv }, px: a.x, py: a.y };
  }

  function zoomDown(e) {
    stage.setPointerCapture(e.pointerId);
    zoomPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    zoomStart();
    if (zoomPointers.size > 1) { lastTap = null; return; }
    const now = performance.now();
    if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
      if (zv.z > 1) zv = { z: 1, x: 0, y: 0 };
      else zoomAt(2.5, e.clientX, e.clientY);
      applyZoom();
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
    } else if (!b && g.px !== undefined && zv.z > 1) {
      zv.x = g.from.x + (a.x - g.px);
      zv.y = g.from.y + (a.y - g.py);
      applyZoom();
    }
  }

  function zoomUp(e) {
    if (!zoomPointers.delete(e.pointerId)) return;
    if (zoomPointers.size) zoomStart();
    else zoomGesture = null;
  }

  /* ================================================================ Avancerat */

  function syncAdvanced() {
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
    syncAdvanced();
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
  $('#tAdjust').addEventListener('click', () => openSheet('adjust'));
  $('#tFlip').addEventListener('click', () => act(() => { S.pl.flip = !S.pl.flip; syncAdjust(); changed(); }));
  $('#tClean').addEventListener('click', () => openEdit('erase'));
  $('#tAdvanced').addEventListener('click', () => openSheet('advanced'));
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
  slider($('#rngScale'), 'move', (v) => { S.pl.scale = v / 100; syncAdjust(); changed(); placeSel(); });
  slider($('#rngRot'), 'move', (v) => { S.pl.rot = v; syncAdjust(); changed(); placeSel(); });
  slider($('#rngOp'), 'still', (v) => { S.pl.opacity = v / 100; syncAdjust(); changed(); });
  slider($('#rngCut'), 'still', (v) => { motif().o.cut = v; paperChanged(false); }, () => paperChanged(true));
  // Nollställ i Justera: placeringen och färgerna, som när tatueringen lades in.
  $('#btnResetPl').addEventListener('click', () => act(() => {
    fitMotif();
    const m = motif();
    if (m && m.auto && (m.o.gray || m.o.black !== m.auto.black)) setInk(false, true);
    changed();
    placeSel();
  }));
  $$('input[name="ink"]').forEach((r) => r.addEventListener('change', () => { if (motif()) act(() => setInk(r.value === 'gray')); }));

  $('#btnDone').addEventListener('click', () => {
    const m = motif();
    if (m) cleanThumb(m);
    renderTray();
    setScreen('place');
    changed();
    commit(); // allt som gjordes i verktyget blir ett steg att ångra
    if (m && m.warning === 'skin') toast('Tatueringen är inte inringad, så det runt omkring följer med. Ringa in finns under Avancerat.', 6000);
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
      toast('Inget att återställa. Tatueringen är som den ställdes in automatiskt.');
      return;
    }
    m.o = { ...auto };
    S.pl.opacity = PL0.opacity;
    S.autoLight = true;
    if (S.body) useLight(S.body);
    syncPics();
    syncAdjust();
    paperChanged(true);
    toast('Tatueringen är återställd.');
  }
  $('#btnResetMotif').addEventListener('click', () => { if (motif()) act(resetMotif); });

  // Ctrl+Z ångrar och Ctrl+Y gör om (Cmd+Z och Cmd+Shift+Z på Mac), som pilarna. Esc lämnar helskärmen.
  window.addEventListener('keydown', (e) => {
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
    if (!found) { toast('Hittade inga små vita ytor inuti tatueringen.'); return; }
    motifEdited();
    toast(`${found === 1 ? 'En vit yta' : `${found} vita ytor`} blev vitt bläck. Tryck på en yta för att ändra.`);
  });

  // Inbäddad i förfrågan: krysset tar tillbaka formuläret, och Skicka heter det den gör där.
  if (host) {
    $('#btnClose').hidden = false;
    $('#btnClose').addEventListener('click', () => host.postMessage({ type: 'tryon:close' }, location.origin));
    $('#privacyNote').textContent = 'Bilden stannar i din telefon tills du lägger den i förfrågan till studion.';
    $('#btnSend span').textContent = 'Lägg till i förfrågan';
    window.addEventListener('message', onHostMessage);
    host.postMessage({ type: 'tryon:ready' }, location.origin);
  }

  syncAdjust();
  setScreen('start');
  if (!E) ensureEngine().catch(() => {}); // hämtas igen direkt, så att den finns när kunden har tagit fotot
})();
