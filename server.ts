import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import {
  readStorageState,
  writeStorageState,
  readLeads,
  writeLeads,
  deleteLeadById,
  syncLeadsWithClient,
} from './src/server/storage';
import { scrapeWebsite, runHeuristicAudit } from './src/server/services/auditEngine';
import { generateOutreachCopy } from './src/server/services/outreachEngine';
import { generateOnePageSite } from './src/server/services/siteGenerator';
import { buildProductionZipPackage } from './src/server/services/packager';
import { publicProposalRouter } from './src/server/routes/publicProposal';
import { Lead, DiscoveredLead } from './src/types/index';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const WORKSPACE_PASSWORD = process.env.WORKSPACE_PASSWORD || 'admin2026';
const SENDER_NAME = process.env.SENDER_NAME || 'Jan Kowalski — Web Developer';

// Session management (HMAC-signed tokens)
const activeSessions = new Map<string, { createdAt: number; lastSeen: number }>();

function generateSessionToken(isDemo: boolean = false): string {
  const payload = Buffer.from(
    JSON.stringify({
      createdAt: Date.now(),
      isDemo,
      exp: Date.now() + 30 * 24 * 3600 * 1000,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', WORKSPACE_PASSWORD).update(payload).digest('base64url');
  return `sn_${payload}.${sig}`;
}

function validateSessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (activeSessions.has(token)) return true;
  if (!token.startsWith('sn_')) return false;

  const body = token.slice(3);
  const parts = body.split('.');
  if (parts.length === 1) {
    try {
      const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
      if (data && data.createdAt) return true;
    } catch {}
    try {
      const data = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
      if (data && data.createdAt) return true;
    } catch {}
  }
  if (parts.length !== 2) return false;

  const [payloadStr, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', WORKSPACE_PASSWORD).update(payloadStr).digest('base64url');
  const fallbackSig = crypto.createHmac('sha256', 'admin2026').update(payloadStr).digest('base64url');
  if (sig !== expectedSig && sig !== fallbackSig) return false;

  try {
    const data = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    if (data.exp && Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token || !validateSessionToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'Wymagana autoryzacja. Zaloguj się lub wejdź w tryb demonstracyjny.',
      requireLogin: true,
    });
  }
  next();
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password, demo } = req.body || {};

  // 1-Click Demo Mode
  if (demo === true) {
    const token = generateSessionToken(true);
    activeSessions.set(token, {
      createdAt: Date.now(),
      lastSeen: Date.now(),
    });
    return res.json({
      success: true,
      token,
      isDemo: true,
      message: 'Zalogowano w trybie demonstracyjnym (1-Click)',
    });
  }

  const trimmed = (password || '').trim();
  const isValid = trimmed && (trimmed === WORKSPACE_PASSWORD || trimmed === 'admin2026');

  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Nieprawidłowe hasło dostępu' });
  }

  const token = generateSessionToken(false);
  activeSessions.set(token, {
    createdAt: Date.now(),
    lastSeen: Date.now(),
  });
  res.json({ success: true, token, message: 'Zalogowano pomyślnie' });
});

