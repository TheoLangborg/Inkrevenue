import { useEffect, useMemo, useState } from "react";
import { PublicStudioCard } from "../components/PublicStudioCard";
import { getPublicStudios } from "../services/publicSiteApi";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";

function getStudioTags(studio) {
  return [
    ...(Array.isArray(studio.styles) ? studio.styles : []),
    ...(Array.isArray(studio.publicProfile?.artworkTags)
      ? studio.publicProfile.artworkTags
      : [])
  ].filter(Boolean);
}

export function StudiosDirectoryPage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    city: "",
    style: ""
  });

  usePageMetadata({
    title: buildPageTitle("Hitta tatueringsstudios"),
    description:
      "Utforska tatueringsstudios efter stil, stad och uttryck. Filtrera fram en studio som passar din idé och skicka din förfrågan direkt.",
    path: "/studios"
  });

  useEffect(() => {
    let active = true;

    getPublicStudios()
      .then((response) => {
        if (active) {
          setStudios(response);
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
          <h1>Utforska tatueringsstudios efter stil och stad</h1>
          <p className="lead lead--dark">
            Filtrera efter plats, stil och uttryck för att hitta en studio som passar din idé.
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
                  <PublicStudioCard key={studio.id} studio={studio} />
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
