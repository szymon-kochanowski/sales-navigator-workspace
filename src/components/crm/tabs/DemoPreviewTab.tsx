import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  FileCode,
  Download,
  Sliders,
  RefreshCw,
  Globe,
  FileText,
  Copy,
  Layout,
} from 'lucide-react';
import { Lead, getWorkAgreementText } from '../../../types';

interface DemoPreviewTabProps {
  lead: Lead;
  isGeneratingSite: boolean;
  isExportingPackage: boolean;
  onGenerateSite: (customPrompt: string) => void;
  onExportPackage: () => void;
  supportWarrantyDays: number | '';
  onUpdateWarrantyDays: (val: number | '') => void;
  onDownloadProposalDocument: () => void;
  showToast: (msg: string) => void;
}

export const DemoPreviewTab: React.FC<DemoPreviewTabProps> = ({
  lead,
  isGeneratingSite,
  isExportingPackage,
  onGenerateSite,
  onExportPackage,
  supportWarrantyDays,
  onUpdateWarrantyDays,
  onDownloadProposalDocument,
  showToast,
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [customPrompt, setCustomPrompt] = useState<string>(lead.demoSitePrompt || '');

  useEffect(() => {
    setCustomPrompt(lead.demoSitePrompt || '');
  }, [lead.id, lead.demoSitePrompt]);

  const handleDownloadHtml = () => {
    if (!lead.demoSiteHtml) return;
    const blob = new Blob([lead.demoSiteHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(lead.name || 'projekt')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')}-onepage.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Pobrano plik HTML!');
  };

  const handleOpenDemoNewTab = () => {
    if (!lead.demoSiteHtml) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(lead.demoSiteHtml);
      win.document.close();
    }
  };

  const handleCopyWorkAgreement = () => {
    navigator.clipboard.writeText(getWorkAgreementText(lead, supportWarrantyDays));
    showToast('Skopiowano specyfikację techniczną wdrożenia!');
  };

  const effectiveDays =
    typeof supportWarrantyDays === 'number'
      ? supportWarrantyDays
      : lead.supportWarrantyDays || 30;

  return (
    <div className="flex-1 p-6 space-y-6 flex flex-col overflow-y-auto">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#12141c] p-4">
        <div className="flex items-center gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewportMode(mode)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                viewportMode === mode
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode === 'desktop' ? (
                <Monitor className="h-3.5 w-3.5" />
              ) : mode === 'tablet' ? (
                <Tablet className="h-3.5 w-3.5" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
              <span className="capitalize">{mode}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {lead.demoSiteHtml && (
            <>
              <button
                onClick={handleOpenDemoNewTab}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Nowe Okno</span>
              </button>
              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Pobierz HTML</span>
              </button>
              <button
                onClick={onExportPackage}
                disabled={isExportingPackage}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Pobierz Pełny Projekt ZIP</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Prompt / Customization Bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-[#12141c] p-3">
        <Sliders className="h-4 w-4 text-purple-400 shrink-0 ml-1" />
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Wpisz wytyczne do wyglądu (np. ciemny styl Dark SaaS, akcenty szmaragdowe, sekcja cennika)..."
          className="flex-1 bg-transparent px-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
        />
        <button
          onClick={() => onGenerateSite(customPrompt)}
          disabled={isGeneratingSite}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 shrink-0"
        >
          {isGeneratingSite ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Layout className="h-3.5 w-3.5" />
          )}
          <span>{lead.demoSiteHtml ? 'Przebuduj stronę' : 'Generuj stronę One-Page'}</span>
        </button>
      </div>

      {/* Viewport Frame */}
      {!lead.demoSiteHtml ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#12141c]/40 p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
          <Globe className="mb-3 h-12 w-12 text-zinc-700" />
          <h3 className="text-base font-semibold text-zinc-200">
            Brak wygenerowanej strony One-Page
          </h3>
          <p className="mt-1 max-w-md text-xs text-zinc-400">
            Generator utworzy kompletny, responsywny kod HTML w Tailwind CSS z formularzem,
            danymi Schema.org oraz mobilnym paskiem Click-to-Call.
          </p>
          <button
            onClick={() => onGenerateSite(customPrompt)}
            disabled={isGeneratingSite}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500"
          >
            <Layout className="h-4 w-4" />
            <span>Generuj Stronę One-Page Teraz</span>
          </button>
        </div>
      ) : (
        <div className="flex justify-center bg-zinc-950/80 rounded-2xl border border-zinc-800 p-4 overflow-hidden min-h-[620px]">
          <div
            className={`h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl bg-white border border-zinc-700 ${
              viewportMode === 'desktop'
                ? 'w-full'
                : viewportMode === 'tablet'
                ? 'w-[768px]'
                : 'w-[375px]'
            }`}
          >
            <iframe
              title={`Podgląd strony One-Page dla ${lead.name}`}
              srcDoc={lead.demoSiteHtml}
              sandbox="allow-scripts"
              className="w-full h-full min-h-[600px] border-0 bg-white"
            />
          </div>
        </div>
      )}

      {/* Technical Specifications */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Pakiety Wdrożeniowe & Specyfikacja Techniczna
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWorkAgreement}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Kopiuj Specyfikację</span>
            </button>
            <button
              onClick={onDownloadProposalDocument}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Pobierz Ofertę</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Specyfikacja Techniczna ({effectiveDays} dni wsparcia)
            </span>
            <div className="flex items-center gap-1">
              {[30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onUpdateWarrantyDays(d)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                    supportWarrantyDays === d
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-900 border border-zinc-800/80 p-3 text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {getWorkAgreementText(lead, supportWarrantyDays)}
          </div>
        </div>
      </div>
    </div>
  );
};
