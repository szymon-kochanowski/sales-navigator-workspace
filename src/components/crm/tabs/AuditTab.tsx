import React from 'react';
import { BarChart3, AlertTriangle, CheckCircle, ShieldCheck, Zap } from 'lucide-react';
import { Lead } from '../../../types';

interface AuditTabProps {
  lead: Lead;
  isAuditing: boolean;
  onRunAudit: () => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  lead,
  isAuditing,
  onRunAudit,
}) => {
  if (!lead.audit) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#12141c]/40 p-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <h3 className="text-base font-semibold text-zinc-200">
            Brak audytu dla {lead.name}
          </h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-zinc-400">
            Kliknij poniższy przycisk, aby uruchomić parser Cheerio DOM, sprawdzić certyfikat SSL,
            nagłówki H1-H3, metatagi, formularze oraz przyciski akcji na stronie {lead.website}.
          </p>
          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 transition"
          >
            <Zap className="h-4 w-4" />
            <span>
              {isAuditing
                ? 'Trwa analiza techniczna DOM & SEO...'
                : 'Uruchom Audyt Techniczny (DOM/SEO)'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const score = lead.audit.score ?? 50;
  const designScore = lead.audit.metrics?.design ?? 50;
  const conversionScore = lead.audit.metrics?.conversion ?? 45;
  const seoScore = lead.audit.metrics?.seo ?? 60;
  const speedScore = lead.audit.metrics?.speed ?? 55;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-zinc-400">
            Ocena Kondycji Strony (DOM & CRO)
          </span>
          <div className="my-2 flex items-baseline gap-1">
            <span
              className={`text-4xl font-black ${
                score < 50
                  ? 'text-red-400'
                  : score < 75
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {score}
            </span>
            <span className="text-sm text-zinc-500 font-semibold">/100</span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              score < 50
                ? 'bg-red-500/10 text-red-300'
                : score < 75
                ? 'bg-amber-500/10 text-amber-300'
                : 'bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {score < 50
              ? 'Krytyczne braki konwersji'
              : score < 75
              ? 'Wymaga optymalizacji mobilnej'
              : 'Wysoka jakość techniczna'}
          </span>
        </div>

        {/* Sub-Metrics */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col justify-between">
          <div className="text-xs text-zinc-400 font-medium">
            Responsywność & UI / UX
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {designScore}%
          </div>
          <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${designScore}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col justify-between">
          <div className="text-xs text-zinc-400 font-medium">
            Potencjał Konwersji (CRO & CTA)
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {conversionScore}%
          </div>
          <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${conversionScore}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col justify-between">
          <div className="text-xs text-zinc-400 font-medium">
            Metatagi SEO & Certyfikat SSL
          </div>
          <div className="text-2xl font-bold text-white mt-1">{seoScore}%</div>
          <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${seoScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {lead.audit.executiveSummary && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-950/10 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Raport Techniczny & Wnioski Audytu</span>
          </div>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            {lead.audit.executiveSummary}
          </p>
        </div>
      )}

      {/* 3 Main Issues */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Wykryte Wąskie Gardła (Konkretne Argumenty do Rozmowy)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(lead.audit.issues || []).map((issue: any, idx: number) => {
            const issueTitle =
              typeof issue === 'string'
                ? issue
                : issue?.title || `Problem #${idx + 1}`;
            const issueSeverity =
              typeof issue === 'object' && issue?.severity
                ? issue.severity
                : 'Średnia';
            const issueImpact =
              typeof issue === 'object' && issue?.impact ? issue.impact : '';

            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-purple-400">
                      Usterka #{idx + 1}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        issueSeverity === 'Wysoka'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      Waga: {issueSeverity}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-white mb-2">
                    {issueTitle}
                  </h4>
                  {issueImpact && (
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {issueImpact}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing Elements & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Elements */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Brakujące Elementy Wykryte w Kodzie Strony
          </h4>
          <ul className="space-y-2">
            {(lead.audit.missingElements || []).map((el: any, i: number) => {
              const text =
                typeof el === 'string'
                  ? el
                  : el?.title || el?.name || JSON.stringify(el);
              return (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-zinc-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Plan Naprawczy & Rekomendacje Wdrożeniowe
          </h4>
          <div className="space-y-3">
            {(lead.audit.recommendations || []).map((rec: any, i: number) => {
              const recTitle =
                typeof rec === 'string' ? rec : rec?.title || 'Usprawnienie';
              const recDetails = typeof rec === 'object' ? rec?.details : '';
              const recExpected =
                typeof rec === 'object' ? rec?.expectedResult : '';

              return (
                <div key={i} className="text-xs">
                  <div className="font-semibold text-purple-300">
                    {recTitle}
                  </div>
                  {recDetails && (
                    <p className="text-zinc-400 mt-0.5">{recDetails}</p>
                  )}
                  {recExpected && (
                    <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                      Cel: {recExpected}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTab;
