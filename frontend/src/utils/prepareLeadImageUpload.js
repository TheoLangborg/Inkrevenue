const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
// Största fil användaren får välja. Exponeras så att formuläret kan visa gränsen
// och använda samma siffra i felmeddelandet.
export const MAX_INSPIRATION_IMAGE_MB = 10;
const maxSourceFileBytes = MAX_INSPIRATION_IMAGE_MB * 1024 * 1024;
const maxOutputFileBytes = 3.5 * 1024 * 1024;
const maxDimension = 1600;
const outputQuality = 0.82;

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
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(t("leadForm.imageError"));
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, "image/jpeg", outputQuality);

  if (!blob) {
    throw new Error(t("leadForm.imageCompressFailed"));
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
