import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { getImageSrcSet, getImageVariantUrl } from "./imageVariants.js";

/**
 * Körs med `node --test src/utils/imageVariants.test.js`.
 *
 * Studiobildernas småversioner räknas fram ur originalets länk
 * (tattoo-crm/docs/bildprestanda.md, steg 5).
 */

const BUCKET = "adminpage-eea4c.firebasestorage.app";
const original = (path, token = "abc-123") =>
  `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
const variant = (path) =>
  `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

describe("getImageVariantUrl", () => {
  it("byter originalets namn och ändelse mot versionens, utan token", () => {
    assert.equal(
      getImageVariantUrl(original("studios/gallery/1784659414869-xuybaiua8lp.jpg"), 480),
      variant("studios/gallery/1784659414869-xuybaiua8lp__w480.webp")
    );
    assert.equal(
      getImageVariantUrl(original("studios/hero/1786109712800-k2.png"), 2048),
      variant("studios/hero/1786109712800-k2__w2048.webp")
    );
  });

  it("gäller alla fyra mapparna, även en WebP från den nya uppladdningen", () => {
    for (const folder of ["logos", "headings", "hero", "gallery"]) {
      assert.equal(
        getImageVariantUrl(original(`studios/${folder}/1-a.webp`), 1024),
        variant(`studios/${folder}/1-a__w1024.webp`)
      );
    }
  });

  it("lämnar allt annat orört", () => {
    const untouched = [
      "",
      null,
      undefined,
      "/ink-revenue-logo.svg",
      "inte en länk",
      "https://example.com/studios/gallery/1-a.jpg",
      `https://storage.googleapis.com/${BUCKET}/studios/gallery/1-a.jpg`,
      original("raw-materials/studio-1/abc.jpg"),
      original("public-leads/abc.jpg"),
      original("studios/other/1-a.jpg"),
      original("studios/gallery/sub/1-a.jpg"),
      // En GIF ska behålla animationen, och en version har inga egna versioner.
      original("studios/gallery/1-a.gif"),
      original("studios/gallery/1-a__w480.webp")
    ];
    for (const url of untouched) {
      assert.equal(getImageVariantUrl(url, 480), url);
    }
  });

  it("tar bara de bredder som finns", () => {
    const url = original("studios/gallery/1-a.jpg");
    assert.equal(getImageVariantUrl(url, 640), url);
  });

  it("tål en trasig procentkodning", () => {
    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/studios%2Fgallery%2F%E0%A4%A.jpg?alt=media`;
    assert.equal(getImageVariantUrl(url, 480), url);
  });
});

describe("getImageSrcSet", () => {
  it("listar versionerna med sina bredder", () => {
    const url = original("studios/gallery/1-a.jpg");
    assert.equal(
      getImageSrcSet(url, [480, 1024]),
      `${variant("studios/gallery/1-a__w480.webp")} 480w, ${variant("studios/gallery/1-a__w1024.webp")} 1024w`
    );
  });

  it("ger undefined för en bild utan versioner", () => {
    assert.equal(getImageSrcSet("https://example.com/a.jpg", [480, 1024]), undefined);
    assert.equal(getImageSrcSet(original("studios/gallery/1-a.gif"), [480, 1024]), undefined);
  });
});
