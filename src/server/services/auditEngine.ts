import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Audit, ScrapedData, Issue, Recommendation } from '../../types/index.ts';

export async function scrapeWebsite(url: string, leadMeta: any = {}): Promise<ScrapedData> {
  let targetUrl = (url || '').trim();
  if (!targetUrl) {
    return buildFallbackScrapedData(leadMeta);
  }
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const result: ScrapedData = {
    title: '',
    metaDescription: '',
    hasSSL: targetUrl.startsWith('https://'),
    hasMobileMeta: false,
    formsCount: 0,
    imagesCount: 0,
    headingsCount: 0,
    ctaButtonsCount: 0,
    headings: [],
    ctaButtons: [],
  };

  try {
    const response = await axios.get(targetUrl, {
      timeout: 4000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SalesNavigatorAuditBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl,en-US;q=0.9,en;q=0.8',
      },
      maxRedirects: 4,
      validateStatus: (status) => status < 500,
    });

    const html = response.data;
    if (typeof html === 'string') {
      const $ = cheerio.load(html);
      $('script, style, noscript, svg, iframe').remove();

      result.title =
        $('title').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        '';
      result.metaDescription =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        '';
      result.hasMobileMeta = $('meta[name="viewport"]').length > 0;
      result.formsCount = $('form').length;
      result.imagesCount = $('img').length;

      const h1s = $('h1')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
      const h2s = $('h2')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean)
        .slice(0, 5);
      result.headings = [...h1s, ...h2s];
      result.headingsCount = result.headings.length;

      const buttons = $(
        'a[href^="tel:"], a[href*="kontakt"], a[href*="rezerw"], a[href*="cennik"], button, a.btn, .button'
      )
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t.length > 2 && t.length < 50)
        .slice(0, 8);
      result.ctaButtons = buttons;
      result.ctaButtonsCount = buttons.length;
    }
  } catch (err: any) {
    return buildFallbackScrapedData(leadMeta);
  }

  return result;
}

function buildFallbackScrapedData(leadMeta: any = {}): ScrapedData {
  return {
    title: `${leadMeta.name || 'Firma'} — ${leadMeta.industry || 'Usługi'} ${leadMeta.city || ''}`,
    metaDescription: `Strona firmy ${leadMeta.name || ''} z branży ${leadMeta.industry || ''} w miejscowości ${leadMeta.city || ''}.`,
    hasSSL: (leadMeta.website || '').startsWith('https://'),
    hasMobileMeta: false,
    formsCount: 0,
    imagesCount: 3,
    headingsCount: 2,
    ctaButtonsCount: 1,
    headings: [`Witamy na stronie ${leadMeta.name || ''}`, 'Nasza oferta'],
    ctaButtons: ['Kontakt'],
  };
}

