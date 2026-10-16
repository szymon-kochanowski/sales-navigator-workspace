import React, { useState } from 'react';
import {
  ExternalLink,
  MapPin,
  RefreshCw,
  Zap,
  Mail,
  FileCode,
  Receipt,
  Download,
  ChevronDown,
  FileText,
  BarChart3,
  Server,
  Share2,
  TrendingUp,
  Search,
  Globe,
  Trash2,
} from 'lucide-react';
import { Lead, WorkspaceTab } from '../../types';
import { DocumentType } from '../DocumentStudioModal';

interface LeadHeaderProps {
  lead: Lead;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  isAuditing: boolean;
  isGeneratingOutreach: boolean;
  isGeneratingSite: boolean;
  isExportingPackage: boolean;
  isAutoPiloting: boolean;
  autoPilotProgress: string;
  onRunAutoPilot: () => void;
  onRunAudit: () => void;
  onGenerateOutreach: () => void;
  onGenerateSite: () => void;
  onExportPackage: () => void;
  onOpenDocStudio: (type: DocumentType) => void;
  onDeleteLead: (id: string, name: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const LeadHeader: React.FC<LeadHeaderProps> = ({
  lead,
  activeTab,
  onSelectTab,
  isAuditing,
  isGeneratingOutreach,
  isGeneratingSite,
  isExportingPackage,
  isAutoPiloting,
  autoPilotProgress,
  onRunAutoPilot,
  onRunAudit,
  onGenerateOutreach,
  onGenerateSite,
  onExportPackage,
  onOpenDocStudio,
  onDeleteLead,
  onUpdateStatus,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800 bg-[#0d0f17] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold tracking-tight text-white">{lead.name}</h2>
            {lead.website && (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <Globe className="h-3 w-3 text-purple-400" />
                <span>{lead.website}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a
              href={
                lead.googleMapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  lead.name + ' ' + (lead.address || lead.city || '')
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300 hover:border-indigo-500 hover:text-white transition"
            >
              <MapPin className="h-3 w-3 text-red-400" />
              <span>Google Maps</span>
              <ExternalLink className="h-3 w-3 text-zinc-500" />
            </a>
            <a
              href={
                lead.googleSearchUrl ||
                `https://www.google.com/search?q=${encodeURIComponent(
                  lead.name + ' ' + (lead.city || '')
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300 hover:border-indigo-500 hover:text-white transition"
            >
              <Search className="h-3 w-3 text-indigo-400" />
              <span>Google</span>
              <ExternalLink className="h-3 w-3 text-zinc-500" />
            </a>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {lead.address && (
              <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 flex items-center gap-1 border border-zinc-700/60">
                <MapPin className="h-3 w-3 text-red-400" />
                <span>{lead.address}</span>
              </span>
            )}
            {lead.industry && (
              <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300">
                Branża: <strong>{lead.industry}</strong>
              </span>
            )}
            {lead.city && (
              <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300">
                Miasto: <strong>{lead.city}</strong>
              </span>
            )}
            {lead.notes && (
              <span className="text-zinc-500 italic max-w-md truncate">
                Notatka: {lead.notes}
              </span>
            )}
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
              <span className="text-zinc-400 font-medium">Status:</span>
              <select
                value={lead.status}
                onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                className={`rounded-lg px-2 py-0.5 text-xs font-semibold border transition cursor-pointer focus:outline-none ${
                  lead.status === 'Oferta zaakceptowana'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : lead.status === 'Oferta gotowa'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                    : lead.status === 'Po audycie'
                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                }`}
              >
                <option value="Nowy">Nowy</option>
                <option value="Po audycie">Po audycie</option>
                <option value="Oferta gotowa">Oferta gotowa</option>
                <option value="Skontaktowano">Skontaktowano (Cold Mail/Call)</option>
                <option value="Oferta zaakceptowana">✓ Oferta zaakceptowana</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunAutoPilot}
            disabled={isAutoPiloting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isAutoPiloting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-300" />
                <span>{autoPilotProgress || 'Autopilot w toku...'}</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                <span>⚡ Autopilot 1-Klik (Kompletny Raport)</span>
              </>
            )}
          </button>

          <button
            onClick={onRunAudit}
            disabled={isAuditing || isAutoPiloting}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Analiza DOM...' : 'Uruchom Audyt Techniczny (DOM/SEO)'}</span>
          </button>

          <button
            onClick={onGenerateOutreach}
            disabled={isGeneratingOutreach || isAutoPiloting}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            {isGeneratingOutreach ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="h-3.5 w-3.5 text-indigo-400" />
            )}
            <span>{isGeneratingOutreach ? 'Generowanie...' : 'Generuj Ofertę (Szablon CRO)'}</span>
          </button>

          <button
            onClick={onGenerateSite}
            disabled={isGeneratingSite || isAutoPiloting}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            {isGeneratingSite ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileCode className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{isGeneratingSite ? 'Budowanie...' : 'Strona One-Page'}</span>
          </button>

          <button
            onClick={() => onOpenDocStudio('proforma')}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:text-white transition shadow-sm"
          >
            <Receipt className="h-3.5 w-3.5 text-purple-400" />
            <span>Faktury & Umowy</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Eksport / Pliki</span>
              <ChevronDown
                className={`h-3 w-3 text-zinc-400 transition-transform ${
                  isExportMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-zinc-800 bg-[#141622] p-2 shadow-2xl z-50">
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportPackage();
                    }}
                    disabled={isExportingPackage || isAutoPiloting}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition text-left disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Pobierz Paczkę ZIP</div>
                      <div className="text-[10px] text-zinc-400">Gotowy projekt HTML + SEO</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onOpenDocStudio('proforma');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition text-left"
                  >
                    <Receipt className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Faktura Proforma (Zadatek)</div>
                      <div className="text-[10px] text-zinc-400">Formularz i druk PDF / B2B</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onOpenDocStudio('work_contract');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition text-left"
                  >
                    <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Umowa o Dzieło / B2B</div>
                      <div className="text-[10px] text-zinc-400">Prawa autorskie & zadatek 50%</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onDeleteLead(lead.id, lead.name)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-2 text-xs font-medium text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Usuń</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap border-b border-zinc-800/90 text-sm">
        <button
          onClick={() => onSelectTab('audit')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition ${
            activeTab === 'audit'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>1. Audyt DOM/SEO</span>
          {lead.audit && typeof lead.audit.score === 'number' && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
              {lead.audit.score}/100
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('outreach')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition ${
            activeTab === 'outreach'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>2. Oferta & Cold Mail (CRO)</span>
          {lead.outreachBody && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
              Gotowa
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('demo')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition ${
            activeTab === 'demo'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>3. Strona One-Page</span>
          {lead.demoSiteHtml && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
              Live
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('hosting')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition ${
            activeTab === 'hosting'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>4. Infrastruktura & Hosting</span>
        </button>

        <button
          onClick={() => onSelectTab('proposal')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition ${
            activeTab === 'proposal'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Share2 className="h-4 w-4 text-indigo-400" />
          <span>5. Portal Prezentacji Klienta</span>
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
            Link SMS
          </span>
        </button>

        <button
          onClick={() => onSelectTab('accelerator')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition ${
            activeTab === 'accelerator'
              ? 'border-emerald-500 text-emerald-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>6. Akcelerator Sprzedaży & Umowy</span>
          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
            Upselle
          </span>
        </button>
      </div>
    </div>
  );
};
