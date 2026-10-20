import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readTestModeParam } from "./testMode.js";

describe("readTestModeParam", () => {
  it("slår på testläget med ?test och ?test=1", () => {
    assert.equal(readTestModeParam("?test"), true);
    assert.equal(readTestModeParam("?test=1"), true);
    assert.equal(readTestModeParam("?utm_source=x&test=ja"), true);
  });

  it("stänger av med ?test=av och liknande", () => {
    for (const value of ["av", "off", "0", "false", "nej", "AV"]) {
      assert.equal(readTestModeParam(`?test=${value}`), false, value);
    }
  });

  it("säger inget när adressen saknar test", () => {
    assert.equal(readTestModeParam(""), null);
    assert.equal(readTestModeParam("?utm_source=instagram"), null);
    assert.equal(readTestModeParam(undefined), null);
  });
});
