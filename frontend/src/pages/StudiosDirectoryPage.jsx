import { useEffect, useMemo, useState } from "react";
import { PublicStudioCard } from "../components/PublicStudioCard";
import { CustomSelect } from "../components/CustomSelect";
import { getPublicStudios } from "../services/publicSiteApi";
import { buildPageTitle, useJsonLd, usePageMetadata } from "../utils/pageMetadata";
import { getStudioTags } from "../utils/studioTags";
import { studioRegistry } from "./studios";
import { useLanguage } from "../i18n/LanguageContext";

export function StudiosDirectoryPage() {
  const { t, localizePath } = useLanguage();
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  // Felet självt, inte dess text: på engelska har det ingen text (serverns är
  // svensk), och då visas den översatta reservtexten.
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(() => {
    if (typeof window === "undefined") return { search: "", city: "", style: "" };
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get("search") || "",
      city: params.get("city") || "",
      style: params.get("style") || ""
    };
  });

  const metaTitle = useMemo(() => {
    const parts = [];
    if (filters.style) parts.push(filters.style);
    if (filters.city) parts.push(t("directory.metaTitleCityPart", { city: filters.city }));
    return parts.length
      ? buildPageTitle(t("directory.metaTitleFiltered", { parts: parts.join(" ") }))
      : buildPageTitle(t("directory.metaTitleDefault"));
  }, [filters.city, filters.style, t]);

  const metaDescription = useMemo(() => {
    if (filters.style && filters.city) {
      return t("directory.metaDescriptionBoth", { style: filters.style, city: filters.city });
    }
    if (filters.style) {
      return t("directory.metaDescriptionStyle", { style: filters.style });
    }
    if (filters.city) {
      return t("directory.metaDescriptionCity", { city: filters.city });
    }
    return t("directory.metaDescriptionDefault");
  }, [filters.city, filters.style, t]);

  const metaPath = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.style) params.set("style", filters.style);
    const qs = params.toString();
    return qs ? `/studios?${qs}` : "/studios";
  }, [filters.city, filters.style]);

  usePageMetadata({
    title: metaTitle,
    description: metaDescription,
    path: metaPath
  });

  useEffect(() => {
    let active = true;

    getPublicStudios()
      .then((response) => {
        if (active) {
          setStudios(Array.isArray(response) ? response.filter(Boolean) : []);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const cities = useMemo(
    () =>
      [...new Set(studios.map((studio) => studio.city).filter(Boolean))].sort((first, second) =>
        first.localeCompare(second, "sv")
      ),
    [studios]
  );

  const styles = useMemo(
    () =>
      [...new Set(studios.flatMap((studio) => getStudioTags(studio)).filter(Boolean))].sort(
        (first, second) => first.localeCompare(second, "sv")
      ),
    [studios]
  );

  const filteredStudios = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return studios.filter((studio) => {
      if (filters.city && studio.city !== filters.city) {
        return false;
      }

      if (filters.style) {
        const tagValues = getStudioTags(studio).map((tag) => tag.toLowerCase());

        if (!tagValues.includes(filters.style.toLowerCase())) {
          return false;
        }
      }

      if (search) {
        const haystack = [
          studio.name,
          studio.city,
          studio.description,
          studio.publicProfile?.headline,
          studio.publicProfile?.cardSummary,
          studio.publicProfile?.serviceArea,
          ...getStudioTags(studio)
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }, [filters, studios]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.style) params.set("style", filters.style);
    if (filters.search) params.set("search", filters.search);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filters]);

  const itemListJsonLd = useMemo(() => {
    if (!filteredStudios.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": t("directory.jsonLdName"),
      "description": metaDescription,
      "numberOfItems": filteredStudios.length,
      "itemListElement": filteredStudios.slice(0, 50).map((studio, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://inkrevenue.online/studio/${encodeURIComponent(studio.slug)}`,
        "name": studio.name
      }))
    };
  }, [filteredStudios, metaDescription, t]);

  useJsonLd(itemListJsonLd);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  }

  return (
    <div>
      <section className="page-hero page-hero--directory">
        <div className="container">
          <p className="eyebrow">{t("directory.eyebrow")}</p>
          <h1>
            {filters.style && filters.city
              ? t("directory.titleBoth", { style: filters.style, city: filters.city })
              : filters.style
              ? t("directory.titleStyle", { style: filters.style })
              : filters.city
              ? t("directory.titleCity", { city: filters.city })
              : t("directory.titleDefault")}
          </h1>
          <p className="lead lead--dark">
            {filters.style || filters.city
              ? t("directory.leadFiltered")
              : t("directory.leadDefault")}
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="filters-panel" data-reveal="up">
            <label>
              {t("directory.searchLabel")}
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder={t("directory.searchPlaceholder")}
              />
            </label>

            <label>
              {t("directory.cityLabel")}
              <CustomSelect
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder={t("directory.allCities")}
                options={[
                  { label: t("directory.allCities"), value: "" },
                  ...cities.map((city) => ({ label: city, value: city }))
                ]}
              />
            </label>

            <label>
              {t("directory.styleLabel")}
              <CustomSelect
                name="style"
                value={filters.style}
                onChange={handleFilterChange}
                placeholder={t("directory.allStyles")}
                options={[
                  { label: t("directory.allStyles"), value: "" },
                  ...styles.map((style) => ({ label: style, value: style }))
                ]}
              />
            </label>
          </div>

          {error ? (
            <div className="error-panel">{error.message || t("directory.loadError")}</div>
          ) : null}

          {loading ? (
            <div className="loading-state">{t("directory.loading")}</div>
          ) : filteredStudios.length ? (
            <>
              <div className="section-heading section-heading--tight">
                <h2>{t("directory.resultsHeading", { count: filteredStudios.length })}</h2>
              </div>
              <div className="studio-grid">
                {filteredStudios.map((studio, index) => (
                  <PublicStudioCard
                    key={studio.id}
                    studio={studio}
                    cardTheme={studioRegistry[studio.slug]?.cardTheme ?? null}
                    revealDelay={(index % 3) + 1}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <h3>{t("directory.emptyTitle")}</h3>
              <p>{t("directory.emptyText")}</p>
            </div>
          )}

          {!loading && (filters.city || filters.style) ? (
            <div className="seo-landing-text" data-reveal="up">
              <h2>
                {filters.style && filters.city
                  ? t("directory.titleBoth", { style: filters.style, city: filters.city })
                  : filters.style
                  ? t("directory.seoStyleTitle", { style: filters.style })
                  : t("directory.titleCity", { city: filters.city })}
              </h2>
              <p>
                {filters.style && filters.city
                  ? t("directory.seoBothText", {
                      style: filters.style.toLowerCase(),
                      city: filters.city
                    })
                  : filters.style
                  ? t("directory.seoStyleText", { style: filters.style.toLowerCase() })
                  : t("directory.seoCityText", { city: filters.city })}
              </p>
              <div className="seo-landing-links">
                {filters.city && (
                  <a href={localizePath("/studios")} onClick={(e) => { e.preventDefault(); setFilters({ search: "", city: "", style: "" }); }}>
                    {t("directory.showAllCities")}
                  </a>
                )}
                {filters.style && (
                  <a href={localizePath("/studios")} onClick={(e) => { e.preventDefault(); setFilters({ search: "", city: "", style: "" }); }}>
                    {t("directory.showAllStyles")}
                  </a>
                )}
                {filters.city && !filters.style && styles.slice(0, 4).map((style) => (
                  <a
                    key={style}
                    href={localizePath(`/studios?city=${encodeURIComponent(filters.city)}&style=${encodeURIComponent(style)}`)}
                    onClick={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, style })); }}
                  >
                    {t("directory.styleInCity", { style, city: filters.city })}
                  </a>
                ))}
                {filters.style && !filters.city && cities.slice(0, 4).map((city) => (
                  <a
                    key={city}
                    href={localizePath(`/studios?style=${encodeURIComponent(filters.style)}&city=${encodeURIComponent(city)}`)}
                    onClick={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, city })); }}
                  >
                    {t("directory.styleInCity", { style: filters.style, city })}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {!loading && !filters.city && !filters.style && !filters.search && cities.length > 0 ? (
            <div className="seo-landing-text" data-reveal="up">
              <h2>{t("directory.exploreTitle")}</h2>
              <p>{t("directory.exploreText")}</p>
              <div className="seo-landing-links">
                {cities.map((city) => (
                  <a
                    key={city}
                    href={localizePath(`/studios?city=${encodeURIComponent(city)}`)}
                    onClick={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, city })); }}
                  >
                    {t("directory.exploreCityLink", { city })}
                  </a>
                ))}
                {styles.map((style) => (
                  <a
                    key={style}
                    href={localizePath(`/studios?style=${encodeURIComponent(style)}`)}
                    onClick={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, style })); }}
                  >
                    {t("directory.exploreStyleLink", { style })}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