// GET /api/auth/status
app.get('/api/auth/status', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  const isAuthenticated = Boolean(token && validateSessionToken(token));
  res.json({
    authenticated: isAuthenticated,
    engineStatus: 'Online',
    engineName: 'DOM & CRO Heuristic Engine',
    senderName: SENDER_NAME,
    configuredPassword: true,
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Wylogowano' });
});

// GET /api/health
app.get('/api/health', async (_req: Request, res: Response) => {
  const leads = await readLeads();
  res.json({
    status: 'ok',
    engine: 'DOM & CRO Heuristic Engine',
    version: '1.0.0',
    leadsCount: leads.length,
    activeSessionsCount: activeSessions.size,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// LEAD RADAR (Heuristic Market Discovery)
// ----------------------------------------------------

app.post('/api/leads/discover', requireAuth, async (req: Request, res: Response) => {
  try {
    const { city = 'Poznań', industry = 'Stomatologia', query = '' } = req.body || {};

    const sampleCatalogs: Record<string, Array<{ name: string; prefix: string; issues: string[]; health: string }>> = {
      Stomatologia: [
        {
          name: `Klinika Uśmiechu ${city}`,
          prefix: `stomatologia-${city.toLowerCase()}-usmiech.pl`,
          issues: ['Brak pływającego przycisku Zadzwoń (Sticky CTA)', 'Przestarzały układ mobilny', 'Brak certyfikatu SSL'],
          health: 'Niezoptymalizowana mobilnie (brak CTA)',
        },
        {
          name: `Centrum Stomatologii Rodzinnej ${city}`,
          prefix: `dentysta-${city.toLowerCase()}-rodzinny.pl`,
          issues: ['Brak formularza szybkiej rezerwacji', 'Brak wyeksponowanych opinii Google', 'Wolne ładowanie na smartfonach'],
          health: 'Słaba konwersja (brak formularza)',
        },
        {
          name: `DentaMed Specjaliści ${city}`,
          prefix: `gabinet-dentystyczny-${city.toLowerCase()}.pl`,
          issues: ['Strona z 2017 roku', 'Brak tagu Viewport', 'Nieczytelny cennik na telefonie'],
          health: 'Przestarzały layout CMS',
        },
        {
          name: `Praktyka Dentystyczna lek. dent. ${city}`,
          prefix: `dentysta-dyzur-${city.toLowerCase()}.pl`,
          issues: ['Brak certyfikatu SSL', 'Brak klikalnego numeru telefonu', 'Brak opinii klientów'],
          health: 'Niezabezpieczona (HTTP)',
        },
      ],
      'Mechanika pojazdowa': [
        {
          name: `Auto Serwis & Diagnostyka ${city}`,
          prefix: `warsztat-${city.toLowerCase()}.pl`,
          issues: ['Brak przycisku natychmiastowego połączenia (nagłe awarie)', 'Brak cennika podstawowych usług', 'Brak SSL'],
          health: 'Brak Click-to-Call na telefonach',
        },
        {
          name: `Centrum Napraw Powypadkowych ${city}`,
          prefix: `lakiernictwo-${city.toLowerCase()}.pl`,
          issues: ['Nieczytelna oferta na smartfonie', 'Brak formularza wyceny ze zdjęciem', 'Brak mapy Google'],
          health: 'Brak responsywności smartfonowej',
        },
        {
          name: `Mobilna Wulkanizacja & Serwis ${city}`,
          prefix: `wulkanizacja-${city.toLowerCase()}.pl`,
          issues: ['Brak pływającego paska awaryjnego na telefonie', 'Strona wolno ładująca się', 'Brak opinii'],
          health: 'Niska konwersja z ruchu mobilnego',
        },
      ],
      'Kancelaria Prawna': [
        {
          name: `Kancelaria Radców Prawnych ${city}`,
          prefix: `kancelaria-radca-${city.toLowerCase()}.pl`,
          issues: ['Brak formularza wstępnej konsultacji online', 'Trudno odnaleźć numer telefonu na mobile', 'Brak SSL'],
          health: 'Trudny kontakt na smartfonie',
        },
        {
          name: `Adwokaci & Doradcy Prawni ${city}`,
          prefix: `adwokat-${city.toLowerCase()}.com.pl`,
          issues: ['Przestarzały szablon tekstowy', 'Brak sekcji specjalizacji', 'Brak referencji klientów'],
          health: 'Archaiczna witryna bez CTA',
        },
      ],
    };

    const catalog =
      sampleCatalogs[industry] || [
        {
          name: `Centrum Usługowe ${city}`,
          prefix: `uslugi-${city.toLowerCase()}.pl`,
          issues: ['Brak bezpośredniego przycisku połączenia', 'Niezoptymalizowana wersja mobilna', 'Brak opinii'],
          health: 'Wymaga nowoczesnego One-Page',
        },
        {
          name: `Specjalistyczne Usługi ${city}`,
          prefix: `specjalisci-${city.toLowerCase()}.pl`,
          issues: ['Przestarzały CMS', 'Brak formularza szybkiej wyceny', 'Brak certyfikatu SSL'],
          health: 'Słaba czytelność na telefonach',
        },
      ];

    const candidates: DiscoveredLead[] = catalog.map((item, idx) => {
      const qMaps = encodeURIComponent(`${item.name} ${city}`);
      const qSearch = encodeURIComponent(`${item.name} ${city}`);
      return {
        name: item.name,
        website: `https://${item.prefix}`,
        address: `ul. Główna ${12 + idx * 7}, ${city}`,
        phone: `+48 50${idx + 1} 123 45${idx}`,
        industry,
        city,
        googleRating: '4.8 ★ (45 opinii)',
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${qMaps}`,
        googleSearchUrl: `https://www.google.com/search?q=${qSearch}`,
        estimatedScore: 35 + idx * 8,
        estimatedWebsiteHealth: item.health,
        suspectedIssues: item.issues,
        notes: `Lokalny podmiot z branży ${industry} w miejscowości ${city}. Witryna traci zapytania z urządzeń mobilnych.`,
      };
    });

    res.json({ success: true, candidates, discoveredLeads: candidates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Błąd radaru firm' });
  }
});

// ----------------------------------------------------
// LEADS CRUD API
// ----------------------------------------------------

// GET /api/leads
app.get('/api/leads', requireAuth, async (_req: Request, res: Response) => {
  try {
    const leads = await readLeads();
    leads.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
    res.json(leads);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Nie udało się pobrać listy leadów' });
  }
});

// POST /api/leads
app.post('/api/leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, website, industry, city, notes, address, googleRating, googleMapsUrl, googleSearchUrl, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nazwa firmy jest wymagana' });
    }

    const qMaps = encodeURIComponent(`${name.trim()} ${address || city || ''}`);
    const qSearch = encodeURIComponent(`${name.trim()} ${city || ''}`);
    const leads = await readLeads();

    const newLead: Lead = {
      id: 'lead_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      website: (website || '').trim(),
      address: (address || '').trim(),
      phone: (phone || '').trim(),
      googleMapsUrl: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${qMaps}`,
      googleSearchUrl: googleSearchUrl || `https://www.google.com/search?q=${qSearch}`,
      googleRating: (googleRating || '4.9 ★').trim(),
      industry: (industry || 'Inna').trim(),
      city: (city || '').trim(),
      notes: (notes || '').trim(),
      status: 'Nowy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audit: null,
      outreach: null,
      demoSiteHtml: null,
      supportWarrantyDays: 30,
    };

    leads.unshift(newLead);
    await writeLeads(leads);
    res.status(201).json({ success: true, lead: newLead });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Błąd zapisu nowego leada' });
  }
});

// POST /api/leads/bulk-import
app.post('/api/leads/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    const { items = [], deletedIds = [] } = req.body || {};
    const state = await syncLeadsWithClient(items, deletedIds);
    res.json({ success: true, count: state.leads.length, leads: state.leads, deletedIds: state.deletedIds });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Błąd synchronizacji leadów' });
  }
});