export function runHeuristicAudit(scraped: ScrapedData, lead: any = {}): Audit {
  const companyName = lead.name || 'Firma';
  const city = lead.city || 'regionie';
  const industry = (lead.industry || 'usług').toLowerCase();

  // 1. Scoring heuristics (0 - 100)
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

  // 2. Concrete issues extraction
  const issues: Issue[] = [];

  if (!scraped.hasSSL) {
    issues.push({
      title: 'Brak aktywnego certyfikatu SSL / Protokół HTTP',
      severity: 'Wysoka',
      impact:
        'Nowoczesne przeglądarki oznaczają stronę jako „Niezabezpieczona”, co natychmiast płoszy potencjalnych klientów i obniża pozycję w wyszukiwarce Google.',
    });
  }

  if (!hasTel || scraped.ctaButtonsCount < 2) {
    issues.push({
      title: 'Brak pływającego przycisku szybkiego kontaktu (Click-to-Call) na telefonach',
      severity: 'Wysoka',
      impact:
        'Użytkownicy smartfonów (ponad 75% ruchu lokalnego) muszą ręcznie przepisywać numer telefonu. Większość z nich natychmiast rezygnuje i wraca do Google.',
    });
  }

  if (!scraped.hasMobileMeta) {
    issues.push({
      title: 'Brak pełnej responsywności mobilnej (Viewport Meta Tag)',
      severity: 'Wysoka',
      impact:
        'Strona wyświetla się w pomniejszonym widoku pulpitu, co zmusza użytkowników do niewygodnego powiększania tekstu i zniechęca do zapoznania się z ofertą.',
    });
  }

  if (scraped.formsCount === 0) {
    issues.push({
      title: 'Brak interaktywnego formularza 15-minutowej wyceny / zapytania',
      severity: 'Średnia',
      impact:
        'Klienci przeglądający ofertę poza godzinami pracy biura nie mają możliwości pozostawienia szybkiego kontaktu do oddzwonienia.',
    });
  }

  if (!scraped.metaDescription || scraped.metaDescription.length < 50) {
    issues.push({
      title: 'Niezoptymalizowany opis meta description i brak OpenGraph dla social media',
      severity: 'Średnia',
      impact:
        'W wynikach wyszukiwania Google oraz przy przesyłaniu linku w komunikatorach nie wyświetla się profesjonalna wizytówka zachęcająca do kliknięcia.',
    });
  }

  // Ensure 3 distinct issues always exist
  if (issues.length < 3) {
    issues.push({
      title: 'Brak sekcji dowodu społecznego i zweryfikowanych opinii z gwiazdkami Google',
      severity: 'Średnia',
      impact:
        'Nowi klienci z okolicy szukają potwierdzenia jakości. Brak wyeksponowanych recenzji wydłuża proces decyzyjny i obniża konwersję.',
    });
  }

  // 3. Missing elements
  const missingElements: string[] = [
    'Pływający pasek Click-to-Call na dolnej krawędzi smartfona',
    'Interaktywny formularz szybkiej rezerwacji terminu / prośby o wycenę',
    'Sekcja Social Proof z recenzjami klientów i oceną Google Maps',
    'Strukturalne dane Schema.org (LocalBusiness) wspomagające pozycjonowanie w Google',
    'Kompletny baner zgód RODO / cookies zgodny z polskimi przepisami',
  ];

  // 4. Recommendations
  const recommendations: Recommendation[] = [
    {
      title: 'Wdrożenie nowoczesnego serwisu One-Page w architekturze Tailwind CSS',
      details:
        'Przebudowa witryny na lekki kod statyczny eliminujący błędy CMS i ładujący się poniżej 0.4s na każdym urządzeniu.',
      expectedResult: 'Zmniejszenie współczynnika odrzuceń (Bounce Rate) na smartfonach o min. 40%.',
    },
    {
      title: 'Wdrożenie pływającego modułu Sticky CTA i bezpośredniego połączenia telefonicznego',
      details:
        'Stały przycisk kontaktu w zasięgu kciuka na ekranach telefonów oraz 1-klikowy formularz kontaktowy.',
      expectedResult: 'Wzrost liczby bezpośrednich telefonów i zapytań o ofertę o min. 35-50%.',
    },
    {
      title: 'Migracja na bezpłatną infrastrukturę chmurową (Serverless Edge)',
      details:
        'Uruchomienie strony na globalnej sieci CDN z automatycznym certyfikatem SSL HTTPS i 0 zł miesięcznych opłat za serwer.',
      expectedResult: 'Oszczędność 600 – 900 zł rocznie względem tradycyjnych hostingów agencyjnych.',
    },
  ];

  const executiveSummary = `Analiza techniczna kodu witryny ${companyName} wykazała ocenę ${weightedScore}/100. Kluczowe wąskie gardła konwersji dotyczą braku optymalizacji pod smartfony oraz braku bezpośredniego wezwania do kontaktu (CTA), co powoduje odpływ potencjalnych klientów z miejscowości ${city} bezpośrednio do konkurencji.`;

  return {
    score: weightedScore,
    analyzedAt: new Date().toISOString(),
    metrics: {
      design,
      seo,
      conversion,
      speed,
    },
    executiveSummary,
    issues: issues.slice(0, 3),
    missingElements,
    recommendations,
    scrapedData: scraped,
  };
}
