// Studior som alltid står först i katalogen och i studiolistorna, i den här
// ordningen. InkRevenues teststudio ligger längst till vänster (användaren
// 2026-10-04). Resten behåller CRM:ets ordning (stad, sedan namn).
export const PINNED_STUDIO_SLUGS = ["inkrevenue-test-studio"];

// Studior som bara listas i testläget (?test i adressen, se testMode.js).
// Sidan på /studio/<slug> fungerar ändå med en direktlänk.
export const TEST_STUDIO_SLUGS = ["inkrevenue-test-studio"];

export function hideTestStudios(studios, showTestStudios = false, hidden = TEST_STUDIO_SLUGS) {
  if (!Array.isArray(studios)) return [];
  if (showTestStudios) return studios;
  return studios.filter((studio) => !hidden.includes(studio?.slug));
}

export function pinStudiosFirst(studios, pinned = PINNED_STUDIO_SLUGS) {
  if (!Array.isArray(studios)) return [];

  const rank = (studio) => {
    const index = pinned.indexOf(studio?.slug);
    return index === -1 ? pinned.length : index;
  };

  // Array#sort är stabil, så studior med samma rang behåller sin ordning.
  return [...studios].sort((first, second) => rank(first) - rank(second));
}
