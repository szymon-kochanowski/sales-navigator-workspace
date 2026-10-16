import React, { useState } from 'react';
import { Server, Copy, Zap, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Lead } from '../../../types';

interface HostingTabProps {
  lead: Lead;
  showToast: (msg: string) => void;
}

export const HostingTab: React.FC<HostingTabProps> = ({ lead, showToast }) => {
  const [hostingSubTab, setHostingSubTab] = useState<
    'compare' | 'calculator' | 'guide' | 'checklist'
  >('compare');
  const [calcHostingType, setCalcHostingType] = useState<
    'cloud' | 'polish_nvme' | 'care_subscription'
  >('cloud');
  const [calcYears, setCalcYears] = useState<number>(2);

  const recommendationText = `Dzień dobry,

W nawiązaniu do projektu nowej strony dla ${lead.name}, przygotowałem jasną rekomendację techniczną odnośnie domeny i hostingu, aby nie ponosili Państwo zbędnych kosztów:

1. DOMENA (.pl):
Zalecam rejestrację domeny np. w SeoHost.pl lub OVHcloud (koszt to zaledwie ~15 zł za 1. rok i ~50-55 zł rocznie za odnowienie). Domena zostaje zarejestrowana w 100% na Państwa firmę jako jedynego właściciela.

2. HOSTING / SERWER (0 ZŁ / MIESIĄC):
Strona została zaprojektowana w nowoczesnej architekturze One-Page (Tailwind CSS). Oznacza to, że nie wymaga ona drogiego serwera za 800 zł rocznie, jak w przypadku tradycyjnych agencji.
Możemy ją uruchomić w bezpłatnej, ultraszybkiej chmurze Cloudflare Pages / Vercel (koszt serwera: 0 zł na zawsze, darmowy certyfikat SSL HTTPS, pełna ochrona przed awariami).

Alternatywnie: Jeśli potrzebują Państwo tradycyjnych firmowych skrzynek e-mail (np. biuro@...), polecam polski pakiet SSD NVMe w SeoHost za jedyne ~79 zł rocznie.

W razie pytań, chętnie pomogę we wszystkim krok po kroku!
Jan Kowalski — Web Developer`;

  const handleCopyClientRecommendation = () => {
    navigator.clipboard.writeText(recommendationText);
    showToast('Skopiowano rekomendację techniczną dla klienta!');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              Centrum Hostingu & Infrastruktury dla {lead.name}
            </h3>
            <p className="text-xs text-zinc-400">
              Jak zaoszczędzić klientowi 800 zł rocznie na serwerze i wybrać optymalne wdrożenie.
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyClientRecommendation}
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Kopiuj Rekomendację dla Klienta</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-medium">
        {[
          { id: 'compare', label: '1. Porównanie Opcji Hostingowych (4 Ścieżki)' },
          { id: 'calculator', label: '2. Kalkulator Kosztów & Oszczędności Klienta' },
          { id: 'guide', label: '3. Instrukcja dla Klienta (Gotowy Tekst)' },
          { id: 'checklist', label: '4. Checklist Bezpiecznego Wdrożenia' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setHostingSubTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl transition ${
              hostingSubTab === tab.id
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {hostingSubTab === 'compare' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-5 flex flex-col justify-between relative">
            <div className="absolute top-3 right-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              0 ZŁ / ROK (REKOMENDOWANE)
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <h4 className="font-bold text-white text-sm">Chmura Serverless Edge (One-Page)</h4>
              </div>
              <div className="text-xs text-zinc-400 mb-3">
                Cloudflare Pages / Vercel / GitHub Pages
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                Strona One-Page w Tailwind CSS jest czystym kodem statycznym. Klient płaci wyłącznie kilkanaście złotych rocznie za samą domenę, a serwer i SSL są w 100% bezpłatne.
              </p>
            </div>
            <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-xs">
              <span className="text-purple-300 font-semibold">
                Oszczędność klienta: ~600 - 900 zł rocznie
              </span>
              <button
                onClick={handleCopyClientRecommendation}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline"
              >
                Poleć klientowi →
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">
                  Polski Hosting Biznes NVMe (~79 zł/rok)
                </h4>
              </div>
              <div className="text-xs text-zinc-400 mb-3">SeoHost.pl / LH.pl</div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                Wybierz ten wariant, jeśli właściciel firmy potrzebuje tradycyjnych kont pocztowych w domenie (np. biuro@...).
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Koszt łączny z domeną: ~110 - 140 zł / rok</span>
              <span className="text-indigo-400 font-semibold">Uczciwy standard MŚP</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">
                  Model Twojego Abonamentu (Dochód Pasywny 89-149 zł/mc)
                </h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                Ty dbasz o działanie strony, kopie zapasowe i drobne aktualizacje cennika. Strona stoi na darmowej chmurze, więc cały abonament to Twój czysty zysk!
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-300 font-semibold">
              10 klientów = ~1 000 - 1 490 PLN / mc pasywnie
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h4 className="font-bold text-white text-sm">
                  Pułapka Wielkich Operatorów (Odnowienia 800-1200 zł)
                </h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                Użyj tego jako argumentu sprzedażowego: uświadamiasz klienta, że chronisz go przed ukrytymi kosztami odnowień serwerów w tradycyjnych firmach.
              </p>
            </div>
            <div className="pt-2 border-t border-rose-500/20 text-xs text-rose-300 font-semibold">
              Buduje autorytet techniczny
            </div>
          </div>
        </div>
      )}

      {hostingSubTab === 'calculator' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-zinc-300">
                Wybierz model hostingu dla {lead.name}:
              </label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  {
                    id: 'cloud',
                    title: 'Chmura Serverless (Cloudflare / Vercel)',
                    sub: 'Serwer: 0 zł / mc • Domena: ~15 zł 1. rok, ~55 zł odnowienie',
                  },
                  {
                    id: 'polish_nvme',
                    title: 'Polski Hosting Biznes NVMe (SeoHost)',
                    sub: 'Serwer: ~79 zł / rok ze skrzynkami e-mail',
                  },
                  {
                    id: 'care_subscription',
                    title: 'Twój Abonament z Opieką Techniczną',
                    sub: '69 zł / mc płacone Tobie (Hosting + opieka + aktualizacje)',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCalcHostingType(opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition ${
                      calcHostingType === opt.id
                        ? 'border-purple-500 bg-purple-950/30 text-white'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-purple-300">{opt.title}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                {[1, 2, 3].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setCalcYears(yr)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                      calcYears === yr
                        ? 'border-purple-500 bg-purple-600 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {yr} {yr === 1 ? 'Rok' : 'Lata'}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 flex flex-col justify-between">
              {(() => {
                const domainCost = 15 + (calcYears - 1) * 55;
                const hostingCost =
                  calcHostingType === 'cloud'
                    ? 0
                    : calcHostingType === 'polish_nvme'
                    ? 79 * calcYears
                    : 69 * 12 * calcYears;
                const totalClientCost = domainCost + hostingCost;
                const agencyCost = 250 + (calcYears - 1) * 850 + (15 + (calcYears - 1) * 160);
                const savings = agencyCost - totalClientCost;
                return (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Koszt domeny .pl:</span>
                      <span className="font-semibold text-white">{domainCost} PLN</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Koszt serwera:</span>
                      <span className="font-semibold text-white">{hostingCost} PLN</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-700 text-sm">
                      <span className="font-bold text-white">Łączny wydatek klienta:</span>
                      <span className="font-black text-purple-400">{totalClientCost} PLN</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        Oszczędność klienta względem tradycyjnych operatorów
                      </div>
                      <div className="text-xl font-black text-emerald-400 mt-1">
                        +{savings > 0 ? savings : 0} PLN
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {hostingSubTab === 'guide' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-6 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {recommendationText}
          </div>
        </div>
      )}

      {hostingSubTab === 'checklist' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#12141c] p-6 space-y-3">
          {[
            '1. Rejestracja domeny ZAWSZE na dane klienta w SeoHost / OVH.',
            '2. Wdrożenie paczki ZIP na Cloudflare Pages / Vercel lub katalog public_html.',
            '3. Weryfikacja automatycznego certyfikatu SSL (HTTPS Let\'s Encrypt).',
            '4. Test formularza kontaktowego oraz przycisku Click-to-Call na telefonie.',
            '5. Test szybkości Google PageSpeed Insights (cel: 95-100/100).',
            '6. Zgłoszenie domeny do Google Search Console.',
          ].map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs text-zinc-200"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
