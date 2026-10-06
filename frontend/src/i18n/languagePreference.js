/**
 * Automatiskt språkval, appens del.
 *
 * Själva valet görs av skriptet överst i index.html innan sidan hunnit ritas:
 * besökarens eget val går före, annars webbläsarens språkinställning, och
 * stämmer inte adressen byts den mot samma sida på rätt språk. Den här modulen
 * har resten: att spara valet från språkväxlaren, och att läsa ut hänvisaren
 * som skriptet sparade innan det bytte adress.
 *
 * Nycklarna måste stämma med skriptet i index.html. languageRedirect.test.js
 * kör skriptet och kontrollerar det.
 */
export const LANGUAGE_PREFERENCE_KEY = "inkrevenue-language";
export const ENTRY_REFERRER_KEY = "inkrevenue-entry-referrer";

// En sparad hänvisare som är äldre än så kommer inte från en omdirigering nyss.
const ENTRY_REFERRER_MAX_AGE_MS = 30000;

/** Språkväxlarens val. Gäller sedan före webbläsarens språk vid varje besök. */
export function rememberLanguageChoice(language) {
  try {
    window.localStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
  } catch {
    // Utan localStorage gäller webbläsarens språk nästa gång. Inget att krascha på.
  }
}

let entryReferrer = null;

/**
 * Var besökaren kom ifrån, även när språkskriptet har bytt adress.
 *
 * Efter location.replace() är vår egen första adress hänvisaren, så
 * document.referrer säger inte längre Instagram eller Google. Skriptet sparar
 * därför den riktiga hänvisaren i sessionStorage strax innan. main.jsx läser
 * den vid start, och sedan ger funktionen samma svar under hela sidladdningen.
 */
export function getEntryReferrer() {
  if (entryReferrer !== null) return entryReferrer;
  if (typeof document === "undefined") return "";

  entryReferrer = document.referrer || "";

  try {
    const stored = window.sessionStorage.getItem(ENTRY_REFERRER_KEY);

    if (stored) {
      window.sessionStorage.removeItem(ENTRY_REFERRER_KEY);
      const { referrer, at } = JSON.parse(stored);

      if (Date.now() - Number(at) < ENTRY_REFERRER_MAX_AGE_MS) {
        entryReferrer = String(referrer || "");
      }
    }
  } catch {
    // Trasig eller otillgänglig lagring: då får document.referrer duga.
  }

  return entryReferrer;
}
