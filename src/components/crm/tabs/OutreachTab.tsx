import React from 'react';
import {
  Mail,
  Copy,
  Send,
  Smartphone,
  PhoneCall,
  BarChart3,
  Check,
  FileText,
  RefreshCw,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Lead, getWorkAgreementText } from '../../../types';

interface OutreachTabProps {
  lead: Lead;
  isGeneratingOutreach: boolean;
  onGenerateOutreach: () => void;
  supportWarrantyDays: number | '';
  onUpdateWarrantyDays: (val: number | '') => void;
  onOpenSmsModal: () => void;
  onOpenColdCallScript: () => void;
  onNavigateDemo: () => void;
  showToast: (msg: string) => void;
}

export const OutreachTab: React.FC<OutreachTabProps> = ({
  lead,
  isGeneratingOutreach,
  onGenerateOutreach,
  supportWarrantyDays,
  onUpdateWarrantyDays,
  onOpenSmsModal,
  onOpenColdCallScript,
  onNavigateDemo,
  showToast,
}) => {
  const handleCopyText = (text: string, label: string) => {
    const liveLink = `${window.location.origin}/?proposal=${lead.id}`;
    const resolved = (text || '').replace(/\[LINK_DO_DEMO\]/g, liveLink);
    navigator.clipboard.writeText(resolved);
    showToast(`Skopiowano ${label} do schowka!`);
  };

  const handleCopyRichEmail = (subject: string, body: string) => {
    const liveLink = `${window.location.origin}/?proposal=${lead.id}`;
    const resolvedBody = (body || '').replace(/\[LINK_DO_DEMO\]/g, liveLink);
    const formattedHtml = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222;"><p><strong>Temat:</strong> ${subject}</p><hr style="border: 0; border-top: 1px solid #ddd; margin: 12px 0;" />${resolvedBody.replace(/\n/g, '<br />')}</div>`;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([formattedHtml], { type: 'text/html' }),
            'text/plain': new Blob([`Temat: ${subject}\n\n${resolvedBody}`], {
              type: 'text/plain',
            }),
          }),
        ]);
        showToast('Skopiowano sformatowaną wiadomość (do wklejenia w Gmail / Outlook)!');
        return;
      }
    } catch {}
    navigator.clipboard.writeText(`Temat: ${subject}\n\n${resolvedBody}`);
    showToast('Skopiowano treść maila do schowka!');
  };

  const handleOpenMailto = () => {
    const recipient = lead.acceptedProposal?.clientEmail || '';
    const subject = encodeURIComponent(
      lead.outreachSubject || `Projekt nowej strony dla ${lead.name}`
    );
    const body = encodeURIComponent(
      lead.outreachBody ||
        `Dzień dobry,\n\nPrzygotowałem bezpłatny projekt demonstracyjny strony dla ${lead.name}.\n\nPozdrawiam,\nJan Kowalski`
    );
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  const handleCopyWorkAgreement = () => {
    const days =
      typeof supportWarrantyDays === 'number'
        ? supportWarrantyDays
        : lead.supportWarrantyDays || 30;
    navigator.clipboard.writeText(getWorkAgreementText(lead, supportWarrantyDays));
    showToast(`Skopiowano specyfikację techniczną (${days} dni gwarancji)!`);
  };

  if (!lead.outreachBody) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#12141c]/40 p-12 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <h3 className="text-base font-semibold text-zinc-200">
            Brak wygenerowanej wiadomości cold mail
          </h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-zinc-400">
            Kliknij przycisk poniżej, aby wygenerować profesjonalną propozycję współpracy
            opartą na wnioskach z audytu technicznego witryny {lead.name}.
          </p>
          <button
            onClick={onGenerateOutreach}
            disabled={isGeneratingOutreach}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generuj Ofertę (Szablon CRO)</span>
          </button>
        </div>
      </div>
    );
  }

  const effectiveDays =
    typeof supportWarrantyDays === 'number'
      ? supportWarrantyDays
      : lead.supportWarrantyDays || 30;

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {/* Subject Line */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Sugerowany Temat Wiadomości E-mail
          </label>
          <button
            onClick={() => handleCopyText(lead.outreachSubject || '', 'temat')}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Kopiuj Temat</span>
          </button>
        </div>
        <div className="mt-2 font-mono text-sm font-semibold text-white bg-zinc-900/90 rounded-xl p-3 border border-zinc-800">
          {lead.outreachSubject}
        </div>
      </div>

      {/* Main Email */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Główna Wiadomość Cold Mail (Perswazja CRO)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenMailto}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
            >
              <Send className="h-3.5 w-3.5 text-indigo-400" />
              <span>Wyślij (mailto:)</span>
            </button>
            <button
              onClick={onOpenSmsModal}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              <span>SMS / WhatsApp</span>
            </button>
            <button
              onClick={onOpenColdCallScript}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
              <span>Skrypt Cold Call</span>
            </button>
            <button
              onClick={() =>
                handleCopyRichEmail(lead.outreachSubject || '', lead.outreachBody || '')
              }
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Kopiuj HTML</span>
            </button>
            <button
              onClick={() => handleCopyText(lead.outreachBody || '', 'treść wiadomości')}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-500"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Kopiuj tekst</span>
            </button>
          </div>
        </div>
        <div className="whitespace-pre-wrap font-sans text-sm text-zinc-200 leading-relaxed bg-zinc-900/90 rounded-xl p-5 border border-zinc-800">
          {lead.outreachBody}
        </div>
      </div>

      {/* ROI Estimate */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Kalkulator Utraconych Przychodów Klienta (Dźwignia Handlowa)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-[#0d1419] p-3 text-center">
            <div className="text-[11px] text-zinc-400">Szacowana strata miesięczna</div>
            <div className="text-lg font-black text-rose-400 mt-1">
              {lead.roiEstimate?.monthlyLostRevenue || '4 800 - 8 500 PLN'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              z powodu uciekających użytkowników mobile
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-[#0d1419] p-3 text-center">
            <div className="text-[11px] text-zinc-400">Utraceni klienci / pacjenci</div>
            <div className="text-lg font-black text-amber-400 mt-1">
              {lead.roiEstimate?.lostClientsPerMonth || '12 - 20 miesięcznie'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              brak bezpośredniego CTA i rezerwacji
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-[#0d1419] p-3 text-center">
            <div className="text-[11px] text-zinc-400">Szacowany wzrost po wdrożeniu</div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {lead.roiEstimate?.projectedAnnualGain || '+28 000 PLN / rok'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              zwrot z nowej strony już w 1. miesiącu
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Sequence */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Gotowa Sekwencja Follow-Up (Większość zleceń zamyka się po 1-2 przypomnieniu)
        </h4>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">
              Follow-Up #1 (Wysyłany po 3 dniach)
            </span>
            <button
              onClick={() => handleCopyText(lead.outreachFollowUp1 || '', 'Follow-Up 1')}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            >
              <Copy className="h-3 w-3" />
              <span>Kopiuj</span>
            </button>
          </div>
          <div className="text-xs text-zinc-300 whitespace-pre-wrap font-sans">
            {lead.outreachFollowUp1 ||
              `Dzień dobry,\n\nNawiązując do mojej wiadomości sprzed 3 dni odnośnie strony ${lead.name} — czy udało się Państwu rzucić okiem na przygotowaną makietę demo?\n\nChętnie odpowiem na pytania.\n\nPozdrawiam!`}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">
              Follow-Up #2 (Ostatnia wiadomość po 6 dniach)
            </span>
            <button
              onClick={() => handleCopyText(lead.outreachFollowUp2 || '', 'Follow-Up 2')}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            >
              <Copy className="h-3 w-3" />
              <span>Kopiuj</span>
            </button>
          </div>
          <div className="text-xs text-zinc-300 whitespace-pre-wrap font-sans">
            {lead.outreachFollowUp2 ||
              `Dzień dobry,\n\nRozumiem, że mogą być Państwo obecnie bardzo zajęci, więc to moja ostatnia wiadomość w sprawie projektu strony dla ${lead.name}.\n\nProjekt demonstracyjny pozostawiam do Państwa dyspozycji.\n\nŻyczę sukcesów!`}
          </div>
        </div>
      </div>

      {/* Pricing Packages Overview */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Pakiety Wdrożeniowe (Stawki rynkowe)
          </h4>
          <button
            onClick={handleCopyWorkAgreement}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Kopiuj Specyfikację dla Klienta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="font-semibold text-zinc-300">
              {lead.pricingPackages?.start?.name || 'Pakiet Mini / Start'}
            </div>
            <div className="text-xl font-black text-white my-1.5">
              {lead.pricingPackages?.start?.price || '890 PLN'}
            </div>
            <ul className="text-zinc-400 space-y-1 text-[11px] mt-2">
              <li>✓ Nowoczesny One-Page w Tailwind CSS</li>
              <li>✓ 100% responsywność na smartfony</li>
              <li>✓ Darmowy hosting w chmurze (0 zł / mc!)</li>
              <li>✓ Realizacja w 48h</li>
            </ul>
          </div>

          <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 relative overflow-hidden">
            <div className="absolute top-2 right-2 rounded-full bg-purple-500/30 px-2 py-0.5 text-[9px] font-bold text-purple-200 uppercase">
              Bestseller
            </div>
            <div className="font-semibold text-purple-200">
              {lead.pricingPackages?.business?.name || 'Pakiet Standard'}
            </div>
            <div className="text-xl font-black text-purple-300 my-1.5">
              {lead.pricingPackages?.business?.price || '1 490 PLN'}
            </div>
            <ul className="text-zinc-300 space-y-1 text-[11px] mt-2">
              <li>✓ Wszystko z pakietu Start</li>
              <li>✓ Pływające Sticky CTA na telefon</li>
              <li>✓ Formularz kontaktowy z powiadomieniami</li>
              <li>✓ Opinie klientów z Google i mapa dojazdu</li>
              <li>✓ Optymalizacja szybkości (&lt; 0.5s)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-zinc-200">
                {lead.pricingPackages?.vip?.name || 'Pakiet Kompleksowy + Opieka'}
              </div>
              <span className="text-[9px] rounded-full bg-purple-600/30 text-purple-300 px-2 py-0.5 font-bold uppercase">
                VIP
              </span>
            </div>
            <div className="text-xl font-black text-white my-1.5">
              {lead.pricingPackages?.vip?.price || '2 190 PLN'}
            </div>
            <ul className="text-zinc-400 space-y-1 text-[11px] mt-2">
              <li>✓ Wszystko z pakietu Standard</li>
              <li>✓ Dedykowany copywriting autorski</li>
              <li>✓ Konfiguracja firmowej poczty w domenie</li>
              <li>✓ Zgodność z RODO i baner cookies</li>
              <li className="text-emerald-300 font-semibold flex items-center gap-1.5 mt-1 bg-emerald-950/40 p-1 rounded-md border border-emerald-500/30">
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>
                  Gwarancja wsparcia: <strong>{effectiveDays} dni</strong>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onGenerateOutreach}
          disabled={isGeneratingOutreach}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Odśwież wersję szablonu</span>
        </button>
        <button
          onClick={onNavigateDemo}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          <span>Przejdź do strony One-Page</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
