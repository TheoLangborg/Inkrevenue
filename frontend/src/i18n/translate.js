import { sv } from "./sv.js";
import { en } from "./en.js";
import { DEFAULT_LANGUAGE } from "./config.js";

/**
 * Översättaren utan React: LanguageContext bygger på den, och moduler utanför
 * komponentträdet (API-klienten, felgränsen, rena hjälpfunktioner med
 * node-tester) kan använda den direkt. Importerna har filändelse för att
 * node --test ska kunna läsa filen.
 */
const DICTIONARIES = { sv, en };

function resolveKey(dictionary, key) {
  return String(key)
    .split(".")
    .reduce((value, part) => (value == null ? undefined : value[part]), dictionary);
}

function interpolate(template, vars) {
  if (!vars || typeof template !== "string") {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

export function createTranslator(language) {
  const dictionary = DICTIONARIES[language] || DICTIONARIES[DEFAULT_LANGUAGE];

  /**
   * t("header.home") → sträng. Saknas nyckeln i det valda språket faller vi
   * tillbaka på svenskan, och saknas den där också returneras nyckeln — det
   * syns i UI:t utan att sidan kraschar.
   */
  function t(key, vars) {
    const value = resolveKey(dictionary, key);
    const fallback = value === undefined ? resolveKey(DICTIONARIES[DEFAULT_LANGUAGE], key) : value;

    if (fallback === undefined) {
      return key;
    }

    return typeof fallback === "string" ? interpolate(fallback, vars) : fallback;
  }

  /** Som t() men garanterar en array — för listor (FAQ, veckodagar). */
  function tList(key) {
    const value = t(key);
    return Array.isArray(value) ? value : [];
  }

  return { t, tList };
}
