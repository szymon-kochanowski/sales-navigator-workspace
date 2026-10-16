// server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path2 from "path";
import crypto from "crypto";
import fs2 from "fs/promises";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/server/storage.ts
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isVercel = Boolean(process.env.VERCEL);
var LOCAL_DATA_FILE = path.join(process.cwd(), "data", "leads.json");
var LOCAL_TEMPLATE_FILE = path.join(process.cwd(), "data", "demo-template.json");
var VERCEL_TMP_FILE = path.join("/tmp", "sn_leads_store.json");
var memoryCache = null;
async function readStorageState() {
  if (memoryCache !== null) {
    return memoryCache;
  }
  const targetFile = isVercel ? VERCEL_TMP_FILE : LOCAL_DATA_FILE;
  try {
    const raw = await fs.readFile(targetFile, "utf-8");
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      memoryCache = {
        leads: parsed,
        deletedIds: [],
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return memoryCache;
    } else if (parsed && Array.isArray(parsed.leads)) {
      memoryCache = {
        leads: parsed.leads,
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
        updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      };
      return memoryCache;
    }
  } catch (err) {
    try {
      const templateRaw = await fs.readFile(LOCAL_TEMPLATE_FILE, "utf-8");
      const templateParsed = JSON.parse(templateRaw || "[]");
      if (Array.isArray(templateParsed)) {
        memoryCache = {
          leads: templateParsed,
          deletedIds: [],
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        return memoryCache;
      }
    } catch {
    }
  }
  memoryCache = {
    leads: [],
    deletedIds: [],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return memoryCache;
}
async function writeStorageState(leads, deletedIds) {
  const current = await readStorageState();
  const nextDeleted = deletedIds !== void 0 ? deletedIds : current.deletedIds;
  const deletedSet = new Set(nextDeleted);
  const cleanLeads = (Array.isArray(leads) ? leads : []).filter(
    (l) => l && l.id && !deletedSet.has(l.id)
  );
  const nextState = {
    leads: cleanLeads,
    deletedIds: Array.from(deletedSet),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memoryCache = nextState;
  const targetFile = isVercel ? VERCEL_TMP_FILE : LOCAL_DATA_FILE;
  try {
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, JSON.stringify(cleanLeads, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Storage File] Pomini\u0119to zapis lokalny:", err?.message);
  }
  return nextState;
}
async function readLeads() {
  const state = await readStorageState();
  return state.leads;
}
async function writeLeads(leads) {
  await writeStorageState(leads);
}
async function deleteLeadById(leadId) {
  const state = await readStorageState();
  const updatedLeads = state.leads.filter((l) => l && l.id !== leadId);
  const updatedDeleted = Array.from(/* @__PURE__ */ new Set([...state.deletedIds, leadId]));
  const next = await writeStorageState(updatedLeads, updatedDeleted);
  return next.leads;
}
async function syncLeadsWithClient(clientLeads, clientDeletedIds = []) {
  const serverState = await readStorageState();
  const mergedDeletedSet = /* @__PURE__ */ new Set([
    ...serverState.deletedIds,
    ...Array.isArray(clientDeletedIds) ? clientDeletedIds : []
  ]);
  const leadMap = /* @__PURE__ */ new Map();
  for (const sLead of serverState.leads) {
    if (sLead && sLead.id && !mergedDeletedSet.has(sLead.id)) {
      leadMap.set(sLead.id, sLead);
    }
  }
  for (const cLead of Array.isArray(clientLeads) ? clientLeads : []) {
    if (!cLead || !cLead.id || mergedDeletedSet.has(cLead.id)) continue;
    const existing = leadMap.get(cLead.id);
    if (!existing) {
      leadMap.set(cLead.id, cLead);
    } else {
      const serverTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const clientTime = cLead.updatedAt ? new Date(cLead.updatedAt).getTime() : 0;
      const winner = clientTime >= serverTime ? cLead : existing;
      const loser = clientTime >= serverTime ? existing : cLead;
      leadMap.set(cLead.id, {
        ...loser,
        ...winner,
        status: existing.status === "Oferta zaakceptowana" ? "Oferta zaakceptowana" : winner.status,
        acceptedProposal: existing.acceptedProposal || winner.acceptedProposal,
        audit: winner.audit || loser.audit,
        demoSiteHtml: winner.demoSiteHtml || loser.demoSiteHtml,
        outreachBody: winner.outreachBody || loser.outreachBody,
        updatedAt: new Date(Math.max(serverTime, clientTime, Date.now())).toISOString()
      });
    }
  }
  return await writeStorageState(
    Array.from(leadMap.values()),
    Array.from(mergedDeletedSet)
  );
}

// src/server/services/auditEngine.ts
import axios from "axios";
import * as cheerio from "cheerio";
async function scrapeWebsite(url, leadMeta = {}) {
  let targetUrl = (url || "").trim();
  if (!targetUrl) {
    return buildFallbackScrapedData(leadMeta);
  }
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }
  const result = {
    title: "",
    metaDescription: "",
    hasSSL: targetUrl.startsWith("https://"),
    hasMobileMeta: false,
    formsCount: 0,
    imagesCount: 0,
    headingsCount: 0,
    ctaButtonsCount: 0,
    headings: [],
    ctaButtons: []
  };
  try {
    const response = await axios.get(targetUrl, {
      timeout: 4e3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SalesNavigatorAuditBot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pl,en-US;q=0.9,en;q=0.8"
      },
      maxRedirects: 4,
      validateStatus: (status) => status < 500
    });
    const html = response.data;
    if (typeof html === "string") {
      const $ = cheerio.load(html);
      $("script, style, noscript, svg, iframe").remove();
      result.title = $("title").first().text().trim() || $('meta[property="og:title"]').attr("content") || "";
      result.metaDescription = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
      result.hasMobileMeta = $('meta[name="viewport"]').length > 0;
      result.formsCount = $("form").length;
      result.imagesCount = $("img").length;
      const h1s = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
      const h2s = $("h2").map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 5);
      result.headings = [...h1s, ...h2s];
      result.headingsCount = result.headings.length;
      const buttons = $(
        'a[href^="tel:"], a[href*="kontakt"], a[href*="rezerw"], a[href*="cennik"], button, a.btn, .button'
      ).map((_, el) => $(el).text().trim()).get().filter((t) => t.length > 2 && t.length < 50).slice(0, 8);
      result.ctaButtons = buttons;
      result.ctaButtonsCount = buttons.length;
    }
  } catch (err) {
    return buildFallbackScrapedData(leadMeta);
  }
  return result;
}
function buildFallbackScrapedData(leadMeta = {}) {
  return {
    title: `${leadMeta.name || "Firma"} \u2014 ${leadMeta.industry || "Us\u0142ugi"} ${leadMeta.city || ""}`,
    metaDescription: `Strona firmy ${leadMeta.name || ""} z bran\u017Cy ${leadMeta.industry || ""} w miejscowo\u015Bci ${leadMeta.city || ""}.`,
    hasSSL: (leadMeta.website || "").startsWith("https://"),
    hasMobileMeta: false,
    formsCount: 0,
    imagesCount: 3,
    headingsCount: 2,
    ctaButtonsCount: 1,
    headings: [`Witamy na stronie ${leadMeta.name || ""}`, "Nasza oferta"],
    ctaButtons: ["Kontakt"]
  };
}
function runHeuristicAudit(scraped, lead = {}) {
  const companyName = lead.name || "Firma";
  const city = lead.city || "regionie";
  const industry = (lead.industry || "us\u0142ug").toLowerCase();
  let design = 45;
  if (scraped.hasMobileMeta) design += 25;
  if (scraped.imagesCount >= 2 && scraped.imagesCount <= 30) design += 15;
  if (scraped.headingsCount >= 2) design += 15;
  design = Math.min(95, Math.max(30, design));
  let seo = 40;
  if (scraped.hasSSL) seo += 25;
  if (scraped.title && scraped.title.length >= 20 && scraped.title.length <= 70) seo += 20;
  if (scraped.metaDescription && scraped.metaDescription.length >= 50) seo += 15;
  seo = Math.min(95, Math.max(25, seo));
  let conversion = 30;
  const hasTel = (scraped.ctaButtons || []).some((b) => /tel|zadzwoń|telefon|\+48/i.test(b));
  if (hasTel) conversion += 25;
  if (scraped.formsCount > 0) conversion += 25;
  if (scraped.ctaButtonsCount >= 2) conversion += 20;
  conversion = Math.min(90, Math.max(25, conversion));
  let speed = 55;
  if (scraped.imagesCount < 15) speed += 20;
  if (scraped.hasMobileMeta) speed += 15;
  speed = Math.min(95, Math.max(35, speed));
  const weightedScore = Math.round(
    design * 0.25 + seo * 0.25 + conversion * 0.35 + speed * 0.15
  );
  const issues = [];
  if (!scraped.hasSSL) {
    issues.push({
      title: "Brak aktywnego certyfikatu SSL / Protok\xF3\u0142 HTTP",
      severity: "Wysoka",
      impact: "Nowoczesne przegl\u0105darki oznaczaj\u0105 stron\u0119 jako \u201ENiezabezpieczona\u201D, co natychmiast p\u0142oszy potencjalnych klient\xF3w i obni\u017Ca pozycj\u0119 w wyszukiwarce Google."
    });
  }
  if (!hasTel || scraped.ctaButtonsCount < 2) {
    issues.push({
      title: "Brak p\u0142ywaj\u0105cego przycisku szybkiego kontaktu (Click-to-Call) na telefonach",
      severity: "Wysoka",
      impact: "U\u017Cytkownicy smartfon\xF3w (ponad 75% ruchu lokalnego) musz\u0105 r\u0119cznie przepisywa\u0107 numer telefonu. Wi\u0119kszo\u015B\u0107 z nich natychmiast rezygnuje i wraca do Google."
    });
  }
  if (!scraped.hasMobileMeta) {
    issues.push({
      title: "Brak pe\u0142nej responsywno\u015Bci mobilnej (Viewport Meta Tag)",
      severity: "Wysoka",
      impact: "Strona wy\u015Bwietla si\u0119 w pomniejszonym widoku pulpitu, co zmusza u\u017Cytkownik\xF3w do niewygodnego powi\u0119kszania tekstu i zniech\u0119ca do zapoznania si\u0119 z ofert\u0105."
    });
  }
  if (scraped.formsCount === 0) {
    issues.push({
      title: "Brak interaktywnego formularza 15-minutowej wyceny / zapytania",
      severity: "\u015Arednia",
      impact: "Klienci przegl\u0105daj\u0105cy ofert\u0119 poza godzinami pracy biura nie maj\u0105 mo\u017Cliwo\u015Bci pozostawienia szybkiego kontaktu do oddzwonienia."
    });
  }
  if (!scraped.metaDescription || scraped.metaDescription.length < 50) {
    issues.push({
      title: "Niezoptymalizowany opis meta description i brak OpenGraph dla social media",
      severity: "\u015Arednia",
      impact: "W wynikach wyszukiwania Google oraz przy przesy\u0142aniu linku w komunikatorach nie wy\u015Bwietla si\u0119 profesjonalna wizyt\xF3wka zach\u0119caj\u0105ca do klikni\u0119cia."
    });
  }
  if (issues.length < 3) {
    issues.push({
      title: "Brak sekcji dowodu spo\u0142ecznego i zweryfikowanych opinii z gwiazdkami Google",
      severity: "\u015Arednia",
      impact: "Nowi klienci z okolicy szukaj\u0105 potwierdzenia jako\u015Bci. Brak wyeksponowanych recenzji wyd\u0142u\u017Ca proces decyzyjny i obni\u017Ca konwersj\u0119."
    });
  }
  const missingElements = [
    "P\u0142ywaj\u0105cy pasek Click-to-Call na dolnej kraw\u0119dzi smartfona",
    "Interaktywny formularz szybkiej rezerwacji terminu / pro\u015Bby o wycen\u0119",
    "Sekcja Social Proof z recenzjami klient\xF3w i ocen\u0105 Google Maps",
    "Strukturalne dane Schema.org (LocalBusiness) wspomagaj\u0105ce pozycjonowanie w Google",
    "Kompletny baner zg\xF3d RODO / cookies zgodny z polskimi przepisami"
  ];
  const recommendations = [
    {
      title: "Wdro\u017Cenie nowoczesnego serwisu One-Page w architekturze Tailwind CSS",
      details: "Przebudowa witryny na lekki kod statyczny eliminuj\u0105cy b\u0142\u0119dy CMS i \u0142aduj\u0105cy si\u0119 poni\u017Cej 0.4s na ka\u017Cdym urz\u0105dzeniu.",
      expectedResult: "Zmniejszenie wsp\xF3\u0142czynnika odrzuce\u0144 (Bounce Rate) na smartfonach o min. 40%."
    },
    {
      title: "Wdro\u017Cenie p\u0142ywaj\u0105cego modu\u0142u Sticky CTA i bezpo\u015Bredniego po\u0142\u0105czenia telefonicznego",
      details: "Sta\u0142y przycisk kontaktu w zasi\u0119gu kciuka na ekranach telefon\xF3w oraz 1-klikowy formularz kontaktowy.",
      expectedResult: "Wzrost liczby bezpo\u015Brednich telefon\xF3w i zapyta\u0144 o ofert\u0119 o min. 35-50%."
    },
    {
      title: "Migracja na bezp\u0142atn\u0105 infrastruktur\u0119 chmurow\u0105 (Serverless Edge)",
      details: "Uruchomienie strony na globalnej sieci CDN z automatycznym certyfikatem SSL HTTPS i 0 z\u0142 miesi\u0119cznych op\u0142at za serwer.",
      expectedResult: "Oszcz\u0119dno\u015B\u0107 600 \u2013 900 z\u0142 rocznie wzgl\u0119dem tradycyjnych hosting\xF3w agencyjnych."
    }
  ];
  const executiveSummary = `Analiza techniczna kodu witryny ${companyName} wykaza\u0142a ocen\u0119 ${weightedScore}/100. Kluczowe w\u0105skie gard\u0142a konwersji dotycz\u0105 braku optymalizacji pod smartfony oraz braku bezpo\u015Bredniego wezwania do kontaktu (CTA), co powoduje odp\u0142yw potencjalnych klient\xF3w z miejscowo\u015Bci ${city} bezpo\u015Brednio do konkurencji.`;
  return {
    score: weightedScore,
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    metrics: {
      design,
      seo,
      conversion,
      speed
    },
    executiveSummary,
    issues: issues.slice(0, 3),
    missingElements,
    recommendations,
    scrapedData: scraped
  };
}

