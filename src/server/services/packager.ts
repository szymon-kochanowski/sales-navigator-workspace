import JSZip from 'jszip';
import { generateOnePageSite } from './siteGenerator';

export interface ProductionPackageResult {
  zipBuffer: Buffer;
  base64Zip: string;
  fileName: string;
  hardenedHtml: string;
}

const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src 'self' https:;" />`;

export function hardenHtmlForProduction(rawHtml: string, lead: any): string {
  let html = rawHtml;
  if (!html.includes('Content-Security-Policy')) {
    html = html.replace('<head>', `<head>\n  ${CSP_META_TAG}`);
  }
  return html;
}

export async function buildProductionZipPackage(
  lead: any
): Promise<ProductionPackageResult> {
  const rawHtml =
    lead.demoSiteHtml && lead.demoSiteHtml.length > 500
      ? lead.demoSiteHtml
      : generateOnePageSite({
          lead,
          customPrompt: lead.demoSitePrompt || '',
        });

  const hardenedHtml = hardenHtmlForProduction(rawHtml, lead);
  const domainUrl =
    lead.website && lead.website.startsWith('http')
      ? lead.website
      : `https://${(lead.website || 'twojadomena.pl').replace(/^https?:\/\//, '')}`;
  const todayIso = new Date().toISOString().slice(0, 10);

  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${domainUrl.replace(/\/$/, '')}/sitemap.xml\n`;

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domainUrl.replace(/\/$/, '')}/</loc>
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
          source: '/(.*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          ],
        },
      ],
    },
    null,
    2
  );

  const readmeTxt = `====================================================================
PACZKA PRODUKCYJNA STRONY ONE-PAGE — ${lead.name}
Wygenerowano przez: Sales Navigator Workspace
Autor: Szymon Kochanowski
Data: ${todayIso}
====================================================================

ZAWARTOŚĆ PACZKI:
1. index.html - Zoptymalizowana strona One-Page (Tailwind CSS + Schema.org LocalBusiness + CSP + Honeypot)
2. robots.txt - Reguły indeksowania dla robotów Google
3. sitemap.xml - Mapa witryny XML do Google Search Console
4. vercel.json - Konfiguracja wdrożenia 1-klik na platformie Vercel

INSTRUKCJA WDROŻENIA (0 ZŁ / MC W CHMURZE):
Opcja A (Cloudflare Pages):
- Wejdź na dash.cloudflare.com -> Workers & Pages -> Create -> Pages -> Upload assets
- Przeciągnij ten plik ZIP i podepnij domenę klienta. Certyfikat SSL wygeneruje się automatycznie.

Opcja B (Vercel / GitHub):
- Połącz repozytorium z plikami lub wgraj przez Vercel CLI: vercel --prod

Opcja C (Tradycyjny hosting cPanel / DirectAdmin np. SeoHost):
- Wgraj zawartość paczki (index.html, robots.txt, sitemap.xml) do katalogu public_html.
`;

  const zip = new JSZip();
  zip.file('index.html', hardenedHtml);
  zip.file('robots.txt', robotsTxt);
  zip.file('sitemap.xml', sitemapXml);
  zip.file('vercel.json', vercelJson);
  zip.file('README_WDROZENIE.txt', readmeTxt);

  const zipBuffer = (await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })) as Buffer;

  const slug = (lead.name || 'projekt')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    zipBuffer,
    base64Zip: zipBuffer.toString('base64'),
    fileName: `${slug || 'strona'}-production-package.zip`,
    hardenedHtml,
  };
}
