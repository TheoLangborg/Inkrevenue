import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { PINNED_STUDIO_SLUGS, pinStudiosFirst } from "./studioOrder.js";

const slugs = (studios) => studios.map((studio) => studio.slug);

describe("pinStudiosFirst", () => {
  it("lägger teststudion först och behåller resten i CRM:ets ordning", () => {
    const fromCrm = [{ slug: "ghost-ink" }, { slug: "inkrevenue-test-studio" }, { slug: "royalkave" }];

    assert.deepEqual(slugs(pinStudiosFirst(fromCrm)), [
      "inkrevenue-test-studio",
      "ghost-ink",
      "royalkave"
    ]);
    assert.equal(PINNED_STUDIO_SLUGS[0], "inkrevenue-test-studio");
  });

  it("ändrar inte listan den får", () => {
    const fromCrm = [{ slug: "royalkave" }, { slug: "inkrevenue-test-studio" }];
    pinStudiosFirst(fromCrm);

    assert.deepEqual(slugs(fromCrm), ["royalkave", "inkrevenue-test-studio"]);
  });

  it("följer ordningen i listan över fasta studior", () => {
    const studios = [{ slug: "c" }, { slug: "b" }, { slug: "a" }];

    assert.deepEqual(slugs(pinStudiosFirst(studios, ["a", "b"])), ["a", "b", "c"]);
  });

  it("klarar en lista utan fasta studior och ett trasigt svar", () => {
    assert.deepEqual(slugs(pinStudiosFirst([{ slug: "x" }, { slug: "y" }])), ["x", "y"]);
    assert.deepEqual(pinStudiosFirst(null), []);
  });
});
