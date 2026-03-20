const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSourceFileBytes = 10 * 1024 * 1024;
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

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Bilden kunde inte läsas. Välj en annan fil."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Bilden kunde inte förberedas för uppladdning."));
    reader.readAsDataURL(blob);
  });
}

export async function prepareLeadImageUpload(file) {
  if (!file) {
    return null;
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Välj en JPG-, PNG- eller WEBP-bild.");
  }

  if (file.size > maxSourceFileBytes) {
    throw new Error("Bilden är för stor. Välj en fil under 10 MB.");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Det gick inte att förbereda bilden för uppladdning.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, "image/jpeg", outputQuality);

  if (!blob) {
    throw new Error("Det gick inte att komprimera bilden. Försök igen med en annan fil.");
  }

  if (blob.size > maxOutputFileBytes) {
    throw new Error("Bilden blev fortfarande för stor. Välj gärna en mindre bild.");
  }

  const dataUrl = await blobToDataUrl(blob);

  return {
    previewUrl: dataUrl,
    fileName: sanitizeFileName(file.name),
    contentType: "image/jpeg",
    dataUrl
  };
}
