import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { getArtistFirstName, getArtistInitials } from "../utils/artistShowcase";

// Så många verk som får plats som miniatyrer på kortet. Resten nås via portföljen.
const CARD_THUMBNAILS = 3;

/**
 * ArtistShowcase — studions tatuerare med profilbild och egna verk, ovanför
 * bokningsformuläret. Kunden bläddrar i en artists portfölj och väljer henne
 * direkt: "Boka hos …" skickar valet till formuläret (via sidan) i stället för
 * att kunden ska leta upp samma namn en gång till.
 *
 * Rubriken ligger hos sidan: StudioProfilePage och ThemedStudioPage har var sin
 * rubrikstil. Utseendet styrs av CSS-variablerna `--as-*` (se App.css), som
 * ThemedStudioPage sätter från studions tema.
 *
 * Overlayerna återanvänder galleriets `.rg-*`-klasser, så portfölj och närbild
 * ser likadana ut som studions eget galleri.
 *
 * @param {{
 *   artists: Array<{ id: string, name: string, photoUrl: string, portfolioImageUrls: string[] }>,
 *   selectedArtistId?: string,
 *   onChooseArtist: (artistId: string) => void,
 *   style?: object
 * }} props
 */
export function ArtistShowcase({
  artists,
  selectedArtistId = "",
  onChooseArtist,
  style,
  // Centrerat rutnät för sidor med centrerad rubrik (ThemedStudioPage).
  centered = false
}) {
  const t = useT();
  // { artistIndex, imageIndex: null | number } — imageIndex null = portföljens rutnät.
  const [overlay, setOverlay] = useState(null);
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  const artist = overlay ? artists[overlay.artistIndex] : null;
  const images = artist?.portfolioImageUrls || [];
  const imageCount = images.length;
  const lightboxIndex = overlay?.imageIndex ?? null;

  const openOverlay = useCallback((artistIndex, imageIndex, trigger) => {
    returnFocusRef.current = trigger || null;
    setOverlay({ artistIndex, imageIndex });
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlay(null);
    // Tillbaka till knappen som öppnade — annars hamnar tangentbordsfokus
    // högst upp på sidan när overlayen försvinner.
    returnFocusRef.current?.focus?.();
  }, []);

  // Öppnades närbilden från portföljens rutnät går stängningen tillbaka dit,
  // precis som i studions galleri. Öppnades den från kortets miniatyr stängs allt.
  const closeLightbox = useCallback(() => {
    if (overlay?.fromGrid) {
      setOverlay((current) => (current ? { ...current, imageIndex: null } : current));
    } else {
      closeOverlay();
    }
  }, [overlay, closeOverlay]);

  const step = useCallback(
    (direction) =>
      setOverlay((current) =>
        current && current.imageIndex !== null
          ? { ...current, imageIndex: (current.imageIndex + direction + imageCount) % imageCount }
          : current
      ),
    [imageCount]
  );

  useEffect(() => {
    if (!overlay) return undefined;

    closeButtonRef.current?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        if (overlay.imageIndex !== null) closeLightbox();
        else closeOverlay();
      } else if (overlay.imageIndex !== null && event.key === "ArrowRight") {
        step(1);
      } else if (overlay.imageIndex !== null && event.key === "ArrowLeft") {
        step(-1);
      }
    };

    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [overlay, step, closeOverlay, closeLightbox]);

  function choose(artistId) {
    setOverlay(null);
    onChooseArtist?.(artistId);
  }

  if (!artists.length) return null;

  return (
    <div className={`artist-showcase${centered ? " artist-showcase--centered" : ""}`} style={style}>
      <div className="artist-showcase__grid">
        {artists.map((item, artistIndex) => {
          const isSelected = item.id === selectedArtistId;
          const works = item.portfolioImageUrls;
          const hiddenWorks = Math.max(0, works.length - CARD_THUMBNAILS);

          return (
            <article
              key={item.id}
              className={`artist-card${isSelected ? " artist-card--selected" : ""}`}
            >
              <div className="artist-card__media">
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt={item.name} loading="lazy" />
                ) : (
                  <span className="artist-card__initials" aria-hidden="true">
                    {getArtistInitials(item.name)}
                  </span>
                )}
                {isSelected ? (
                  <span className="artist-card__badge">{t("artists.selected")}</span>
                ) : null}
              </div>

              <div className="artist-card__body">
                <h3 className="artist-card__name">{item.name}</h3>
                <p className="artist-card__meta">
                  {works.length
                    ? works.length === 1
                      ? t("artists.workCountOne")
                      : t("artists.workCount", { count: works.length })
                    : t("artists.noWorks")}
                </p>

                {works.length ? (
                  <div className="artist-card__thumbs">
                    {works.slice(0, CARD_THUMBNAILS).map((url, imageIndex) => {
                      const showsRemainder =
                        hiddenWorks > 0 && imageIndex === CARD_THUMBNAILS - 1;

                      return (
                        <button
                          key={url}
                          type="button"
                          className="artist-card__thumb"
                          onClick={(event) =>
                            showsRemainder
                              ? openOverlay(artistIndex, null, event.currentTarget)
                              : openOverlay(artistIndex, imageIndex, event.currentTarget)
                          }
                          aria-label={
                            showsRemainder
                              ? t("artists.seePortfolioOf", { name: item.name })
                              : t("gallery.openImage", {
                                  index: imageIndex + 1,
                                  total: works.length
                                })
                          }
                        >
                          <img src={url} alt="" loading="lazy" />
                          {showsRemainder ? (
                            <span className="artist-card__more" aria-hidden="true">
                              +{hiddenWorks + 1}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="artist-card__actions">
                  {works.length ? (
                    <button
                      type="button"
                      className="artist-card__button artist-card__button--ghost"
                      onClick={(event) => openOverlay(artistIndex, null, event.currentTarget)}
                    >
                      {t("artists.seePortfolio")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="artist-card__button artist-card__button--primary"
                    onClick={() => choose(item.id)}
                    aria-pressed={isSelected}
                    // Fulla namnet för skärmläsare; den synliga texten ("Boka hos
                    // Sam") ryms i etiketten. I valt läge gäller den synliga texten.
                    aria-label={isSelected ? undefined : t("artists.bookWith", { name: item.name })}
                  >
                    {isSelected
                      ? t("artists.selectedBookWith")
                      : t("artists.bookWith", { name: getArtistFirstName(item.name) })}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {artist && lightboxIndex === null ? (
        <div
          className="rg-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("artists.portfolioAria", { name: artist.name })}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeOverlay();
          }}
        >
          <button
            ref={closeButtonRef}
            className="rg-overlay-close"
            type="button"
            onClick={closeOverlay}
            aria-label={t("gallery.closePortfolio")}
          >
            ✕
          </button>
          <div className="rg-portfolio">
            <p className="rg-portfolio-eyebrow">{t("gallery.portfolioEyebrow")}</p>
            <h3 className="rg-portfolio-title">{artist.name}</h3>
            <p className="rg-portfolio-sub">{t("gallery.portfolioSub")}</p>
            <div className="rg-portfolio-grid">
              {images.map((url, imageIndex) => (
                <button
                  key={url}
                  type="button"
                  className="rg-card rg-card--grid"
                  onClick={() =>
                    setOverlay((current) => ({ ...current, imageIndex, fromGrid: true }))
                  }
                  aria-label={t("gallery.openImage", { index: imageIndex + 1, total: imageCount })}
                >
                  <img
                    src={url}
                    alt={t("artists.imageAlt", { name: artist.name, index: imageIndex + 1 })}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="artist-showcase__overlay-cta"
              onClick={() => choose(artist.id)}
            >
              {t("artists.bookWith", { name: artist.name })}
            </button>
          </div>
        </div>
      ) : null}

      {artist && lightboxIndex !== null ? (
        <div
          className="rg-overlay rg-overlay--lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("gallery.lightboxAria", { index: lightboxIndex + 1, total: imageCount })}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <button
            ref={closeButtonRef}
            className="rg-overlay-close"
            type="button"
            onClick={closeLightbox}
            aria-label={t("gallery.close")}
          >
            ✕
          </button>
          {imageCount > 1 ? (
            <button
              className="rg-lb-nav rg-lb-prev"
              type="button"
              onClick={() => step(-1)}
              aria-label={t("gallery.prevImage")}
            >
              ‹
            </button>
          ) : null}
          <figure className="rg-lb-figure">
            <img
              src={images[lightboxIndex]}
              alt={t("artists.imageAlt", { name: artist.name, index: lightboxIndex + 1 })}
            />
            <figcaption className="rg-lb-counter">
              {artist.name} · {lightboxIndex + 1} / {imageCount}
            </figcaption>
            <button
              type="button"
              className="artist-showcase__overlay-cta"
              onClick={() => choose(artist.id)}
            >
              {t("artists.bookWith", { name: artist.name })}
            </button>
          </figure>
          {imageCount > 1 ? (
            <button
              className="rg-lb-nav rg-lb-next"
              type="button"
              onClick={() => step(1)}
              aria-label={t("gallery.nextImage")}
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
