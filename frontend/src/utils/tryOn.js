// Studior där kunden kan prova tatueringen på kroppen i förfrågan (TryOnLauncher).
// Bara teststudion tills try-on är färdigtestad (tryon-lab/BYGGPLAN.md, fas 4).
export const TRYON_STUDIO_SLUGS = ["inkrevenue-test-studio"];

export function hasTryOn(slug) {
  return TRYON_STUDIO_SLUGS.includes(slug);
}
