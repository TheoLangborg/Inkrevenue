// Testläget: InkRevenues teststudio syns bara när man ber om den
// (användaren 2026-10-20). Lägg till ?test i adressen, t.ex.
// inkrevenue.online/studios?test. Läget gäller sedan i den fliken tills den
// stängs eller man öppnar en adress med ?test=av.
const STORAGE_KEY = "inkrevenue-test-mode";
const OFF_VALUES = new Set(["av", "off", "0", "false", "nej", "no"]);

// true/false när adressen säger något om testläget, annars null.
export function readTestModeParam(search) {
  const params = new URLSearchParams(search || "");
  if (!params.has("test")) return null;
  return !OFF_VALUES.has(String(params.get("test")).trim().toLowerCase());
}

export function isTestMode() {
  if (typeof window === "undefined") return false;
  const fromUrl = readTestModeParam(window.location.search);

  try {
    if (fromUrl === true) window.sessionStorage.setItem(STORAGE_KEY, "1");
    if (fromUrl === false) window.sessionStorage.removeItem(STORAGE_KEY);
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Utan sessionStorage (privat läge, blockerad lagring) gäller bara adressen.
    return fromUrl === true;
  }
}

export function turnOffTestMode() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Inget sparat att ta bort.
  }
}
