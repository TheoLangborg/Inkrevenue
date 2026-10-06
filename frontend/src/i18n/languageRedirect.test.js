import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { ENTRY_REFERRER_KEY, LANGUAGE_PREFERENCE_KEY } from "./languagePreference.js";

/**
 * Körs med `node --test src/i18n/languageRedirect.test.js`.
 *
 * Testar det riktiga skriptet ur index.html, inte en kopia: det plockas ut ur
 * filen och körs mot en låtsad webbläsare.
 */
const indexHtml = fs.readFileSync(fileURLToPath(new URL("../../index.html", import.meta.url)), "utf8");
const scriptSource = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((source) => source.includes("__inkrevenueLanguageRedirect"));

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values
  };
}

function throwingStorage() {
  const fail = () => {
    throw new Error("SecurityError");
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

/** Kör skriptet och returnerar adressen det bytte till (eller null). */
function run({
  path = "/",
  search = "",
  hash = "",
  languages = ["sv-SE", "sv", "en-US", "en"],
  language,
  userAgent = CHROME_UA,
  localStorage = createStorage(),
  sessionStorage = createStorage(),
  referrer = "",
  framed = false
} = {}) {
  let replacedWith = null;
  const context = {
    location: {
      pathname: path,
      search,
      hash,
      replace: (url) => {
        replacedWith = url;
      }
    },
    navigator: { userAgent, languages, language: language ?? languages?.[0] },
    localStorage,
    sessionStorage,
    document: { referrer, documentElement: { style: {} } },
    setTimeout: () => {},
    JSON,
    Date,
    String
  };
  context.window = context;
  context.self = context;
  context.top = framed ? {} : context;

  vm.runInNewContext(scriptSource, context);
  return { replacedWith, context };
}

describe("språkskriptet i index.html", () => {
  it("finns och är inte tomt", () => {
    assert.ok(scriptSource && scriptSource.includes("location"), "skriptet hittades inte i index.html");
  });

  it("låter en svensk webbläsare stanna på den svenska sidan", () => {
    assert.equal(run({ path: "/" }).replacedWith, null);
    assert.equal(run({ path: "/studios" }).replacedWith, null);
  });

  it("skickar en engelsk webbläsare till samma sida på engelska", () => {
    assert.equal(run({ path: "/", languages: ["en-US", "en"] }).replacedWith, "/en");
    assert.equal(run({ path: "/faq", languages: ["en-GB"] }).replacedWith, "/en/faq");
  });

  it("behåller query och hash, så att utm-taggar och ankare följer med", () => {
    const { replacedWith } = run({
      path: "/studio/royalkave",
      search: "?utm_source=instagram",
      hash: "#studio-form",
      languages: ["en-US"]
    });
    assert.equal(replacedWith, "/en/studio/royalkave?utm_source=instagram#studio-form");
  });

  it("skickar en svensk webbläsare från en engelsk länk till svenska", () => {
    assert.equal(run({ path: "/en", languages: ["sv-SE"] }).replacedWith, "/");
    assert.equal(run({ path: "/en/studios", search: "?city=Malm%C3%B6", languages: ["sv"] }).replacedWith, "/studios?city=Malm%C3%B6");
  });

  it("väljer det första språket i listan som sajten har", () => {
    assert.equal(run({ path: "/", languages: ["en-US", "sv-SE"] }).replacedWith, "/en");
    assert.equal(run({ path: "/en", languages: ["de-DE", "sv", "en"] }).replacedWith, "/");
    // Finlandssvenska är svenska.
    assert.equal(run({ path: "/en", languages: ["sv-FI"] }).replacedWith, "/");
  });

  it("väljer engelska när sajten inte har något av besökarens språk", () => {
    assert.equal(run({ path: "/", languages: ["de-DE", "de"] }).replacedWith, "/en");
    assert.equal(run({ path: "/en", languages: ["nb-NO"] }).replacedWith, null);
  });

  it("gör ingenting när webbläsaren inte säger något om språk", () => {
    assert.equal(run({ path: "/", languages: [], language: "" }).replacedWith, null);
    assert.equal(run({ path: "/", languages: undefined, language: undefined }).replacedWith, null);
  });

  it("klarar språklistor med understreck och versaler", () => {
    assert.equal(run({ path: "/", languages: ["EN_us"] }).replacedWith, "/en");
  });

  it("låter besökarens eget val gå före webbläsarens språk", () => {
    const chosenSwedish = createStorage({ [LANGUAGE_PREFERENCE_KEY]: "sv" });
    assert.equal(run({ path: "/en/studios", languages: ["en-US"], localStorage: chosenSwedish }).replacedWith, "/studios");
    assert.equal(run({ path: "/studios", languages: ["en-US"], localStorage: chosenSwedish }).replacedWith, null);

    const chosenEnglish = createStorage({ [LANGUAGE_PREFERENCE_KEY]: "en" });
    assert.equal(run({ path: "/", languages: ["sv-SE"], localStorage: chosenEnglish }).replacedWith, "/en");
  });

  it("ignorerar ett okänt sparat värde", () => {
    const garbage = createStorage({ [LANGUAGE_PREFERENCE_KEY]: "de" });
    assert.equal(run({ path: "/", languages: ["sv-SE"], localStorage: garbage }).replacedWith, null);
  });

  it("faller tillbaka på webbläsarens språk när localStorage är spärrat", () => {
    assert.equal(run({ path: "/", languages: ["en-US"], localStorage: throwingStorage() }).replacedWith, "/en");
  });

  it("rör inte sökmotorer och andra robotar", () => {
    const robots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse"
    ];
    for (const userAgent of robots) {
      assert.equal(run({ path: "/", languages: ["en-US"], userAgent }).replacedWith, null, userAgent);
    }
  });

  it("rör inte inbäddade sidor (CRM:ets förhandsvisning, webwork)", () => {
    assert.equal(run({ path: "/studio/royalkave", languages: ["en-US"], framed: true }).replacedWith, null);
  });

  it("rör inte CRM-förhandsvisningen eller betallänkar, inte ens öppnade direkt", () => {
    assert.equal(run({ path: "/studio-crm-preview", languages: ["en-US"] }).replacedWith, null);
    assert.equal(run({ path: "/betala/abc123", languages: ["en-US"] }).replacedWith, null);
    assert.equal(run({ path: "/en/betala/abc123", languages: ["sv-SE"] }).replacedWith, null);
  });

  it("byter språk på sms-länken för lediga tider som på alla andra sidor", () => {
    assert.equal(run({ path: "/tid/abc123", languages: ["en-US"] }).replacedWith, "/en/tid/abc123");
  });

  it("hanterar avslutande snedstreck", () => {
    assert.equal(run({ path: "/studios/", languages: ["en-US"] }).replacedWith, "/en/studios");
    assert.equal(run({ path: "/en/", languages: ["sv"] }).replacedWith, "/");
  });

  it("varnar main.jsx och gömmer sidan under bytet, men bara då", () => {
    const switching = run({ path: "/", languages: ["en-US"] }).context;
    assert.equal(switching.__inkrevenueLanguageRedirect, true);
    assert.equal(switching.document.documentElement.style.visibility, "hidden");

    const staying = run({ path: "/", languages: ["sv-SE"] }).context;
    assert.equal(staying.__inkrevenueLanguageRedirect, undefined);
    assert.equal(staying.document.documentElement.style.visibility, undefined);
  });

  it("sparar hänvisaren före bytet, men bara då", () => {
    const sessionStorage = createStorage();
    run({ path: "/", languages: ["en-US"], referrer: "https://l.instagram.com/", sessionStorage });
    const stored = JSON.parse(sessionStorage.getItem(ENTRY_REFERRER_KEY));
    assert.equal(stored.referrer, "https://l.instagram.com/");
    assert.ok(Math.abs(Date.now() - stored.at) < 5000);

    const untouched = createStorage();
    run({ path: "/", languages: ["sv-SE"], referrer: "https://l.instagram.com/", sessionStorage: untouched });
    assert.equal(untouched.getItem(ENTRY_REFERRER_KEY), null);
  });
});

// languagePreference.js håller tillståndet i modulen, så varje fall laddar en
// egen instans (frågesträngen ger en ny modul).
let instance = 0;
async function loadPreferenceModule({ referrer = "", sessionStorage = createStorage(), localStorage = createStorage() } = {}) {
  globalThis.window = { sessionStorage, localStorage };
  globalThis.document = { referrer };
  instance += 1;
  return import(`./languagePreference.js?case=${instance}`);
}

describe("languagePreference.js", () => {
  it("ger tillbaka hänvisaren som skriptet sparade före bytet", async () => {
    const sessionStorage = createStorage();
    run({ path: "/studio/royalkave", languages: ["en-US"], referrer: "https://l.instagram.com/", sessionStorage });

    // Efter location.replace är vår egen svenska sida hänvisaren.
    const { getEntryReferrer } = await loadPreferenceModule({
      referrer: "https://www.inkrevenue.online/studio/royalkave",
      sessionStorage
    });
    assert.equal(getEntryReferrer(), "https://l.instagram.com/");
    // Läses en gång och tas bort, men svaret står sig under sidladdningen.
    assert.equal(sessionStorage.getItem(ENTRY_REFERRER_KEY), null);
    assert.equal(getEntryReferrer(), "https://l.instagram.com/");
  });

  it("ger tillbaka en tom hänvisare när besökaren kom direkt", async () => {
    const sessionStorage = createStorage();
    run({ path: "/", languages: ["en-US"], referrer: "", sessionStorage });
    const { getEntryReferrer } = await loadPreferenceModule({
      referrer: "https://www.inkrevenue.online/",
      sessionStorage
    });
    assert.equal(getEntryReferrer(), "");
  });

  it("använder document.referrer när inget byte skett", async () => {
    const { getEntryReferrer } = await loadPreferenceModule({ referrer: "https://www.google.com/" });
    assert.equal(getEntryReferrer(), "https://www.google.com/");
  });

  it("bortser från en gammal sparad hänvisare", async () => {
    const sessionStorage = createStorage({
      [ENTRY_REFERRER_KEY]: JSON.stringify({ referrer: "https://l.instagram.com/", at: Date.now() - 120000 })
    });
    const { getEntryReferrer } = await loadPreferenceModule({ referrer: "https://www.google.com/", sessionStorage });
    assert.equal(getEntryReferrer(), "https://www.google.com/");
  });

  it("tål trasig och spärrad lagring", async () => {
    const broken = createStorage({ [ENTRY_REFERRER_KEY]: "{inte json" });
    const first = await loadPreferenceModule({ referrer: "https://www.google.com/", sessionStorage: broken });
    assert.equal(first.getEntryReferrer(), "https://www.google.com/");

    const second = await loadPreferenceModule({ referrer: "https://www.google.com/", sessionStorage: throwingStorage() });
    assert.equal(second.getEntryReferrer(), "https://www.google.com/");
  });

  it("sparar språkväxlarens val så att skriptet följer det nästa gång", async () => {
    const localStorage = createStorage();
    const { rememberLanguageChoice } = await loadPreferenceModule({ localStorage });
    rememberLanguageChoice("en");

    assert.equal(run({ path: "/", languages: ["sv-SE"], localStorage }).replacedWith, "/en");
  });

  it("kraschar inte när valet inte går att spara", async () => {
    const { rememberLanguageChoice } = await loadPreferenceModule({ localStorage: throwingStorage() });
    assert.doesNotThrow(() => rememberLanguageChoice("en"));
  });
});
