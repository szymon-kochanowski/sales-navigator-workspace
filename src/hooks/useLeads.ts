import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Lead,
  DiscoveredLead,
  CrmFilter,
  WorkspaceTab,
  DEMO_LEAD_IDS,
} from '../types';

const STORAGE_LEADS_KEY = 'sn_crm_leads';
const STORAGE_DELETED_KEY = 'sn_crm_deleted_ids';
const STORAGE_DEMO_RESTORE_KEY = 'sn_crm_demo_explicit_restore';

interface UseLeadsOptions {
  isAuthenticated: boolean;
  token: string;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  showToast: (msg: string) => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export function useLeads({
  isAuthenticated,
  token,
  authFetch,
  showToast,
  onNavigateTab,
}: UseLeadsOptions) {
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const explicitRestore = localStorage.getItem(STORAGE_DEMO_RESTORE_KEY) === 'true';
      const rawDeleted = localStorage.getItem(STORAGE_DELETED_KEY);
      const deletedSet = new Set<string>(rawDeleted ? JSON.parse(rawDeleted) : []);

      const cached = localStorage.getItem(STORAGE_LEADS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(
            (l) => l && l.id && (!deletedSet.has(l.id) || explicitRestore)
          );
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Błąd odczytu leads z localStorage:', e);
    }
    return [];
  });

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<CrmFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState<boolean>(false);
  const [isGeneratingSite, setIsGeneratingSite] = useState<boolean>(false);
  const [isExportingPackage, setIsExportingPackage] = useState<boolean>(false);
  const [isAutoPiloting, setIsAutoPiloting] = useState<boolean>(false);
  const [autoPilotProgress, setAutoPilotProgress] = useState<string>('');
  const [isSimulatingAccept, setIsSimulatingAccept] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads || []));
    } catch (e) {
      console.warn('Błąd zapisu leads do localStorage:', e);
    }
  }, [leads]);

  const getDeletedIdsSet = useCallback((): Set<string> => {
    const set = new Set<string>();
    try {
      const raw = localStorage.getItem(STORAGE_DELETED_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((id: string) => set.add(id));
      }
    } catch {}
    return set;
  }, []);

  const fetchLeads = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await authFetch('/api/leads');
      if (!res.ok) return;
      const data = await res.json();
      const serverItems: Lead[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.leads)
        ? data.leads
        : [];

      const deletedIds = getDeletedIdsSet();

      setLeads((prevLocal) => {
        const validServerItems = serverItems.filter(
          (l) => l && l.id && !deletedIds.has(l.id)
        );
        const validLocalItems = (Array.isArray(prevLocal) ? prevLocal : []).filter(
          (l) => l && l.id && !deletedIds.has(l.id)
        );

        const map = new Map<string, Lead>();
        validServerItems.forEach((sLead) => {
          map.set(sLead.id, sLead);
        });

        const missingOrNewerOnClient: Lead[] = [];
        validLocalItems.forEach((localLead) => {
          const serverLead = map.get(localLead.id);
          if (!serverLead) {
            map.set(localLead.id, localLead);
            missingOrNewerOnClient.push(localLead);
          } else {
            const localTime = localLead.updatedAt
              ? new Date(localLead.updatedAt).getTime()
              : 0;
            const serverTime = serverLead.updatedAt
              ? new Date(serverLead.updatedAt).getTime()
              : 0;

            const primary = localTime >= serverTime ? localLead : serverLead;
            const secondary = localTime >= serverTime ? serverLead : localLead;

            const mergedLead: Lead = {
              ...secondary,
              ...primary,
              status:
                serverLead.status === 'Oferta zaakceptowana'
                  ? 'Oferta zaakceptowana'
                  : primary.status,
              acceptedProposal:
                serverLead.acceptedProposal || localLead.acceptedProposal,
              audit: primary.audit || secondary.audit,
              demoSiteHtml: primary.demoSiteHtml || secondary.demoSiteHtml,
              outreachBody: primary.outreachBody || secondary.outreachBody,
              outreachSubject: primary.outreachSubject || secondary.outreachSubject,
              outreachFollowUp1:
                primary.outreachFollowUp1 || secondary.outreachFollowUp1,
              outreachFollowUp2:
                primary.outreachFollowUp2 || secondary.outreachFollowUp2,
              pricingPackages:
                primary.pricingPackages || secondary.pricingPackages,
              roiEstimate: primary.roiEstimate || secondary.roiEstimate,
              phone: primary.phone || secondary.phone,
              address: primary.address || secondary.address,
            };
            map.set(localLead.id, mergedLead);

            if (
              (localLead.demoSiteHtml && !serverLead.demoSiteHtml) ||
              (localLead.audit && !serverLead.audit)
            ) {
              missingOrNewerOnClient.push(mergedLead);
            }
          }
        });

        if (missingOrNewerOnClient.length > 0) {
          authFetch('/api/leads/bulk-import', {
            method: 'POST',
            body: JSON.stringify({ items: missingOrNewerOnClient }),
          }).catch(() => {});
        }

        const mergedList = Array.from(map.values());
        try {
          localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(mergedList));
        } catch {}

        setSelectedLeadId((prevId) => {
          if (prevId && mergedList.some((l) => l.id === prevId)) return prevId;
          return mergedList.length > 0 ? mergedList[0].id : null;
        });

        return mergedList;
      });
    } catch (err: any) {
      console.warn('Używam pamięci lokalnej:', err.message);
    }
  }, [isAuthenticated, authFetch, getDeletedIdsSet]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated, token, fetchLeads]);

  const selectedLead = useMemo<Lead | null>(() => {
    const list = Array.isArray(leads) ? leads : [];
    if (list.length === 0) return null;
    return list.find((l) => l && l.id === selectedLeadId) || list[0] || null;
  }, [leads, selectedLeadId]);

  const filteredLeads = useMemo<Lead[]>(() => {
    const list = Array.isArray(leads) ? leads : [];
    const q = (searchQuery || '').toLowerCase().trim();
    return list.filter((lead) => {
      if (!lead) return false;
      const matchesFilter = activeFilter === 'ALL' || lead.status === activeFilter;
      const name = (lead.name || '').toLowerCase();
      const city = (lead.city || '').toLowerCase();
      const industry = (lead.industry || '').toLowerCase();
      const matchesSearch =
        !q || name.includes(q) || city.includes(q) || industry.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [leads, activeFilter, searchQuery]);

  const metricsCount = useMemo(() => {
    const list = Array.isArray(leads) ? leads : [];
    const total = list.length;
    const audited = list.filter((l) => Boolean(l && l.audit)).length;
    const ready = list.filter((l) => Boolean(l && l.status === 'Oferta gotowa')).length;
    const contacted = list.filter((l) => Boolean(l && l.status === 'Skontaktowano')).length;
    const accepted = list.filter(
      (l) => Boolean(l && l.status === 'Oferta zaakceptowana')
    ).length;
    const estimatedPipelinePLN = (ready + contacted + accepted) * 1490;
    return { total, audited, ready, contacted, accepted, estimatedPipelinePLN };
  }, [leads]);

  const demoLeadsCount = useMemo(() => {
    const list = Array.isArray(leads) ? leads : [];
    return list.filter((l) => l && DEMO_LEAD_IDS.includes(l.id)).length;
  }, [leads]);

  const createLead = async (formData: {
    name: string;
    website: string;
    address?: string;
    industry?: string;
    city?: string;
    notes?: string;
  }): Promise<boolean> => {
    if (!formData.name.trim() || !formData.website.trim()) {
      showToast('Wpisz nazwę i adres strony www');
      return false;
    }
    try {
      const res = await authFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        const created: Lead = {
          ...(data.lead || data),
          updatedAt: new Date().toISOString(),
        };
        setLeads((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        setSelectedLeadId(created.id);
        showToast(`Dodano firmę: ${created.name}`);
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Błąd dodawania firmy');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd zapisu');
      return false;
    }
  };

  const addRadarLeadToCrm = async (
    item: DiscoveredLead,
    fallbackIndustry: string,
    fallbackCity: string
  ): Promise<boolean> => {
    try {
      const issues = item.detectedIssues || item.suspectedIssues || [];
      const res = await authFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: item.name,
          website: item.website,
          address: item.address,
          phone: item.phone,
          googleMapsUrl: item.googleMapsUrl,
          googleSearchUrl: item.googleSearchUrl,
          googleRating: item.googleRating,
          industry: item.industry || fallbackIndustry,
          city: item.city || fallbackCity,
          notes: `${item.notes || ''} ${item.address ? '| ' + item.address : ''} ${
            item.googleRating ? '| ' + item.googleRating : ''
          } | Braki: ${issues.join(', ')}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const created: Lead = {
          ...(data.lead || data),
          updatedAt: new Date().toISOString(),
        };
        setLeads((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
        setSelectedLeadId(created.id);
        showToast(`Dodano firmę "${item.name}" do bazy CRM!`);
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Błąd dodawania z radaru');
      return false;
    }
  };

  const deleteLead = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno usunąć firmę "${name}" z bazy CRM?`)) return;
    try {
      const raw = localStorage.getItem(STORAGE_DELETED_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(id)) arr.push(id);
      localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(arr));
    } catch {}

    const updated = (Array.isArray(leads) ? leads : []).filter((l) => l && l.id !== id);
    setLeads(updated);
    if (selectedLeadId === id) {
      setSelectedLeadId(updated.length > 0 ? updated[0].id : null);
    }
    try {
      const res = await authFetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Usunięto firmę "${name}"`);
      }
    } catch (err: any) {
      showToast(err.message || 'Usunięto z bazy');
    }
  };

  const clearDemoLeads = async () => {
    if (demoLeadsCount === 0) {
      showToast('Wszystkie domyślne firmy demonstracyjne zostały już usunięte.');
      return;
    }
    if (
      !confirm(
        `Czy na pewno usunąć ${demoLeadsCount} przykładowych firm pokazowych? Dodane przez Ciebie firmy zostaną nienaruszone.`
      )
    )
      return;

    try {
      localStorage.removeItem(STORAGE_DEMO_RESTORE_KEY);
      const raw = localStorage.getItem(STORAGE_DELETED_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      DEMO_LEAD_IDS.forEach((id) => {
        if (!arr.includes(id)) arr.push(id);
      });
      localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(arr));
    } catch {}

    const updated = (Array.isArray(leads) ? leads : []).filter(
      (l) => l && !DEMO_LEAD_IDS.includes(l.id)
    );
    setLeads(updated);
    if (selectedLeadId && DEMO_LEAD_IDS.includes(selectedLeadId)) {
      setSelectedLeadId(updated.length > 0 ? updated[0].id : null);
    }
    try {
      await authFetch('/api/leads/clear-demo', { method: 'POST' });
      showToast(`Usunięto ${demoLeadsCount} firm testowych`);
    } catch {
      showToast('Usunięto firmy demonstracyjne');
    }
  };

  const clearAllLeads = async () => {
    if (
      !confirm(
        'UWAGA: Czy na pewno chcesz wyczyścić bazę do zera? Utworzona zostanie pusta przestrzeń robocza.'
      )
    )
      return;

    try {
      localStorage.removeItem(STORAGE_DEMO_RESTORE_KEY);
      const raw = localStorage.getItem(STORAGE_DELETED_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      (Array.isArray(leads) ? leads : []).forEach((l) => {
        if (l && l.id && !arr.includes(l.id)) arr.push(l.id);
      });
      localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(arr));
    } catch {}

    setLeads([]);
    setSelectedLeadId(null);
    try {
      await authFetch('/api/leads/clear-all', { method: 'POST' });
      showToast('Wyczyszczono bazę CRM');
    } catch {
      showToast('Baza wyczyszczona lokalnie');
    }
  };

  const restoreDemoLeads = async () => {
    if (!confirm('Czy chcesz załadować 4 przykładowe firmy pokazowe z gotowymi audytami i stronami?'))
      return;

    try {
      localStorage.setItem(STORAGE_DEMO_RESTORE_KEY, 'true');
      const raw = localStorage.getItem(STORAGE_DELETED_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        const filtered = arr.filter((id) => !DEMO_LEAD_IDS.includes(id));
        localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(filtered));
      }
    } catch {}

    try {
      const res = await authFetch('/api/leads/restore-demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leads)) {
          setLeads(data.leads);
          if (data.leads.length > 0) setSelectedLeadId(data.leads[0].id);
        }
        showToast('Przywrócono przykładowe firmy pokazowe');
      }
    } catch {
      showToast('Błąd przywracania danych pokazowych');
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const now = new Date().toISOString();
    setLeads((prev) =>
      prev.map((l) => (l && l.id === leadId ? { ...l, status: newStatus, updatedAt: now } : l))
    );
    try {
      await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, updatedAt: now }),
      });
      showToast(`Zaktualizowano status leada: ${newStatus}`);
    } catch (err) {
      console.warn('Nie udało się zapisać statusu:', err);
    }
  };

  const updateWarrantyDays = async (leadId: string, days: number) => {
    const now = new Date().toISOString();
    setLeads((prev) =>
      prev.map((l) =>
        l && l.id === leadId ? { ...l, supportWarrantyDays: days, updatedAt: now } : l
      )
    );
    try {
      await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ supportWarrantyDays: days, updatedAt: now }),
      });
    } catch (err) {
      console.warn('Nie udało się zapisać dni gwarancji:', err);
    }
  };

  const runAudit = async () => {
    if (!selectedLead) return;
    setIsAuditing(true);
    showToast('Rozpoczynam audyt: parsowanie DOM przez Cheerio i ocena parametrów CRO/SEO...');
    try {
      const res = await authFetch(`/api/leads/${selectedLead.id}/audit`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedLead: Lead = {
          ...(data.lead || data),
          updatedAt: new Date().toISOString(),
        };
        setLeads((prev) =>
          prev.map((l) => (l && l.id === selectedLead.id ? updatedLead : l))
        );
        onNavigateTab?.('audit');
        showToast(`Audyt techniczny ukończony! Wynik: ${updatedLead.audit?.score ?? 50}/100`);
      } else {
        showToast(data.error || 'Błąd podczas audytu');
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd połączenia z API audytu');
    } finally {
      setIsAuditing(false);
    }
  };

  const generateOutreach = async () => {
    if (!selectedLead) return;
    setIsGeneratingOutreach(true);
    showToast('Generuję spersonalizowaną ofertę (szablon CRO)...');
    try {
      const res = await authFetch(`/api/leads/${selectedLead.id}/generate-outreach`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedLead: Lead = {
          ...(data.lead || data),
          updatedAt: new Date().toISOString(),
        };
        setLeads((prev) =>
          prev.map((l) => (l && l.id === selectedLead.id ? updatedLead : l))
        );
        onNavigateTab?.('outreach');
        showToast('Oferta i cold mail (CRO) zostały wygenerowane!');
      } else {
        showToast(data.error || 'Błąd generowania wiadomości');
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd połączenia z API');
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const generateSite = async (customPrompt: string = '') => {
    if (!selectedLead) return;
    setIsGeneratingSite(true);
    showToast('Generuję nowoczesną stronę One-Page w architekturze Tailwind CSS...');
    try {
      const res = await authFetch(`/api/leads/${selectedLead.id}/generate-site`, {
        method: 'POST',
        body: JSON.stringify({ customPrompt: customPrompt.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedLead: Lead = {
          ...(data.lead || data),
          updatedAt: new Date().toISOString(),
        };
        setLeads((prev) =>
          prev.map((l) => (l && l.id === selectedLead.id ? updatedLead : l))
        );
        onNavigateTab?.('demo');
        showToast('Strona One-Page została pomyślnie wygenerowana!');
      } else {
        showToast(data.error || 'Błąd generowania kodu strony');
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd generowania strony');
    } finally {
      setIsGeneratingSite(false);
    }
  };

  const runAutoPilot = async () => {
    if (!selectedLead) return;
    setIsAutoPiloting(true);
    setAutoPilotProgress('Krok 1/3: Pobieranie struktury DOM i audyt techniczny...');
    showToast(`Uruchomiono pełen audyt i generowanie dla "${selectedLead.name}"`);
    try {
      const res = await authFetch(`/api/leads/${selectedLead.id}/auto-pilot`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedLead: Lead = {
          ...(data.lead || data),
          updatedAt: new Date().toISOString(),
        };
        setLeads((prev) =>
          prev.map((l) => (l && l.id === selectedLead.id ? updatedLead : l))
        );
        onNavigateTab?.('outreach');
        showToast(`Raport gotowy! Kompletny pakiet dla "${selectedLead.name}" został wygenerowany.`);
      } else {
        showToast(data.error || 'Błąd wykonania procedury');
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd połączenia z API');
    } finally {
      setIsAutoPiloting(false);
      setAutoPilotProgress('');
    }
  };

  const exportProductionPackage = async () => {
    if (!selectedLead) return;
    setIsExportingPackage(true);
    showToast('Buduję zabezpieczoną paczkę produkcyjną ZIP (HTML + Tailwind + SEO + Security)...');
    try {
      const res = await authFetch(
        `/api/leads/${selectedLead.id}/generate-production-package`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        const currentToken = token || localStorage.getItem('sn_token') || '';
        const downloadUrl = `/api/leads/${selectedLead.id}/download-package?token=${encodeURIComponent(
          currentToken
        )}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${(selectedLead.name || 'projekt')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')}-production-website.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Paczka produkcyjna ZIP pobiera się!');
      } else {
        showToast(data.error || 'Błąd tworzenia paczki');
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd eksportu');
    } finally {
      setIsExportingPackage(false);
    }
  };

  const simulateClientAccept = async () => {
    if (!selectedLead) return;
    setIsSimulatingAccept(true);
    try {
      const res = await fetch(`/api/public/proposal/${selectedLead.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName:
            selectedLead.pricingPackages?.business?.name ||
            'Pakiet Standard (Bestseller)',
          clientName: selectedLead.name,
          clientPhone: '500 123 456',
          clientEmail:
            'kontakt@' +
            (selectedLead.website || '')
              .replace(/^https?:\/\//, '')
              .replace(/\/.*$/, ''),
          clientNotes:
            'Proszę o kontakt w godzinach 9:00 - 15:00 w celu omówienia wdrożenia.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Symulacja udana! Klient zaakceptował ofertę.');
        await fetchLeads();
      } else {
        showToast(data.error || 'Błąd zapisu akceptacji');
      }
    } catch (e: any) {
      showToast(e.message || 'Błąd połączenia');
    } finally {
      setIsSimulatingAccept(false);
    }
  };

  const exportCsv = () => {
    const list = Array.isArray(leads) ? leads : [];
    if (list.length === 0) {
      showToast('Brak firm w bazie do wyeksportowania');
      return;
    }
    const headers = [
      'Nazwa Firmy',
      'Strona WWW',
      'Branza',
      'Miasto',
      'Status',
      'Ocena Audytu',
      'Temat Cold Maila',
      'Tresc Cold Maila',
      'Follow-Up 1',
      'Follow-Up 2',
      'Utrata Miesieczna (ROI)',
      'Notatki',
    ];
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = list.map((l) => [
      escapeCsv(l.name),
      escapeCsv(l.website),
      escapeCsv(l.industry || ''),
      escapeCsv(l.city || ''),
      escapeCsv(l.status),
      escapeCsv(l.audit?.score ?? ''),
      escapeCsv(l.outreachSubject || ''),
      escapeCsv(l.outreachBody || ''),
      escapeCsv(l.outreachFollowUp1 || ''),
      escapeCsv(l.outreachFollowUp2 || ''),
      escapeCsv(l.roiEstimate?.monthlyLostRevenue || ''),
      escapeCsv(l.notes || ''),
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-navigator-leads-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(
      `Wyeksportowano ${list.length} leadów do pliku CSV (gotowe do wysyłki)!`
    );
  };

  return {
    leads,
    setLeads,
    selectedLead,
    selectedLeadId,
    setSelectedLeadId,
    filteredLeads,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    metricsCount,
    demoLeadsCount,
    isAuditing,
    isGeneratingOutreach,
    isGeneratingSite,
    isExportingPackage,
    isAutoPiloting,
    autoPilotProgress,
    isSimulatingAccept,
    fetchLeads,
    createLead,
    addRadarLeadToCrm,
    deleteLead,
    clearDemoLeads,
    clearAllLeads,
    restoreDemoLeads,
    updateLeadStatus,
    updateWarrantyDays,
    runAudit,
    generateOutreach,
    generateSite,
    runAutoPilot,
    exportProductionPackage,
    simulateClientAccept,
    exportCsv,
  };
}
