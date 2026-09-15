import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { isBioLinkVisit } from "./bioLinkVisit.js";

/**
 * Körs med `node --test src/utils/bioLinkVisit.test.js` — frontenden har ingen
 * testrunner.
 */

const INSTAGRAM_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.91";
const TIKTOK_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 musical_ly_2023508030 BytedanceWebview/d8a21c6";
const SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

describe("isBioLinkVisit", () => {
  it("känner igen varje länk ReferralLinkPanel delar ut", () => {
    for (const source of ["instagram", "facebook", "tiktok", "social_media", "inkrevenue"]) {
      assert.equal(isBioLinkVisit({ search: `?utm_source=${source}`, userAgent: SAFARI_UA }), true, source);
    }
  });

  it("tål versaler och de korta aliasen", () => {
    assert.equal(isBioLinkVisit({ search: "?utm_source=Instagram" }), true);
    assert.equal(isBioLinkVisit({ search: "?utm_source=ig" }), true);
  });

  it("fångar en naken biolänk via appens webbläsare", () => {
    assert.equal(isBioLinkVisit({ userAgent: INSTAGRAM_UA }), true);
    assert.equal(isBioLinkVisit({ userAgent: TIKTOK_UA }), true);
    assert.equal(isBioLinkVisit({ userAgent: "Mozilla/5.0 [FBAN/FBIOS;FBAV/470.0]" }), true);
  });

  it("fångar klick från sociala sajter i vanlig webbläsare", () => {
    assert.equal(isBioLinkVisit({ referrer: "https://l.instagram.com/", userAgent: SAFARI_UA }), true);
    assert.equal(isBioLinkVisit({ referrer: "https://www.tiktok.com/", userAgent: SAFARI_UA }), true);
    assert.equal(isBioLinkVisit({ referrer: "https://lm.facebook.com/", userAgent: SAFARI_UA }), true);
  });

  it("lämnar Google, direkttrafik och vår egen studiokatalog i fred", () => {
    assert.equal(isBioLinkVisit({ userAgent: SAFARI_UA }), false);
    assert.equal(isBioLinkVisit({ referrer: "https://www.google.com/", userAgent: SAFARI_UA }), false);
    assert.equal(isBioLinkVisit({ referrer: "https://inkrevenue.online/studios", userAgent: SAFARI_UA }), false);
  });

  it("en okänd utm-tagg säger vilken länk som klickades och vinner över appen", () => {
    assert.equal(isBioLinkVisit({ search: "?utm_source=google_ads", userAgent: INSTAGRAM_UA }), false);
  });

  it("kraschar inte på skräp", () => {
    assert.equal(isBioLinkVisit({ referrer: "inte en url" }), false);
    assert.equal(isBioLinkVisit(), false);
  });
});
