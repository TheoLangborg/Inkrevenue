import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_LANGUAGE,
  LOCALES,
  buildLanguagePath,
  localizePath as localizePathForLanguage
} from "./config";
import { createTranslator } from "./translate";

export { createTranslator };

/**
 * Importerar avsiktligt INTE siteRouter — routern importerar den här filen för
 * att kunna språkprefixa <SiteLink>. Går importen åt båda hållen får vi en cykel.
 */
const LanguageContext = createContext(null);

export function LanguageProvider({ language = DEFAULT_LANGUAGE, path = "/", children }) {
  const value = useMemo(() => {
    const { t, tList } = createTranslator(language);

    return {
      language,
      isEnglish: language === "en",
      locale: LOCALES[language] || LOCALES[DEFAULT_LANGUAGE],
      // Sidans språkfria sökväg — språkväxlaren och hreflang bygger på den.
      path,
      t,
      tList,
      localizePath: (href) => localizePathForLanguage(href, language),
      pathForLanguage: (nextLanguage, options) =>
        buildLanguagePath(path, nextLanguage, options)
    };
  }, [language, path]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    // Gör komponenter som SiteLink användbara även utanför providern (t.ex. i
    // isolerade tester) — då gäller svenska utan prefix.
    const { t, tList } = createTranslator(DEFAULT_LANGUAGE);
    return {
      language: DEFAULT_LANGUAGE,
      isEnglish: false,
      locale: LOCALES[DEFAULT_LANGUAGE],
      path: "/",
      t,
      tList,
      localizePath: (href) => href,
      pathForLanguage: (nextLanguage, options) =>
        buildLanguagePath("/", nextLanguage, options)
    };
  }

  return context;
}

export function useT() {
  return useLanguage().t;
}
