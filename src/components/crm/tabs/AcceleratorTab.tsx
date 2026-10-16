import React, { useState } from 'react';
import {
  TrendingUp,
  BookOpen,
  Copy,
  FileText,
  Shield,
  Receipt,
  Download,
  PhoneCall,
  ChevronDown,
} from 'lucide-react';
import {
  Lead,
  UpsellItem,
  UPSELL_OPTIONS,
  OBJECTION_ITEMS,
  getWorkContractText,
} from '../../../types';
import { DocumentType } from '../../DocumentStudioModal';

interface AcceleratorTabProps {
  lead: Lead;
  subTab: 'upsells' | 'contract' | 'coldcall' | 'goals';
  onSubTabChange: (tab: 'upsells' | 'contract' | 'coldcall' | 'goals') => void;
  monthlyGoalPLN: number;
  onMonthlyGoalChange: (val: number) => void;
  supportWarrantyDays: number | '';
  onOpenStartGuide: () => void;
  onOpenDocStudio: (type: DocumentType) => void;
  showToast: (msg: string) => void;
}

export const AcceleratorTab: React.FC<AcceleratorTabProps> = ({
  lead,
  subTab,
  onSubTabChange,
  monthlyGoalPLN,
  onMonthlyGoalChange,
  supportWarrantyDays,
  onOpenStartGuide,
  onOpenDocStudio,
  showToast,
}) => {
  const [selectedBasePackage, setSelectedBasePackage] = useState<
    'start' | 'business' | 'vip'
  >('business');
  const [selectedUpsellIds, setSelectedUpsellIds] = useState<Record<string, boolean>>({
    retainer_care: true,
    google_maps_seo: true,
    booking_sms: true,
  });
  const [coldCallObjectionOpen, setColdCallObjectionOpen] = useState<string | null>(
    'obj_1'
  );

  const basePriceNum =
    selectedBasePackage === 'start' ? 890 : selectedBasePackage === 'vip' ? 2190 : 1490;
  const baseName =
    selectedBasePackage === 'start'
      ? 'Pakiet Start'
      : selectedBasePackage === 'vip'
      ? 'Pakiet VIP'
      : 'Pakiet Standard';

  const activeUpsells = UPSELL_OPTIONS.filter((u) => selectedUpsellIds[u.id]);
  const onetimeUpsellsTotal = activeUpsells
    .filter((u) => u.category === 'onetime')
    .reduce((sum, u) => sum + u.pricePLN, 0);
  const monthlyRetainerTotal = activeUpsells
    .filter((u) => u.category === 'recurring')
    .reduce((sum, u) => sum + u.pricePLN, 0);

  const totalUpfront = basePriceNum + onetimeUpsellsTotal;
  const advance = Math.round(totalUpfront * 0.5);
  const warrantyDays =
    typeof supportWarrantyDays === 'number'
      ? supportWarrantyDays
      : lead.supportWarrantyDays || 30;

  const handleCopyUpsellProposal = () => {
    const list = activeUpsells
      .map(
        (u) =>
          `• ${u.name} (+${u.pricePLN} PLN ${u.periodText || ''})\n  Dlaczego warto: ${
            u.benefitToClient
          }`
      )
      .join('\n\n');

    const msg = `Dzień dobry,\n\nW nawiązaniu do projektu nowej strony internetowej dla ${
      lead.name
    }, przygotowałem rekomendację dodatkowych modułów:\n\n${list}\n\nPODSUMOWANIE PAKIETU:\n- Całkowity koszt wdrożenia pod klucz: ${totalUpfront.toLocaleString(
      'pl-PL'
    )} PLN (w tym 50% zadatku: ${advance} PLN)\n${
      monthlyRetainerTotal > 0
        ? `- Stała opieka techniczna: ${monthlyRetainerTotal} PLN / mc\n`
        : ''
    }- Bezpłatny hosting chmurowy (0 zł / mc)\n\nZ poważaniem,\nJan Kowalski — Web Developer`;

    navigator.clipboard.writeText(msg);
    showToast('Skopiowano propozycję modułów do klienta!');
  };

  const handleCopyContract = () => {
    const text = getWorkContractText(
      lead,
      basePriceNum,
      baseName,
      totalUpfront,
      advance,
      monthlyRetainerTotal,
      warrantyDays,
      activeUpsells
    );
    navigator.clipboard.writeText(text);
    showToast('Skopiowano treść umowy B2B z zadatkiem 50% do schowka!');
  };

  const handleDownloadContractDocument = () => {
    const contractText = getWorkContractText(
      lead,
      basePriceNum,
      baseName,
      totalUpfront,
      advance,
      monthlyRetainerTotal,
      warrantyDays,
      activeUpsells
    );
    const htmlContent = `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Umowa — ${lead.name}</title><style>body{font-family:sans-serif;line-height:1.6;max-width:840px;margin:40px auto;padding:0 20px;}pre{white-space:pre-wrap;font-family:sans-serif;}</style></head><body><pre>${contractText}</pre></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Umowa_Wdrozeniowa_${(lead.name || 'klient').replace(
      /[^a-zA-Z0-9]/g,
      '_'
    )}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Pobrano gotową umowę z zadatkiem 50%!');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              Akcelerator Zarobków dla zlecenia: {lead.name}
            </h3>
            <p className="text-xs text-zinc-400">
              Zwiększ wartość każdego zlecenia za pomocą modułów upsell, umowy z zadatkiem 50% i skryptu rozmowy.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenStartGuide}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Legalny Start Bez Firmy (Poradnik)</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-medium">
        {[
          { id: 'upsells', label: '1. Moduły Dodatkowe & Upselle (+800 do 2 000 zł)' },
          { id: 'contract', label: '2. Umowa z Zadatkiem 50% (B2B / O Dzieło)' },
          { id: 'coldcall', label: '3. Skrypt Rozmowy & Zbijanie 5 Obiekcji' },
          { id: 'goals', label: '4. Cel Miesięczny & Kalkulator NDG' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => onSubTabChange(t.id as any)}
            className={`px-3 py-1.5 rounded-xl transition ${
              subTab === t.id
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'upsells' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: 'start', name: 'Pakiet Start', price: 890, desc: 'One-Page w 48h' },
              {
                key: 'business',
                name: 'Pakiet Standard (Bestseller)',
                price: 1490,
                desc: 'Sticky CTA + Opinie + SEO',
              },
              {
                key: 'vip',
                name: 'Pakiet Kompleksowy VIP',
                price: 2190,
                desc: 'Copywriting + Poczta + Gwarancja',
              },
            ].map((pkg) => (
              <button
                key={pkg.key}
                type="button"
                onClick={() => setSelectedBasePackage(pkg.key as any)}
                className={`p-4 rounded-xl border text-left transition ${
                  selectedBasePackage === pkg.key
                    ? 'border-emerald-500 bg-emerald-950/30 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{pkg.name}</span>
                  <span className="text-sm font-black text-emerald-400">{pkg.price} PLN</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{pkg.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {UPSELL_OPTIONS.map((item) => {
                const isChecked = Boolean(selectedUpsellIds[item.id]);
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      setSelectedUpsellIds((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                      isChecked
                        ? 'border-emerald-500/50 bg-emerald-950/20'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{item.name}</span>
                          {item.badge && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300">{item.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-white">+{item.pricePLN} PLN</div>
                      <div className="text-[10px] text-zinc-400">
                        {item.periodText || 'jednorazowo'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/25 p-5 space-y-4 h-fit">
              <div className="border-b border-emerald-500/20 pb-3">
                <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">
                  Wynagrodzenie z tego zlecenia:
                </span>
                <div className="text-3xl font-black text-white mt-1">
                  {totalUpfront.toLocaleString('pl-PL')} PLN
                </div>
                <div className="text-xs text-zinc-300 mt-1">
                  Zadatek 50% przed pracami:{' '}
                  <strong className="text-emerald-400">
                    {advance.toLocaleString('pl-PL')} PLN
                  </strong>
                </div>
              </div>

              <button
                onClick={handleCopyUpsellProposal}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Kopiuj Ofertę Modułów</span>
              </button>

              <button
                onClick={() => onSubTabChange('contract')}
                className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                <span>Wygeneruj Umowę z Zadatkiem 50% →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {subTab === 'contract' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <h4 className="font-bold text-white text-base">
                Umowa Wdrożeniowa B2B / o Dzieło (Zadatek 50%: {advance} PLN)
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenDocStudio('work_contract')}
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
              >
                <Receipt className="h-3.5 w-3.5 text-purple-400" />
                <span>Otwórz Studio Dokumentów</span>
              </button>
              <button
                onClick={handleCopyContract}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Kopiuj Umowę</span>
              </button>
              <button
                onClick={handleDownloadContractDocument}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Pobierz HTML</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[540px] overflow-y-auto">
            {getWorkContractText(
              lead,
              basePriceNum,
              baseName,
              totalUpfront,
              advance,
              monthlyRetainerTotal,
              warrantyDays,
              activeUpsells
            )}
          </div>
        </div>
      )}

      {subTab === 'coldcall' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="h-5 w-5 text-amber-400" />
                <h4 className="font-bold text-white text-base">
                  60-Sekundowy Skrypt Rozmowy Telefonicznej (Cold Call)
                </h4>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Dzień dobry, z tej strony Jan Kowalski (Web Developer). Dzwonię na 60 sekund w sprawie strony ${lead.name}. Zauważyłem, że na smartfonach brakuje szybkiego przycisku połączenia. Przygotowałem bezpłatną makietę nowej strony One-Page. Czy mogę wysłać SMS-em link do rzucenia okiem w 30 sekund?`
                  );
                  showToast('Skopiowano skrypt rozmowy telefonicznej!');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Kopiuj Skrypt</span>
              </button>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed">
              „Dzień dobry, z tej strony Jan Kowalski (Web Developer). Dzwonię krótko w sprawie strony <strong>{lead.website || lead.name}</strong>. Zauważyłem, że witryna wolno ładuje się na smartfonach i brakuje pływającego przycisku połączenia. Przygotowałem dla Państwa bezpłatną, działającą wersję demonstracyjną nowej strony One-Page. Czy mogę przesłać bezpośredni link SMS-em, żeby mogli Państwo w 30 sekund ocenić na telefonie?”
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-6 space-y-3">
            <h4 className="font-bold text-white text-base">
              Matryca Zbijania 5 Najczęstszych Obiekcji Klientów
            </h4>
            {OBJECTION_ITEMS.map((item) => {
              const isOpen = coldCallObjectionOpen === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setColdCallObjectionOpen(isOpen ? null : item.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-zinc-800/50"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{item.objection}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{item.context}</div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 transition-transform ${
                        isOpen ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-2 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2 text-xs">
                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-200">
                        {item.response}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        <strong className="text-emerald-400">Wskazówka psychologiczna:</strong>{' '}
                        {item.psychologyTip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'goals' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-6 space-y-4">
          <h4 className="font-bold text-white text-base">
            Cel Miesięczny & Limity Prawne (Działalność Nierejestrowana)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-2">
              <span className="text-xs text-zinc-400">Twój Cel Miesięczny (PLN):</span>
              <input
                type="number"
                min="500"
                max="50000"
                step="500"
                value={monthlyGoalPLN}
                onChange={(e) =>
                  onMonthlyGoalChange(Math.max(500, parseInt(e.target.value, 10) || 500))
                }
                className="w-full rounded-lg border border-emerald-500/40 bg-zinc-950 px-3 py-1.5 text-lg font-black text-emerald-400 focus:outline-none"
              />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <span className="text-xs text-zinc-400">Liczba Zleceń do Celu:</span>
              <div className="text-2xl font-black text-white mt-1">
                {Math.ceil(monthlyGoalPLN / 1490)} wdrożenia
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">przy pakiecie Standard 1 490 PLN</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <span className="text-xs text-zinc-400">Rekomendowana forma rozliczenia:</span>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {monthlyGoalPLN <= 3500
                  ? 'Działalność Nierejestrowana (0 zł ZUS)'
                  : 'Umowa o Dzieło z 50% KUP'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
