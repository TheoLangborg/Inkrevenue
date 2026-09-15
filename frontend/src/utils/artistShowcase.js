// Studions tatuerare som de kommer från CRM:et (`studio.artistOptions`), tvättade
// en gång så att formulärets väljare och sektionen med portföljerna läser samma
// lista. CRM:et skickar bara aktiva artister och bara när studion slagit på att
// kunden får välja — en tom lista betyder att inget av det ska renderas.

export function cleanImageUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
}

const cleanUrl = cleanImageUrl;

// Studions logga på "Ingen preferens": en ungefär fyrkantig logga fyller hela
// cirkeln (som en profilbild), en bred eller hög visas hel — annars klipps texten
// i den. Innan bilden laddat vet vi inte formatet; då gäller fyll.
export function getLogoFit(width, height) {
  if (!width || !height) return "fill";
  const ratio = width / height;
  return ratio >= 0.8 && ratio <= 1.25 ? "fill" : "contain";
}

export function buildShowcaseArtists(artistOptions) {
  if (!Array.isArray(artistOptions)) return [];

  return artistOptions
    .map((option) => {
      const id = String(option?.id || "").trim();
      const name = String(option?.name || "").trim();
      if (!id || !name) return null;

      return {
        id,
        name,
        photoUrl: cleanUrl(option.photoUrl),
        // Unika: CRM:ets "Redigera URL:er manuellt" släpper igenom samma länk två
        // gånger, och kortet och portföljen nycklar sina bilder på URL:en.
        portfolioImageUrls: Array.isArray(option.portfolioImageUrls)
          ? [...new Set(option.portfolioImageUrls.map(cleanUrl).filter(Boolean))]
          : []
      };
    })
    .filter(Boolean);
}

// Sektionen på studiosidan finns för att kunden ska kunna SE vem hon väljer.
// Har ingen artist varken bild eller verk blir den en rad namn som formuläret
// redan visar — då hoppar vi över den.
export function shouldShowArtistShowcase(artists) {
  return (
    Array.isArray(artists) &&
    artists.some((artist) => artist.photoUrl || artist.portfolioImageUrls.length > 0)
  );
}

// Förnamnet till kortets knapp: "Boka hos Sam Lindqvist-Oksanen" bröts på två
// rader på mobil. Kortet står redan under hela namnet, och knappens
// aria-label bär det fulla namnet för skärmläsare.
export function getArtistFirstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

// Initialer när artisten saknar profilbild: "Nina Holm" → "NH", "Nina" → "NI".
export function getArtistInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
