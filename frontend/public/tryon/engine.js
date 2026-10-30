/*
 * Tryon-motorn: läsa bilder, rensa motivet från papper, ringa in en tatuering på hud, vitt bläck, beskärning,
 * suddning och att rita motivet på kroppen som en färsk tatuering med hudens struktur ovanpå.
 * Delas av labbet (app.js) och kundvyn (prova.js).
 *
 * Inställningarna för rensningen skickas in som o = { clean, cut, flatten },
 * och ritningen som fx = { multiply, skin, fast }.
 */
window.TryonEngine = (() => {
  'use strict';

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const UNDO_MAX = 25;

  const FRESH_RED = 'rgb(255, 188, 176)'; // färsk tatuering: huden runt linjerna är lite röd
  const FRESH_RED_ALPHA = 0.4;
  const FRESH_RED_BLUR = 0.004; // hur långt rodnaden når, i andel av fotots längsta sida
  const TEXTURE = 0.9; // hur mycket av hudens ljusa struktur som läggs tillbaka över bläcket
  const TEXTURE_RADIUS = 0.006; // porer och hår: det som är mindre än så här, i andel av fotots längsta sida
  const SHEEN_RADIUS = 0.04; // glans: det som är ljusare än omgivningen inom så här stort område
  const SHEEN = 0.8; // hur mycket av glansen som kommer tillbaka över mörkt bläck
  const INK_GAIN_MAX = 1.6; // grå linjer på ett mörkt foto av papper dras upp mot svart, högst så här mycket
  const LINE_MIN = 0.0016; // tunnaste linjen på kroppen, i andel av fotots längsta sida: en tunn nål på en underarm som fyller bilden
  const LINE_MIN_PX = 1.5; // och aldrig under så här många pixlar
  const LINE_DARKEN = 2.5; // tunna linjer mörkas så här mycket: täckningen a blir 1 - (1 - a)^LINE_DARKEN
  const LINE_FAINT = 0.1; // linjer med lägre täckning än så här dras inte upp, och upp till det dubbla bara delvis
  const RING_MIN = 800; // Ringa in: ett litet utsnitt skalas upp till minst så här många pixlar på längsta sidan
  const SKIN_RADIUS = 0.07; // Ringa in på hud: linjer och fyllningar smalare än så här, i andel av utsnittet, blir bläck
  const SKIN_HUE_RADIUS = 0.105; // hudens färgton skattas över ett större område, eftersom den inte skuggas
  const SKIN_HUE_BOOST = 3; // färgtonen får göra bläcket högst så här mycket starkare än ljusheten visar
  const SKIN_INK = 0.85; // det starkaste bläcket innanför ringen dras upp till så här mycket täckning
  const SKIN_GAIN_MAX = 2.5; // men högst så här många gånger

  function newCanvas(w, hh) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = hh;
    return c;
  }

  /* ================================================================ bilder in */

  /*
   * Lämnar tillbaka en canvas minne direkt, och det som räknats fram ur den (hudstrukturen, skuggan).
   * Safari på telefonen har ett tak för allt canvasminne och räknar en canvas tills skräpsamlingen har gått.
   * Når appen taket går det inte att skapa fler, och då kan inte ens nästa foto läsas in.
   */
  function release(c) {
    if (!c) return;
    for (const made of [details, shades]) {
      const d = made.get(c);
      if (!d) continue;
      made.delete(c);
      d.width = 0;
      d.height = 0;
    }
    c.width = 0;
    c.height = 0;
  }

  /* createImageBitmap först. Misslyckas den, eller ger den en tom bild, provas en vanlig img. */
  async function decode(file) {
    try {
      const bmp = await createImageBitmap(file);
      if (bmp.width && bmp.height) return bmp;
      bmp.close();
    } catch {
      /* provas med en img nedan */
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); img.naturalWidth ? resolve(img) : reject(new Error('decode')); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  /*
   * Bilden i en canvas med längsta sidan högst max. Är den mindre än min skalas den upp, så att ett litet foto
   * (som en skärmdump) fyller skärmen och tatueringen ritas med alla detaljer ovanpå.
   */
  async function fileToCanvas(file, max, opaque = false, min = 0) {
    const src = await decode(file);
    const w0 = src.width || src.naturalWidth;
    const h0 = src.height || src.naturalHeight;
    const long = Math.max(w0, h0);
    const k = Math.max(Math.min(1, max / long), Math.min(min, max) / long);
    const c = newCanvas(Math.max(1, Math.round(w0 * k)), Math.max(1, Math.round(h0 * k)));
    const x = c.getContext('2d', { willReadFrequently: true });
    if (!x) { if (src.close) src.close(); throw new Error('canvas'); } // canvasminnet är slut (Safari)
    if (opaque) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); } // foton med genomskinlighet blir inte svarta i JPEG
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, c.width, c.height);
    if (src.close) src.close();
    return c;
  }

  function hasAlpha(c) {
    const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
    let n = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 245 && ++n > 20) return true;
    }
    return false;
  }

  function thumbOf(c, size = 128, contain = false) {
    const t = newCanvas(size, size);
    const x = t.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, size, size);
    const s = contain ? Math.min(size / c.width, size / c.height) * 0.9 : Math.max(size / c.width, size / c.height);
    const w = c.width * s;
    const hh = c.height * s;
    x.imageSmoothingQuality = 'high';
    x.drawImage(c, (size - w) / 2, (size - hh) / 2, w, hh);
    return t.toDataURL('image/jpeg', 0.75);
  }

  /*
   * photo är bilden som den laddades in, för Ringa in. orig är motivet efter automatiken. src är det beskurna,
   * erase det suddade och ink de vita ytor som är vitt bläck. shade är masken för hudstrukturen.
   * ring är den senaste inringningen, i fotots pixlar.
   */
  function newMotif(name, c) {
    return {
      name, thumb: thumbOf(c, 128, true), hasAlpha: hasAlpha(c), photo: c, ring: null,
      orig: c, src: c, erase: null, ink: null, undo: [], redo: [], rev: 0, eraseRev: 0,
      wp: null, wpSrc: null, grid: null, gridSrc: null, pre: null, preKey: '', base: null, baseKey: '', out: null, outKey: '', bold: null,
      sprite: null,
      inverted: false, // vitt på svart: ljusheten är vänd i orig och src, men inte i photo
    };
  }

  /* ================================================================ rensa motivet från papper */

  /* Pappersvitt: 90:e percentilen per kanal. Är den inte ljus antas att det inte finns något papper. */
  function whitePoint(c) {
    const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
    const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
    let n = 0;
    for (let i = 0; i < data.length; i += 28) {
      hist[0][data[i]]++; hist[1][data[i + 1]]++; hist[2][data[i + 2]]++;
      n++;
    }
    const wp = hist.map((hst) => {
      let acc = 0;
      for (let v = 0; v < 256; v++) {
        acc += hst[v];
        if (acc >= n * 0.9) return v;
      }
      return 255;
    });
    // Ljusheten avgör, inte varje kanal för sig: beige papper har en blå kanal under 200 men är ändå papper.
    // Kraftpapper och papper fotat i svagt gult ljus ligger runt 120 till 160.
    return wp[0] * 0.299 + wp[1] * 0.587 + wp[2] * 0.114 >= 110 ? wp : [255, 255, 255];
  }

  function whitePointFor(m) {
    if (m.wpSrc !== m.src) { m.wp = whitePoint(m.src); m.wpSrc = m.src; }
    return m.wp;
  }

  /*
   * Papperets färg område för område, för mobilfoton med skugga och ojämnt ljus.
   * Varje ruta får snittfärgen av sina ljusaste 10 procent. Rutor som ser ut som bläck
   * (mörka, färgade eller tydligt mörkare än en granne) fylls i från grannarna, och till
   * sist jämnas rutnätet ut. Finns inget ljust papper alls blir det null, och vitpunkten används.
   */
  function paperGrid(c) {
    const W = c.width;
    const H = c.height;
    const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H);
    const cell = Math.max(12, Math.round(Math.max(W, H) / 28));
    const gw = Math.ceil(W / cell);
    const gh = Math.ceil(H / cell);
    const n = gw * gh;
    const R = new Float32Array(n);
    const G = new Float32Array(n);
    const B = new Float32Array(n);
    const L = new Float32Array(n);
    const hist = new Uint32Array(256);
    const lum = (i) => (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;

    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const x0 = gx * cell;
        const y0 = gy * cell;
        const x1 = Math.min(W, x0 + cell);
        const y1 = Math.min(H, y0 + cell);
        hist.fill(0);
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) hist[lum((y * W + x) * 4)]++;
        const top = (x1 - x0) * (y1 - y0) * 0.1;
        let t = 255;
        let acc = hist[255];
        while (acc < top && t > 0) acc += hist[--t];
        let r = 0, g = 0, b = 0, k = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * W + x) * 4;
            if (lum(i) < t) continue;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; k++;
          }
        }
        const j = gy * gw + gx;
        R[j] = r / k; G[j] = g / k; B[j] = b / k;
        L[j] = (R[j] * 77 + G[j] * 150 + B[j] * 29) / 256;
      }
    }

    const around = (j, fn) => {
      const gx = j % gw;
      const gy = (j - gx) / gw;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = gx + dx;
          const y = gy + dy;
          if ((dx || dy) && x >= 0 && y >= 0 && x < gw && y < gh) fn(y * gw + x);
        }
      }
    };

    const paper = Float32Array.from(L).sort()[Math.floor((n - 1) * 0.9)];
    if (paper < 90) return null;
    // Papperets färgton, från de ljusaste rutorna. Kraftpapper och färgat papper är inte grått, så en ruta
    // räknas som bläck när den har en annan färgton än pappret, inte när den har färg.
    const tone = [0, 0, 0];
    let tk = 0;
    for (let j = 0; j < n; j++) {
      if (L[j] < paper) continue;
      const s = R[j] + G[j] + B[j] || 1;
      tone[0] += R[j] / s; tone[1] += G[j] / s; tone[2] += B[j] / s;
      tk++;
    }
    const ok = new Uint8Array(n);
    let missing = 0;
    for (let j = 0; j < n; j++) {
      let near = 0;
      around(j, (q) => { near = Math.max(near, L[q]); });
      const s = R[j] + G[j] + B[j] || 1;
      const off = Math.max(Math.abs(R[j] / s - tone[0] / tk), Math.abs(G[j] / s - tone[1] / tk), Math.abs(B[j] / s - tone[2] / tk));
      ok[j] = L[j] >= paper * 0.5 && L[j] >= near * 0.8 && off <= 0.065 ? 1 : 0;
      if (!ok[j]) missing++;
    }
    if (missing === n) return null;
    while (missing) {
      const done = ok.slice();
      for (let j = 0; j < n; j++) {
        if (ok[j]) continue;
        let r = 0, g = 0, b = 0, k = 0;
        around(j, (q) => { if (ok[q]) { r += R[q]; g += G[q]; b += B[q]; k++; } });
        if (!k) continue;
        R[j] = r / k; G[j] = g / k; B[j] = b / k;
        done[j] = 1;
        missing--;
      }
      ok.set(done);
    }

    for (let pass = 0; pass < 2; pass++) {
      for (const A of [R, G, B]) {
        const prev = A.slice();
        for (let j = 0; j < n; j++) {
          let s = prev[j];
          let k = 1;
          around(j, (q) => { s += prev[q]; k++; });
          A[j] = s / k;
        }
      }
    }
    return { cell, gw, gh, R, G, B };
  }

  function paperGridFor(m) {
    if (m.gridSrc !== m.src) { m.grid = paperGrid(m.src); m.gridSrc = m.src; }
    return m.grid;
  }

  /*
   * Är papperet ojämnt belyst? Tittar bara på rutorna längs kanten, som nästan alltid är papper.
   * En stor grå skuggning mitt i designen räknas alltså inte som skugga.
   */
  function unevenLight(m) {
    if (m.hasAlpha) return false;
    const grid = paperGridFor(m);
    if (!grid) return false;
    const { gw, gh, R, G, B } = grid;
    let lo = Infinity;
    let hi = 0;
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        if (gx && gy && gx < gw - 1 && gy < gh - 1) continue;
        const j = gy * gw + gx;
        const l = (R[j] * 77 + G[j] * 150 + B[j] * 29) / 256;
        lo = Math.min(lo, l);
        hi = Math.max(hi, l);
      }
    }
    return hi > 0 && lo / hi < 0.85;
  }

  /* Papperets färg för rad y, tre värden per kolumn, interpolerat mellan rutorna. */
  function paperRow(grid, y, W, out) {
    const { cell, gw, gh, R, G, B } = grid;
    const fy = clamp((y + 0.5) / cell - 0.5, 0, gh - 1);
    const y0 = Math.floor(fy);
    const y1 = Math.min(gh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < W; x++) {
      const fx = clamp((x + 0.5) / cell - 0.5, 0, gw - 1);
      const x0 = Math.floor(fx);
      const x1 = Math.min(gw - 1, x0 + 1);
      const tx = fx - x0;
      const a = y0 * gw + x0, b = y0 * gw + x1, c = y1 * gw + x0, d = y1 * gw + x1;
      const wa = (1 - tx) * (1 - ty), wb = tx * (1 - ty), wc = (1 - tx) * ty, wd = tx * ty;
      out[x * 3] = R[a] * wa + R[b] * wb + R[c] * wc + R[d] * wd;
      out[x * 3 + 1] = G[a] * wa + G[b] * wb + G[c] * wc + G[d] * wd;
      out[x * 3 + 2] = B[a] * wa + B[b] * wb + B[c] * wc + B[d] * wd;
    }
  }

  /* Ljusheten för pixeln vid i, för svartgrått (o.gray): varje färg blir lika mörk som den ser ut. */
  const grayOf = (d, i) => d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;

  /*
   * Första halvan av rensningen, den som inte beror på cut: färgen mot papperet, täckningen A per pixel,
   * omgivningens täckning near och vitt bläck. Färgen tas fram för all täckning över noll. Det som sedan
   * rensas bort blir genomskinligt, så resultatet blir detsamma som när bara det som behålls räknades.
   */
  function paperPass(m, o) {
    const key = `${o.flatten ? 1 : 0}|${o.black ? 1 : o.gray ? 2 : 0}|${m.rev}`;
    if (m.pre && m.preKey === key) return m.pre;
    const W = m.src.width;
    const H = m.src.height;
    const color = m.src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const light = new Uint8Array(W * H);
    const ink = m.ink;
    const wimg = ink ? new ImageData(W, H) : null;
    let whites = 0;
    const grid = o.flatten ? paperGridFor(m) : null;
    const paper = new Float32Array(W * 3);
    if (!grid) {
      const wp = whitePointFor(m);
      for (let x = 0; x < W; x++) paper.set(wp, x * 3);
    }
    const A = new Float32Array(W * H); // täckningen per pixel, innan rensningen
    for (let y = 0; y < H; y++) {
      if (grid) paperRow(grid, y, W, paper);
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        const i = p * 4;
        const r = Math.min(255, (color[i] * 255) / Math.max(1, paper[x * 3]));
        const g = Math.min(255, (color[i + 1] * 255) / Math.max(1, paper[x * 3 + 1]));
        const b = Math.min(255, (color[i + 2] * 255) / Math.max(1, paper[x * 3 + 2]));
        const a = 1 - Math.min(r, g, b) / 255;
        if (a < 0.5) {
          light[p] = 1;
          if (ink && ink[p]) {
            wimg.data[i] = r; wimg.data[i + 1] = g; wimg.data[i + 2] = b; wimg.data[i + 3] = 255;
            whites++;
            continue;
          }
        }
        A[p] = a;
        if (a <= 0) continue;
        const white = 255 * (1 - a);
        color[i] = (r - white) / a;
        color[i + 1] = (g - white) / a;
        color[i + 2] = (b - white) / a;
        if (o.black) color[i] = color[i + 1] = color[i + 2] = 0; // stencil eller penna: visas som svart bläck
        else if (o.gray) color[i] = color[i + 1] = color[i + 2] = grayOf(color, i); // svartgrått: samma rensning, utan färg
      }
    }
    const rl = Math.max(2, Math.round(Math.max(W, H) / 200));
    m.pre = { color, A, near: boxBlur(boxBlur(A, W, H, rl), W, H, rl), light, wimg, whites };
    m.preKey = key;
    return m.pre;
  }

  /*
   * "Färg till alfa" mot papperet: svart linjearbete blir svart med genomskinlighet, färger behålls.
   * Resultatet är två lager. art ritas med multiply. white är vitt bläck och ritas vanligt ovanpå,
   * eftersom multiply aldrig kan göra huden ljusare. light markerar ljusa pixlar (papper och vita ytor)
   * för verktyget Vitt bläck.
   */
  function buildBase(m, o) {
    const key = `${o.clean ? 1 : 0}|${o.cut}|${o.flatten ? 1 : 0}|${o.black ? 1 : o.gray ? 2 : 0}|${m.rev}`;
    if (m.base && m.baseKey === key) return m.base;
    const W = m.src.width;
    const H = m.src.height;
    let img;
    let light;
    let wimg = null;
    let whites = 0;

    if (o.clean && !m.hasAlpha) {
      // Allt utom rensningen beror inte på cut och sparas, så att reglaget för rensning bara gör det sista steget.
      const pre = paperPass(m, o);
      img = new ImageData(W, H);
      const d = img.data;
      d.set(pre.color);
      ({ light, wimg, whites } = pre);
      const { A, near } = pre;
      const darkAlpha = new Uint32Array(256); // täckningen för svart bläck, för att se om linjerna blivit grå
      let darkCount = 0;
      const cut = o.cut / 100;
      const low = cut * 0.55;
      // Rensning i två steg: allt över cut är bläck. Svagare pixlar (över low) behålls bara om de hänger ihop
      // med bläck och är mörkare än närmaste omgivningen, så att en svag blyertslinje blir kvar men lösa prickar
      // av brus och breda mjuka veck i pappret försvinner.
      const keep = new Uint8Array(W * H);
      const q = new Int32Array(W * H);
      let qn = 0;
      for (let p = 0; p < W * H; p++) if (A[p] > cut) { keep[p] = 1; q[qn++] = p; }
      for (let k = 0; k < qn; k++) {
        const p = q[k];
        const x = p % W;
        for (let dy = -W; dy <= W; dy += W) {
          for (let dx = x > 0 ? -1 : 0; dx <= (x < W - 1 ? 1 : 0); dx++) {
            const r = p + dy + dx;
            if (r >= 0 && r < W * H && !keep[r] && A[r] > low && A[r] > near[r] + 0.04) { keep[r] = 1; q[qn++] = r; }
          }
        }
      }
      for (let p = 0; p < W * H; p++) {
        const i = p * 4;
        if (!keep[p]) { d[i + 3] = 0; continue; }
        d[i + 3] = ((A[p] - low) / (1 - low)) * 255;
        if (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114 < 70) { darkAlpha[d[i + 3]]++; darkCount++; }
      }
      // Svarta linjer som fotats i dåligt ljus blir grå, alltså svarta med låg täckning. Då dras all täckning upp
      // så att de blir svarta igen. En design utan svart bläck lämnas, så att ljusa färger inte blir starkare.
      if (darkCount > W * H * 0.002) {
        let acc = 0;
        let p97 = 255;
        for (let v = 0; v < 256; v++) {
          acc += darkAlpha[v];
          if (acc >= darkCount * 0.97) { p97 = v; break; }
        }
        const gain = p97 < 230 ? clamp(247 / Math.max(1, p97), 1, INK_GAIN_MAX) : 1;
        if (gain > 1) for (let i = 3; i < d.length; i += 4) d[i] = Math.min(255, d[i] * gain);
      }
    } else {
      // Utan rensning räknas ljust och täckande som vitt, till exempel vitt i en PNG med genomskinlig bakgrund.
      img = m.src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H);
      const d = img.data;
      const ink = m.ink;
      light = new Uint8Array(W * H);
      if (ink) wimg = new ImageData(W, H);
      for (let p = 0; p < W * H; p++) {
        const i = p * 4;
        if (d[i + 3] <= 128 || Math.min(d[i], d[i + 1], d[i + 2]) <= 127) continue;
        light[p] = 1;
        if (ink && ink[p]) {
          wimg.data[i] = d[i]; wimg.data[i + 1] = d[i + 1]; wimg.data[i + 2] = d[i + 2]; wimg.data[i + 3] = 255;
          d[i + 3] = 0;
          whites++;
        }
      }
      if (o.gray) for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = grayOf(d, i);
    }

    const art = newCanvas(W, H);
    art.getContext('2d').putImageData(img, 0, 0);
    let white = null;
    if (whites) {
      white = newCanvas(W, H);
      white.getContext('2d').putImageData(wimg, 0, 0);
    }
    if (m.base) { release(m.base.art); release(m.base.white); } // de gamla lagren ritas aldrig igen
    m.base = { art, white, light };
    m.baseKey = key;
    return m.base;
  }

  /* Det färdiga motivet: grundlagren med det suddade bortklippt. Canvasarna återanvänds, så att suddning går snabbt. */
  function buildClean(m, o) {
    const base = buildBase(m, o);
    if (!m.erase) return base;
    const key = `${m.baseKey}|${m.eraseRev}`;
    if (m.out && m.outKey === key) return m.out;
    const paint = (c, out) => {
      if (!c) return null;
      if (!out || out.width !== c.width || out.height !== c.height) out = newCanvas(c.width, c.height);
      const x = out.getContext('2d');
      x.globalCompositeOperation = 'copy';
      x.drawImage(c, 0, 0);
      x.globalCompositeOperation = 'destination-out';
      x.drawImage(m.erase, 0, 0);
      return out;
    };
    const prev = m.out || {};
    m.out = { art: paint(base.art, prev.art), white: paint(base.white, prev.white), light: base.light };
    m.outKey = key;
    return m.out;
  }

  /* ================================================================ automatik */

  /*
   * Rensningen sätts strax över papperets brus. Papperet är det vanligaste i bilden, så efter normaliseringen
   * hamnar det som en topp nära noll täckning. Toppens bredd är bruset: smal för en scan, bred för ett mobilfoto.
   */
  function autoCut(m, flatten) {
    const W = m.src.width;
    const H = m.src.height;
    const { data } = m.src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H);
    const grid = flatten ? paperGridFor(m) : null;
    const paper = new Float32Array(W * 3);
    if (!grid) {
      const wp = whitePointFor(m);
      for (let x = 0; x < W; x++) paper.set(wp, x * 3);
    }
    const hist = new Uint32Array(101);
    for (let y = 0; y < H; y += 2) {
      if (grid) paperRow(grid, y, W, paper);
      for (let x = 0; x < W; x += 2) {
        const i = (y * W + x) * 4;
        const lo = Math.min(
          (data[i] * 255) / Math.max(1, paper[x * 3]),
          (data[i + 1] * 255) / Math.max(1, paper[x * 3 + 1]),
          (data[i + 2] * 255) / Math.max(1, paper[x * 3 + 2]),
        );
        hist[Math.round(clamp(1 - lo / 255, 0, 1) * 100)]++;
      }
    }
    return noiseCut(hist, 0.03, 35);
  }

  /*
   * hist är täckningen 0 till 100. Toppen nära noll är bakgrunden, och rensningen sätts strax över där toppen
   * har fallit till andelen tail. max är den högsta rensningen.
   */
  function noiseCut(hist, tail, max) {
    let peak = 0;
    for (let b = 1; b <= 30; b++) if (hist[b] > hist[peak]) peak = b;
    let edge = peak;
    while (edge < 60 && hist[edge + 1] > hist[peak] * tail) edge++;
    return clamp(edge + 4, 5, max);
  }

  /*
   * Beskär bort tomma kanter runt motivet, med lite luft kvar, så att motivet placeras och skalas efter designen
   * och inte efter pappret. Damm räknas inte: bara rutor med bläck som har en granne med bläck.
   * Det beskurna blir motivets original, så att Återställ och Ångra inte tar tillbaka kanterna.
   */
  function autoTrim(m, o) {
    const { art } = buildClean(m, o);
    const W = art.width;
    const H = art.height;
    const d = art.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const cell = Math.max(4, Math.round(Math.max(W, H) / 150));
    const gw = Math.ceil(W / cell);
    const gh = Math.ceil(H / cell);
    const count = new Uint16Array(gw * gh);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 64) count[Math.floor(y / cell) * gw + Math.floor(x / cell)]++;
    }
    let x0 = gw, y0 = gh, x1 = -1, y1 = -1;
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        if (count[gy * gw + gx] < 3) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const qx = gx + dx;
            const qy = gy + dy;
            if ((dx || dy) && qx >= 0 && qy >= 0 && qx < gw && qy < gh && count[qy * gw + qx] >= 3) { near = true; break; }
          }
        }
        if (!near) continue;
        x0 = Math.min(x0, gx); y0 = Math.min(y0, gy); x1 = Math.max(x1, gx); y1 = Math.max(y1, gy);
      }
    }
    if (x1 < 0) return false;
    const pad = Math.round(Math.max(W, H) * 0.04) + 4;
    const box = { x0: x0 * cell - pad, y0: y0 * cell - pad, x1: (x1 + 1) * cell + pad, y1: (y1 + 1) * cell + pad };
    const area = (clamp(box.x1, 0, W) - clamp(box.x0, 0, W)) * (clamp(box.y1, 0, H) - clamp(box.y0, 0, H));
    if (area > W * H * 0.9 || !applyCrop(m, box)) return false;
    m.undo = [];
    m.orig = m.src;
    return true;
  }

  /* Bilden i låg upplösning (längsta sidan 240 px) för analyserna nedan: ljushet L, färgstyrka C och färgerna. */
  function lowRes(c) {
    const k = Math.min(1, 240 / Math.max(c.width, c.height));
    const w = Math.max(8, Math.round(c.width * k));
    const h = Math.max(8, Math.round(c.height * k));
    const x = newCanvas(w, h).getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high';
    x.drawImage(c, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data;
    const L = new Float32Array(w * h);
    const C = new Float32Array(w * h);
    for (let p = 0, i = 0; p < L.length; p++, i += 4) {
      L[p] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      C[p] = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
    }
    return { w, h, k, d, L, C };
  }

  // Hud är rödaktig: rött störst, och grönt nära blått jämfört med hur mycket rött som sticker ut. Det gäller
  // även mycket ljus hud. Krämvitt, beige och kraftpapper är gulare (grönt långt över blått), och grått papper är blekt.
  const isSkin = (d, i) => {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    return r > g && g >= b && r > 60 && r < 250 && r - b >= 22 && (g - b) * 3.2 < 2 * r - g - b;
  };

  /*
   * Är mitten av bilden mest hud? Då är det ett foto av en tatuering på någon, inte en teckning. Mörkt bläck
   * räknas inte, så att en stor mörk tatuering också känns igen på huden runt omkring.
   */
  function looksLikeSkin(lr) {
    const { w, h, d, L } = lr;
    let skin = 0;
    let lit = 0;
    let all = 0;
    for (let y = Math.floor(h * 0.3); y < h * 0.7; y++) {
      for (let x = Math.floor(w * 0.3); x < w * 0.7; x++) {
        const p = y * w + x;
        all++;
        if (L[p] < 60) continue;
        lit++;
        if (isSkin(d, p * 4)) skin++;
      }
    }
    return lit > all * 0.2 && skin > lit * 0.35;
  }

  /*
   * Behöver kunden ringa in motivet? Det gäller ett foto av en tatuering på hud och ett foto med mycket mer än
   * motivet. Ett ark är en stor jämn yta: papper har nästan samma ljushet överallt, medan hud är rundad och
   * skuggad. På testbilderna låg papperet under 16 i standardavvikelse, och hud och foton över 18. Ser mitten
   * ut som hud krävs ett jämnare ark (12), så att en slät fotobakgrund bakom en person inte tas för papper.
   * Utan ark avgör huden, en ojämn yta med färg, eller många olika färger, som en vägg full av flash.
   * Huden ensam räcker inte: ett gammalt beige kort har samma färg som solbränd hud.
   */
  function needsRing(lr, region) {
    const { w, h, L, C } = lr;
    const n = w * h;
    const skin = looksLikeSkin(lr);
    if (region) {
      const { best, area } = region;
      let s = 0, s2 = 0, c = 0;
      for (let p = 0; p < n; p++) {
        if (!best[p]) continue;
        s += L[p]; s2 += L[p] * L[p]; c += C[p];
      }
      const mean = s / area;
      const spread = Math.sqrt(Math.max(0, s2 / area - mean * mean));
      if (area >= n * 0.15 && spread <= (skin ? 12 : 16)) return false;
      if (skin || (spread > 18 && c / area >= 8)) return true;
    } else if (skin) return true;
    return hueCount(lr) >= 3;
  }

  /* Antal tydliga färgtoner i bilden: fack om 30 grader med minst 3 procent av bilden i mättade färger. */
  function hueCount(lr) {
    const { d, C } = lr;
    const bins = new Uint32Array(12);
    for (let p = 0; p < C.length; p++) {
      if (C[p] < 40) continue;
      const r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2];
      const hi = Math.max(r, g, b);
      const k = hi === r ? (g - b) / C[p] : hi === g ? 2 + (b - r) / C[p] : 4 + (r - g) / C[p];
      bins[Math.floor(((k * 60 + 360) % 360) / 30)]++;
    }
    let n = 0;
    for (const v of bins) if (v > C.length * 0.03) n++;
    return n;
  }

  /*
   * Pappret i ett foto, som ett trollspö: från den ljusaste jämna punkten nära mitten breder ytan ut sig
   * till grannar med nästan samma ljushet, så den följer en skugga på pappret men stannar vid bordskanten.
   * Returnerar ytan som en mask (best) med antal pixlar (area), eller null. accept(pixlar) kan sålla bort
   * ytor som inte får vinna, och drift är hur mycket ljusheten får ändras från startpunkten.
   */
  function paperRegion(lr, accept = null, drift = Infinity) {
    const { w, h, L, C } = lr;
    const n = w * h;
    const flat = (p) => {
      const x = p % w;
      if (x < 1 || p < w || x >= w - 1 || p >= n - w) return false;
      return Math.abs(L[p] - L[p - 1]) + Math.abs(L[p] - L[p + 1]) + Math.abs(L[p] - L[p - w]) + Math.abs(L[p] - L[p + w]) < 10;
    };
    const seeds = [];
    for (let y = Math.floor(h * 0.2); y < h * 0.8; y += 2) {
      for (let x = Math.floor(w * 0.2); x < w * 0.8; x += 2) if (flat(y * w + x)) seeds.push(y * w + x);
    }
    seeds.sort((a, b) => L[b] - L[a]);

    // Ytan från en startpunkt. Prova några av de ljusaste och behåll den största.
    let best = null;
    let area = 0;
    const taken = new Uint8Array(n);
    for (let s = 0, tries = 0; s < seeds.length && tries < 6; s++) {
      const seed = seeds[s];
      if (taken[seed]) continue;
      tries++;
      const inR = new Uint8Array(n);
      const q = [seed];
      inR[seed] = 1;
      const cMax = C[seed] + 28;
      for (let i = 0; i < q.length; i++) {
        const p = q[i];
        const x = p % w;
        const step = (r) => {
          if (!inR[r] && Math.abs(L[r] - L[p]) <= 6 && C[r] <= cMax && Math.abs(L[r] - L[seed]) <= drift) { inR[r] = 1; q.push(r); }
        };
        if (x > 0) step(p - 1);
        if (x < w - 1) step(p + 1);
        if (p >= w) step(p - w);
        if (p < n - w) step(p + w);
      }
      for (const p of q) taken[p] = 1;
      if (q.length > area && (!accept || accept(q))) { best = inR; area = q.length; }
    }
    return best ? { best, area } : null;
  }

  /*
   * Allt pappret omsluter (designen) räknas till pappret. Allt utanför, som bord, händer och böcker, byts mot
   * pappersfärg och beskärs bort. Returnerar true för ett foto av papper, och false för en scan som bara
   * fått ramen bortplockad eller när inget papper hittades.
   */
  function isolatePaper(m, lr, region) {
    if (!region) return false;
    const { w, h, d } = lr;
    const n = w * h;
    const { best } = region;

    // Pappret = ytan plus allt den omsluter. Det som går att nå från bildkanten utan att korsa ytan är bakgrund.
    const outside = new Uint8Array(n);
    const q = [];
    const reach = (p) => { if (!best[p] && !outside[p]) { outside[p] = 1; q.push(p); } };
    for (let x = 0; x < w; x++) { reach(x); reach(n - w + x); }
    for (let y = 0; y < h; y++) { reach(y * w); reach(y * w + w - 1); }
    for (let i = 0; i < q.length; i++) {
      const p = q[i];
      const x = p % w;
      if (x > 0) reach(p - 1);
      if (x < w - 1) reach(p + 1);
      if (p >= w) reach(p - w);
      if (p < n - w) reach(p + w);
    }
    // Ett pappersark är konvext. Det som når bildkanten men ligger innanför arkets konvexa hölje är en design
    // som går ut i kanten (en scan eller ett beskuret foto), inte bord. Men bara om det når en bit in på arket:
    // det som ligger tätt längs arkets kant är papperskantens skugga. Och inte hud: fingrar som håller i pappret.
    // Ett litet hölje är inget ark, bara en ljus fläck i en tät teckning.
    const span = hullRows(best, w, h);
    let hullArea = 0;
    for (let y = 0; y < h; y++) hullArea += Math.max(0, Math.floor(span[y * 2 + 1]) - Math.ceil(span[y * 2]) + 1);
    if (hullArea < n * 0.25) return false;
    const inHull = (x, y) => y >= 0 && y < h && x >= span[y * 2] - 0.5 && x <= span[y * 2 + 1] + 0.5;
    const DEEP = 4;
    const seen = new Uint8Array(n);
    for (let p0 = 0; p0 < n; p0++) {
      if (!outside[p0] || seen[p0] || !inSpan(span, p0, w)) continue;
      const part = [p0];
      seen[p0] = 1;
      let skin = 0;
      let deep = 0;
      for (let i = 0; i < part.length; i++) {
        const p = part[i];
        const x = p % w;
        const y = (p - x) / w;
        if (isSkin(d, p * 4)) skin++;
        if (inHull(x - DEEP, y) && inHull(x + DEEP, y) && inHull(x, y - DEEP) && inHull(x, y + DEEP)) deep++;
        for (const r of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
          if (r >= 0 && r < n && outside[r] && !seen[r] && inSpan(span, r, w)) { seen[r] = 1; part.push(r); }
        }
      }
      if (skin < part.length * 0.3 && deep >= part.length * 0.5) for (const p of part) outside[p] = 0;
    }
    // Krymp pappret två pixlar mot bakgrunden, så att papperskanten och dess skugga också räknas bort.
    // Mot bildkanten krymps det inte, där finns ingen papperskant.
    let paper = new Uint8Array(n);
    for (let p = 0; p < n; p++) paper[p] = outside[p] ? 0 : 1;
    for (let pass = 0; pass < 2; pass++) {
      const prev = paper.slice();
      for (let p = 0; p < n; p++) {
        if (!prev[p]) continue;
        const x = p % w;
        if ((x > 0 && !prev[p - 1]) || (x < w - 1 && !prev[p + 1]) || (p >= w && !prev[p - w]) || (p < n - w && !prev[p + w])) paper[p] = 0;
      }
    }
    let area = 0;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let p = 0; p < n; p++) {
      if (!paper[p]) continue;
      area++;
      const x = p % w;
      const y = (p - x) / w;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    // En scan som fyller nästan hela bilden får ändå ramen och marginalen bortplockad, men räknas inte som
    // ett foto av papper, så att skuggorna jämnas ut bara om ljuset är ojämnt.
    if (area === n || area < n * 0.06) return false;
    const photo = area <= n * 0.85;

    // Bakgrunden får närmaste pappersfärg: varje bakgrundspixel tar färgen från grannen den nåddes från.
    const fill = new Uint8ClampedArray(n * 4);
    const known = new Uint8Array(n);
    const fq = [];
    for (let p = 0; p < n; p++) {
      if (!best[p] || !paper[p]) continue;
      known[p] = 1;
      fq.push(p);
      fill.set(d.subarray(p * 4, p * 4 + 3), p * 4);
    }
    for (let i = 0; i < fq.length; i++) {
      const p = fq[i];
      const x = p % w;
      const give = (r) => {
        if (known[r]) return;
        known[r] = 1;
        fill[r * 4] = fill[p * 4]; fill[r * 4 + 1] = fill[p * 4 + 1]; fill[r * 4 + 2] = fill[p * 4 + 2];
        fq.push(r);
      };
      if (x > 0) give(p - 1);
      if (x < w - 1) give(p + 1);
      if (p >= w) give(p - w);
      if (p < n - w) give(p + w);
    }
    for (let p = 0; p < n; p++) fill[p * 4 + 3] = 255;
    const fillC = newCanvas(w, h);
    fillC.getContext('2d').putImageData(new ImageData(fill, w, h), 0, 0);
    const maskData = new Uint8ClampedArray(n * 4);
    for (let p = 0; p < n; p++) maskData[p * 4 + 3] = paper[p] ? 255 : 0;
    const maskC = newCanvas(w, h);
    maskC.getContext('2d').putImageData(new ImageData(maskData, w, h), 0, 0);

    // I full upplösning: pappersfärgen under, fotot ovanpå bara där pappret är, med mjuk övergång.
    const W = m.src.width;
    const H = m.src.height;
    const keep = newCanvas(W, H);
    const kx = keep.getContext('2d');
    kx.imageSmoothingQuality = 'high';
    kx.drawImage(maskC, 0, 0, W, H);
    kx.globalCompositeOperation = 'source-in';
    kx.drawImage(m.src, 0, 0);
    const out = newCanvas(W, H);
    const ox = out.getContext('2d', { willReadFrequently: true });
    ox.imageSmoothingQuality = 'high';
    ox.drawImage(fillC, 0, 0, W, H);
    ox.drawImage(keep, 0, 0);
    m.src = out;
    m.orig = out;
    const pad = 2;
    if (!applyCrop(m, { x0: (x0 - pad) / lr.k, y0: (y0 - pad) / lr.k, x1: (x1 + 1 + pad) / lr.k, y1: (y1 + 1 + pad) / lr.k })) changed(m);
    m.undo = [];
    m.orig = m.src;
    return photo;
  }

  /* Det konvexa höljet av en mask som ett intervall per rad: span[2y] till span[2y + 1], tomt när från > till. */
  function hullRows(mask, w, h) {
    const pts = [];
    for (let y = 0; y < h; y++) {
      let a = -1;
      let b = -1;
      for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (a < 0) a = x; b = x; }
      if (a >= 0) pts.push([a, y], [b, y]);
    }
    const span = new Float32Array(h * 2);
    for (let y = 0; y < h; y++) { span[y * 2] = Infinity; span[y * 2 + 1] = -Infinity; }
    if (!pts.length) return span;
    // Andrews monotona kedja: nedre och övre delen av höljet.
    pts.sort((p, r) => p[0] - r[0] || p[1] - r[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (list) => {
      const out = [];
      for (const p of list) {
        while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const poly = half(pts).concat(half(pts.slice().reverse()));
    if (poly.length < 2) poly.push(pts[0]);
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i];
      const [bx, by] = poly[(i + 1) % poly.length];
      for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
        const x = ay === by ? null : ax + ((y - ay) * (bx - ax)) / (by - ay);
        span[y * 2] = Math.min(span[y * 2], x ?? Math.min(ax, bx));
        span[y * 2 + 1] = Math.max(span[y * 2 + 1], x ?? Math.max(ax, bx));
      }
    }
    return span;
  }

  const inSpan = (span, p, w) => {
    const x = p % w;
    const y = (p - x) / w;
    return x >= span[y * 2] - 0.5 && x <= span[y * 2 + 1] + 0.5;
  };

  /*
   * Är designen ritad med blå eller lila penna, eller är det en stencil? Då visas den svart, som den blir
   * som tatuering. Stencilbläck blir nästan svart när pappret räknas bort, men med en blå ton, så det är
   * bläckets snittfärg som avgör. En design med andra färger (rött, gult, grönt) får behålla dem.
   */
  function penInk(m, o) {
    const { art } = buildClean(m, o);
    const d = art.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, art.width, art.height).data;
    let r = 0, g = 0, b = 0, all = 0, colored = 0;
    for (let i = 0; i < d.length; i += 8) {
      if (d[i + 3] < 100) continue;
      all++;
      r += d[i]; g += d[i + 1]; b += d[i + 2];
      const hi = Math.max(d[i], d[i + 1], d[i + 2]);
      if (hi - Math.min(d[i], d[i + 1], d[i + 2]) >= 40 && hi !== d[i + 2]) colored++; // tydlig färg som inte är blå
    }
    if (all < 150) return false;
    return (b - Math.max(r, g)) / all >= 6 && colored < all * 0.1;
  }

  /*
   * Inställningarna för ett nytt motiv. Pappret letas upp och bakgrunden tas bort, skuggor jämnas ut,
   * rensningen sätts efter bruset, blå eller lila linjer blir svarta och tomma kanter beskärs bort.
   * m.warning blir 'skin' för ett foto av en tatuering på hud eller ett foto med mycket mer än motivet, där
   * kunden behöver ringa in motivet, och 'empty' om ingen design hittades.
   */
  function autoPrepare(m) {
    m.warning = '';
    let paper = false;
    if (!m.hasAlpha) {
      let lr = lowRes(m.src);
      let region = paperRegion(lr);
      const dark = m.inverted || looksLikeSkin(lr) ? null : lightOnDark(lr);
      if (dark) {
        // Det mörka underlaget blir pappret efter vändningen. Det söks inte om, eftersom en ny sökning kan
        // krypa längs en sned arkkant ut på bordet.
        invertMotif(m);
        lr = lowRes(m.src);
        region = dark;
      }
      if (needsRing(lr, region)) m.warning = 'skin';
      else paper = isolatePaper(m, lr, region);
    }
    const o = settingsFor(m, paper);
    if (!autoTrim(m, o) && !m.warning && !hasInk(m, o)) m.warning = 'empty';
    return o;
  }

  /* Rensningen för ett motiv på papper. paper: pappret är redan isolerat, så skuggor jämnas alltid ut. */
  /*
   * Vitt på svart, som krita på asfalt eller vit penna på svart papper. Det mörka underlaget söks som pappret,
   * fast från den mörkaste jämna punkten. Det ska vara stort, nå bildkanten (en mörk skuggning på vitt papper
   * gör inte det), och det som ligger på det (innanför dess hölje) ska mest vara ljusare och täcka en mindre del.
   */
  function lightOnDark(lr) {
    const { w, h, L } = lr;
    const n = w * h;
    // Asfalt och svart papper är korniga, så bilden jämnas ut lite innan ytan söks. Bara en mörk yta får vinna,
    // eftersom ett ljust bord runt ett svart ark kan vara större än arket. Ytan får inte bli mycket ljusare än
    // där den började, annars kryper den längs en sned arkkant ut på bordet.
    const meanOf = (pixels) => pixels.reduce((s, p) => s + L[p], 0) / pixels.length;
    const region = paperRegion({ ...lr, L: boxBlur(L, w, h, 1).map((v) => 255 - v) }, (q) => meanOf(q) <= 130, 50);
    if (!region || region.area < n * 0.3) return null;
    const { best, area } = region;
    let s = 0;
    for (let p = 0; p < n; p++) if (best[p]) s += L[p];
    const mean = s / area;
    let edge = 0;
    let onDark = 0;
    for (let p = 0; p < n; p++) {
      const x = p % w;
      if (x && x < w - 1 && p >= w && p < n - w) continue;
      edge++;
      if (L[p] < mean + 30) onDark++;
    }
    const span = hullRows(best, w, h);
    let light = 0;
    let dark = 0;
    let hull = 0;
    for (let p = 0; p < n; p++) {
      if (!inSpan(span, p, w)) continue;
      hull++;
      if (best[p]) continue;
      if (L[p] > mean + 40) light++;
      else if (L[p] < mean - 40) dark++;
    }
    // Ett svart ark på ett ljust bord når inte bildkanten, men fyller nästan hela sitt hölje, till skillnad
    // från en mörk skuggning med ljusa partier i. Linjerna och det de omsluter räknas till arket: bara det
    // som når höljets kant utan att korsa ytan räknas bort.
    if (onDark < edge * 0.4) {
      const out = new Uint8Array(n);
      const q = [];
      const inHull = (p) => inSpan(span, p, w);
      for (let p = 0; p < n; p++) {
        if (best[p] || !inHull(p)) continue;
        const x = p % w;
        if (!x || x === w - 1 || p < w || p >= n - w || !inHull(p - 1) || !inHull(p + 1) || !inHull(p - w) || !inHull(p + w)) {
          out[p] = 1;
          q.push(p);
        }
      }
      for (let i = 0; i < q.length; i++) {
        const p = q[i];
        const x = p % w;
        for (const r of [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
          if (r < 0 || r >= n || out[r] || best[r] || !inHull(r)) continue;
          out[r] = 1;
          q.push(r);
        }
      }
      if (q.length > hull * 0.1) return null;
    }
    return light >= hull * 0.01 && light <= hull * 0.3 && light > dark * 2 ? region : null;
  }

  /*
   * Vänder ljusheten i motivet men behåller färgtonen: vit krita blir svart, färgad krita blir en mörk
   * variant av samma färg, och det mörka pappret blir ljust. Ringa in vänder sitt utsnitt på samma sätt.
   */
  function invertLight(d) {
    for (let i = 0; i < d.length; i += 4) {
      const k = 255 - 2 * (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      d[i] += k; d[i + 1] += k; d[i + 2] += k; // Uint8ClampedArray: under 0 blir 0
    }
  }

  function invertMotif(m) {
    const c = newCanvas(m.src.width, m.src.height);
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(m.src, 0, 0);
    const img = x.getImageData(0, 0, c.width, c.height);
    invertLight(img.data);
    x.putImageData(img, 0, 0);
    Object.assign(m, { src: c, orig: c, inverted: true });
    changed(m);
  }

  function settingsFor(m, paper) {
    const flatten = paper || unevenLight(m);
    const o = { clean: true, cut: m.hasAlpha ? 14 : autoCut(m, flatten), flatten, black: false };
    if (!m.hasAlpha && !m.warning) o.black = penInk(m, o);
    return o;
  }

  function hasInk(m, o) {
    const { art } = buildClean(m, o);
    const d = art.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, art.width, art.height).data;
    let ink = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 64 && ++ink > 20) return true;
    return false;
  }

  /*
   * Kroppsfotot: bara tydligt dåliga foton rättas, så att en mörk hudton inte ljusas upp. Ett underexponerat
   * foto får vitpunkten uppdragen och mitten ljusare, ett överexponerat får mitten nedtonad. Samma kurva för
   * alla färgkanaler, så att hudtonen behålls. Returnerar en rättad kopia, eller null om fotot redan är okej.
   */
  function autoExposure(c) {
    const W = c.width;
    const H = c.height;
    const img = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H);
    const d = img.data;
    const hist = new Uint32Array(256);
    let n = 0;
    for (let i = 0; i < d.length; i += 16) { hist[(d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8]++; n++; }
    const pct = (q) => {
      let acc = 0;
      for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * q) return v; }
      return 255;
    };
    // Mörk hud som är rätt exponerad har ändå ljusa partier (glans, bakgrund). Är inget i bilden ljusare än
    // 150 av 255 är fotot för mörkt, och då dras det ljusaste upp till ungefär 230.
    const hi = pct(0.99);
    const white = hi < 150 ? Math.max(hi / 0.9, 105) : 255;
    const mid = clamp(pct(0.5) / white, 0.01, 0.99);
    let gamma = 1;
    if (mid < 0.2) gamma = clamp(Math.log(0.3) / Math.log(mid), 0.75, 1);
    // Ett överexponerat foto är urblekt överallt, även i skuggorna. En ljus bakgrund, som avatarernas
    // krämvita, ger en hög median fast fotot är rätt exponerat, så det är de mörkaste partierna som avgör.
    else if (mid > 0.82 && pct(0.05) / white > 0.5) gamma = clamp(Math.log(0.7) / Math.log(mid), 1, 1.5);
    if (white === 255 && gamma === 1) return null;
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) lut[v] = 255 * clamp(v / white, 0, 1) ** gamma;
    for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
    const out = newCanvas(W, H);
    out.getContext('2d', { willReadFrequently: true }).putImageData(img, 0, 0);
    return out;
  }

  /* ================================================================ ringa in */

  /*
   * Kunden ringar in tatueringen på fotot som det laddades in (m.photo), och allt utanför ringen tas bort.
   * Är det hud innanför, alltså ett foto av en tatuering på någon, behandlas huden som papper (skinToPaper).
   * Annars är det papper, till exempel ett av motiven på ett flash-ark, och det utanför ringen fylls med
   * pappersfärg. ring är punkter i fotots pixlar. Returnerar inställningarna, eller null om ringen är för liten.
   * m.warning blir 'empty' om inget bläck hittades.
   */
  function ringMotif(m, ring) {
    const photo = m.photo;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of ring) {
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    }
    x0 = clamp(Math.floor(x0), 0, photo.width);
    y0 = clamp(Math.floor(y0), 0, photo.height);
    const bw = clamp(Math.ceil(x1), 0, photo.width) - x0;
    const bh = clamp(Math.ceil(y1), 0, photo.height) - y0;
    if (bw < 8 || bh < 8) return null;

    // Ett litet utsnitt skalas upp, så att tatueringen har detaljer nog att placeras stort.
    const k = clamp(RING_MIN / Math.max(bw, bh), 1, 4);
    const W = Math.round(bw * k);
    const H = Math.round(bh * k);
    const crop = newCanvas(W, H);
    const cx = crop.getContext('2d', { willReadFrequently: true });
    cx.fillStyle = '#fff';
    cx.fillRect(0, 0, W, H);
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(photo, x0, y0, bw, bh, 0, 0, W, H);
    const mx = newCanvas(W, H).getContext('2d', { willReadFrequently: true });
    mx.beginPath();
    ring.forEach((p, i) => (i ? mx.lineTo((p.x - x0) * k, (p.y - y0) * k) : mx.moveTo((p.x - x0) * k, (p.y - y0) * k)));
    mx.closePath();
    mx.fill();
    const md = mx.getImageData(0, 0, W, H).data;
    const inside = new Uint8Array(W * H);
    for (let p = 0; p < inside.length; p++) inside[p] = md[p * 4 + 3] > 127 ? 1 : 0;

    const img = cx.getImageData(0, 0, W, H);
    if (m.inverted) invertLight(img.data); // vitt på svart, som när motivet lästes in
    const skin = onSkin(img.data, inside);
    let cut = 0;
    if (skin) cut = skinToPaper(img.data, inside, W, H);
    else fillPaper(crop, img.data, inside);
    cx.putImageData(img, 0, 0);

    Object.assign(m, { src: crop, orig: crop, erase: null, ink: null, undo: [], redo: [], hasAlpha: false, warning: '', ring });
    changed(m);
    const o = skin ? { clean: true, cut, flatten: false, black: true } : settingsFor(m, true);
    if (!autoTrim(m, o) && !hasInk(m, o)) m.warning = 'empty';
    return o;
  }

  /*
   * Är det hud innanför ringen? Den ljusare halvan avgör, eftersom det är bakgrunden och inte bläcket.
   * Hudfärg räcker, men i färgat ljus (lila klubbljus, gul lampa) ser huden inte ut som hud. Då räknas det som
   * hud så länge det inte ser ut som papper: papper är blekt, gulaktigt (krämvitt, beige, gult lampljus) eller
   * grönare än rött, och aldrig lila.
   */
  function onSkin(d, inside) {
    const lum = [];
    for (let p = 0; p < inside.length; p += 7) {
      if (inside[p]) lum.push(d[p * 4] * 0.299 + d[p * 4 + 1] * 0.587 + d[p * 4 + 2] * 0.114);
    }
    if (!lum.length) return false;
    const mid = Float32Array.from(lum).sort()[lum.length >> 1];
    let bright = 0;
    let skin = 0;
    let r = 0, g = 0, b = 0, l = 0, c = 0;
    for (let p = 0, j = 0; p < inside.length; p += 7) {
      if (!inside[p]) continue;
      const v = lum[j++];
      if (v < mid) continue;
      const i = p * 4;
      bright++;
      if (isSkin(d, i)) skin++;
      r += d[i]; g += d[i + 1]; b += d[i + 2]; l += v;
      c += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
    }
    if (skin >= bright * 0.4) return true;
    r /= bright; g /= bright; b /= bright;
    if (r - g > 10 && b - g > 10) return true;
    return !(c < l * 0.25 || r - g < (g - b) * 0.6 || g >= r);
  }

  /* Det utanför ringen får pappersfärgen runt omkring, så att det försvinner med pappret. */
  function fillPaper(crop, d, inside) {
    const W = crop.width;
    const grid = paperGrid(crop);
    const paper = new Float32Array(W * 3);
    if (!grid) {
      const wp = whitePoint(crop);
      for (let x = 0; x < W; x++) paper.set(wp, x * 3);
    }
    for (let y = 0; y < crop.height; y++) {
      if (grid) paperRow(grid, y, W, paper);
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (inside[p]) continue;
        d[p * 4] = paper[x * 3]; d[p * 4 + 1] = paper[x * 3 + 1]; d[p * 4 + 2] = paper[x * 3 + 2];
      }
    }
  }

  /*
   * Huden som papper. Bläcket syns på två sätt: det gör huden mörkare, och det tar bort hudens rödbruna ton, så
   * att den blir grå eller blå. Ljusheten mäts i rödkanalen, eftersom rodnad, hudfläckar och ådror syns i grönt
   * och blått medan bläck mörkar alla kanaler. Den har detaljerna och räcker på ljus hud. På mörk hud är läkt
   * bläck ofta gråblått och knappt mörkare än huden, medan hudens textur och skuggor syns mer, och då är det
   * färgtonen som visar bläcket. Färgtonen påverkas inte av skuggor, men den har mindre detaljer (JPEG sparar
   * färgen i halv upplösning), och den är brusig på ljus hud. Därför får den bara dra upp det som ljusheten
   * redan visar lite av, och mer ju svagare ljusheten ser bläcket jämfört med färgtonen.
   * Svagt bläck dras sedan upp, så att en blek tatuering blir tydlig. Resultatet blir svart bläck på vitt, och
   * rött bläck försvinner, eftersom det varken mörkar rödkanalen eller gör huden grå. Det utanför ringen blir vitt.
   * Returnerar rensningen, satt efter hudens brus.
   */
  function skinToPaper(d, inside, W, H) {
    const N = W * H;
    const f = Math.max(1, Math.round(Math.max(W, H) / 250)); // skattningarna görs i låg upplösning, de är ändå mjuka
    const side = Math.max(Math.ceil(W / f), Math.ceil(H / f));
    const warm = new Float32Array(N); // hur rödbrun pixeln är: 0 för grått, och samma i skugga som i ljus
    for (let p = 0, i = 0; p < N; p++, i += 4) warm[p] = (d[i] - d[i + 2]) / (d[i] + 16);
    const SR = skinLevel((p) => d[p * 4], inside, W, H, f, Math.max(2, Math.round(side * SKIN_RADIUS)), false);
    const SU = skinLevel((p) => warm[p], inside, W, H, f, Math.max(2, Math.round(side * SKIN_HUE_RADIUS)), true);

    const aR = new Float32Array(N); // täckningen enligt ljusheten
    const aU = new Float32Array(N); // och enligt färgtonen
    for (let p = 0; p < N; p++) {
      if (!inside[p]) continue;
      aR[p] = 1 - Math.min(1, d[p * 4] / Math.max(8, SR[p]));
      aU[p] = SU[p] > 0.04 ? clamp(1 - warm[p] / SU[p], 0, 1) : 0;
    }
    // Hudens ton skattas från de varmaste partierna, så vanlig hud ser lite grå ut. Det som 30 procent av
    // ringen når räknas som hud.
    const off = Math.min(0.9, quantile(aU, inside, 0.3));
    for (let p = 0; p < N; p++) if (inside[p]) aU[p] = Math.max(0, (aU[p] - off) / (1 - off));
    const boost = clamp(1 + (quantile(aU, inside, 0.995) / Math.max(0.05, quantile(aR, inside, 0.995)) - 1.2) * 4, 1, SKIN_HUE_BOOST);
    const A = aR;
    for (let p = 0; p < N; p++) if (inside[p]) A[p] = Math.max(aR[p], Math.min(aU[p], boost * aR[p]));
    const gain = clamp(SKIN_INK / Math.max(0.01, quantile(A, inside, 0.995)), 1, SKIN_GAIN_MAX);

    const hist = new Uint32Array(101);
    for (let p = 0; p < N; p++) {
      const i = p * 4;
      let v = 255;
      if (inside[p]) {
        const a = Math.min(1, A[p] * gain);
        hist[Math.round(a * 100)]++;
        v = 255 * (1 - a);
      }
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    // Huden har en bred topp och en lång svans av porer och veck. Räknas svansen in försvinner svaga linjer,
    // så rensningen sätts där toppen fallit till en fjärdedel. Histogrammet jämnas först, eftersom 8-bitarsvärdena
    // fyller varannan stapel ojämnt. Det som är ljusare än huden hamnar på noll och räknas inte som toppen.
    const smooth = new Uint32Array(101);
    for (let b = 1; b <= 100; b++) smooth[b] = (hist[b - 1] + 2 * hist[b] + hist[Math.min(100, b + 1)]) / 4;
    return noiseCut(smooth, 0.25, 30);
  }

  /*
   * Hudens nivå i en kanal, per pixel. I rutor om f pixlar tas det största värdet, eller medelvärdet (mean) för
   * en brusig kanal. Sedan det största inom radien r och det minsta av det, så att bläck smalare än radien
   * försvinner och bara huden blir kvar. Till sist utjämnat och uppskalat.
   */
  function skinLevel(get, inside, W, H, f, r, mean) {
    const w = Math.ceil(W / f);
    const h = Math.ceil(H / f);
    const top = new Float32Array(w * h).fill(-Infinity);
    const count = new Uint16Array(w * h);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (!inside[p]) continue;
        const j = Math.floor(y / f) * w + Math.floor(x / f);
        const v = get(p);
        if (mean) top[j] = count[j] ? top[j] + v : v;
        else if (v > top[j]) top[j] = v;
        count[j]++;
      }
    }
    let sum = 0;
    let n = 0;
    for (let j = 0; j < top.length; j++) {
      if (!count[j]) continue;
      if (mean) top[j] /= count[j];
      sum += top[j];
      n++;
    }
    const grown = rankFilter(top, w, h, r, true);
    for (let j = 0; j < grown.length; j++) if (grown[j] === -Infinity) grown[j] = Infinity;
    const skin = rankFilter(grown, w, h, r, false);
    for (let j = 0; j < skin.length; j++) if (skin[j] === Infinity) skin[j] = n ? sum / n : 0;
    const S = boxBlur(skin, w, h, Math.max(1, r >> 1));
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const fy = clamp((y + 0.5) / f - 0.5, 0, h - 1);
      const gy0 = Math.floor(fy);
      const gy1 = Math.min(h - 1, gy0 + 1);
      const ty = fy - gy0;
      for (let x = 0; x < W; x++) {
        const fx = clamp((x + 0.5) / f - 0.5, 0, w - 1);
        const gx0 = Math.floor(fx);
        const gx1 = Math.min(w - 1, gx0 + 1);
        const tx = fx - gx0;
        out[y * W + x] = (S[gy0 * w + gx0] * (1 - tx) + S[gy0 * w + gx1] * tx) * (1 - ty) + (S[gy1 * w + gx0] * (1 - tx) + S[gy1 * w + gx1] * tx) * ty;
      }
    }
    return out;
  }

  /* Värdet som andelen q av pixlarna innanför ringen ligger under. Var tredje pixel räcker. */
  function quantile(a, inside, q) {
    const v = [];
    for (let p = 0; p < a.length; p += 3) if (inside[p]) v.push(a[p]);
    if (!v.length) return 0;
    const s = Float32Array.from(v).sort();
    return s[Math.min(s.length - 1, Math.floor(s.length * q))];
  }

  /*
   * Största (max) eller minsta värdet inom radien r, först på bredden och sedan på höjden. Räknas med van Herk:
   * största värdet från början och från slutet av varje block på 2r + 1, så att tiden inte beror på radien.
   * Fungerar med flyttal och med bytes (minsta värdet är då det största av 255 - v). Med Uint32Array går bara
   * max, och då kan värdet i de översta bitarna bära med sig något i de undre, som en färg.
   */
  function rankFilter(src, W, H, r, max) {
    const T = src.constructor;
    const flip = T === Uint8Array ? (v) => 255 - v : (v) => -v;
    const k = 2 * r + 1;
    const a = max ? src : src.map(flip);
    const tmp = new T(src.length);
    const len = Math.ceil((W + 2 * r) / k) * k;
    const line = new T(len);
    const g = new T(len);
    const h = new T(len);
    for (let y = 0; y < H; y++) {
      const o = y * W;
      line.fill(-Infinity);
      line.set(a.subarray(o, o + W), r);
      for (let s = 0; s < len; s += k) {
        g[s] = line[s];
        for (let i = s + 1; i < s + k; i++) g[i] = g[i - 1] > line[i] ? g[i - 1] : line[i];
        h[s + k - 1] = line[s + k - 1];
        for (let i = s + k - 2; i >= s; i--) h[i] = h[i + 1] > line[i] ? h[i + 1] : line[i];
      }
      for (let x = 0; x < W; x++) tmp[o + x] = h[x] > g[x + 2 * r] ? h[x] : g[x + 2 * r];
    }
    // På höjden med hela rader åt gången, så att minnet läses i ordning.
    const rows = Math.ceil((H + 2 * r) / k) * k;
    const G = new T(rows * W).fill(-Infinity); // blir 0 i en Uint8Array, också det minsta möjliga
    const B = new T(rows * W).fill(-Infinity);
    for (let y = 0; y < H; y++) G.set(tmp.subarray(y * W, y * W + W), (y + r) * W);
    B.set(G);
    for (let s = 0; s < rows; s += k) {
      for (let j = s + 1; j < s + k; j++) {
        for (let x = j * W, e = x + W; x < e; x++) if (G[x - W] > G[x]) G[x] = G[x - W];
      }
      for (let j = s + k - 2; j >= s; j--) {
        for (let x = j * W, e = x + W; x < e; x++) if (B[x + W] > B[x]) B[x] = B[x + W];
      }
    }
    const out = new T(src.length);
    const off = 2 * r * W;
    for (let p = 0; p < out.length; p++) out[p] = B[p] > G[p + off] ? B[p] : G[p + off];
    return max ? out : out.map(flip);
  }

  /* ================================================================ gratis-looken */

  /*
   * Motivet som det ska ritas när det skalas med s (fotots pixlar per motivpixel). En linje som blir smalare än
   * den tunnaste nålen (LINE_MIN) blir annars ljusgrå när den skalas ner, så tunna linjer görs bredare och mörkare,
   * så som en tatuerare ändå skulle dra dem. Täta streck, som skuggning, går inte att dra som linjer i den
   * storleken och behåller sin ton.
   *
   * Det räknas i ett rutnät där en linje på LINE_MIN blir ungefär en och en halv ruta. Varje ruta får det mörkaste
   * i sig, så en tunn linje blir minst en ruta bred med sin egen täckning. Det som är tunt i rutnätet mörkas och
   * läggs ovanpå motivet, som alltså ritas skarpt som förut. Rutnätet är ungefär lika stort som motivet blir på
   * fotot, så det går fort, och det sparas per rutstorlek.
   */
  function boldFor(m, o, s, W, H) {
    const clean = buildClean(m, o);
    const T = Math.max(LINE_MIN_PX, Math.max(W, H) * LINE_MIN) / s; // den tunnaste linjen, i motivets pixlar
    if (T < 3) {
      if (m.bold && m.bold.src === clean && m.bold.c === 0) return clean;
      dropBold(m);
      m.bold = { src: clean, c: 0, out: clean }; // så att snabbritningen inte tar linjerna från en mindre storlek
      return clean;
    }
    const c = Math.max(2, Math.round(T / 1.5));
    if (m.bold && m.bold.src === clean && m.bold.c === c) return m.bold.out;
    const { art } = clean;
    const aw = art.width;
    const ah = art.height;
    const d = art.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, aw, ah).data;
    const gw = Math.ceil(aw / c);
    const gh = Math.ceil(ah / c);
    const n = gw * gh;
    const X = new Uint8Array(n); // den högsta täckningen i rutan
    const R = new Float32Array(n);
    const G = new Float32Array(n);
    const B = new Float32Array(n);
    const S = new Float32Array(n);
    const col = new Int32Array(aw);
    for (let x = 0; x < aw; x++) col[x] = (x / c) | 0;
    for (let y = 0, i = 0; y < ah; y++) {
      const row = ((y / c) | 0) * gw;
      for (let x = 0; x < aw; x++, i += 4) {
        const a = d[i + 3];
        if (!a) continue;
        const j = row + col[x];
        if (a > X[j]) X[j] = a;
        R[j] += d[i] * a; G[j] += d[i + 1] * a; B[j] += d[i + 2] * a; S[j] += a;
      }
    }
    // Tunt är det som en öppning tar bort, alltså smalare än tre rutor. Svaga hjälplinjer och kortkanter
    // dras inte upp, eftersom en tatuerare inte heller skulle dra dem.
    const open = rankFilter(rankFilter(X, gw, gh, 1, false), gw, gh, 1, true);
    const faint = LINE_FAINT * 255;
    const t = new Float32Array(n);
    const has = new Uint8Array(n);
    for (let j = 0; j < n; j++) {
      const a = X[j];
      if (a <= open[j] || a <= faint) continue;
      t[j] = ((a - open[j]) / a) * (1 - (1 - a / 255) ** LINE_DARKEN) * Math.min(1, (a - faint) / faint);
      if (t[j] > 0.05) has[j] = 1;
    }
    // Hur mycket av omgivningen som har bläck. Runt en ensam linje är det mesta tomt, medan täta streck,
    // skuggning och papperets struktur fyller nästan allt. Där blir det inget tillägg, eftersom det då
    // skulle flyta ihop till svart eller göra papperets korn till prickar.
    const ink = new Uint8Array(n);
    for (let j = 0; j < n; j++) ink[j] = X[j] > 12 ? 1 : 0;
    const cover = boxBlur(ink, gw, gh, 3);
    dropSpecks(has, gw, gh, 6);
    const add = new ImageData(gw, gh);
    const q = add.data;
    for (let j = 0; j < n; j++) {
      if (!has[j]) continue;
      const v = t[j] * clamp((0.75 - cover[j]) / 0.3, 0, 1);
      if (v < 0.004) continue;
      const i = j * 4;
      q[i] = R[j] / S[j]; q[i + 1] = G[j] / S[j]; q[i + 2] = B[j] / S[j];
      q[i + 3] = v * 255;
    }
    const layer = newCanvas(gw, gh);
    layer.getContext('2d').putImageData(add, 0, 0);
    const bold = newCanvas(aw, ah);
    const bx = bold.getContext('2d');
    bx.drawImage(art, 0, 0);
    bx.imageSmoothingQuality = 'high';
    bx.drawImage(layer, 0, 0, gw * c, gh * c);
    release(layer);
    const out = { art: bold, white: clean.white };
    dropBold(m);
    m.bold = { src: clean, c, out };
    return out;
  }

  /* Den förra bilden med upplyfta linjer ritas aldrig igen. Lyftes inget upp är out själva clean, och den ligger kvar. */
  function dropBold(m) {
    if (m.bold && m.bold.out !== m.bold.src) release(m.bold.out.art);
  }

  /*
   * Nollar de delar av masken has som är mindre än min pixlar åt båda hållen: damm och lösa prickar ska
   * inte bli tydliga prickar på huden. Besökta pixlar märks med 2 och blir 1 igen till sist.
   */
  function dropSpecks(has, W, H, min) {
    const q = new Int32Array(W * H);
    for (let s = 0; s < W * H; s++) {
      if (has[s] !== 1) continue;
      let qn = 0;
      q[qn++] = s;
      has[s] = 2;
      let x0 = W, x1 = 0, y0 = H, y1 = 0;
      for (let k = 0; k < qn; k++) {
        const p = q[k];
        const y = (p / W) | 0;
        const x = p - y * W;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        const left = x > 0 ? -1 : 0;
        const right = x < W - 1 ? 1 : 0;
        for (let dy = y > 0 ? -W : 0; dy <= (y < H - 1 ? W : 0); dy += W) {
          for (let dx = left; dx <= right; dx++) {
            const t = p + dy + dx;
            if (has[t] === 1) { has[t] = 2; q[qn++] = t; }
          }
        }
      }
      const keep = x1 - x0 + 1 >= min || y1 - y0 + 1 >= min ? 2 : 0;
      for (let k = 0; k < qn; k++) has[q[k]] = keep;
    }
    for (let p = 0; p < W * H; p++) has[p] = has[p] ? 1 : 0;
  }

  /*
   * Hur mycket hudstruktur som ska tillbaka över varje pixel av motivet: mörkt och vitt bläck döljer mest,
   * eftersom multiply redan behåller strukturen under ljust bläck. Räknas en gång per lager.
   */
  const shades = new WeakMap();
  function shadeOf({ art, white }) {
    let canvas = shades.get(art);
    if (canvas) return canvas;
    const W = art.width;
    const H = art.height;
    const d = art.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const shade = new ImageData(W, H);
    const s = shade.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3]) s[i + 3] = d[i + 3] * (1 - (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255);
    }
    if (white) {
      const wd = white.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
      for (let i = 3; i < wd.length; i += 4) s[i] = Math.max(s[i], wd[i]);
    }
    canvas = newCanvas(W, H);
    canvas.getContext('2d').putImageData(shade, 0, 0);
    shades.set(art, canvas);
    return canvas;
  }

  /* Lådoskärpa med radien r, först på bredden och sedan på höjden. */
  function boxBlur(src, W, H, r) {
    const tmp = new Float32Array(src.length);
    const out = new Float32Array(src.length);
    const n = 2 * r + 1;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += src[row + clamp(k, 0, W - 1)];
      for (let x = 0; x < W; x++) {
        tmp[row + x] = acc / n;
        acc += src[row + Math.min(W - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    // På höjden rad för rad, med en summa per kolumn, så att minnet läses i ordning.
    const acc = new Float32Array(W);
    for (let k = -r; k <= r; k++) {
      const row = clamp(k, 0, H - 1) * W;
      for (let x = 0; x < W; x++) acc[x] += tmp[row + x];
    }
    for (let y = 0; y < H; y++) {
      const row = y * W;
      const add = Math.min(H - 1, y + r + 1) * W;
      const sub = Math.max(0, y - r) * W;
      for (let x = 0; x < W; x++) {
        out[row + x] = acc[x] / n;
        acc[x] += tmp[add + x] - tmp[sub + x];
      }
    }
    return out;
  }

  /*
   * Hudens ljusa struktur som gråskala, svart där det inte finns någon: ljusa porkanter, ljust hår och små
   * glansprickar (ljusare än en lätt suddig kopia av fotot) plus glans (ljusare än en mycket suddig kopia).
   * Det är bara det ljusa som behövs. Glans ligger ovanpå huden, så multiply släcker den över mörkt bläck,
   * medan mörka porer och hår redan blir kvar i rätt proportion. Räknas en gång per foto.
   */
  const details = new WeakMap();
  function skinDetail(skin) {
    let c = details.get(skin);
    if (c) return c;
    const W = skin.width;
    const H = skin.height;
    const { data } = skin.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H);
    const L = new Float32Array(W * H);
    for (let p = 0, i = 0; p < L.length; p++, i += 4) L[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const rs = Math.max(2, Math.round(Math.max(W, H) * TEXTURE_RADIUS));
    const small = boxBlur(boxBlur(L, W, H, rs), W, H, rs);

    // Glansen räknas på en bild som är fyra gånger mindre. Den är mjuk ändå, och det går sexton gånger fortare.
    const k = 4;
    const w4 = Math.ceil(W / k);
    const h4 = Math.ceil(H / k);
    const s4 = new Float32Array(w4 * h4);
    for (let y = 0; y < h4; y++) {
      for (let x = 0; x < w4; x++) s4[y * w4 + x] = small[Math.min(H - 1, y * k) * W + Math.min(W - 1, x * k)];
    }
    const rb = Math.max(2, Math.round((Math.max(W, H) * SHEEN_RADIUS) / k));
    const big = boxBlur(boxBlur(s4, w4, h4, rb), w4, h4, rb);

    const img = new ImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      const fy = Math.min(h4 - 1, y / k);
      const y0 = Math.floor(fy);
      const y1 = Math.min(h4 - 1, y0 + 1);
      const ty = fy - y0;
      for (let x = 0; x < W; x++) {
        const fx = Math.min(w4 - 1, x / k);
        const x0 = Math.floor(fx);
        const x1 = Math.min(w4 - 1, x0 + 1);
        const tx = fx - x0;
        const top = big[y0 * w4 + x0] * (1 - tx) + big[y0 * w4 + x1] * tx;
        const bot = big[y1 * w4 + x0] * (1 - tx) + big[y1 * w4 + x1] * tx;
        const p = y * W + x;
        const i = p * 4;
        d[i] = d[i + 1] = d[i + 2] = Math.max(0, L[p] - small[p]) + SHEEN * Math.max(0, small[p] - (top * (1 - ty) + bot * ty));
        d[i + 3] = 255;
      }
    }
    c = newCanvas(W, H);
    c.getContext('2d').putImageData(img, 0, 0);
    details.set(skin, c);
    return c;
  }

  /* Klarar webbläsaren ctx.filter? Där det saknas går egenskapen ändå att sätta, så det måste provas på riktigt. */
  let filterOk = null;
  function canFilter() {
    if (filterOk === null) {
      const x = newCanvas(5, 5).getContext('2d', { willReadFrequently: true });
      x.filter = 'blur(1px)';
      x.fillRect(2, 2, 1, 1);
      filterOk = x.getImageData(1, 2, 1, 1).data[3] > 0;
    }
    return filterOk;
  }

  /* Ett lager i fotots storlek som bläcket ritas i innan det läggs på huden. Återanvänds mellan ritningarna. */
  let layerCanvas = null;
  function layerFor(W, H) {
    if (!layerCanvas || layerCanvas.width !== W || layerCanvas.height !== H) layerCanvas = newCanvas(W, H);
    return layerCanvas;
  }

  /* Ritar c på lagret enligt placeringen, med oskärpan blur i fotots pixlar. */
  function placeOn(x, c, pl, W, H, w, hgt, blur) {
    const draw = (dx, dy) => {
      x.setTransform(1, 0, 0, 1, pl.x * W + dx, pl.y * H + dy);
      x.rotate((pl.rot * Math.PI) / 180);
      if (pl.flip) x.scale(-1, 1);
      x.drawImage(c, -w / 2, -hgt / 2, w, hgt);
    };
    x.imageSmoothingQuality = 'high';
    if (!blur) {
      draw(0, 0);
    } else if (canFilter()) {
      x.filter = `blur(${blur.toFixed(2)}px)`;
      draw(0, 0);
      x.filter = 'none';
    } else {
      // Utan ctx.filter: medelvärdet av fem förskjutna kopior. 'lighter' adderar, och en femtedel var blir medelvärdet.
      const k = blur * 0.8;
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.2;
      for (const [dx, dy] of [[0, 0], [k, k], [-k, k], [k, -k], [-k, -k]]) draw(dx, dy);
      x.globalAlpha = 1;
      x.globalCompositeOperation = 'source-over';
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ================================================================ rita */

  /*
   * Motivet på kroppen enligt placeringen pl, som en färsk tatuering: lätt rodnad runt linjerna, bläcket
   * med multiply och hudens ljusa struktur ovanpå. Returnerar motivets storlek i bildens pixlar.
   * Allt ritas först i ett eget lager inom motivets ruta, så att det går snabbt även när motivet flyttas.
   * fx = { multiply, skin, fast, moving }: skin är fotot som hudstrukturen hämtas från. fast (medan kunden drar
   * i något) ritar de tunna linjerna som de räknades senast och hoppar över hudens struktur, som kommer tillbaka
   * när kunden släpper. moving (medan motivet flyttas, nyps eller vrids) lägger dessutom på motivet som en enda
   * färdig bild (spriteFor). Den blir en aning mjukare vid vridning, vilket inte syns medan motivet rör sig.
   */
  function drawMotif(c2d, m, o, pl, W, H, fx = {}) {
    const clean = buildClean(m, o);
    const w = pl.scale * W;
    const hgt = (w * clean.art.height) / clean.art.width;
    const layers = fx.fast && m.bold && m.bold.src === clean ? m.bold.out : boldFor(m, o, w / clean.art.width, W, H);
    const { art, white } = layers;
    const multiply = fx.multiply !== false;
    const redBlur = multiply ? Math.max(W, H) * FRESH_RED_BLUR : 0;
    if (fx.moving) {
      drawSprite(c2d, spriteFor(m, layers, w, hgt, redBlur, pl.opacity, multiply), pl, W, H, w);
      return { w, h: hgt };
    }

    const a = (pl.rot * Math.PI) / 180;
    const pad = Math.ceil(redBlur * 3) + 2;
    const ex = (Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * hgt) / 2 + pad;
    const ey = (Math.abs(Math.sin(a)) * w + Math.abs(Math.cos(a)) * hgt) / 2 + pad;
    const x0 = clamp(Math.floor(pl.x * W - ex), 0, W);
    const y0 = clamp(Math.floor(pl.y * H - ey), 0, H);
    const bw = clamp(Math.ceil(pl.x * W + ex), 0, W) - x0;
    const bh = clamp(Math.ceil(pl.y * H + ey), 0, H) - y0;
    if (bw <= 0 || bh <= 0) return { w, h: hgt };

    const L = layerFor(W, H);
    const lx = L.getContext('2d');
    const paint = (c, blur = 0) => {
      lx.clearRect(x0, y0, bw, bh);
      placeOn(lx, c, pl, W, H, w, hgt, blur);
    };
    // Byter färgen i lagret mot fill (en färg eller en bild), men behåller formen. Bara inom motivets ruta.
    const recolor = (fill) => {
      lx.save();
      lx.beginPath();
      lx.rect(x0, y0, bw, bh);
      lx.clip();
      lx.globalCompositeOperation = 'source-in';
      fill();
      lx.restore();
    };
    const put = (op, alpha) => {
      c2d.globalCompositeOperation = op;
      c2d.globalAlpha = alpha;
      c2d.drawImage(L, x0, y0, bw, bh, x0, y0, bw, bh);
    };

    c2d.save();
    if (redBlur) {
      // Rodnaden: motivets form, mycket suddig och röd, läggs på huden före bläcket.
      paint(art, redBlur);
      recolor(() => { lx.fillStyle = FRESH_RED; lx.fillRect(x0, y0, bw, bh); });
      put('multiply', FRESH_RED_ALPHA * pl.opacity);
    }
    paint(art);
    put(multiply ? 'multiply' : 'source-over', pl.opacity);
    if (white) {
      paint(white);
      put('source-over', pl.opacity);
    }
    if (fx.skin && !fx.fast) {
      // Hudens ljusa struktur, bara där bläcket döljer den, läggs på med screen, som bara kan göra ljusare.
      paint(shadeOf(layers));
      const D = skinDetail(fx.skin);
      const kx = D.width / W;
      const ky = D.height / H;
      recolor(() => lx.drawImage(D, x0 * kx, y0 * ky, bw * kx, bh * ky, x0, y0, bw, bh));
      put('screen', TEXTURE * pl.opacity);
    }
    c2d.restore();
    return { w, h: hgt };
  }

  /*
   * Snabbversionen av motivet: rodnaden och bläcket bakas ihop en gång till en bild i motivets storlek, som
   * sedan läggs på med en enda drawImage per bildruta. Bakat på vitt blir multiply av rodnaden och sedan
   * bläcket samma faktor som när de läggs på huden var för sig. Bilden görs om när motivet eller färgstyrkan
   * har ändrats, eller när storleken har ändrats så mycket att den skulle bli suddig.
   */
  function spriteFor(m, layers, w, hgt, redBlur, opacity, multiply) {
    const s = m.sprite;
    if (s && s.layers === layers && s.opacity === opacity && s.redBlur === redBlur && s.multiply === multiply && w < s.w * 1.3 && w > s.w * 0.75) return s;
    const pad = Math.ceil(redBlur * 3) + 2;
    const SW = Math.ceil(w) + pad * 2;
    const SH = Math.ceil(hgt) + pad * 2;
    const mid = { x: 0.5, y: 0.5, rot: 0, flip: false };
    const ink = newCanvas(SW, SH);
    const x = ink.getContext('2d');
    if (multiply) {
      x.fillStyle = '#fff';
      x.fillRect(0, 0, SW, SH);
      x.globalCompositeOperation = 'multiply';
      if (redBlur) {
        const red = newCanvas(SW, SH);
        const rx = red.getContext('2d');
        placeOn(rx, layers.art, mid, SW, SH, w, hgt, redBlur);
        rx.globalCompositeOperation = 'source-in';
        rx.fillStyle = FRESH_RED;
        rx.fillRect(0, 0, SW, SH);
        x.globalAlpha = FRESH_RED_ALPHA * opacity;
        x.drawImage(red, 0, 0);
        release(red);
      }
    }
    x.globalAlpha = opacity;
    placeOn(x, layers.art, mid, SW, SH, w, hgt, 0);
    let white = null;
    if (layers.white) {
      white = newCanvas(SW, SH);
      const wx = white.getContext('2d');
      wx.globalAlpha = opacity;
      placeOn(wx, layers.white, mid, SW, SH, w, hgt, 0);
    }
    if (s) { release(s.ink); release(s.white); }
    m.sprite = { layers, opacity, redBlur, multiply, w, ink, white };
    return m.sprite;
  }

  function drawSprite(c2d, sp, pl, W, H, w) {
    c2d.save();
    c2d.translate(pl.x * W, pl.y * H);
    c2d.rotate((pl.rot * Math.PI) / 180);
    if (pl.flip) c2d.scale(-1, 1);
    c2d.scale(w / sp.w, w / sp.w);
    c2d.globalCompositeOperation = sp.multiply ? 'multiply' : 'source-over';
    c2d.drawImage(sp.ink, -sp.ink.width / 2, -sp.ink.height / 2);
    if (sp.white) {
      c2d.globalCompositeOperation = 'source-over';
      c2d.drawImage(sp.white, -sp.white.width / 2, -sp.white.height / 2);
    }
    c2d.restore();
  }

  /* Vit kant under blå linje, så att den syns på både ljus och mörk bakgrund. */
  function outline(c2d, draw, u, dashed) {
    c2d.lineWidth = 3.2 * u;
    c2d.strokeStyle = 'rgba(255,255,255,0.9)';
    c2d.setLineDash([]);
    draw();
    c2d.lineWidth = 1.6 * u;
    c2d.strokeStyle = '#215fb0';
    c2d.setLineDash(dashed ? [7 * u, 5 * u] : []);
    draw();
    c2d.setLineDash([]);
  }

  /* Stencilram runt motivet, med registreringsmärke i mitten. */
  function drawFrame(c2d, pl, W, H, w, hgt) {
    const u = Math.max(1, W / 640);
    c2d.save();
    c2d.translate(pl.x * W, pl.y * H);
    c2d.rotate((pl.rot * Math.PI) / 180);
    c2d.globalCompositeOperation = 'source-over';
    c2d.globalAlpha = 1;
    outline(c2d, () => c2d.strokeRect(-w / 2, -hgt / 2, w, hgt), u, true);
    const r = 6 * u;
    c2d.beginPath();
    c2d.arc(0, 0, r, 0, Math.PI * 2);
    c2d.moveTo(-r * 2, 0); c2d.lineTo(r * 2, 0);
    c2d.moveTo(0, -r * 2); c2d.lineTo(0, r * 2);
    outline(c2d, () => c2d.stroke(), u, false);
    c2d.restore();
  }

  let checker = null;
  function checkerPattern(c2d, size) {
    if (!checker || checker.size !== size) {
      const t = newCanvas(size * 2, size * 2);
      const x = t.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, size * 2, size * 2);
      x.fillStyle = '#d6d8e2';
      x.fillRect(0, 0, size, size);
      x.fillRect(size, size, size, size);
      checker = { size, tile: t };
    }
    return c2d.createPattern(checker.tile, 'repeat');
  }

  /* Granskningsvyns storlek: motivet (eller c, som fotot vid Ringa in) skalat upp till minst max px, högst fyra gånger. */
  function viewSize(m, max, c = m.src) {
    const k = clamp(max / Math.max(c.width, c.height), 1, 4);
    return { W: Math.round(c.width * k), H: Math.round(c.height * k) };
  }

  /* Ringa in: fotot som det laddades in, med ringen ovanpå. ring är punkter i fotots pixlar, closed när den är klar. */
  function drawRingView(c2d, m, ring, W, H, closed) {
    const k = W / m.photo.width;
    c2d.save();
    c2d.fillStyle = '#fff';
    c2d.fillRect(0, 0, W, H);
    c2d.imageSmoothingQuality = 'high';
    c2d.drawImage(m.photo, 0, 0, W, H);
    if (ring && ring.length > 1) {
      c2d.lineJoin = 'round';
      c2d.lineCap = 'round';
      c2d.beginPath();
      ring.forEach((p, i) => (i ? c2d.lineTo(p.x * k, p.y * k) : c2d.moveTo(p.x * k, p.y * k)));
      if (closed) c2d.closePath();
      outline(c2d, () => c2d.stroke(), Math.max(1.5, W / 400), false);
    }
    c2d.restore();
  }

  /*
   * Granskningsvyn: det rensade motivet utan multiply, så att papperrester, glorior och hål syns.
   * v = { view: 'checker' | 'black' | 'white', cropBox, brush: { x, y, size } } i motivets pixlar.
   */
  function drawMotifView(c2d, m, o, v, W, H) {
    const k = W / m.src.width;
    const { art, white } = buildClean(m, o);
    const u = Math.max(1, W / 640);
    c2d.save();
    c2d.fillStyle = v.view === 'checker' ? checkerPattern(c2d, Math.max(8, Math.round(W / 48))) : v.view === 'black' ? '#000' : '#fff';
    c2d.fillRect(0, 0, W, H);
    c2d.imageSmoothingQuality = 'high';
    c2d.drawImage(art, 0, 0, W, H);
    if (white) c2d.drawImage(white, 0, 0, W, H);
    if (v.cropBox) {
      const x = v.cropBox.x0 * k;
      const y = v.cropBox.y0 * k;
      const w = (v.cropBox.x1 - v.cropBox.x0) * k;
      const hh = (v.cropBox.y1 - v.cropBox.y0) * k;
      c2d.fillStyle = 'rgba(10, 26, 47, 0.5)';
      c2d.beginPath();
      c2d.rect(0, 0, W, H);
      c2d.rect(x, y, w, hh);
      c2d.fill('evenodd');
      outline(c2d, () => c2d.strokeRect(x, y, w, hh), u, true);
    }
    if (v.brush) {
      c2d.beginPath();
      c2d.arc(v.brush.x * k, v.brush.y * k, (v.brush.size * k) / 2, 0, Math.PI * 2);
      outline(c2d, () => c2d.stroke(), u, false);
    }
    c2d.restore();
  }

  /* ================================================================ redigera motivet */

  const boxOf = (a, b) => ({ x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) });

  /* Efter beskärning, suddning, vitt bläck, ångra, gör om och återställ. */
  function changed(m) {
    m.rev++;
    m.eraseRev++;
    m.thumb = thumbOf(m.src, 128, true);
  }

  /*
   * Ångra och gör om sparar referenser, inga kopior, och det som sparats får aldrig ändras på plats. Sudda och
   * Vitt bläck ändrar m.erase och m.ink på plats, så pushUndo ger motivet egna kopior (detach) innan de ändras.
   * Det som ångrats går att göra om tills något nytt görs.
   */
  function pushUndo(m) {
    m.undo.push({ src: m.src, erase: m.erase, ink: m.ink });
    if (m.undo.length > UNDO_MAX) m.undo.shift();
    m.redo = [];
    detach(m);
  }

  function undo(m) {
    return swapUndo(m, m.undo, m.redo);
  }

  function redo(m) {
    return swapUndo(m, m.redo, m.undo);
  }

  function swapUndo(m, from, to) {
    if (!from.length) return false;
    to.push({ src: m.src, erase: m.erase, ink: m.ink });
    Object.assign(m, from.pop());
    changed(m);
    return true;
  }

  /* Motivets innehåll, för ångra i kundvyn: referenser, inga kopior (se pushUndo). */
  function motifState(m) {
    const { src, orig, erase, ink, hasAlpha, warning, ring } = m;
    return { src, orig, erase, ink, undo: m.undo.slice(), hasAlpha, warning, ring };
  }

  function restoreMotif(m, state) {
    Object.assign(m, state, { undo: state.undo.slice(), redo: [] });
    changed(m);
  }

  function detach(m) {
    if (m.erase) {
      const erase = newCanvas(m.erase.width, m.erase.height);
      erase.getContext('2d').drawImage(m.erase, 0, 0);
      m.erase = erase;
    }
    if (m.ink) m.ink = m.ink.slice();
  }

  function reset(m) {
    if (m.src === m.orig && !m.erase && !m.ink) return false;
    pushUndo(m);
    Object.assign(m, { src: m.orig, erase: null, ink: null });
    changed(m);
    return true;
  }

  /* Ett penseldrag från a till b, size i motivets pixlar. Anroparen tar pushUndo när draget börjar. */
  function paintErase(m, a, b, size) {
    if (!m.erase) m.erase = newCanvas(m.src.width, m.src.height);
    const x = m.erase.getContext('2d');
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.lineWidth = size;
    x.strokeStyle = '#000';
    x.beginPath();
    x.moveTo(a.x, a.y);
    x.lineTo(b.x + 0.01, b.y); // en tryckning utan rörelse ska också bli en prick
    x.stroke();
    m.eraseRev++;
  }

  /* Beskär till rutan r (motivets pixlar). false om rutan är för liten eller hela motivet. */
  function applyCrop(m, r) {
    const W = m.src.width;
    const H = m.src.height;
    const x0 = clamp(Math.floor(r.x0), 0, W);
    const y0 = clamp(Math.floor(r.y0), 0, H);
    const w = clamp(Math.ceil(r.x1), 0, W) - x0;
    const hh = clamp(Math.ceil(r.y1), 0, H) - y0;
    if (w < 8 || hh < 8 || (w === W && hh === H)) return false;
    pushUndo(m);
    const crop = (c) => {
      const out = newCanvas(w, hh);
      out.getContext('2d', { willReadFrequently: true }).drawImage(c, -x0, -y0);
      return out;
    };
    m.src = crop(m.src);
    if (m.erase) m.erase = crop(m.erase);
    if (m.ink) {
      const ink = new Uint8Array(w * hh);
      for (let y = 0; y < hh; y++) ink.set(m.ink.subarray((y0 + y) * W + x0, (y0 + y) * W + x0 + w), y * w);
      m.ink = ink;
    }
    changed(m);
    return true;
  }

  /* Den sammanhängande ljusa ytan som börjar i start. edge betyder att ytan når bildkanten, alltså bakgrund. */
  function lightArea(light, W, H, start, seen) {
    const pixels = [start];
    seen[start] = 1;
    let edge = false;
    for (let k = 0; k < pixels.length; k++) {
      const p = pixels[k];
      const x = p % W;
      const y = (p - x) / W;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge = true;
      if (x > 0 && light[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; pixels.push(p - 1); }
      if (x < W - 1 && light[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; pixels.push(p + 1); }
      if (y > 0 && light[p - W] && !seen[p - W]) { seen[p - W] = 1; pixels.push(p - W); }
      if (y < H - 1 && light[p + W] && !seen[p + W]) { seen[p + W] = 1; pixels.push(p + W); }
    }
    return { pixels, edge };
  }

  /* Växla vitt bläck för den vita ytan under pt. 'none': ingen vit yta där. 'edge': ytan hör till bakgrunden. */
  function toggleWhite(m, pt, o) {
    const W = m.src.width;
    const H = m.src.height;
    const x = Math.floor(pt.x);
    const y = Math.floor(pt.y);
    if (x < 0 || y < 0 || x >= W || y >= H) return 'none';
    const p = y * W + x;
    const { light } = buildBase(m, o);
    if (!light[p]) return 'none';
    const area = lightArea(light, W, H, p, new Uint8Array(W * H));
    if (area.edge) return 'edge';
    pushUndo(m);
    const on = !(m.ink && m.ink[p]);
    if (!m.ink) m.ink = new Uint8Array(W * H);
    for (const q of area.pixels) m.ink[q] = on ? 1 : 0;
    changed(m);
    return 'ok';
  }

  /* Markera små vita ytor som motivet omsluter helt, som highlights. Stora ytor är oftast hud mellan linjerna och lämnas. */
  function findWhite(m, o) {
    const W = m.src.width;
    const H = m.src.height;
    const N = W * H;
    const maxPx = Math.max(40, N * 0.004);
    const { light } = buildBase(m, o);
    const seen = new Uint8Array(N);
    const ink = m.ink ? m.ink.slice() : new Uint8Array(N);
    let found = 0;
    for (let p = 0; p < N; p++) {
      if (!light[p] || seen[p]) continue;
      const area = lightArea(light, W, H, p, seen);
      if (area.edge || area.pixels.length < 6 || area.pixels.length > maxPx) continue;
      for (const q of area.pixels) ink[q] = 1;
      found++;
    }
    if (!found) return 0;
    pushUndo(m);
    m.ink = ink;
    changed(m);
    return found;
  }

  return {
    newCanvas, fileToCanvas, thumbOf, newMotif, unevenLight, buildClean, skinDetail, autoPrepare, autoExposure,
    ringMotif, drawMotif, drawFrame, viewSize, drawMotifView, drawRingView,
    boxOf, pushUndo, undo, redo, reset, paintErase, applyCrop, toggleWhite, findWhite, motifState, restoreMotif, release,
  };
})();