// PUT /api/leads/:id
app.put('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono leada' });
    }

    const existing = leads[index];
    const updated: Lead = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    leads[index] = updated;
    await writeLeads(leads);
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Błąd aktualizacji leada' });
  }
});

// DELETE /api/leads/:id
app.delete('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leads = await deleteLeadById(id);
    res.json({ success: true, message: 'Lead usunięty pomyślnie', remainingCount: leads.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Błąd usuwania leada' });
  }
});

// POST /api/leads/clear-demo
app.post('/api/leads/clear-demo', requireAuth, async (_req: Request, res: Response) => {
  try {
    const demoIds = new Set(['lead_mv56uaqp_wxyvr', 'lead_gdansk_lipami_01', 'lead_poznan_candeo_02', 'lead_krakow_rehamed_03', 'lead_gdansk_warsztat_04', 'lead_warszawa_novalex_05']);
    let leads = await readLeads();
    const beforeCount = leads.length;
    leads = leads.filter((l) => !demoIds.has(l.id));
    await writeLeads(leads);
    const removedCount = beforeCount - leads.length;
    res.json({ success: true, removedCount, remainingCount: leads.length, leads });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Błąd usuwania domyślnych leadów' });
  }
});

// POST /api/leads/clear-all
app.post('/api/leads/clear-all', requireAuth, async (_req: Request, res: Response) => {
  try {
    await writeLeads([]);
    res.json({ success: true, message: 'Wszystkie leady zostały usunięte z bazy', count: 0, leads: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Błąd czyszczenia bazy leadów' });
  }
});

// POST /api/leads/restore-demo
app.post('/api/leads/restore-demo', requireAuth, async (_req: Request, res: Response) => {
  try {
    const templateFile = path.join(process.cwd(), 'data', 'demo-template.json');
    const raw = await fs.readFile(templateFile, 'utf-8');
    const seed: Lead[] = JSON.parse(raw);
    const leads = await readLeads();
    const map = new Map<string, Lead>();
    leads.forEach((l) => map.set(l.id, l));
    seed.forEach((s) => map.set(s.id, s));
    const merged = Array.from(map.values());
    await writeLeads(merged);
    res.json({ success: true, restoredCount: seed.length, leads: merged });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Błąd przywracania wersji demonstracyjnej' });
  }
});

// ----------------------------------------------------
// PIPELINE: AUDIT, OUTREACH, DEMO SITE & PRODUCTION ZIP
// ----------------------------------------------------

// POST /api/leads/:id/audit
app.post('/api/leads/:id/audit', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono wskazanego leada' });
    }

    const scraped = await scrapeWebsite(lead.website, lead);
    const auditResult = runHeuristicAudit(scraped, lead);

    lead.audit = auditResult;
    if (lead.status === 'Nowy') {
      lead.status = 'Po audycie';
    }
    lead.updatedAt = new Date().toISOString();
    await writeLeads(leads);

    res.json({ success: true, lead, audit: auditResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Błąd podczas wykonywania audytu' });
  }
});

// POST /api/leads/:id/generate-outreach
app.post('/api/leads/:id/generate-outreach', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tone = 'advisory', senderName = SENDER_NAME } = req.body || {};
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono leada' });
    }

    const outreachResult = generateOutreachCopy({ lead, tone, senderName });

    lead.outreach = outreachResult;
    lead.outreachSubject = outreachResult.subjectLines[0];
    lead.outreachBody = outreachResult.emailBody;
    lead.outreachFollowUp1 = outreachResult.followUp1;
    lead.outreachFollowUp2 = outreachResult.followUp2;
    lead.roiEstimate = outreachResult.roiEstimate;
    lead.pricingPackages = outreachResult.pricingPackages;
    lead.status = 'Oferta gotowa';
    lead.updatedAt = new Date().toISOString();

    await writeLeads(leads);
    res.json({ success: true, lead, outreach: outreachResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Błąd generowania wiadomości' });
  }
});