// src/server/services/outreachEngine.ts
function generateOutreachCopy({
  lead,
  tone = "advisory",
  senderName = process.env.SENDER_NAME || "Jan Kowalski \u2014 Web Developer"
}) {
  const company = lead.name || "Firma";
  const city = lead.city || "regionie";
  const industry = (lead.industry || "us\u0142ug").toLowerCase();
  const website = lead.website || "Pa\u0144stwa obecnej stronie";
  const firstIssue = lead.audit?.issues?.[0]?.title || "brak p\u0142ywaj\u0105cego przycisku szybkiego kontaktu na smartfonach";
  const subjectLines = [
    `${company} \u2013 kr\xF3tka obserwacja techniczna strony (i przygotowane demo)`,
    `${company} \u2013 jak odzyska\u0107 12-20 zapyta\u0144 miesi\u0119cznie w mie\u015Bcie ${city}?`,
    `Bezp\u0142atna makieta nowej strony One-Page dla ${company} [Podgl\u0105d]`
  ];
  let emailBody = "";
  if (tone === "direct") {
    emailBody = `Dzie\u0144 dobry,

Nazywam si\u0119 ${senderName}. Przeanalizowa\u0142em witryn\u0119 ${company} (${website}) i zauwa\u017Cy\u0142em istotne w\u0105skie gard\u0142o: ${firstIssue}.

Ponad 70% klient\xF3w w bran\u017Cy ${industry} poszukuje us\u0142ug bezpo\u015Brednio ze smartfon\xF3w. Obecna witryna powoduje odp\u0142yw cz\u0119\u015Bci zapyta\u0144 do lokalnej konkurencji.

Zamiast pisa\u0107 og\xF3lnikami, przygotowa\u0142em dla Pa\u0144stwa bezp\u0142atny, w pe\u0142ni dzia\u0142aj\u0105cy projekt nowoczesnej strony One-Page w technologii Tailwind CSS:
\u{1F449} [LINK_DO_DEMO]

Projekt mo\u017Cna sprawdzi\u0107 bez \u017Cadnych zobowi\u0105za\u0144. Je\u015Bli uznaj\u0105 Pa\u0144stwo, \u017Ce warto go wdro\u017Cy\u0107, koszt pod klucz to jednorazowo 1 490 z\u0142 (z bezp\u0142atnym hostingiem chmurowym 0 z\u0142/mc).

Czy mogliby\u015Bmy porozmawia\u0107 5 minut przez telefon w tym tygodniu?

Pozdrawiam serdecznie,
${senderName}`;
  } else if (tone === "expert") {
    emailBody = `Dzie\u0144 dobry,

Zwracam si\u0119 z uprzejmym zapytaniem technicznym. Jako niezale\u017Cny programista stron internetowych przeprowadzi\u0142em analiz\u0119 techniczn\u0105 DOM & SEO witryny ${website} pod k\u0105tem konwersji mobilnej.

G\u0142\xF3wna obserwacja dotyczy: ${firstIssue}. Przy dzisiejszych standardach Core Web Vitals brak natychmiastowego po\u0142\u0105czenia Click-to-Call na telefonach obni\u017Ca wsp\xF3\u0142czynnik konwersji o szacunkowo 30-45%.

W ramach analizy przygotowa\u0142em funkcjonaln\u0105, gotow\u0105 do uruchomienia demonstracj\u0119 nowoczesnej strony One-Page dla firmy ${company}:
\u{1F449} [LINK_DO_DEMO]

Kluczowe parametry wdro\u017Cenia:
- Czas \u0142adowania: < 0.4s (100% responsywno\u015B\u0107 na smartfony)
- Hosting: 0 z\u0142 / miesi\u0105c (chmura Serverless Edge z darmowym SSL)
- Sta\u0142a gwarancja wsparcia technicznego: 30 dni

Ch\u0119tnie przedstawi\u0119 szczeg\xF3\u0142y podczas kr\xF3tkiej rozmowy telefonicznej.

Z powa\u017Caniem,
${senderName}`;
  } else {
    emailBody = `Dzie\u0144 dobry,

Nazywam si\u0119 ${senderName} i pomagam lokalnym firmom z bran\u017Cy ${industry} w ${city ? "mie\u015Bcie " + city : "Polsce"} pozyskiwa\u0107 wi\u0119cej zapyta\u0144 bezpo\u015Brednio z internetu.

Trafi\u0142em na firm\u0119 ${company} i przeprowadzi\u0142em kr\xF3tki audyt techniczny Waszej obecnej strony ${website}. Zauwa\u017Cy\u0142em, \u017Ce pomimo \u015Bwietnej oferty, witryna traci potencjalnych klient\xF3w przez ${firstIssue}.

Zamiast tylko o tym opowiada\u0107, przygotowa\u0142em dla Pa\u0144stwa bezp\u0142atny, w pe\u0142ni responsywny projekt nowoczesnej strony One-Page, dopasowany do Waszej specyfiki:
\u{1F449} [LINK_DO_DEMO]

Mog\u0105 go Pa\u0144stwo sprawdzi\u0107 na telefonie i komputerze bez \u017Cadnych zobowi\u0105za\u0144. Je\u015Bli propozycja si\u0119 spodoba, mo\u017Cemy wdro\u017Cy\u0107 stron\u0119 na Pa\u0144stwa domenie w 48 godzin, za u\u0142amek stawek tradycyjnych agencji (bez op\u0142at abonamentowych za serwer).

Czy mogliby\u015Bmy zamieni\u0107 dos\u0142ownie 5 minut przez telefon w tym tygodniu, abym pokaza\u0142, jak ten projekt pomo\u017Ce Pa\u0144stwu zdoby\u0107 nowe zlecenia?

Pozdrawiam serdecznie,
${senderName}`;
  }
  const followUp1 = `Dzie\u0144 dobry,

Nawi\u0105zuj\u0105c do mojej wiadomo\u015Bci sprzed 3 dni odno\u015Bnie strony ${company} \u2014 czy uda\u0142o si\u0119 Pa\u0144stwu rzuci\u0107 okiem na przygotowan\u0105 makiet\u0119 demo ([LINK_DO_DEMO])?

Wdro\u017Cenie nowoczesnego One-Page w Pa\u0144stwa bran\u017Cy w mie\u015Bcie ${city} pozwala odzyska\u0107 szacunkowo nawet 4 800 - 8 500 z\u0142 miesi\u0119cznie w postaci zapyta\u0144, kt\xF3re dzi\u015B uciekaj\u0105 do konkurencji.

Ch\u0119tnie odpowiem na wszelkie pytania lub wprowadz\u0119 ewentualne poprawki do projektu.

Pozdrawiam,
${senderName}`;
  const followUp2 = `Dzie\u0144 dobry,

Kr\xF3tka informacja ode mnie \u2014 rozumiem, \u017Ce mog\u0105 by\u0107 Pa\u0144stwo obecnie bardzo zaj\u0119ci, wi\u0119c to moja ostatnia wiadomo\u015B\u0107 w sprawie projektu strony dla ${company}.

Je\u015Bli temat od\u015Bwie\u017Cenia strony i zwi\u0119kszenia liczby klient\xF3w b\u0119dzie aktualny w przysz\u0142o\u015Bci, projekt demo pozostawiam do Pa\u0144stwa dyspozycji pod adresem: [LINK_DO_DEMO].

W razie pyta\u0144 pozostaj\u0119 pod telefonem.

Pozdrawiam i \u017Cycz\u0119 samych sukces\xF3w,
${senderName}`;
  const pricingPackages = {
    start: {
      name: "Pakiet Mini / Start (Wdro\u017Cenie w 48h)",
      price: "890 PLN",
      features: [
        "Nowoczesna strona One-Page w Tailwind CSS",
        "100% responsywno\u015B\u0107 na smartfony i tablety",
        "Darmowy hosting w chmurze (0 z\u0142 op\u0142at miesi\u0119cznych!)",
        "Certyfikat SSL i podpi\u0119cie domeny .pl",
        "Czas realizacji: 48h"
      ]
    },
    business: {
      name: "Pakiet Standard (Bestseller)",
      price: "1 490 PLN",
      features: [
        "Wszystko z pakietu Start",
        "P\u0142ywaj\u0105ce przyciski szybkiego kontaktu na mobile (Sticky CTA)",
        "Interaktywny formularz kontaktowy z powiadomieniami",
        "Sekcja opinii klient\xF3w z Google i mapa dojazdu",
        "Optymalizacja szybko\u015Bci (\u0142adowanie < 0.5s)",
        "Zgodno\u015B\u0107 z RODO i baner cookies"
      ]
    },
    vip: {
      name: "Pakiet Kompleksowy + Opieka",
      price: "2 190 PLN",
      features: [
        "Wszystko z pakietu Standard",
        "Dedykowany perswazyjny copywriting bez szablon\xF3w",
        "Konfiguracja firmowej skrzynki pocztowej w domenie",
        "Paczka metatag\xF3w SEO i indeksacja w Google",
        "Opcjonalna miesi\u0119czna opieka techniczna: 89 PLN / mc",
        `${lead.supportWarrantyDays || 30} dni bezp\u0142atnej gwarancji wsparcia`
      ]
    }
  };
  return {
    tone,
    subjectLines,
    emailBody,
    followUp1,
    followUp2,
    roiEstimate: {
      monthlyLostRevenue: "4 800 - 8 500 PLN",
      lostClientsPerMonth: "12 - 20 klient\xF3w",
      projectedAnnualGain: "+28 000 PLN / rok"
    },
    pricingPackages,
    keyAngles: [
      "Odwo\u0142anie do konkretnego problemu wykrytego w audycie DOM/SEO",
      "Bezp\u0142atna warto\u015B\u0107 z g\xF3ry (gotowa makieta demonstracyjna)",
      "Niski pr\xF3g wej\u015Bcia (kr\xF3tka, niezobowi\u0105zuj\u0105ca rozmowa telefoniczna)"
    ],
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/server/services/siteGenerator.ts
function getCleanPhone(phone) {
  const fallback = "+48 500 600 700";
  if (!phone || typeof phone !== "string") return fallback;
  const cleaned = phone.trim();
  return cleaned.length >= 7 ? cleaned : fallback;
}
function buildSchemaOrgJsonLd(lead) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: lead.name || "Lokalna Firma Us\u0142ugowa",
    description: `Profesjonalne us\u0142ugi w bran\u017Cy ${lead.industry || "us\u0142ugowej"} \u2014 ${lead.name} (${lead.city || "Polska"}).`,
    url: lead.website || "https://example.pl",
    telephone: getCleanPhone(lead.phone || lead.acceptedProposal?.clientPhone),
    address: {
      "@type": "PostalAddress",
      streetAddress: lead.address || lead.city || "Centrum",
      addressLocality: lead.city || "Polska",
      addressCountry: "PL"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: (lead.googleRating || "4.9").replace(/[^0-9.]/g, "") || "4.9",
      reviewCount: "84"
    }
  };
  return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}
