import { useEffect, useMemo, useState } from "react";
import { PublicStudioCard } from "../components/PublicStudioCard";
import { getPublicStudios } from "../services/publicSiteApi";
import { buildPageTitle, useJsonLd, usePageMetadata } from "../utils/pageMetadata";
import { getStudioTags } from "../utils/studioTags";
import { studioRegistry } from "./studios";

export function StudiosDirectoryPage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (filters.city) parts.push(`i ${filters.city}`);
    return parts.length
      ? buildPageTitle(`Tatueringsstudios ${parts.join(" ")}`)
      : buildPageTitle("Hitta tatueringsstudios i Sverige");
  }, [filters.city, filters.style]);

  const metaDescription = useMemo(() => {
    if (filters.style && filters.city) {
      return `Hitta tatueringsstudios med ${filters.style} i ${filters.city}. Filtrera, se galleri och skicka din förfrågan direkt via Ink Revenue.`;
    }
    if (filters.style) {
      return `Tatueringsstudios specialiserade på ${filters.style}. Se galleri, läs om studion och skicka din förfrågan direkt.`;
    }
    if (filters.city) {
      return `Tatueringsstudios i ${filters.city}. Filtrera på stil, se galleri och skicka förfrågan direkt via Ink Revenue.`;
    }
    return "Utforska tatueringsstudios i Sverige efter stil, stad och uttryck. Filtrera fram en studio som passar din idé och skicka din förfrågan direkt.";
  }, [filters.city, filters.style]);

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
          setError("");
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError.message);
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
      "name": "Tatueringsstudios på Ink Revenue",
      "description": metaDescription,
      "numberOfItems": filteredStudios.length,
      "itemListElement": filteredStudios.slice(0, 50).map((studio, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://inkrevenue.online/studio/${encodeURIComponent(studio.slug)}`,
        "name": studio.name
      }))
    };
  }, [filteredStudios, metaDescription]);

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
          <p className="eyebrow">Hitta Rätt Studio</p>
          <h1>
            {filters.style && filters.city
              ? `${filters.style}-tatueringar i ${filters.city}`
              : filters.style
              ? `Tatueringsstudios — ${filters.style}`
              : filters.city
              ? `Tatueringsstudios i ${filters.city}`
              : "Utforska tatueringsstudios i Sverige"}
          </h1>
          <p className="lead lead--dark">
            {filters.style || filters.city
              ? "Filtrera vidare efter plats, stil och uttryck — skicka din förfrågan direkt."
              : "Filtrera efter plats, stil och uttryck för att hitta en studio som passar din idé."}
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="filters-panel">
            <label>
              Sök
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Studio, stad eller stil"
              />
            </label>

            <label>
              Stad
              <select name="city" value={filters.city} onChange={handleFilterChange}>
                <option value="">Alla städer</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Stil
              <select name="style" value={filters.style} onChange={handleFilterChange}>
                <option value="">Alla stilar</option>
                {styles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? <div className="error-panel">{error}</div> : null}

          {loading ? (
            <div className="loading-state">Laddar studios...</div>
          ) : filteredStudios.length ? (
            <>
              <div className="section-heading section-heading--tight">
                <h2>{filteredStudios.length} studios matchar din filtrering</h2>
              </div>
              <div className="studio-grid">
                {filteredStudios.map((studio) => (
                  <PublicStudioCard
                    key={studio.id}
                    studio={studio}
                    cardTheme={studioRegistry[studio.slug]?.cardTheme ?? null}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <h3>Inga studios matchade filtren</h3>
              <p>Prova att rensa sökningen eller välj en annan stil eller stad.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