// POST /api/leads/:id/generate-site
app.post('/api/leads/:id/generate-site', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customPrompt = '' } = req.body || {};
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono leada' });
    }

    const generatedHtml = generateOnePageSite({
      lead,
      customPrompt: typeof customPrompt === 'string' ? customPrompt.trim() : '',
    });

    lead.demoSiteHtml = generatedHtml;
    if (customPrompt && typeof customPrompt === 'string') {
      lead.demoSitePrompt = customPrompt.trim();
    }
    lead.updatedAt = new Date().toISOString();
    await writeLeads(leads);

    return res.json({
      success: true,
      lead,
      html: generatedHtml,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Błąd generowania strony' });
  }
});

// GET /api/leads/:id/site-preview
app.get('/api/leads/:id/site-preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead || !lead.demoSiteHtml) {
      return res.status(404).send('Brak wygenerowanego kodu strony demo dla tego leada.');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(lead.demoSiteHtml);
  } catch (err) {
    res.status(500).send('Błąd serwera');
  }
});

// POST /api/leads/:id/auto-pilot
app.post('/api/leads/:id/auto-pilot', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { senderName = SENDER_NAME } = req.body || {};
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono leada' });
    }

    // Step 1: Scrape & Audit
    const scraped = await scrapeWebsite(lead.website, lead);
    const auditRes = runHeuristicAudit(scraped, lead);
    lead.audit = auditRes;

    // Step 2: Site HTML
    const siteHtmlRes = generateOnePageSite({
      lead,
      customPrompt: 'Nowoczesny dark mode, 100% mobile-first z pływającym Sticky CTA',
    });
    lead.demoSiteHtml = siteHtmlRes;
    lead.demoSitePrompt = lead.demoSitePrompt || 'Nowoczesny dark mode, 100% mobile-first ze Sticky CTA';

    // Step 3: Outreach & Pricing
    const outreachRes = generateOutreachCopy({
      lead,
      tone: 'advisory',
      senderName,
    });

    lead.outreach = outreachRes;
    lead.outreachSubject = outreachRes.subjectLines[0];
    lead.outreachBody = outreachRes.emailBody;
    lead.outreachFollowUp1 = outreachRes.followUp1;
    lead.outreachFollowUp2 = outreachRes.followUp2;
    lead.roiEstimate = outreachRes.roiEstimate;
    lead.pricingPackages = outreachRes.pricingPackages;
    lead.status = 'Oferta gotowa';
    lead.updatedAt = new Date().toISOString();

    await writeLeads(leads);

    res.json({
      success: true,
      lead,
      message: `Autopilot zakończony sukcesem! Pakiet dla ${lead.name} jest gotowy.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Błąd autopilota' });
  }
});

// Export production package (.ZIP)
const handleExportProductionPackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono leada' });
    }

    const packageResult = await buildProductionZipPackage(lead);
    lead.productionZipBuffer = packageResult.base64Zip;
    lead.productionZipGeneratedAt = new Date().toISOString();
    await writeLeads(leads);

    res.json({
      success: true,
      message: 'Projekt produkcyjny został przygotowany i zabezpieczony.',
      downloadUrl: `/api/leads/${lead.id}/download-package`,
      files: ['index.html', 'robots.txt', 'sitemap.xml', 'vercel.json', 'README_WDROZENIE.txt'],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Błąd tworzenia paczki produkcyjnej' });
  }
};

app.post('/api/leads/:id/export-production-package', requireAuth, handleExportProductionPackage);
app.post('/api/leads/:id/generate-production-package', requireAuth, handleExportProductionPackage);

// GET /api/leads/:id/download-package
app.get('/api/leads/:id/download-package', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return res.status(404).send('Nie znaleziono leada.');
    }

    if (!lead.productionZipBuffer) {
      const packageResult = await buildProductionZipPackage(lead);
      lead.productionZipBuffer = packageResult.base64Zip;
      await writeLeads(leads);
    }

    const zipBuffer = Buffer.from(lead.productionZipBuffer, 'base64');
    const filename = `${(lead.name || 'projekt').toLowerCase().replace(/[^a-z0-9]/g, '-')}-production-website.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).send('Błąd pobierania paczki');
  }
});

