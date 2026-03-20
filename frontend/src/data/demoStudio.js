function encodeSvg(value) {
  return encodeURIComponent(value)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%2F/g, "/");
}

function createImageDataUrl({
  title,
  subtitle = "",
  accent = "#7dc0ff",
  backgroundStart = "#10233f",
  backgroundEnd = "#1e4f7a",
  textColor = "#ffffff",
  width = 1200,
  height = 800
}) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${backgroundStart}" />
          <stop offset="100%" stop-color="${backgroundEnd}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="48" fill="url(#bg)" />
      <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.2)}" r="${Math.round(
        height * 0.16
      )}" fill="${accent}" fill-opacity="0.18" />
      <circle cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.78)}" r="${Math.round(
        height * 0.22
      )}" fill="${accent}" fill-opacity="0.12" />
      <text x="72" y="${Math.round(height * 0.42)}" fill="${textColor}" font-size="72" font-family="Georgia, serif" font-weight="700">
        ${title}
      </text>
      <text x="72" y="${Math.round(height * 0.54)}" fill="${textColor}" fill-opacity="0.84" font-size="34" font-family="Arial, sans-serif">
        ${subtitle}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeSvg(svg)}`;
}

function normalizeSlug(value) {
  return String(value || "").trim().toLowerCase();
}

export function createDemoStudioPreview({ submitSlug = "" } = {}) {
  const normalizedSubmitSlug = normalizeSlug(submitSlug);

  return {
    id: "demo-studio-preview",
    slug: normalizedSubmitSlug,
    name: "North Canvas Studio",
    city: "Stockholm",
    logoUrl: createImageDataUrl({
      title: "NC",
      subtitle: "Demo studio",
      accent: "#c6f1ff",
      width: 400,
      height: 400
    }),
    heroImageUrl: createImageDataUrl({
      title: "North Canvas Studio",
      subtitle: "Demo preview for Ink Revenue",
      accent: "#9ee0ff"
    }),
    description:
      "En teststudio for att snabbt se hur en studiosida kan kannas innan ni fyller i allt riktigt innehall.",
    styles: ["Fineline", "Blackwork", "Ornamental"],
    previewMode: true,
    previewDisabledMessage:
      "Det har ar en ren preview utan CRM-koppling annu. Oppna /studio-preview/din-slug for att testa formularet mot en riktig studio i CRM.",
    publicProfile: {
      enabled: Boolean(normalizedSubmitSlug),
      showInDirectory: false,
      headline: "Illustrativa tatueringar med lugn, modern studiokansla.",
      cardSummary:
        "Testprofil for att snabbt prova layout, tonalitet och kundflode innan publicering.",
      intro:
        "Den har demosidan ar till for att ni snabbt ska kunna se hur en studiosida pa Ink Revenue beter sig med hero, intro, galleri och bokningsformular. Nar ni ar nojda kan samma struktur kopplas till en riktig studio i CRM.",
      serviceArea: "Stockholm med omnejd",
      websiteUrl: "",
      instagramUrl: "",
      artworkTags: ["Custom", "Minimal", "Linework"],
      galleryImageUrls: [
        createImageDataUrl({
          title: "Gallery 01",
          subtitle: "Fineline / Floral",
          accent: "#f6d3ff",
          backgroundStart: "#1f2438",
          backgroundEnd: "#5a3358"
        }),
        createImageDataUrl({
          title: "Gallery 02",
          subtitle: "Blackwork / Graphic",
          accent: "#d4efff",
          backgroundStart: "#0f1727",
          backgroundEnd: "#174c73"
        }),
        createImageDataUrl({
          title: "Gallery 03",
          subtitle: "Ornamental / Flow",
          accent: "#ffe1b8",
          backgroundStart: "#231b2f",
          backgroundEnd: "#764c39"
        })
      ],
      formTitle: "Beratta om din ide",
      formIntro:
        "Det har formularet ar samma typ av infolde som en riktig studio kan ta emot fran sin publika sida.",
      successMessage:
        "Tack! Det har ar demoformatet for hur ett skickat formular kan bekräftas till kunden."
    }
  };
}
