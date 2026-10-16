import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  Sparkles,
  Building2,
  Plus,
  RefreshCw,
  Download,
  ExternalLink,
  Copy,
  Check,
  Lock,
  LogOut,
  AlertTriangle,
  X,
  ChevronRight,
  Rocket,
  Trash2,
  Radar,
  Receipt,
  BookOpen,
  ChevronDown,
  Activity,
  Zap,
} from 'lucide-react';
import PublicClientProposalPortal from './components/PublicClientProposalPortal';
import DocumentStudioModal, { DocumentType } from './components/DocumentStudioModal';
import { Sidebar } from './components/crm/Sidebar';
import { LeadHeader } from './components/crm/LeadHeader';
import { AuditTab } from './components/crm/tabs/AuditTab';
import { OutreachTab } from './components/crm/tabs/OutreachTab';
import { DemoPreviewTab } from './components/crm/tabs/DemoPreviewTab';
import { HostingTab } from './components/crm/tabs/HostingTab';
import { AcceleratorTab } from './components/crm/tabs/AcceleratorTab';
import { useAuth } from './hooks/useAuth';
import { useLeads } from './hooks/useLeads';
import { DiscoveredLead, WorkspaceTab } from './types';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Błąd renderowania panelu:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#090a0f] p-4 text-zinc-100">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#12141c] p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <h2 className="text-lg font-bold text-white">Wystąpił błąd wyświetlania panelu</h2>
            <p className="mt-2 text-xs text-zinc-400">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-500"
            >
              Odśwież panel
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function WorkspaceApp() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('audit');
  const [acceleratorSubTab, setAcceleratorSubTab] = useState<
    'upsells' | 'contract' | 'coldcall' | 'goals'
  >('upsells');
  const [monthlyGoalPLN, setMonthlyGoalPLN] = useState<number>(() =>
    parseInt(localStorage.getItem('sn_monthly_goal') || '3500', 10)
  );
  const [supportWarrantyDays, setSupportWarrantyDays] = useState<number | ''>(30);

  const auth = useAuth(showToast);
  const crm = useLeads({
    isAuthenticated: auth.isAuthenticated,
    token: auth.token,
    authFetch: auth.authFetch,
    showToast,
    onNavigateTab: setActiveTab,
  });

  // Modals state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [isDeployGuideModalOpen, setIsDeployGuideModalOpen] = useState(false);
  const [isStartGuideModalOpen, setIsStartGuideModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isDocStudioOpen, setIsDocStudioOpen] = useState(false);
  const [docStudioInitialType, setDocStudioInitialType] =
    useState<DocumentType>('proforma');
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    website: '',
    address: '',
    industry: '',
    city: '',
    notes: '',
  });

  const [radarIndustry, setRadarIndustry] = useState('Stomatologia');
  const [radarCity, setRadarCity] = useState('Poznań');
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [radarResults, setRadarResults] = useState<DiscoveredLead[]>([]);
  const [radarAddedMap, setRadarAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (crm.selectedLead) {
      setSupportWarrantyDays(crm.selectedLead.supportWarrantyDays ?? 30);
    }
  }, [crm.selectedLead?.id, crm.selectedLead?.supportWarrantyDays]);

  const handleOpenDocStudio = (type: DocumentType = 'proforma') => {
    setDocStudioInitialType(type);
    setIsDocStudioOpen(true);
  };

  const handleUpdateWarranty = (val: number | '') => {
    setSupportWarrantyDays(val);
    if (crm.selectedLead) {
      crm.updateWarrantyDays(
        crm.selectedLead.id,
        val === '' ? 30 : Math.max(0, Number(val))
      );
    }
  };

  const handleDownloadProposalDocument = () => {
    if (!crm.selectedLead) return;
    const price = crm.selectedLead.pricingPackages?.business?.price || '1 490 PLN';
    const html = `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Oferta — ${crm.selectedLead.name}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;}</style></head><body><h1>Oferta Wdrożenia Strony: ${crm.selectedLead.name}</h1><p>Pakiet Rekomendowany: <strong>${price}</strong> (Hosting 0 zł/mc, Gwarancja ${supportWarrantyDays || 30} dni).</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Oferta_${crm.selectedLead.name.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    a.click();
    showToast('Pobrano ofertę handlową w formacie HTML!');
  };

  const handleRadarScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRadarLoading(true);
    setRadarResults([]);
    try {
      const res = await auth.authFetch('/api/leads/discover', {
        method: 'POST',
        body: JSON.stringify({
          industry: radarIndustry,
          city: radarCity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const found = data.discoveredLeads || data.candidates || [];
        setRadarResults(found);
        showToast(`Znaleziono ${found.length} firm w radarze!`);
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd radaru');
    } finally {
      setIsRadarLoading(false);
    }
  };

  if (auth.isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090a0f] text-zinc-300">
        <RefreshCw className="h-5 w-5 animate-spin text-purple-400 mr-2" />
        <span>Weryfikacja sesji workspace...</span>
      </div>
    );
  }

  // Login Screen with 1-Click Demo
  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090a0f] p-4 text-zinc-100 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#12141c] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-600/10 blur-3xl pointer-events-none"></div>

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-xl shadow-purple-600/30">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sales Navigator Workspace</h1>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed max-w-xs">
              Mini-CRM · Automatyczny Audyt DOM/SEO · Generator Ofert & Landing Page
            </p>
          </div>

          <div className="space-y-4">
            {/* 1-Click Demo Mode Button */}
            <button
              type="button"
              onClick={auth.handleDemoLogin}
              disabled={auth.isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-3 text-sm font-bold text-emerald-300 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.99]"
            >
              <span>⚡ Wejdź w tryb Demo (1-Click)</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px flex-1 bg-zinc-800"></div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">LUB HASŁO ADMINA</span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>

            <form onSubmit={auth.handleLogin} className="space-y-3.5">
              <div className="relative">
                <input
                  type="password"
                  value={auth.loginPassword}
                  onChange={(e) => auth.setLoginPassword(e.target.value)}
                  placeholder="Wpisz hasło workspace (np. admin2026)..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  autoFocus
                />
                <Lock className="absolute right-3.5 top-3 h-4 w-4 text-zinc-500" />
              </div>

              {auth.loginError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  {auth.loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={auth.isLoggingIn}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30"
              >
                <span>{auth.isLoggingIn ? 'Logowanie...' : 'Odblokuj Workspace'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <p className="text-[11px] text-zinc-500 text-center pt-1">
                Domyślne hasło lokalne: <span className="font-mono text-zinc-300 font-semibold">admin2026</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#090a0f] text-zinc-100 font-sans overflow-hidden">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-purple-500/40 bg-[#161824] px-4 py-3 text-sm text-white shadow-2xl">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-[#0d0f17] px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base">Sales Navigator Workspace</span>
              <p className="text-xs text-zinc-400">
                Mini-CRM · Automatyczny Audyt DOM/SEO · Generator Ofert & Landing Page
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 ml-4 pl-4 border-l border-zinc-800 text-xs">
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-1.5">
              <span className="font-medium text-white">{crm.metricsCount.total} firm</span>
              <span>•</span>
              <span>Audyty: {crm.metricsCount.audited}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                Pipeline: {crm.metricsCount.estimatedPipelinePLN.toLocaleString('pl-PL')} zł
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">Silnik Analityczny: Online</span>
          </div>

          <button
            onClick={() => setIsRadarModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20"
          >
            <Radar className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span>Lead Radar</span>
          </button>

          <button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nowa Firma</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
            >
              <span>Narzędzia</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {isToolsMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsToolsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-zinc-800 bg-[#141622] p-2 shadow-2xl z-50 text-xs">
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      handleOpenDocStudio('proforma');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-zinc-800 text-left"
                  >
                    <Receipt className="h-4 w-4 text-purple-400" />
                    <span>Generator Faktur & Umów</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsStartGuideModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-zinc-800 text-left"
                  >
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    <span>Poradnik: Legalny Start NDG</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      crm.exportCsv();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-zinc-800 text-left"
                  >
                    <Download className="h-4 w-4 text-blue-400" />
                    <span>Eksport bazy CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsDeployGuideModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-zinc-800 text-left"
                  >
                    <Rocket className="h-4 w-4 text-purple-400" />
                    <span>Instrukcja Vercel & GitHub</span>
                  </button>

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      crm.restoreDemoLeads();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-zinc-800 text-left"
                  >
                    <RefreshCw className="h-4 w-4 text-purple-400" />
                    <span>Przywróć 4 firmy pokazowe</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      crm.clearAllLeads();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/10 text-left"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Wyczyść bazę firm</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={auth.handleLogout}
            title="Wyloguj"
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          leads={crm.leads}
          filteredLeads={crm.filteredLeads}
          selectedLeadId={crm.selectedLead?.id}
          onSelectLead={crm.setSelectedLeadId}
          onDeleteLead={crm.deleteLead}
          activeFilter={crm.activeFilter}
          onFilterChange={crm.setActiveFilter}
          searchQuery={crm.searchQuery}
          onSearchChange={crm.setSearchQuery}
          demoLeadsCount={crm.demoLeadsCount}
          onClearDemoLeads={crm.clearDemoLeads}
          onOpenRadar={() => setIsRadarModalOpen(true)}
          onOpenAddLead={() => setIsAddLeadModalOpen(true)}
        />

        {crm.selectedLead ? (
          <div className="flex flex-1 flex-col overflow-y-auto bg-[#090a0f]">
            <LeadHeader
              lead={crm.selectedLead}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isAuditing={crm.isAuditing}
              isGeneratingOutreach={crm.isGeneratingOutreach}
              isGeneratingSite={crm.isGeneratingSite}
              isExportingPackage={crm.isExportingPackage}
              isAutoPiloting={crm.isAutoPiloting}
              autoPilotProgress={crm.autoPilotProgress}
              onRunAutoPilot={crm.runAutoPilot}
              onRunAudit={crm.runAudit}
              onGenerateOutreach={crm.generateOutreach}
              onGenerateSite={() =>
                crm.generateSite(crm.selectedLead?.demoSitePrompt || '')
              }
              onExportPackage={crm.exportProductionPackage}
              onOpenDocStudio={handleOpenDocStudio}
              onDeleteLead={crm.deleteLead}
              onUpdateStatus={crm.updateLeadStatus}
            />

            {activeTab === 'audit' && (
              <AuditTab
                lead={crm.selectedLead}
                isAuditing={crm.isAuditing}
                onRunAudit={crm.runAudit}
              />
            )}

            {activeTab === 'outreach' && (
              <OutreachTab
                lead={crm.selectedLead}
                isGeneratingOutreach={crm.isGeneratingOutreach}
                onGenerateOutreach={crm.generateOutreach}
                supportWarrantyDays={supportWarrantyDays}
                onUpdateWarrantyDays={handleUpdateWarranty}
                onOpenSmsModal={() => setIsSmsModalOpen(true)}
                onOpenColdCallScript={() => {
                  setActiveTab('accelerator');
                  setAcceleratorSubTab('coldcall');
                }}
                onNavigateDemo={() => setActiveTab('demo')}
                showToast={showToast}
              />
            )}

            {activeTab === 'demo' && (
              <DemoPreviewTab
                lead={crm.selectedLead}
                isGeneratingSite={crm.isGeneratingSite}
                isExportingPackage={crm.isExportingPackage}
                onGenerateSite={crm.generateSite}
                onExportPackage={crm.exportProductionPackage}
                supportWarrantyDays={supportWarrantyDays}
                onUpdateWarrantyDays={handleUpdateWarranty}
                onDownloadProposalDocument={handleDownloadProposalDocument}
                showToast={showToast}
              />
            )}

            {activeTab === 'hosting' && (
              <HostingTab lead={crm.selectedLead} showToast={showToast} />
            )}

            {activeTab === 'proposal' && (
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Portal Prezentacji & Akceptacji Oferty dla {crm.selectedLead.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Link dla klienta: {window.location.origin}/?proposal={crm.selectedLead.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/?proposal=${crm.selectedLead?.id}`
                        );
                        showToast('Skopiowano link prezentacji dla klienta!');
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Kopiuj Link dla Klienta</span>
                    </button>
                    <a
                      href={`/?proposal=${crm.selectedLead.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Otwórz Podgląd</span>
                    </a>
                    <button
                      onClick={crm.simulateClientAccept}
                      disabled={crm.isSimulatingAccept}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Symuluj Akceptację</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#090a0f] min-h-[700px]">
                  <PublicClientProposalPortal
                    leadId={crm.selectedLead.id}
                    isEmbeddedPreview={true}
                  />
                </div>
              </div>
            )}

            {activeTab === 'accelerator' && (
              <AcceleratorTab
                lead={crm.selectedLead}
                subTab={acceleratorSubTab}
                onSubTabChange={setAcceleratorSubTab}
                monthlyGoalPLN={monthlyGoalPLN}
                onMonthlyGoalChange={(val) => {
                  setMonthlyGoalPLN(val);
                  localStorage.setItem('sn_monthly_goal', String(val));
                }}
                supportWarrantyDays={supportWarrantyDays}
                onOpenStartGuide={() => setIsStartGuideModalOpen(true)}
                onOpenDocStudio={handleOpenDocStudio}
                showToast={showToast}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <Building2 className="h-12 w-12 text-purple-400 mb-3" />
            <h3 className="text-xl font-bold text-white">
              {crm.leads.length === 0 ? 'Baza CRM jest pusta' : 'Wybierz firmę z listy'}
            </h3>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsRadarModalOpen(true)}
                className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-500"
              >
                Wyszukaj firmy (Lead Radar)
              </button>
              <button
                onClick={() => setIsAddLeadModalOpen(true)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
              >
                Dodaj firmę ręcznie
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nowa Firma */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#12141c] p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white">Dodaj nową firmę</h3>
              <button onClick={() => setIsAddLeadModalOpen(false)}>
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await crm.createLead(newLeadForm);
                if (ok) {
                  setIsAddLeadModalOpen(false);
                  setNewLeadForm({
                    name: '',
                    website: '',
                    address: '',
                    industry: '',
                    city: '',
                    notes: '',
                  });
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <input
                type="text"
                required
                placeholder="Nazwa firmy *"
                value={newLeadForm.name}
                onChange={(e) =>
                  setNewLeadForm({ ...newLeadForm, name: e.target.value })
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Adres strony WWW *"
                value={newLeadForm.website}
                onChange={(e) =>
                  setNewLeadForm({ ...newLeadForm, website: e.target.value })
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Branża"
                  value={newLeadForm.industry}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, industry: e.target.value })
                  }
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Miasto"
                  value={newLeadForm.city}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, city: e.target.value })
                  }
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Adres siedziby / ulica"
                value={newLeadForm.address}
                onChange={(e) =>
                  setNewLeadForm({ ...newLeadForm, address: e.target.value })
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <textarea
                placeholder="Notatki o firmie..."
                rows={2}
                value={newLeadForm.notes}
                onChange={(e) =>
                  setNewLeadForm({ ...newLeadForm, notes: e.target.value })
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-white focus:border-purple-500 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2 hover:bg-zinc-800"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500"
                >
                  Zapisz Firmę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lead Radar */}
      {isRadarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#12141c] p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Radar className="h-4 w-4 text-indigo-400" />
                <span>Lead Radar — Wyszukiwarka Lokalnych Firm</span>
              </h3>
              <button onClick={() => setIsRadarModalOpen(false)}>
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleRadarScan} className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                required
                value={radarIndustry}
                onChange={(e) => setRadarIndustry(e.target.value)}
                placeholder="Branża (np. Stomatologia)"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                required
                value={radarCity}
                onChange={(e) => setRadarCity(e.target.value)}
                placeholder="Miasto (np. Poznań)"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isRadarLoading}
                className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isRadarLoading ? 'Skanowanie...' : 'Skanuj Rynek'}
              </button>
            </form>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2">
              {radarResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  Wpisz branżę i miasto, a następnie kliknij „Skanuj Rynek”.
                </div>
              ) : (
                radarResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-zinc-400 font-mono text-[11px]">{item.website}</div>
                      <div className="text-amber-400 text-[10px] mt-0.5">{item.estimatedWebsiteHealth}</div>
                    </div>
                    <button
                      disabled={radarAddedMap[item.name]}
                      onClick={async () => {
                        const ok = await crm.addRadarLeadToCrm(
                          item,
                          radarIndustry,
                          radarCity
                        );
                        if (ok) setRadarAddedMap((p) => ({ ...p, [item.name]: true }));
                      }}
                      className="rounded-xl bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {radarAddedMap[item.name] ? 'W bazie' : '+ Dodaj do CRM'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: SMS / WhatsApp */}
      {isSmsModalOpen && crm.selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#12141c] p-6 text-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                Wiadomość SMS / WhatsApp
              </h3>
              <button onClick={() => setIsSmsModalOpen(false)}>
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-200 leading-relaxed font-mono text-[11px]">
              {`Dzień dobry, z tej strony Jan Kowalski (Web Developer). Przygotowałem bezpłatną, w 100% działającą wersję demonstracyjną nowej strony dla ${crm.selectedLead.name}: ${window.location.origin}/?proposal=${crm.selectedLead.id}. Można sprawdzić na telefonie w 30 sekund. Pozdrawiam!`}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Dzień dobry, z tej strony Jan Kowalski (Web Developer). Przygotowałem bezpłatną wersję demonstracyjną nowej strony dla ${crm.selectedLead?.name}: ${window.location.origin}/?proposal=${crm.selectedLead?.id}`
                  );
                  showToast('Skopiowano treść SMS!');
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500"
              >
                Kopiuj Treść SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Poradnik Legalny Start NDG */}
      {isStartGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#12141c] p-6 text-xs space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span>Poradnik: Legalny Start Bez Firmy (NDG & Umowa o Dzieło)</span>
              </h3>
              <button onClick={() => setIsStartGuideModalOpen(false)}>
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 text-zinc-300 leading-relaxed pr-1">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <h4 className="font-bold text-white text-sm mb-1">1. Działalność Nierejestrowana (NDG)</h4>
                <p>
                  W Polsce możesz legalnie zarabiać do 75% minimalnego wynagrodzenia miesięcznie (ok. 3 200 – 3 500 zł) bez rejestracji w CEIDG i bez płacenia składek ZUS. Wystawiasz klientom faktury bez VAT (zwolnienie podmiotowe z art. 113 ust. 1 i 9).
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <h4 className="font-bold text-white text-sm mb-1">2. Umowa o Dzieło z 50% KUP</h4>
                <p>
                  Dla większych zleceń (np. 1 490 zł czy 2 190 zł) idealnym rozwiązaniem jest Umowa o Dzieło z przekazaniem autorskich praw majątkowych. Dzięki 50% kosztom uzyskania przychodu realny podatek dochodowy wynosi zaledwie ok. 6-9%, a ZUS wynosi 0 zł.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <h4 className="font-bold text-white text-sm mb-1">3. Bezpieczeństwo Płatności (Zadatek 50%)</h4>
                <p>
                  Zawsze pobieraj zadatek 50% przed przystąpieniem do wdrożenia. Generator w module „Faktury & Umowy” pozwala wystawić fakturę proforma w 60 sekund.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setIsStartGuideModalOpen(false)}
                className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Deploy Guide */}
      {isDeployGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#12141c] p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Rocket className="h-4 w-4 text-purple-400" />
                <span>Instrukcja Publikacji na GitHub & Vercel</span>
              </h3>
              <button onClick={() => setIsDeployGuideModalOpen(false)}>
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-3 text-zinc-300 leading-relaxed font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-white mb-1">Krok 1: Wypchnięcie na GitHub</div>
                <div>git init && git add .</div>
                <div>git commit -m "Initial commit sales-navigator-workspace"</div>
                <div>git push -u origin main</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-white mb-1">Krok 2: Połączenie z Vercel</div>
                <div>Zaloguj się na vercel.com i zaimportuj repozytorium.</div>
                <div>Dodaj zmienne: WORKSPACE_PASSWORD oraz SENDER_NAME.</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsDeployGuideModalOpen(false)}
                className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentStudioModal
        isOpen={isDocStudioOpen}
        onClose={() => setIsDocStudioOpen(false)}
        lead={crm.selectedLead}
        initialDocType={docStudioInitialType}
        showToast={showToast}
        leadsList={crm.leads}
        onSelectLead={(l) => crm.setSelectedLeadId(l.id)}
      />
    </div>
  );
}

export default function App() {
  const [proposalParam, setProposalParam] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('proposal') || params.get('p');
  });

  if (proposalParam) {
    return (
      <ErrorBoundary>
        <PublicClientProposalPortal
          leadId={proposalParam}
          onBackToAdmin={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('proposal');
            url.searchParams.delete('p');
            window.history.pushState({}, '', url.toString());
            setProposalParam(null);
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <WorkspaceApp />
    </ErrorBoundary>
  );
}
