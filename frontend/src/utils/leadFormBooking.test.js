import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { canBookDirectly } from "./leadFormBooking.js";

/**
 * Körs med `node --test src/utils/leadFormBooking.test.js` — frontenden har
 * ingen testrunner, och grinden är ren logik utan DOM.
 *
 * Granskning 4 punkt 2: den inaktuella kalendern ritar luckor från det GAMLA
 * estimatet. Kunden hann välja en av dem, betala, och fick sedan manuell
 * granskning eftersom inskicket bar den nya beskrivningen.
 */

const ready = {
  canShowCalendar: true,
  hasEnoughDetails: true,
  availabilityState: "success",
  eligibleForDirectBooking: true,
  hasSlots: true
};

describe("canBookDirectly", () => {
  it("bokar direkt när kalendern är färsk och studion tillåter det", () => {
    assert.equal(canBookDirectly(ready), true);
  });

  it("⚠️ bokar INTE direkt när kalendern är inaktuell — luckorna bär det gamla estimatet", () => {
    assert.equal(canBookDirectly({ ...ready, availabilityState: "stale" }), false);
  });

  it("håller kvar grinden under en omhämtning, så betalknappen inte flimrar", () => {
    // "loading" behåller förra svaret i data — grinden ska stå kvar tänd, annars
    // slår knappen om från "Gå till betalning" till "Skicka förfrågan" mitt i.
    assert.equal(canBookDirectly({ ...ready, availabilityState: "loading" }), true);
  });

  it("bokar inte direkt utan luckor, utan eligibility eller utan bokningsflöde", () => {
    assert.equal(canBookDirectly({ ...ready, hasSlots: false }), false);
    assert.equal(canBookDirectly({ ...ready, eligibleForDirectBooking: false }), false);
    assert.equal(canBookDirectly({ ...ready, canShowCalendar: false }), false);
    assert.equal(canBookDirectly({ ...ready, hasEnoughDetails: false }), false);
  });
});
