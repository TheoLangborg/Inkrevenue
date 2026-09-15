import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  buildShowcaseArtists,
  cleanImageUrl,
  getArtistFirstName,
  getArtistInitials,
  getLogoFit,
  shouldShowArtistShowcase
} from "./artistShowcase.js";

/**
 * Körs med `node --test src/utils/artistShowcase.test.js`.
 *
 * Tatuerarnas bilder och portföljer från CRM:et. Formulärets väljare och
 * sektionen på studiosidan läser samma tvättade lista.
 */

describe("buildShowcaseArtists", () => {
  it("tål att en äldre backend inte skickar artistOptions alls", () => {
    assert.deepEqual(buildShowcaseArtists(undefined), []);
  });

  it("tål att en äldre backend skickar artister utan bilder", () => {
    assert.deepEqual(buildShowcaseArtists([{ id: "nina", name: "Nina" }]), [
      { id: "nina", name: "Nina", photoUrl: "", portfolioImageUrls: [] }
    ]);
  });

  it("släpper artister utan id eller namn", () => {
    assert.deepEqual(
      buildShowcaseArtists([{ id: "", name: "Nina" }, { id: "erik", name: "  " }]),
      []
    );
  });

  it("släpper bildlänkar som inte är http(s)", () => {
    const [artist] = buildShowcaseArtists([
      {
        id: "nina",
        name: "Nina",
        photoUrl: "javascript:alert(1)",
        portfolioImageUrls: ["https://cdn.example/a.jpg", "", "data:image/png;base64,x"]
      }
    ]);

    assert.equal(artist.photoUrl, "");
    assert.deepEqual(artist.portfolioImageUrls, ["https://cdn.example/a.jpg"]);
  });

  it("visar samma verk bara en gång", () => {
    const [artist] = buildShowcaseArtists([
      {
        id: "nina",
        name: "Nina",
        portfolioImageUrls: [
          "https://cdn.example/a.jpg",
          " https://cdn.example/a.jpg ",
          "https://cdn.example/b.jpg"
        ]
      }
    ]);

    assert.deepEqual(artist.portfolioImageUrls, [
      "https://cdn.example/a.jpg",
      "https://cdn.example/b.jpg"
    ]);
  });
});

describe("cleanImageUrl", () => {
  it("släpper igenom studions logga när den är http(s)", () => {
    assert.equal(cleanImageUrl(" https://cdn.example/logo.png "), "https://cdn.example/logo.png");
  });

  it("ger tom sträng utan logga eller med annan länktyp", () => {
    assert.equal(cleanImageUrl(undefined), "");
    assert.equal(cleanImageUrl("javascript:alert(1)"), "");
  });
});

describe("getLogoFit", () => {
  it("fyrkantig logga fyller cirkeln", () => {
    assert.equal(getLogoFit(512, 512), "fill");
    assert.equal(getLogoFit(600, 500), "fill");
  });

  it("bred eller hög logga visas hel", () => {
    assert.equal(getLogoFit(480, 160), "contain");
    assert.equal(getLogoFit(200, 400), "contain");
  });

  it("fyller innan bilden laddat", () => {
    assert.equal(getLogoFit(0, 0), "fill");
  });
});

describe("shouldShowArtistShowcase", () => {
  it("visas inte när ingen artist har bild eller verk", () => {
    assert.equal(
      shouldShowArtistShowcase(buildShowcaseArtists([{ id: "nina", name: "Nina" }])),
      false
    );
  });

  it("visas när en artist har en profilbild", () => {
    const artists = buildShowcaseArtists([
      { id: "nina", name: "Nina" },
      { id: "erik", name: "Erik", photoUrl: "https://cdn.example/erik.jpg" }
    ]);

    assert.equal(shouldShowArtistShowcase(artists), true);
  });

  it("visas när en artist bara har verk", () => {
    const artists = buildShowcaseArtists([
      { id: "nina", name: "Nina", portfolioImageUrls: ["https://cdn.example/a.jpg"] }
    ]);

    assert.equal(shouldShowArtistShowcase(artists), true);
  });
});

describe("getArtistFirstName", () => {
  it("tar första ordet", () => {
    assert.equal(getArtistFirstName("  Sam Lindqvist-Oksanen "), "Sam");
  });

  it("ger tom sträng utan namn", () => {
    assert.equal(getArtistFirstName(""), "");
  });
});

describe("getArtistInitials", () => {
  it("tar för- och efternamnets första bokstav", () => {
    assert.equal(getArtistInitials("Nina Holm"), "NH");
  });

  it("tar två bokstäver av ett ensamt namn", () => {
    assert.equal(getArtistInitials("erik"), "ER");
  });

  it("har ett tecken även utan namn", () => {
    assert.equal(getArtistInitials(""), "?");
  });
});
