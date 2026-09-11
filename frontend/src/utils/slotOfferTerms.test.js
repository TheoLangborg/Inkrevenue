import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { buildSlotOfferTermsView } from "./slotOfferTerms.js";

/**
 * Körs med `node --test src/utils/slotOfferTerms.test.js` — frontenden har ingen
 * testrunner, och det här är ren logik utan DOM.
 *
 * Punkt 14: villkoren SKA synas innan kunden trycker ja. Testerna vaktar två
 * saker: att inget utelämnas, och att inget påstås som bokningsvägen inte gör.
 */

describe("buildSlotOfferTermsView", () => {
  it("visar depositionen och att den inte dras här", () => {
    const rows = buildSlotOfferTermsView({
      prepaymentKind: "deposit",
      prepaymentAmountSek: 800,
      cancellationNoticeHours: 0
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].label, "Deposition");
    assert.match(rows[0].text, /800 kr/);
    // Sidan tar inte betalt. Utan den meningen tror kunden att hon just betalat.
    assert.match(rows[0].text, /du betalar inget här/);
  });

  it("visar bokningsavgiften när studion valt den i stället", () => {
    const rows = buildSlotOfferTermsView({
      prepaymentKind: "booking_fee",
      prepaymentAmountSek: 300,
      cancellationNoticeHours: 0
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].label, "Bokningsavgift");
    assert.match(rows[0].text, /300 kr/);
    // Skillnaden mot depositionen: avgiften räknas inte av mot slutpriset.
    assert.match(rows[0].text, /räknas inte av/);
  });

  it("visar aldrig två sorters förskott", () => {
    // Servern skickar ETT belopp av EN sort. Skulle den någonsin skicka en
    // motsägelse ska sidan inte hitta på ett andra krav.
    const rows = buildSlotOfferTermsView({
      prepaymentKind: "deposit",
      prepaymentAmountSek: 800,
      cancellationNoticeHours: 24
    });

    assert.deepEqual(
      rows.map((row) => row.key),
      ["deposit", "cancellation"]
    );
  });

  it("kopplar den sena avbokningen till depositionen", () => {
    const [, cancellation] = buildSlotOfferTermsView({
      prepaymentKind: "deposit",
      prepaymentAmountSek: 800,
      cancellationNoticeHours: 24
    });

    assert.match(cancellation.text, /Senast 24 timmar/);
    assert.match(cancellation.text, /ta betalt för depositionen på 800 kr/);
  });

  it("påstår INTE att bokningsavgiften kan tas ut vid sen avbokning", () => {
    // `applyLateCancellationToDeposit` rör bara depositionen. Skrev sidan samma
    // varning för avgiften vore det ett hot studion inte kan verkställa.
    const [, cancellation] = buildSlotOfferTermsView({
      prepaymentKind: "booking_fee",
      prepaymentAmountSek: 300,
      cancellationNoticeHours: 24
    });

    assert.equal(cancellation.text, "Senast 24 timmar innan tiden.");
  });

  it("visar avbokningsregeln även utan förskott", () => {
    const rows = buildSlotOfferTermsView({
      prepaymentKind: null,
      prepaymentAmountSek: 0,
      cancellationNoticeHours: 48
    });

    assert.deepEqual(
      rows.map((row) => row.key),
      ["cancellation"]
    );
    assert.match(rows[0].text, /48 timmar/);
  });

  it("visar ingen ruta alls när studion varken har förskott eller varsel", () => {
    assert.deepEqual(
      buildSlotOfferTermsView({
        prepaymentKind: null,
        prepaymentAmountSek: 0,
        cancellationNoticeHours: 0
      }),
      []
    );
  });

  it("tål att en äldre backend inte skickar terms alls", () => {
    // Repona deployas var för sig. En sida som kraschar för att fältet saknas
    // är sämre än en sida utan villkorsruta.
    assert.deepEqual(buildSlotOfferTermsView(undefined), []);
    assert.deepEqual(buildSlotOfferTermsView(null), []);
  });

  it("tolkar ett nollbelopp som inget förskott", () => {
    // depositRequired utan belopp har förekommit. "Deposition 0 kr" är brus.
    assert.deepEqual(
      buildSlotOfferTermsView({
        prepaymentKind: "deposit",
        prepaymentAmountSek: 0,
        cancellationNoticeHours: 0
      }),
      []
    );
  });
});
