const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
// Största fil användaren får välja. Exponeras så att formuläret kan visa gränsen
// och använda samma siffra i felmeddelandet. Filen skickas aldrig som den är —
// den krymps här först — så gränsen skyddar telefonens minne, inte servern:
// hela originalet avkodas innan det ritas om.
export const MAX_INSPIRATION_IMAGE_MB = 20;
// Hur många bilder kunden får bifoga. Samma siffra som MAX_INSPIRATION_IMAGES i
// tattoo-crm/backend/src/services/publicLeadUploadService.js.
export const MAX_INSPIRATION_IMAGES = 5;
const maxSourceFileBytes = MAX_INSPIRATION_IMAGE_MB * 1024 * 1024;
// Tak per färdig bild. Fem bilder à 1,5 MB blir ~10 MB base64, och hela kedjan
// av gränser (proxyn, CRM:et, schemat) står i tattoo-crm/backend/src/schemas/
// publicSchemas.js. Ändras siffran här måste den kedjan ändras med.
const maxOutputFileBytes = 1.5 * 1024 * 1024;
// Första försöket ger en vanlig mobilbild på några hundra KB. De följande tar
// bara över för ovanligt detaljrika bilder som inte ryms under taket.
const encodeAttempts = [
  { maxDimension: 1600, quality: 0.82 },
  { maxDimension: 1600, quality: 0.72 },
  { maxDimension: 1280, quality: 0.72 },
  { maxDimension: 1024, quality: 0.65 }
];

function sanitizeFileName(value) {
  const normalized = String(value || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${normalized || "inspiration"}.jpg`;
}

function loadImage(file, t) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(t("leadForm.imageUnreadable")));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function blobToDataUrl(blob, t) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(t("leadForm.imageError")));
    reader.readAsDataURL(blob);
  });
}

/**
 * Förbereder kundens bild för uppladdning. `t` är formulärets översättare, så
 * att felen som visas under fältet står på sidans språk.
 */
export async function prepareLeadImageUpload(file, t) {
  if (!file) {
    return null;
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new Error(t("leadForm.imageTypeUnsupported"));
  }

  if (file.size > maxSourceFileBytes) {
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(t("leadForm.imageTooLarge", { size: fileMb, max: MAX_INSPIRATION_IMAGE_MB }));
  }

  const image = await loadImage(file, t);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(t("leadForm.imageError"));
  }

  let blob = null;
  let drawnDimension = 0;

  try {
    for (const attempt of encodeAttempts) {
      if (attempt.maxDimension !== drawnDimension) {
        const scale = Math.min(1, attempt.maxDimension / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        // JPEG saknar genomskinlighet: utan vit botten blir en PNG med
        // transparent bakgrund svart.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        drawnDimension = attempt.maxDimension;
      }

      blob = await canvasToBlob(canvas, "image/jpeg", attempt.quality);

      if (!blob) {
        throw new Error(t("leadForm.imageCompressFailed"));
      }

      if (blob.size <= maxOutputFileBytes) {
        break;
      }
    }
  } finally {
    // Släpp bildminnet direkt. Formuläret behandlar upp till fem bilder i rad,
    // och på en telefon är det minnet som tar slut först.
    canvas.width = 0;
    canvas.height = 0;
  }

  if (blob.size > maxOutputFileBytes) {
    throw new Error(t("leadForm.imageTooDetailed"));
  }

  const dataUrl = await blobToDataUrl(blob, t);

  return {
    previewUrl: dataUrl,
    fileName: sanitizeFileName(file.name),
    contentType: "image/jpeg",
    dataUrl
  };
}