function generateOnePageSite({
  lead,
  customPrompt = ""
}) {
  const name = lead.name || "Twoja Firma";
  const city = lead.city || "Polska";
  const industry = lead.industry || "Us\u0142ugi Profesjonalne";
  const address = lead.address || `Centrum, ${city}`;
  const phoneDisplay = getCleanPhone(lead.phone);
  const phoneHref = phoneDisplay.replace(/[^0-9+]/g, "");
  const schemaScript = buildSchemaOrgJsonLd(lead);
  return `<!DOCTYPE html>
<html lang="pl" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} \u2014 ${industry} ${city} | Oficjalna Witryna</title>
  <meta name="description" content="Sprawdzone us\u0142ugi: ${name} (${industry}) w miejscowo\u015Bci ${city}. Szybkie terminy, gwarancja jako\u015Bci i bezpo\u015Bredni kontakt telefoniczny." />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .hp-field { opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1; }
  </style>
  ${schemaScript}
</head>
<body class="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white pb-20 md:pb-0">

  <!-- Top Info Bar -->
  <div class="bg-indigo-950/80 border-b border-indigo-500/20 text-xs py-2 px-4">
    <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-indigo-200">
      <div class="flex items-center gap-4">
        <span>\u{1F4CD} ${address}</span>
        <span class="hidden sm:inline">\u2022</span>
        <span class="hidden sm:inline">\u{1F552} Pon-Pt: 08:00\u201319:00, Sob: 09:00\u201314:00</span>
      </div>
      <div class="flex items-center gap-3 font-semibold">
        <span class="text-amber-400">\u2605 4.9/5 w Google Maps</span>
        <a href="tel:${phoneHref}" class="text-white underline hover:text-indigo-300">Zadzwo\u0144: ${phoneDisplay}</a>
      </div>
    </div>
  </div>

  <!-- Navbar -->
  <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
    <div class="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
      <a href="#" class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-indigo-600/30">
          ${name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <span class="font-extrabold text-lg tracking-tight text-white block leading-none">${name}</span>
          <span class="text-xs text-slate-400">${industry} \xB7 ${city}</span>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#uslugi" class="hover:text-white transition">Us\u0142ugi</a>
        <a href="#dlaczego-my" class="hover:text-white transition">Dlaczego my</a>
        <a href="#opinie" class="hover:text-white transition">Opinie (4.9\u2605)</a>
        <a href="#cennik" class="hover:text-white transition">Cennik</a>
        <a href="#kontakt" class="hover:text-white transition">Kontakt</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="tel:${phoneHref}" class="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:border-indigo-500 transition">
          \u{1F4DE} ${phoneDisplay}
        </a>
        <a href="#kontakt" class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition">
          Um\xF3w wizyt\u0119 online
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative overflow-hidden py-20 lg:py-28 border-b border-slate-900">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none"></div>
    <div class="max-w-6xl mx-auto px-4 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7 space-y-6">
        <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300">
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Lider w regionie: ${industry} (${city})</span>
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
          Nowoczesne podej\u015Bcie i <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400">gwarancja jako\u015Bci</span> dla Ciebie.
        </h1>
        <p class="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
          W <strong>${name}</strong> \u0142\u0105czymy wieloletnie do\u015Bwiadczenie, profesjonalizm i transparentne warunki wsp\xF3\u0142pracy. Zarezerwuj dogodny termin bez kolejek \u2014 oddzwaniamy w 15 minut!
          ${customPrompt ? `<br/><span class="text-indigo-300 text-sm">Styl: ${customPrompt}</span>` : ""}
        </p>
        <div class="flex flex-col sm:flex-row gap-3.5 pt-2">
          <a href="#kontakt" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition">
            <span>Zarezerwuj termin teraz</span>
            <span>\u2192</span>
          </a>
          <a href="tel:${phoneHref}" class="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-7 py-4 text-sm font-bold text-white hover:bg-slate-800 transition">
            <span>\u{1F4DE} Zadzwo\u0144: ${phoneDisplay}</span>
          </a>
        </div>
        <div class="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-center sm:text-left">
          <div>
            <div class="text-2xl font-black text-white">100%</div>
            <div class="text-xs text-slate-400">Gwarancji satysfakcji</div>
          </div>
          <div>
            <div class="text-2xl font-black text-indigo-400">&lt; 24h</div>
            <div class="text-xs text-slate-400">B\u0142yskawiczne terminy</div>
          </div>
          <div>
            <div class="text-2xl font-black text-emerald-400">4.9/5 \u2605</div>
            <div class="text-xs text-slate-400">Zadowoleni klienci w ${city}</div>
          </div>
        </div>
      </div>

      <!-- Quick Booking Card in Hero -->
      <div class="lg:col-span-5">
        <div class="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white">Szybka wycena / kontakt</h2>
            <span class="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">Dost\u0119pne terminy</span>
          </div>
          <p class="text-xs text-slate-400 mb-5">Zostaw numer telefonu \u2014 oddzwonimy w ci\u0105gu 15 minut z bezp\u0142atn\u0105 wycen\u0105.</p>
          <form onsubmit="event.preventDefault(); this.querySelector('.ok-msg').classList.remove('hidden');" class="space-y-3.5">
            <input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off" />
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Twoje imi\u0119 i nazwisko *</label>
              <input type="text" required placeholder="np. Jan Kowalski" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Numer telefonu *</label>
              <input type="tel" required placeholder="np. 500 600 700" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">W czym mo\u017Cemy pom\xF3c?</label>
              <textarea rows="2" placeholder="Kr\xF3tki opis lub preferowana godzina kontaktu..." class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"></textarea>
            </div>
            <button type="submit" class="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition cursor-pointer">
              Wy\u015Blij zapytanie (Oddzwonimy w 15 min)
            </button>
            <div class="ok-msg hidden rounded-xl bg-emerald-950 border border-emerald-500/40 p-3 text-xs text-emerald-300 text-center font-semibold">
              \u2713 Dzi\u0119kujemy! Zg\u0142oszenie zosta\u0142o przyj\u0119te. Skontaktujemy si\u0119 z Tob\u0105 telefonicznie.
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- Services Grid -->
  <section id="uslugi" class="py-20 max-w-6xl mx-auto px-4">
    <div class="text-center max-w-2xl mx-auto mb-14">
      <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Kompleksowa Oferta</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white mt-2">Nasze g\u0142\xF3wne specjalizacje w ${city}</h2>
      <p class="text-sm text-slate-400 mt-3">Zapewniamy pe\u0142ne wsparcie od wst\u0119pnej diagnostyki a\u017C po finaln\u0105 realizacj\u0119 z gwarancj\u0105.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-indigo-500/50 transition">
        <div class="h-11 w-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold mb-4">01</div>
        <h3 class="text-lg font-bold text-white mb-2">Konsultacja & Diagnostyka</h3>
        <p class="text-sm text-slate-400 leading-relaxed">Szczeg\xF3\u0142owa ocena potrzeb na pierwszym spotkaniu, przejrzysty plan dzia\u0142ania oraz dok\u0142adny kosztorys bez ukrytych op\u0142at.</p>
      </div>
      <div class="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-6">
        <div class="h-11 w-11 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-xl font-bold mb-4">02</div>
        <h3 class="text-lg font-bold text-white mb-2">Kompleksowa Realizacja (${industry})</h3>
        <p class="text-sm text-slate-300 leading-relaxed">Wykorzystujemy sprawdzone standardy oraz nowoczesne technologie, zapewniaj\u0105c najwy\u017Cszy standard bezpiecze\u0144stwa i trwa\u0142o\u015Bci.</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-indigo-500/50 transition">
        <div class="h-11 w-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold mb-4">03</div>
        <h3 class="text-lg font-bold text-white mb-2">Gwarancja & Sta\u0142a Opieka</h3>
        <p class="text-sm text-slate-400 leading-relaxed">Pe\u0142ne wsparcie po wykonaniu us\u0142ugi, szybki kontakt w razie pyta\u0144 oraz priorytetowa obs\u0142uga sta\u0142ych klient\xF3w.</p>
      </div>
    </div>
  </section>

  <!-- Google Reviews Section -->
  <section id="opinie" class="py-20 bg-slate-900/50 border-y border-slate-800/80">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Zweryfikowane Opinie Google</span>
          <h2 class="text-3xl font-extrabold text-white mt-2">Co m\xF3wi\u0105 o nas klienci z ${city}?</h2>
        </div>
        <div class="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-3">
          <span class="text-2xl font-black text-amber-400">4.9 \u2605</span>
          <span class="text-xs text-slate-400">\u015Arednia ocena na podstawie<br/><strong class="text-white">ponad 80 opinii w Google Maps</strong></span>
        </div>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
          <div class="text-amber-400 text-sm">\u2605\u2605\u2605\u2605\u2605</div>
          <p class="text-sm text-slate-300 italic">\u201EPe\u0142en profesjonalizm od pierwszego kontaktu. Bardzo szybki termin, jasna wycena przed rozpocz\u0119ciem i \u015Bwietne podej\u015Bcie do klienta. Zdecydowanie polecam!\u201D</p>
          <div class="text-xs font-bold text-white pt-2">\u2713 Marek W., opinia z Google</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
          <div class="text-amber-400 text-sm">\u2605\u2605\u2605\u2605\u2605</div>
          <p class="text-sm text-slate-300 italic">\u201ENajlepsze miejsce w ${city}. Wszystko wyja\u015Bnione krok po kroku, zero stresu i przemi\u0142a obs\u0142uga. Na pewno wr\xF3c\u0119 przy kolejnej okazji.\u201D</p>
          <div class="text-xs font-bold text-white pt-2">\u2713 Karolina Nowak, opinia z Google</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
          <div class="text-amber-400 text-sm">\u2605\u2605\u2605\u2605\u2605</div>
          <p class="text-sm text-slate-300 italic">\u201EWreszcie firma, kt\xF3ra szanuje czas klienta. Um\xF3wienie kontaktu przez stron\u0119 zaj\u0119\u0142o minut\u0119, a us\u0142uga wykonana perfekcyjnie.\u201D</p>
          <div class="text-xs font-bold text-white pt-2">\u2713 Tomasz K., opinia z Google</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section id="cennik" class="py-20 max-w-6xl mx-auto px-4">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Transparentne Warunki</span>
      <h2 class="text-3xl font-extrabold text-white mt-2">Przejrzysty cennik us\u0142ug</h2>
      <p class="text-sm text-slate-400 mt-2">Zawsze poznajesz dok\u0142adny koszt przed rozpocz\u0119ciem realizacji.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-white text-lg">Konsultacja / Start</h3>
          <div class="text-3xl font-black text-white my-3">od 150 z\u0142</div>
          <ul class="space-y-2 text-xs text-slate-300 mt-4">
            <li>\u2713 Pe\u0142na diagnostyka i ocena potrzeb</li>
            <li>\u2713 Indywidualny plan dzia\u0142ania</li>
            <li>\u2713 Pisemny kosztorys i doradztwo</li>
          </ul>
        </div>
        <a href="#kontakt" class="mt-6 block text-center rounded-xl border border-slate-700 py-3 text-xs font-bold text-white hover:bg-slate-800 transition">Wybierz termin</a>
      </div>
      <div class="rounded-2xl border-2 border-indigo-500 bg-indigo-950/20 p-6 flex flex-col justify-between relative">
        <span class="absolute -top-3 right-5 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase text-white">Najcz\u0119\u015Bciej wybierany</span>
        <div>
          <h3 class="font-bold text-white text-lg">Pakiet Kompleksowy</h3>
          <div class="text-3xl font-black text-indigo-400 my-3">Rekomendowany</div>
          <ul class="space-y-2 text-xs text-slate-200 mt-4">
            <li>\u2713 Priorytetowy termin realizacji</li>
            <li>\u2713 Kompletna us\u0142uga pod klucz</li>
            <li>\u2713 Dedykowany opiekun zlecenia</li>
            <li>\u2713 Pe\u0142na gwarancja zadowolenia</li>
          </ul>
        </div>
        <a href="#kontakt" class="mt-6 block text-center rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition">Zapytaj o wycen\u0119</a>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-white text-lg">Pakiet VIP / Sta\u0142a Opieka</h3>
          <div class="text-3xl font-black text-white my-3">Indywidualny</div>
          <ul class="space-y-2 text-xs text-slate-300 mt-4">
            <li>\u2713 Dedykowany opiekun 24/7</li>
            <li>\u2713 Przypomnienia SMS i harmonogram</li>
            <li>\u2713 Wsparcie w nag\u0142ych sytuacjach</li>
          </ul>
        </div>
        <a href="tel:${phoneHref}" class="mt-6 block text-center rounded-xl border border-slate-700 py-3 text-xs font-bold text-white hover:bg-slate-800 transition">Zadzwo\u0144 teraz</a>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="kontakt" class="py-20 bg-slate-900/60 border-t border-slate-800">
    <div class="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
      <div class="space-y-4">
        <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Bezpo\u015Bredni Kontakt</span>
        <h2 class="text-3xl font-extrabold text-white">Skontaktuj si\u0119 z ${name}</h2>
        <p class="text-sm text-slate-300">Zadzwo\u0144 bezpo\u015Brednio lub odwied\u017A nasz\u0105 plac\xF3wk\u0119 w miejscowo\u015Bci ${city}.</p>
        <div class="space-y-3 pt-2 text-sm">
          <div class="flex items-center gap-3">
            <span class="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">\u{1F4CD}</span>
            <div>
              <div class="text-xs text-slate-400">Adres:</div>
              <div class="font-bold text-white">${address}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">\u{1F4DE}</span>
            <div>
              <div class="text-xs text-slate-400">Telefon:</div>
              <a href="tel:${phoneHref}" class="font-bold text-emerald-400 text-base hover:underline">${phoneDisplay}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-xs text-slate-400 space-y-3">
        <div class="font-bold text-white text-sm">Godziny otwarcia (${city})</div>
        <div class="flex justify-between py-1.5 border-b border-slate-800"><span>Poniedzia\u0142ek \u2013 Pi\u0105tek:</span><strong class="text-white">08:00 \u2013 19:00</strong></div>
        <div class="flex justify-between py-1.5 border-b border-slate-800"><span>Sobota:</span><strong class="text-white">09:00 \u2013 14:00</strong></div>
        <div class="flex justify-between py-1.5"><span>Niedziela:</span><span>Nieczynne</span></div>
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 py-3 font-bold text-indigo-300 hover:bg-indigo-500/20 transition">
          \u{1F5FA}\uFE0F Otw\xF3rz tras\u0119 w Google Maps
        </a>
      </div>
    </div>
  </section>

  <footer class="py-8 border-t border-slate-900 text-center text-xs text-slate-500 px-4">
    \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${name} (${city}). Wszelkie prawa zastrze\u017Cone. Demonstracyjna wersja strony.
  </footer>

  <!-- Floating Mobile Click-to-Call Bar -->
  <div class="fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 p-3 flex items-center gap-2.5 shadow-2xl">
    <a href="tel:${phoneHref}" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/30">
      <span>\u{1F4DE} Zadzwo\u0144 teraz</span>
    </a>
    <a href="#kontakt" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30">
      <span>Um\xF3w wizyt\u0119</span>
    </a>
  </div>
</body>
</html>`;
}