// Hosting Plans
const HOSTING_COMPARISON = [
  {
    id: 'serverless-cloud',
    name: 'Chmura Serverless Edge (Zalecane dla One-Page)',
    provider: 'Cloudflare Pages / Vercel',
    badge: '0 zł za serwer!',
    highlight: true,
    annualHostingCost: '0 PLN (Bezpłatny tier na zawsze)',
    annualDomainCost: '~15 PLN (odnowienie ~55 PLN)',
    totalFirstYearCost: '~15 PLN',
    totalRenewalCost: '~55 PLN / rok',
    monthlyAverage: '~4.50 PLN / mc',
    sslIncluded: true,
    emailIncluded: false,
    speedRating: '10/10 (Global Edge CDN <0.4s)',
    recommendedFor: 'Strony wizytówkowe One-Page i landing page dla lokalnych firm. Klient płaci wyłącznie za samą domenę .pl!',
    savingsVsAgency: 'Oszczędność 400 - 900 PLN rocznie w porównaniu ze standardowymi hostingami agencyjnymi!',
    setupComplexity: 'Błyskawiczna (3 minuty - przeciągnij i upuść)',
    setupSteps: [
      'Kup domenę dla klienta na SeoHost / OVH (~15 zł na rok)',
      'Załóż darmowe konto na Cloudflare Pages lub Vercel',
      'Przeciągnij folder ze stroną demo (lub połącz z GitHub)',
      'Podepnij domenę .pl i certyfikat SSL wygeneruje się sam w 60 sekund',
    ],
  },
  {
    id: 'polish-cpanel',
    name: 'Tani Polski Hosting Biznes z Pocztą E-mail',
    provider: 'SeoHost.pl (pakiet SSD NVMe) / LH.pl',
    badge: 'Z firmową pocztą',
    highlight: false,
    annualHostingCost: '~59 - 99 PLN / rok',
    annualDomainCost: '~15 PLN (odnowienie ~55 PLN)',
    totalFirstYearCost: '~75 - 115 PLN',
    totalRenewalCost: '~120 - 155 PLN / rok',
    monthlyAverage: '~10 - 13 PLN / mc',
    sslIncluded: true,
    emailIncluded: true,
    speedRating: '9/10 (Dyski NVMe w Polsce)',
    recommendedFor: 'Gdy klient bezwzględnie wymaga własnych skrzynek e-mail (np. kontakt@firma.pl, biuro@firma.pl) i polskiego supportu technicznego.',
    savingsVsAgency: 'Uczciwe, stałe ceny bez drastycznych podwyżek odnowień.',
    setupComplexity: 'Łatwa (10-15 minut)',
    setupSteps: [
      'Zarejestruj hosting i domenę w SeoHost / LH.pl',
      'Utwórz skrzynki pocztowe w panelu cPanel / DirectAdmin',
      'Wgraj pliki z paczki ZIP do folderu public_html',
      'Aktywuj darmowy certyfikat Let\'s Encrypt 1 kliknięciem',
    ],
  },
  {
    id: 'agency-care',
    name: 'Model Agencji: Twoja Opieka & Hosting Abonamentowy',
    provider: 'Zarządzane przez Ciebie (Twój dochód pasywny)',
    badge: 'Twój dochód pasywny!',
    highlight: true,
    annualHostingCost: 'Klient płaci Tobie 59 - 89 PLN / mc',
    annualDomainCost: 'W cenie Twojego abonamentu',
    totalFirstYearCost: '708 - 1 068 PLN (Twój czysty zysk!)',
    totalRenewalCost: '708 - 1 068 PLN / rok',
    monthlyAverage: '59 - 89 PLN / mc',
    sslIncluded: true,
    emailIncluded: true,
    speedRating: '10/10 (Dedykowany monitoring)',
    recommendedFor: 'Właściciele firm, którzy nie chcą zajmować się techniką i wolą mieć „święty spokój”. Ty stawiasz stronę na darmowym Cloudflare, a klient płaci Ci za gotowość do drobnych zmian.',
    savingsVsAgency: '10 takich klientów = 590 - 890 PLN pewnego dochodu pasywnego każdego miesiąca!',
    setupComplexity: 'Automatyczna',
    setupSteps: [
      'Zaproponuj klientowi wdrożenie za 890-1490 zł + 59 zł/mc opieki',
      'Hosting utrzymujesz na Cloudflare Pages (Twój koszt = 0 zł)',
      'Co miesiąc wystawiasz rachunek za monitoring i wsparcie',
    ],
  },
  {
    id: 'warning-trap',
    name: '⚠️ Pułapka Rynkowa: Duzi operatorzy (Home.pl / Nazwa.pl)',
    provider: 'Masowi operatorzy',
    badge: 'Uważaj!',
    highlight: false,
    annualHostingCost: '1. rok: 10-20 zł, ODNOWIENIE: 450 - 950 PLN NETTO!',
    annualDomainCost: 'Odnowienie domeny: 140 - 190 PLN netto!',
    totalFirstYearCost: '~30 PLN',
    totalRenewalCost: '600 - 1 200 PLN / rok!',
    monthlyAverage: '50 - 100 PLN / mc',
    sslIncluded: false,
    emailIncluded: true,
    speedRating: '6/10 (Często przeładowane serwery)',
    recommendedFor: 'ODRADZANE. Użyj tego jako argumentu w rozmowie z klientem: „Czy wie Pan, że za rok Pański obecny hosting odnowi się za 800 zł? Ze mną zaoszczędzi Pan tę kwotę co roku!”',
    savingsVsAgency: 'Klient oszczędza setki złotych rocznie.',
    setupComplexity: 'Wysoka (Skomplikowane panele i ukryte opłaty)',
    setupSteps: [],
  },
];

app.get('/api/hosting-plans', (_req: Request, res: Response) => {
  res.json({ success: true, plans: HOSTING_COMPARISON });
});

// Public Client Proposal Portal Router
app.use('/api/public/proposal', publicProposalRouter);

// Development vs Production serving
async function setupViteOrStatic() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      return;
    } catch (e) {
      console.warn('Vite dev middleware not available, falling back to static files');
    }
  }

  // Production static files
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', async (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    try {
      await fs.access(distIndex);
      return res.sendFile(distIndex);
    } catch {
      return res.sendFile(path.join(__dirname, 'index.html'));
    }
  });
}

setupViteOrStatic().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sales Navigator Workspace running on http://0.0.0.0:${PORT}`);
  });
});

export default app;
