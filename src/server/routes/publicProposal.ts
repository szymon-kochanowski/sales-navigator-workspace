import { Router, Request, Response } from 'express';
import { readLeads, writeLeads } from '../storage';
import { generateOnePageSite } from '../services/siteGenerator';

export const publicProposalRouter = Router();

function buildDefaultPricingPackages(lead: any) {
  return (
    lead.pricingPackages || {
      start: {
        name: 'Pakiet Start (Wizytówka One-Page)',
        price: '890 PLN',
        features: [
          'Nowoczesna strona One-Page w Tailwind CSS',
          'Pełna responsywność na smartfony i tablety',
          'Darmowy hosting chmurowy (0 zł / mc)',
          'Wdrożenie w 48h z certyfikatem SSL',
        ],
      },
      business: {
        name: 'Pakiet Standard (Bestseller)',
        price: '1 490 PLN',
        features: [
          'Wszystko z Pakietu Start',
          'Pływający przycisk połączenia (Click-to-Call)',
          'Formularz kontaktowy z ochroną antyspamową',
          'Sekcja opinii z Google Maps + Schema.org SEO',
          'Optymalizacja szybkości ładowania (< 0.5s)',
        ],
      },
      vip: {
        name: 'Pakiet Kompleksowy VIP + Opieka',
        price: '2 190 PLN',
        features: [
          'Wszystko z Pakietu Standard',
          'Autorski copywriting sprzedażowy H1-H3',
          'Optymalizacja wizytówki Google Maps',
          'Pakiet zgodności z RODO i baner cookies',
          `${lead.supportWarrantyDays || 30} dni gwarancji wsparcia technicznego`,
        ],
      },
    }
  );
}

// GET /api/public/proposal/:id
publicProposalRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leads = await readLeads();
    const lead = leads.find((l) => l && l.id === id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Nie znaleziono dedykowanej prezentacji o podanym identyfikatorze.',
      });
    }

    if (!lead.demoSiteHtml || lead.demoSiteHtml.length < 300) {
      lead.demoSiteHtml = generateOnePageSite({ lead });
      lead.updatedAt = new Date().toISOString();
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
        city: lead.city || 'Polska',
        industry: lead.industry || 'Usługi lokalne',
        status: lead.status,
        supportWarrantyDays: lead.supportWarrantyDays ?? 30,
        audit: lead.audit || {
          score: 44,
          metrics: { design: 45, conversion: 40, seo: 52, speed: 48 },
          executiveSummary: `Obecna witryna ${lead.name} wymaga optymalizacji pod kątem użytkowników korzystających ze smartfonów oraz wdrożenia szybkiego kontaktu Click-to-Call.`,
          issues: [
            {
              title: 'Brak pływającego przycisku połączenia (Click-to-Call) na telefonach',
              severity: 'Wysoka',
              impact:
                'Użytkownicy smartfonów rezygnują z kontaktu, gdy muszą ręcznie kopiować numer telefonu.',
            },
            {
              title: 'Niska konwersja z ruchu lokalnego Google',
              severity: 'Wysoka',
              impact:
                'Brak wyeksponowanych opinii Google i szybkiego formularza wyceny na pierwszym ekranie.',
            },
          ],
          missingElements: [
            'Pływający pasek szybkiego kontaktu telefonicznego na mobile',
            'Formularz kontaktowy 15-minutowej wyceny',
            'Dane strukturalne Schema.org LocalBusiness dla wyszukiwarki Google',
          ],
        },
        roiEstimate: lead.roiEstimate || {
          monthlyLostRevenue: '4 800 - 8 500 PLN',
          lostClientsPerMonth: '12 - 20 klientów / mc',
          projectedAnnualGain: '+28 000 PLN / rok',
        },
        pricingPackages,
        demoSiteHtml: lead.demoSiteHtml,
        acceptedProposal: lead.acceptedProposal || null,
      },
    });
  } catch (err: any) {
    console.error('[PublicProposal GET] Błąd:', err);
    return res.status(500).json({
      success: false,
      error: 'Wystąpił błąd serwera podczas wczytywania oferty.',
    });
  }
});

// POST /api/public/proposal/:id/accept
publicProposalRouter.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { packageName, clientName, clientEmail, clientPhone, clientNotes } = req.body || {};

    if (!clientName || !clientPhone) {
      return res.status(400).json({
        success: false,
        error: 'Podaj imię/nazwę firmy oraz numer telefonu kontaktowego.',
      });
    }

    const leads = await readLeads();
    const index = leads.findIndex((l) => l && l.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Nie znaleziono oferty do akceptacji.',
      });
    }

    const nowIso = new Date().toISOString();
    const acceptedProposal = {
      packageName: String(packageName || 'Pakiet Standard (1 490 PLN)').trim(),
      clientName: String(clientName).trim(),
      clientEmail: String(clientEmail || '').trim(),
      clientPhone: String(clientPhone).trim(),
      clientNotes: String(clientNotes || '').trim(),
      acceptedAt: nowIso,
    };

    leads[index] = {
      ...leads[index],
      status: 'Oferta zaakceptowana',
      phone: leads[index].phone || acceptedProposal.clientPhone,
      acceptedProposal,
      updatedAt: nowIso,
    };

    await writeLeads(leads);

    return res.json({
      success: true,
      message: 'Oferta została pomyślnie zaakceptowana!',
      lead: leads[index],
      acceptedProposal,
    });
  } catch (err: any) {
    console.error('[PublicProposal ACCEPT] Błąd:', err);
    return res.status(500).json({
      success: false,
      error: 'Błąd podczas zapisywania akceptacji oferty.',
    });
  }
});
