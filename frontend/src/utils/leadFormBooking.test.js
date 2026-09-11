import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { canBookDirectly, resolveTimeStepNotice } from "./leadFormBooking.js";

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

/**
 * Granskning 4 punkt 3: tidssteget blev HELT tomt när kalendern saknade luckor.
 * Renderingen krävde att någon vecka hade en lucka — annars stod bara rubriken
 * och Tillbaka/Nästa kvar, utan en rad text.
 */
const settled = {
  availabilityState: "success",
  hasSlots: true,
  eligibleForDirectBooking: true
};

describe("resolveTimeStepNotice", () => {
  it("säger ingenting när kalendern är färsk, full och bokningsbar", () => {
    assert.equal(resolveTimeStepNotice(settled), "none");
  });

  it("⚠️ förklarar tomma tidssteg i stället för att rendera ingenting", () => {
    // Studion har inga bokningsbara veckodagar, eller allt i fönstret är taget.
    assert.equal(resolveTimeStepNotice({ ...settled, hasSlots: false }), "noSlots");
  });

  it("förklarar även ett tomt steg som aldrig hann hämtas", () => {
    assert.equal(
      resolveTimeStepNotice({ ...settled, availabilityState: "idle", hasSlots: false }),
      "noSlots"
    );
  });

  it("⚠️ säger att kalendern är en önskelista när direktbokning inte tillåts", () => {
    assert.equal(
      resolveTimeStepNotice({ ...settled, eligibleForDirectBooking: false }),
      "timesAreRequests"
    );
  });

  it("låter stale-texten stå ensam — den säger redan samma sak", () => {
    assert.equal(
      resolveTimeStepNotice({ ...settled, availabilityState: "stale", eligibleForDirectBooking: false }),
      "stale"
    );
  });

  it("tar noSlots före stale när den kvarstående kalendern är tom", () => {
    // stale-texten lovar "tiderna nedan" — utan luckor finns inga.
    assert.equal(
      resolveTimeStepNotice({ ...settled, availabilityState: "stale", hasSlots: false }),
      "noSlots"
    );
  });

  it("tiger under hämtningen och när felmeddelandet redan står där", () => {
    assert.equal(
      resolveTimeStepNotice({ ...settled, availabilityState: "loading", hasSlots: false }),
      "none"
    );
    assert.equal(
      resolveTimeStepNotice({ ...settled, availabilityState: "error", hasSlots: false }),
      "none"
    );
  });
});