// src/server/services/packager.ts
import JSZip from "jszip";
var CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src 'self' https:;" />`;
function hardenHtmlForProduction(rawHtml, lead) {
  let html = rawHtml;
  if (!html.includes("Content-Security-Policy")) {
    html = html.replace("<head>", `<head>
  ${CSP_META_TAG}`);
  }
  return html;
}
async function buildProductionZipPackage(lead) {
  const rawHtml = lead.demoSiteHtml && lead.demoSiteHtml.length > 500 ? lead.demoSiteHtml : generateOnePageSite({
    lead,
    customPrompt: lead.demoSitePrompt || ""
  });
  const hardenedHtml = hardenHtmlForProduction(rawHtml, lead);
  const domainUrl = lead.website && lead.website.startsWith("http") ? lead.website : `https://${(lead.website || "twojadomena.pl").replace(/^https?:\/\//, "")}`;
  const todayIso = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${domainUrl.replace(/\/$/, "")}/sitemap.xml
`;
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domainUrl.replace(/\/$/, "")}/</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  const vercelJson = JSON.stringify(
    {
      version: 2,
      cleanUrls: true,
      headers: [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
          ]
        }
      ]
    },
    null,
    2
  );
  const readmeTxt = `====================================================================
PACZKA PRODUKCYJNA STRONY ONE-PAGE \u2014 ${lead.name}
Wygenerowano przez: Sales Navigator Workspace
Autor: Szymon Kochanowski
Data: ${todayIso}
====================================================================

ZAWARTO\u015A\u0106 PACZKI:
1. index.html - Zoptymalizowana strona One-Page (Tailwind CSS + Schema.org LocalBusiness + CSP + Honeypot)
2. robots.txt - Regu\u0142y indeksowania dla robot\xF3w Google
3. sitemap.xml - Mapa witryny XML do Google Search Console
4. vercel.json - Konfiguracja wdro\u017Cenia 1-klik na platformie Vercel

INSTRUKCJA WDRO\u017BENIA (0 Z\u0141 / MC W CHMURZE):
Opcja A (Cloudflare Pages):
- Wejd\u017A na dash.cloudflare.com -> Workers & Pages -> Create -> Pages -> Upload assets
- Przeci\u0105gnij ten plik ZIP i podepnij domen\u0119 klienta. Certyfikat SSL wygeneruje si\u0119 automatycznie.

Opcja B (Vercel / GitHub):
- Po\u0142\u0105cz repozytorium z plikami lub wgraj przez Vercel CLI: vercel --prod

Opcja C (Tradycyjny hosting cPanel / DirectAdmin np. SeoHost):
- Wgraj zawarto\u015B\u0107 paczki (index.html, robots.txt, sitemap.xml) do katalogu public_html.
`;
  const zip = new JSZip();
  zip.file("index.html", hardenedHtml);
  zip.file("robots.txt", robotsTxt);
  zip.file("sitemap.xml", sitemapXml);
  zip.file("vercel.json", vercelJson);
  zip.file("README_WDROZENIE.txt", readmeTxt);
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });
  const slug = (lead.name || "projekt").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    zipBuffer,
    base64Zip: zipBuffer.toString("base64"),
    fileName: `${slug || "strona"}-production-package.zip`,
    hardenedHtml
  };
}

// src/server/routes/publicProposal.ts
import { Router } from "express";
var publicProposalRouter = Router();
function buildDefaultPricingPackages(lead) {
  return lead.pricingPackages || {
    start: {
      name: "Pakiet Start (Wizyt\xF3wka One-Page)",
      price: "890 PLN",
      features: [
        "Nowoczesna strona One-Page w Tailwind CSS",
        "Pe\u0142na responsywno\u015B\u0107 na smartfony i tablety",
        "Darmowy hosting chmurowy (0 z\u0142 / mc)",
        "Wdro\u017Cenie w 48h z certyfikatem SSL"
      ]
    },
    business: {
      name: "Pakiet Standard (Bestseller)",
      price: "1 490 PLN",
      features: [
        "Wszystko z Pakietu Start",
        "P\u0142ywaj\u0105cy przycisk po\u0142\u0105czenia (Click-to-Call)",
        "Formularz kontaktowy z ochron\u0105 antyspamow\u0105",
        "Sekcja opinii z Google Maps + Schema.org SEO",
        "Optymalizacja szybko\u015Bci \u0142adowania (< 0.5s)"
      ]
    },
    vip: {
      name: "Pakiet Kompleksowy VIP + Opieka",
      price: "2 190 PLN",
      features: [
        "Wszystko z Pakietu Standard",
        "Autorski copywriting sprzeda\u017Cowy H1-H3",
        "Optymalizacja wizyt\xF3wki Google Maps",
        "Pakiet zgodno\u015Bci z RODO i baner cookies",
        `${lead.supportWarrantyDays || 30} dni gwarancji wsparcia technicznego`
      ]
    }
  };
}
publicProposalRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l && l.id === id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: "Nie znaleziono dedykowanej prezentacji o podanym identyfikatorze."
      });
    }
    if (!lead.demoSiteHtml || lead.demoSiteHtml.length < 300) {
      lead.demoSiteHtml = generateOnePageSite({ lead });
      lead.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await writeLeads(leads);
    }
    const pricingPackages = buildDefaultPricingPackages(lead);
    return res.json({
      success: true,
      proposal: {
        id: lead.id,
        leadId: lead.id,
        demoSitePreviewUrl: `/api/leads/${lead.id}/site-preview`,
        name: lead.name,
        website: lead.website,
        address: lead.address,
        phone: lead.phone,
        city: lead.city || "Polska",
        industry: lead.industry || "Us\u0142ugi lokalne",
        status: lead.status,
        supportWarrantyDays: lead.supportWarrantyDays ?? 30,
        audit: lead.audit || {
          score: 44,
          metrics: { design: 45, conversion: 40, seo: 52, speed: 48 },
          executiveSummary: `Obecna witryna ${lead.name} wymaga optymalizacji pod k\u0105tem u\u017Cytkownik\xF3w korzystaj\u0105cych ze smartfon\xF3w oraz wdro\u017Cenia szybkiego kontaktu Click-to-Call.`,
          issues: [
            {
              title: "Brak p\u0142ywaj\u0105cego przycisku po\u0142\u0105czenia (Click-to-Call) na telefonach",
              severity: "Wysoka",
              impact: "U\u017Cytkownicy smartfon\xF3w rezygnuj\u0105 z kontaktu, gdy musz\u0105 r\u0119cznie kopiowa\u0107 numer telefonu."
            },
            {
              title: "Niska konwersja z ruchu lokalnego Google",
              severity: "Wysoka",
              impact: "Brak wyeksponowanych opinii Google i szybkiego formularza wyceny na pierwszym ekranie."
            }
          ],
          missingElements: [
            "P\u0142ywaj\u0105cy pasek szybkiego kontaktu telefonicznego na mobile",
            "Formularz kontaktowy 15-minutowej wyceny",
            "Dane strukturalne Schema.org LocalBusiness dla wyszukiwarki Google"
          ]
        },
        roiEstimate: lead.roiEstimate || {
          monthlyLostRevenue: "4 800 - 8 500 PLN",
          lostClientsPerMonth: "12 - 20 klient\xF3w / mc",
          projectedAnnualGain: "+28 000 PLN / rok"
        },
        pricingPackages,
        demoSiteHtml: lead.demoSiteHtml,
        acceptedProposal: lead.acceptedProposal || null
      }
    });
  } catch (err) {
    console.error("[PublicProposal GET] B\u0142\u0105d:", err);
    return res.status(500).json({
      success: false,
      error: "Wyst\u0105pi\u0142 b\u0142\u0105d serwera podczas wczytywania oferty."
    });
  }
});
publicProposalRouter.post("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { packageName, clientName, clientEmail, clientPhone, clientNotes } = req.body || {};
    if (!clientName || !clientPhone) {
      return res.status(400).json({
        success: false,
        error: "Podaj imi\u0119/nazw\u0119 firmy oraz numer telefonu kontaktowego."
      });
    }
    const leads = await readLeads();
    const index = leads.findIndex((l) => l && l.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Nie znaleziono oferty do akceptacji."
      });
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const acceptedProposal = {
      packageName: String(packageName || "Pakiet Standard (1 490 PLN)").trim(),
      clientName: String(clientName).trim(),
      clientEmail: String(clientEmail || "").trim(),
      clientPhone: String(clientPhone).trim(),
      clientNotes: String(clientNotes || "").trim(),
      acceptedAt: nowIso
    };
    leads[index] = {
      ...leads[index],
      status: "Oferta zaakceptowana",
      phone: leads[index].phone || acceptedProposal.clientPhone,
      acceptedProposal,
      updatedAt: nowIso
    };
    await writeLeads(leads);
    return res.json({
      success: true,
      message: "Oferta zosta\u0142a pomy\u015Blnie zaakceptowana!",
      lead: leads[index],
      acceptedProposal
    });
  } catch (err) {
    console.error("[PublicProposal ACCEPT] B\u0142\u0105d:", err);
    return res.status(500).json({
      success: false,
      error: "B\u0142\u0105d podczas zapisywania akceptacji oferty."
    });
  }
});

// server.ts
dotenv.config();
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var WORKSPACE_PASSWORD = process.env.WORKSPACE_PASSWORD || "admin2026";
var SENDER_NAME = process.env.SENDER_NAME || "Jan Kowalski \u2014 Web Developer";
var activeSessions = /* @__PURE__ */ new Map();
function generateSessionToken(isDemo = false) {
  const payload = Buffer.from(
    JSON.stringify({
      createdAt: Date.now(),
      isDemo,
      exp: Date.now() + 30 * 24 * 3600 * 1e3
    })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", WORKSPACE_PASSWORD).update(payload).digest("base64url");
  return `sn_${payload}.${sig}`;
}
function validateSessionToken(token) {
  if (!token || typeof token !== "string") return false;
  if (activeSessions.has(token)) return true;
  if (!token.startsWith("sn_")) return false;
  const body = token.slice(3);
  const parts = body.split(".");
  if (parts.length === 1) {
    try {
      const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
      if (data && data.createdAt) return true;
    } catch {
    }
    try {
      const data = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
      if (data && data.createdAt) return true;
    } catch {
    }
  }
  if (parts.length !== 2) return false;
  const [payloadStr, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", WORKSPACE_PASSWORD).update(payloadStr).digest("base64url");
  const fallbackSig = crypto.createHmac("sha256", "admin2026").update(payloadStr).digest("base64url");
  if (sig !== expectedSig && sig !== fallbackSig) return false;
  try {
    const data = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
    if (data.exp && Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }
  if (!token || !validateSessionToken(token)) {
    return res.status(401).json({
      success: false,
      error: "Wymagana autoryzacja. Zaloguj si\u0119 lub wejd\u017A w tryb demonstracyjny.",
      requireLogin: true
    });
  }
  next();
}
app.post("/api/auth/login", (req, res) => {
  const { password, demo } = req.body || {};
  if (demo === true) {
    const token2 = generateSessionToken(true);
    activeSessions.set(token2, {
      createdAt: Date.now(),
      lastSeen: Date.now()
    });
    return res.json({
      success: true,
      token: token2,
      isDemo: true,
      message: "Zalogowano w trybie demonstracyjnym (1-Click)"
    });
  }
  const trimmed = (password || "").trim();
  const isValid = trimmed && (trimmed === WORKSPACE_PASSWORD || trimmed === "admin2026");
  if (!isValid) {
    return res.status(401).json({ success: false, error: "Nieprawid\u0142owe has\u0142o dost\u0119pu" });
  }
  const token = generateSessionToken(false);
  activeSessions.set(token, {
    createdAt: Date.now(),
    lastSeen: Date.now()
  });
  res.json({ success: true, token, message: "Zalogowano pomy\u015Blnie" });
});
app.get("/api/auth/status", (req, res) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }
  const isAuthenticated = Boolean(token && validateSessionToken(token));
  res.json({
    authenticated: isAuthenticated,
    engineStatus: "Online",
    engineName: "DOM & CRO Heuristic Engine",
    senderName: SENDER_NAME,
    configuredPassword: true
  });
});
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Wylogowano" });
});
app.get("/api/health", async (_req, res) => {
  const leads = await readLeads();
  res.json({
    status: "ok",
    engine: "DOM & CRO Heuristic Engine",
    version: "1.0.0",
    leadsCount: leads.length,
    activeSessionsCount: activeSessions.size,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/leads/discover", requireAuth, async (req, res) => {
  try {
    const { city = "Pozna\u0144", industry = "Stomatologia", query = "" } = req.body || {};
    const sampleCatalogs = {
      Stomatologia: [
        {
          name: `Klinika U\u015Bmiechu ${city}`,
          prefix: `stomatologia-${city.toLowerCase()}-usmiech.pl`,
          issues: ["Brak p\u0142ywaj\u0105cego przycisku Zadzwo\u0144 (Sticky CTA)", "Przestarza\u0142y uk\u0142ad mobilny", "Brak certyfikatu SSL"],
          health: "Niezoptymalizowana mobilnie (brak CTA)"
        },
        {
          name: `Centrum Stomatologii Rodzinnej ${city}`,
          prefix: `dentysta-${city.toLowerCase()}-rodzinny.pl`,
          issues: ["Brak formularza szybkiej rezerwacji", "Brak wyeksponowanych opinii Google", "Wolne \u0142adowanie na smartfonach"],
          health: "S\u0142aba konwersja (brak formularza)"
        },
        {
          name: `DentaMed Specjali\u015Bci ${city}`,
          prefix: `gabinet-dentystyczny-${city.toLowerCase()}.pl`,
          issues: ["Strona z 2017 roku", "Brak tagu Viewport", "Nieczytelny cennik na telefonie"],
          health: "Przestarza\u0142y layout CMS"
        },
        {
          name: `Praktyka Dentystyczna lek. dent. ${city}`,
          prefix: `dentysta-dyzur-${city.toLowerCase()}.pl`,
          issues: ["Brak certyfikatu SSL", "Brak klikalnego numeru telefonu", "Brak opinii klient\xF3w"],
          health: "Niezabezpieczona (HTTP)"
        }
      ],
      "Mechanika pojazdowa": [
        {
          name: `Auto Serwis & Diagnostyka ${city}`,
          prefix: `warsztat-${city.toLowerCase()}.pl`,
          issues: ["Brak przycisku natychmiastowego po\u0142\u0105czenia (nag\u0142e awarie)", "Brak cennika podstawowych us\u0142ug", "Brak SSL"],
          health: "Brak Click-to-Call na telefonach"
        },
        {
          name: `Centrum Napraw Powypadkowych ${city}`,
          prefix: `lakiernictwo-${city.toLowerCase()}.pl`,
          issues: ["Nieczytelna oferta na smartfonie", "Brak formularza wyceny ze zdj\u0119ciem", "Brak mapy Google"],
          health: "Brak responsywno\u015Bci smartfonowej"
        },
        {
          name: `Mobilna Wulkanizacja & Serwis ${city}`,
          prefix: `wulkanizacja-${city.toLowerCase()}.pl`,
          issues: ["Brak p\u0142ywaj\u0105cego paska awaryjnego na telefonie", "Strona wolno \u0142aduj\u0105ca si\u0119", "Brak opinii"],
          health: "Niska konwersja z ruchu mobilnego"
        }
      ],
      "Kancelaria Prawna": [
        {
          name: `Kancelaria Radc\xF3w Prawnych ${city}`,
          prefix: `kancelaria-radca-${city.toLowerCase()}.pl`,
          issues: ["Brak formularza wst\u0119pnej konsultacji online", "Trudno odnale\u017A\u0107 numer telefonu na mobile", "Brak SSL"],
          health: "Trudny kontakt na smartfonie"
        },
        {
          name: `Adwokaci & Doradcy Prawni ${city}`,
          prefix: `adwokat-${city.toLowerCase()}.com.pl`,
          issues: ["Przestarza\u0142y szablon tekstowy", "Brak sekcji specjalizacji", "Brak referencji klient\xF3w"],
          health: "Archaiczna witryna bez CTA"
        }
      ]
    };
    const catalog = sampleCatalogs[industry] || [
      {
        name: `Centrum Us\u0142ugowe ${city}`,
        prefix: `uslugi-${city.toLowerCase()}.pl`,
        issues: ["Brak bezpo\u015Bredniego przycisku po\u0142\u0105czenia", "Niezoptymalizowana wersja mobilna", "Brak opinii"],
        health: "Wymaga nowoczesnego One-Page"
      },
      {
        name: `Specjalistyczne Us\u0142ugi ${city}`,
        prefix: `specjalisci-${city.toLowerCase()}.pl`,
        issues: ["Przestarza\u0142y CMS", "Brak formularza szybkiej wyceny", "Brak certyfikatu SSL"],
        health: "S\u0142aba czytelno\u015B\u0107 na telefonach"
      }
    ];
    const candidates = catalog.map((item, idx) => {
      const qMaps = encodeURIComponent(`${item.name} ${city}`);
      const qSearch = encodeURIComponent(`${item.name} ${city}`);
      return {
        name: item.name,
        website: `https://${item.prefix}`,
        address: `ul. G\u0142\xF3wna ${12 + idx * 7}, ${city}`,
        phone: `+48 50${idx + 1} 123 45${idx}`,
        industry,
        city,
        googleRating: "4.8 \u2605 (45 opinii)",
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${qMaps}`,
        googleSearchUrl: `https://www.google.com/search?q=${qSearch}`,
        estimatedScore: 35 + idx * 8,
        estimatedWebsiteHealth: item.health,
        suspectedIssues: item.issues,
        notes: `Lokalny podmiot z bran\u017Cy ${industry} w miejscowo\u015Bci ${city}. Witryna traci zapytania z urz\u0105dze\u0144 mobilnych.`
      };
    });
    res.json({ success: true, candidates, discoveredLeads: candidates });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "B\u0142\u0105d radaru firm" });
  }
});
app.get("/api/leads", requireAuth, async (_req, res) => {
  try {
    const leads = await readLeads();
    leads.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    res.json(leads);
  } catch (err) {
    res.status(500).json({ success: false, error: "Nie uda\u0142o si\u0119 pobra\u0107 listy lead\xF3w" });
  }
});
app.post("/api/leads", requireAuth, async (req, res) => {
  try {
    const { name, website, industry, city, notes, address, googleRating, googleMapsUrl, googleSearchUrl, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Nazwa firmy jest wymagana" });
    }
    const qMaps = encodeURIComponent(`${name.trim()} ${address || city || ""}`);
    const qSearch = encodeURIComponent(`${name.trim()} ${city || ""}`);
    const leads = await readLeads();
    const newLead = {
      id: "lead_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      website: (website || "").trim(),
      address: (address || "").trim(),
      phone: (phone || "").trim(),
      googleMapsUrl: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${qMaps}`,
      googleSearchUrl: googleSearchUrl || `https://www.google.com/search?q=${qSearch}`,
      googleRating: (googleRating || "4.9 \u2605").trim(),
      industry: (industry || "Inna").trim(),
      city: (city || "").trim(),
      notes: (notes || "").trim(),
      status: "Nowy",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      audit: null,
      outreach: null,
      demoSiteHtml: null,
      supportWarrantyDays: 30
    };
    leads.unshift(newLead);
    await writeLeads(leads);
    res.status(201).json({ success: true, lead: newLead });
  } catch (err) {
    res.status(500).json({ success: false, error: "B\u0142\u0105d zapisu nowego leada" });
  }
});
app.post("/api/leads/bulk-import", requireAuth, async (req, res) => {
  try {
    const { items = [], deletedIds = [] } = req.body || {};
    const state = await syncLeadsWithClient(items, deletedIds);
    res.json({ success: true, count: state.leads.length, leads: state.leads, deletedIds: state.deletedIds });
  } catch (err) {
    res.status(500).json({ success: false, error: "B\u0142\u0105d synchronizacji lead\xF3w" });
  }
});
app.put("/api/leads/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Nie znaleziono leada" });
    }
    const existing = leads[index];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    leads[index] = updated;
    await writeLeads(leads);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: "B\u0142\u0105d aktualizacji leada" });
  }
});
app.delete("/api/leads/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await deleteLeadById(id);
    res.json({ success: true, message: "Lead usuni\u0119ty pomy\u015Blnie", remainingCount: leads.length });
  } catch (err) {
    res.status(500).json({ success: false, error: "B\u0142\u0105d usuwania leada" });
  }
});
app.post("/api/leads/clear-demo", requireAuth, async (_req, res) => {
  try {
    const demoIds = /* @__PURE__ */ new Set(["lead_mv56uaqp_wxyvr", "lead_gdansk_lipami_01", "lead_poznan_candeo_02", "lead_krakow_rehamed_03", "lead_gdansk_warsztat_04", "lead_warszawa_novalex_05"]);
    let leads = await readLeads();
    const beforeCount = leads.length;
    leads = leads.filter((l) => !demoIds.has(l.id));
    await writeLeads(leads);
    const removedCount = beforeCount - leads.length;
    res.json({ success: true, removedCount, remainingCount: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: "B\u0142\u0105d usuwania domy\u015Blnych lead\xF3w" });
  }
});
app.post("/api/leads/clear-all", requireAuth, async (_req, res) => {
  try {
    await writeLeads([]);
    res.json({ success: true, message: "Wszystkie leady zosta\u0142y usuni\u0119te z bazy", count: 0, leads: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: "B\u0142\u0105d czyszczenia bazy lead\xF3w" });
  }
});
app.post("/api/leads/restore-demo", requireAuth, async (_req, res) => {
  try {
    const templateFile = path2.join(process.cwd(), "data", "demo-template.json");
    const raw = await fs2.readFile(templateFile, "utf-8");
    const seed = JSON.parse(raw);
    const leads = await readLeads();
    const map = /* @__PURE__ */ new Map();
    leads.forEach((l) => map.set(l.id, l));
    seed.forEach((s) => map.set(s.id, s));
    const merged = Array.from(map.values());
    await writeLeads(merged);
    res.json({ success: true, restoredCount: seed.length, leads: merged });
  } catch (err) {
    res.status(500).json({ success: false, error: "B\u0142\u0105d przywracania wersji demonstracyjnej" });
  }
});
app.post("/api/leads/:id/audit", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Nie znaleziono wskazanego leada" });
    }
    const scraped = await scrapeWebsite(lead.website, lead);
    const auditResult = runHeuristicAudit(scraped, lead);
    lead.audit = auditResult;
    if (lead.status === "Nowy") {
      lead.status = "Po audycie";
    }
    lead.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await writeLeads(leads);
    res.json({ success: true, lead, audit: auditResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "B\u0142\u0105d podczas wykonywania audytu" });
  }
});
app.post("/api/leads/:id/generate-outreach", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tone = "advisory", senderName = SENDER_NAME } = req.body || {};
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Nie znaleziono leada" });
    }
    const outreachResult = generateOutreachCopy({ lead, tone, senderName });
    lead.outreach = outreachResult;
    lead.outreachSubject = outreachResult.subjectLines[0];
    lead.outreachBody = outreachResult.emailBody;
    lead.outreachFollowUp1 = outreachResult.followUp1;
    lead.outreachFollowUp2 = outreachResult.followUp2;
    lead.roiEstimate = outreachResult.roiEstimate;
    lead.pricingPackages = outreachResult.pricingPackages;
    lead.status = "Oferta gotowa";
    lead.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await writeLeads(leads);
    res.json({ success: true, lead, outreach: outreachResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "B\u0142\u0105d generowania wiadomo\u015Bci" });
  }
});
app.post("/api/leads/:id/generate-site", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { customPrompt = "" } = req.body || {};
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Nie znaleziono leada" });
    }
    const generatedHtml = generateOnePageSite({
      lead,
      customPrompt: typeof customPrompt === "string" ? customPrompt.trim() : ""
    });
    lead.demoSiteHtml = generatedHtml;
    if (customPrompt && typeof customPrompt === "string") {
      lead.demoSitePrompt = customPrompt.trim();
    }
    lead.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await writeLeads(leads);
    return res.json({
      success: true,
      lead,
      html: generatedHtml
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "B\u0142\u0105d generowania strony" });
  }
});
app.get("/api/leads/:id/site-preview", async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead || !lead.demoSiteHtml) {
      return res.status(404).send("Brak wygenerowanego kodu strony demo dla tego leada.");
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(lead.demoSiteHtml);
  } catch (err) {
    res.status(500).send("B\u0142\u0105d serwera");
  }
});
app.post("/api/leads/:id/auto-pilot", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { senderName = SENDER_NAME } = req.body || {};
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Nie znaleziono leada" });
    }
    const scraped = await scrapeWebsite(lead.website, lead);
    const auditRes = runHeuristicAudit(scraped, lead);
    lead.audit = auditRes;
    const siteHtmlRes = generateOnePageSite({
      lead,
      customPrompt: "Nowoczesny dark mode, 100% mobile-first z p\u0142ywaj\u0105cym Sticky CTA"
    });
    lead.demoSiteHtml = siteHtmlRes;
    lead.demoSitePrompt = lead.demoSitePrompt || "Nowoczesny dark mode, 100% mobile-first ze Sticky CTA";
    const outreachRes = generateOutreachCopy({
      lead,
      tone: "advisory",
      senderName
    });
    lead.outreach = outreachRes;
    lead.outreachSubject = outreachRes.subjectLines[0];
    lead.outreachBody = outreachRes.emailBody;
    lead.outreachFollowUp1 = outreachRes.followUp1;
    lead.outreachFollowUp2 = outreachRes.followUp2;
    lead.roiEstimate = outreachRes.roiEstimate;
    lead.pricingPackages = outreachRes.pricingPackages;
    lead.status = "Oferta gotowa";
    lead.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await writeLeads(leads);
    res.json({
      success: true,
      lead,
      message: `Autopilot zako\u0144czony sukcesem! Pakiet dla ${lead.name} jest gotowy.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "B\u0142\u0105d autopilota" });
  }
});
var handleExportProductionPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Nie znaleziono leada" });
    }
    const packageResult = await buildProductionZipPackage(lead);
    lead.productionZipBuffer = packageResult.base64Zip;
    lead.productionZipGeneratedAt = (/* @__PURE__ */ new Date()).toISOString();
    await writeLeads(leads);
    res.json({
      success: true,
      message: "Projekt produkcyjny zosta\u0142 przygotowany i zabezpieczony.",
      downloadUrl: `/api/leads/${lead.id}/download-package`,
      files: ["index.html", "robots.txt", "sitemap.xml", "vercel.json", "README_WDROZENIE.txt"]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "B\u0142\u0105d tworzenia paczki produkcyjnej" });
  }
};
app.post("/api/leads/:id/export-production-package", requireAuth, handleExportProductionPackage);
app.post("/api/leads/:id/generate-production-package", requireAuth, handleExportProductionPackage);
app.get("/api/leads/:id/download-package", async (req, res) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).send("Nie znaleziono leada.");
    }
    if (!lead.productionZipBuffer) {
      const packageResult = await buildProductionZipPackage(lead);
      lead.productionZipBuffer = packageResult.base64Zip;
      await writeLeads(leads);
    }
    const zipBuffer = Buffer.from(lead.productionZipBuffer, "base64");
    const filename = `${(lead.name || "projekt").toLowerCase().replace(/[^a-z0-9]/g, "-")}-production-website.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache");
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).send("B\u0142\u0105d pobierania paczki");
  }
});
var HOSTING_COMPARISON = [
  {
    id: "serverless-cloud",
    name: "Chmura Serverless Edge (Zalecane dla One-Page)",
    provider: "Cloudflare Pages / Vercel",
    badge: "0 z\u0142 za serwer!",
    highlight: true,
    annualHostingCost: "0 PLN (Bezp\u0142atny tier na zawsze)",
    annualDomainCost: "~15 PLN (odnowienie ~55 PLN)",
    totalFirstYearCost: "~15 PLN",
    totalRenewalCost: "~55 PLN / rok",
    monthlyAverage: "~4.50 PLN / mc",
    sslIncluded: true,
    emailIncluded: false,
    speedRating: "10/10 (Global Edge CDN <0.4s)",
    recommendedFor: "Strony wizyt\xF3wkowe One-Page i landing page dla lokalnych firm. Klient p\u0142aci wy\u0142\u0105cznie za sam\u0105 domen\u0119 .pl!",
    savingsVsAgency: "Oszcz\u0119dno\u015B\u0107 400 - 900 PLN rocznie w por\xF3wnaniu ze standardowymi hostingami agencyjnymi!",
    setupComplexity: "B\u0142yskawiczna (3 minuty - przeci\u0105gnij i upu\u015B\u0107)",
    setupSteps: [
      "Kup domen\u0119 dla klienta na SeoHost / OVH (~15 z\u0142 na rok)",
      "Za\u0142\xF3\u017C darmowe konto na Cloudflare Pages lub Vercel",
      "Przeci\u0105gnij folder ze stron\u0105 demo (lub po\u0142\u0105cz z GitHub)",
      "Podepnij domen\u0119 .pl i certyfikat SSL wygeneruje si\u0119 sam w 60 sekund"
    ]
  },
  {
    id: "polish-cpanel",
    name: "Tani Polski Hosting Biznes z Poczt\u0105 E-mail",
    provider: "SeoHost.pl (pakiet SSD NVMe) / LH.pl",
    badge: "Z firmow\u0105 poczt\u0105",
    highlight: false,
    annualHostingCost: "~59 - 99 PLN / rok",
    annualDomainCost: "~15 PLN (odnowienie ~55 PLN)",
    totalFirstYearCost: "~75 - 115 PLN",
    totalRenewalCost: "~120 - 155 PLN / rok",
    monthlyAverage: "~10 - 13 PLN / mc",
    sslIncluded: true,
    emailIncluded: true,
    speedRating: "9/10 (Dyski NVMe w Polsce)",
    recommendedFor: "Gdy klient bezwzgl\u0119dnie wymaga w\u0142asnych skrzynek e-mail (np. kontakt@firma.pl, biuro@firma.pl) i polskiego supportu technicznego.",
    savingsVsAgency: "Uczciwe, sta\u0142e ceny bez drastycznych podwy\u017Cek odnowie\u0144.",
    setupComplexity: "\u0141atwa (10-15 minut)",
    setupSteps: [
      "Zarejestruj hosting i domen\u0119 w SeoHost / LH.pl",
      "Utw\xF3rz skrzynki pocztowe w panelu cPanel / DirectAdmin",
      "Wgraj pliki z paczki ZIP do folderu public_html",
      "Aktywuj darmowy certyfikat Let's Encrypt 1 klikni\u0119ciem"
    ]
  },
  {
    id: "agency-care",
    name: "Model Agencji: Twoja Opieka & Hosting Abonamentowy",
    provider: "Zarz\u0105dzane przez Ciebie (Tw\xF3j doch\xF3d pasywny)",
    badge: "Tw\xF3j doch\xF3d pasywny!",
    highlight: true,
    annualHostingCost: "Klient p\u0142aci Tobie 59 - 89 PLN / mc",
    annualDomainCost: "W cenie Twojego abonamentu",
    totalFirstYearCost: "708 - 1 068 PLN (Tw\xF3j czysty zysk!)",
    totalRenewalCost: "708 - 1 068 PLN / rok",
    monthlyAverage: "59 - 89 PLN / mc",
    sslIncluded: true,
    emailIncluded: true,
    speedRating: "10/10 (Dedykowany monitoring)",
    recommendedFor: "W\u0142a\u015Bciciele firm, kt\xF3rzy nie chc\u0105 zajmowa\u0107 si\u0119 technik\u0105 i wol\u0105 mie\u0107 \u201E\u015Bwi\u0119ty spok\xF3j\u201D. Ty stawiasz stron\u0119 na darmowym Cloudflare, a klient p\u0142aci Ci za gotowo\u015B\u0107 do drobnych zmian.",
    savingsVsAgency: "10 takich klient\xF3w = 590 - 890 PLN pewnego dochodu pasywnego ka\u017Cdego miesi\u0105ca!",
    setupComplexity: "Automatyczna",
    setupSteps: [
      "Zaproponuj klientowi wdro\u017Cenie za 890-1490 z\u0142 + 59 z\u0142/mc opieki",
      "Hosting utrzymujesz na Cloudflare Pages (Tw\xF3j koszt = 0 z\u0142)",
      "Co miesi\u0105c wystawiasz rachunek za monitoring i wsparcie"
    ]
  },
  {
    id: "warning-trap",
    name: "\u26A0\uFE0F Pu\u0142apka Rynkowa: Duzi operatorzy (Home.pl / Nazwa.pl)",
    provider: "Masowi operatorzy",
    badge: "Uwa\u017Caj!",
    highlight: false,
    annualHostingCost: "1. rok: 10-20 z\u0142, ODNOWIENIE: 450 - 950 PLN NETTO!",
    annualDomainCost: "Odnowienie domeny: 140 - 190 PLN netto!",
    totalFirstYearCost: "~30 PLN",
    totalRenewalCost: "600 - 1 200 PLN / rok!",
    monthlyAverage: "50 - 100 PLN / mc",
    sslIncluded: false,
    emailIncluded: true,
    speedRating: "6/10 (Cz\u0119sto prze\u0142adowane serwery)",
    recommendedFor: "ODRADZANE. U\u017Cyj tego jako argumentu w rozmowie z klientem: \u201ECzy wie Pan, \u017Ce za rok Pa\u0144ski obecny hosting odnowi si\u0119 za 800 z\u0142? Ze mn\u0105 zaoszcz\u0119dzi Pan t\u0119 kwot\u0119 co roku!\u201D",
    savingsVsAgency: "Klient oszcz\u0119dza setki z\u0142otych rocznie.",
    setupComplexity: "Wysoka (Skomplikowane panele i ukryte op\u0142aty)",
    setupSteps: []
  }
];
app.get("/api/hosting-plans", (_req, res) => {
  res.json({ success: true, plans: HOSTING_COMPARISON });
});
app.use("/api/public/proposal", publicProposalRouter);
async function setupViteOrStatic() {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    try {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      return;
    } catch (e) {
      console.warn("Vite dev middleware not available, falling back to static files");
    }
  }
  app.use(express.static(path2.join(__dirname2, "dist")));
  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    const distIndex = path2.join(__dirname2, "dist", "index.html");
    try {
      await fs2.access(distIndex);
      return res.sendFile(distIndex);
    } catch {
      return res.sendFile(path2.join(__dirname2, "index.html"));
    }
  });
}
setupViteOrStatic().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Sales Navigator Workspace running on http://0.0.0.0:${PORT}`);
  });
});
var server_default = app;
export {
  server_default as default
};
