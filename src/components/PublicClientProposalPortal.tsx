import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Smartphone,
  ExternalLink,
  Shield,
  Zap,
  Server,
  ArrowRight,
  Check,
  Phone,
  Mail,
  User,
  Building2,
} from 'lucide-react';

interface PublicProposalProps {
  leadId: string;
  isEmbeddedPreview?: boolean;
  onBackToAdmin?: () => void;
}

export default function PublicClientProposalPortal({
  leadId,
  isEmbeddedPreview = false,
  onBackToAdmin,
}: PublicProposalProps) {
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPackage, setSelectedPackage] = useState<'start' | 'business' | 'vip'>('business');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    let isMounted = true;
    const fetchProposal = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/proposal/${leadId}`);
        if (!res.ok) {
          throw new Error('Nie znaleziono prezentacji dla wybranego identyfikatora.');
        }
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.proposal) {
            setProposal(data.proposal);
            setClientName(data.proposal.name || '');
            if (data.proposal.status === 'Oferta zaakceptowana') {
              setIsSubmitted(true);
            }
          } else {
            setError(data.error || 'Błąd ładowania propozycji');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Błąd połączenia z serwerem prezentacji');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProposal();
    return () => {
      isMounted = false;
    };
  }, [leadId]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientPhone.trim() && !clientEmail.trim()) {
      alert('Proszę podać numer telefonu lub adres e-mail do kontaktu.');
      return;
    }
    setIsSubmitting(true);
    try {
      const packageName =
        selectedPackage === 'start'
          ? proposal?.pricingPackages?.start?.name || 'Pakiet Start'
          : selectedPackage === 'vip'
          ? proposal?.pricingPackages?.vip?.name || 'Pakiet Kompleksowy + Opieka'
          : proposal?.pricingPackages?.business?.name || 'Pakiet Standard (Bestseller)';

      const res = await fetch(`/api/public/proposal/${leadId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName,
          clientName: clientName || proposal?.name,
          clientPhone,
          clientEmail,
          clientNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSubmitted(true);
      } else {
        alert(data.error || 'Wystąpił błąd podczas potwierdzania propozycji. Spróbuj ponownie.');
      }
    } catch (err: any) {
      alert(err.message || 'Błąd połączenia z serwerem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center text-zinc-300 font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 animate-pulse mb-4">
          <Globe className="h-6 w-6" />
        </div>
        <div className="text-sm font-semibold text-white">Ładowanie dedykowanej prezentacji projektu...</div>
        <p className="mt-1 text-xs text-zinc-500">Pobieranie makiety strony One-Page i audytu technicznego</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center text-zinc-300 font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="text-base font-bold text-white">Nie znaleziono prezentacji</div>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm">{error || 'Link mógł wygasnąć lub jest niepoprawny.'}</p>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="mt-6 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Powrót do panelu Workspace
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`font-sans text-zinc-100 selection:bg-purple-500 selection:text-white ${isEmbeddedPreview ? 'bg-transparent' : 'min-h-screen bg-[#090a0f]'}`}>
      {/* Top Banner Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0c0e14]/90 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Dedykowana Propozycja Nowej Strony
              </div>
              <div className="font-bold text-sm text-white sm:text-base leading-tight">
                {proposal.name} {proposal.city ? `(${proposal.city})` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <span className="text-zinc-400">Wykonawca: </span>
              <strong className="text-white">Jan Kowalski</strong>
              <div className="text-[10px] text-emerald-400 font-medium">Web Developer • Realizacja 48h</div>
            </div>
            <a
              href="#zamow"
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition"
            >
              Zamów wdrożenie
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12 space-y-12">
        {/* HERO SECTION */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/30 px-3.5 py-1 text-xs font-semibold text-purple-300">
            <span>Działająca Makieta One-Page + Raport DOM/SEO</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Nowoczesna, Responsywna Strona WWW <br className="hidden sm:inline" />
            dla firmy <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">{proposal.name}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Przygotowałem dla Państwa bezpłatną, w pełni działającą demonstrację nowej strony internetowej. Została zaprojektowana tak, aby perfekcyjnie wyświetlać się na smartfonach, natychmiast ułatwiać kontakt i pozyskiwać zlecenia od klientów z {proposal.city || 'Państwa regionu'}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-zinc-300">
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 font-medium">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Czas wdrożenia: 48 - 72h
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 font-medium">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Brak zaliczek przed prezentacją
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 font-medium">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Koszt hostingu w chmurze: 0 zł / mc
            </span>
          </div>
        </section>

        {/* SECTION 1: AUDIT & COMPARISON */}
        <section className="rounded-3xl border border-zinc-800 bg-[#12141c] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                1. Analiza Obecnej Strony (Raport DOM & SEO)
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Dlaczego warto odświeżyć obecną stronę {proposal.website ? `(${proposal.website.replace(/^https?:\/\//, '')})` : ''}?
              </h2>
            </div>
            {proposal.audit?.score && (
              <div className="flex items-center gap-2 self-start rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                <span>Ocena techniczna:</span>
                <span className="text-sm font-black">{proposal.audit.score}/100</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Brak przycisków szybkiego kontaktu</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Na obecnej witrynie klient przeglądający ofertę na telefonie nie ma pod ręką stałego przycisku „Zadzwoń teraz” lub „Zamów wycenę”. Wielu użytkowników rezygnuje i wraca do Google.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <Smartphone className="h-4 w-4 shrink-0" />
                <span>Słabe dopasowanie do smartfonów</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ponad 70% klientów lokalnych szuka usług na telefonie komórkowym. Brak nowoczesnej responsywności i wolne wczytywanie powoduje natychmiastowe opuszczenie witryny.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                <Shield className="h-4 w-4 shrink-0" />
                <span>Brak budowania zaufania (Opinie)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Brak wyróżnionych referencji, opinii z Google oraz przejrzystego cennika obniża gotowość klienta do powierzenia zlecenia Państwa firmie.
              </p>
            </div>
          </div>

          {/* ROI highlight */}
          {proposal.roiEstimate && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Potencjalny Wzrost Przychodów
                </div>
                <div className="text-sm font-semibold text-white mt-1">
                  Szacowany odzyskany obrót z ruchu mobilnego po wdrożeniu nowej strony:
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {proposal.roiEstimate.monthlyLostRevenue || '4 800 - 8 500 PLN'} / mc
                </div>
                <div className="text-[11px] text-zinc-400">Nowa strona zwraca się po pierwszym zleceniu!</div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: LIVE INTERACTIVE DEMO */}
        <section className="rounded-3xl border border-zinc-800 bg-[#12141c] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                2. Interaktywna Makieta na Żywo
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Przetestuj działanie nowej strony demonstracyjnej
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Możesz swobodnie przewijać, sprawdzać przyciski i przełączać widok między komputerem a smartfonem.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    previewDevice === 'desktop'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Komputer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    previewDevice === 'mobile'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Smartfon</span>
                </button>
              </div>
              <a
                href={proposal.demoSitePreviewUrl || `/api/leads/${proposal.leadId || proposal.id || leadId}/site-preview`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pełny Ekran</span>
              </a>
            </div>
          </div>

          <div className="flex justify-center bg-zinc-950/80 rounded-2xl border border-zinc-800 p-4 overflow-hidden">
            <div
              className={`transition-all duration-300 rounded-xl overflow-hidden shadow-2xl bg-white border border-zinc-700 ${
                previewDevice === 'desktop' ? 'w-full' : 'w-[375px]'
              }`}
            >
              <iframe
                title={`Makieta demonstracyjna dla ${proposal.name}`}
                srcDoc={proposal.demoSiteHtml || undefined}
                src={proposal.demoSitePreviewUrl || `/api/leads/${proposal.leadId || proposal.id || leadId}/site-preview`}
                className="w-full min-h-[580px] border-0 bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: HOSTING & DOMAIN COMPARISON */}
        <section className="rounded-3xl border border-zinc-800 bg-[#12141c] p-6 sm:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
              3. Uczciwy Hosting & Domena
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              Dlaczego ze mną nie przepłacasz 800 zł rocznie za serwer?
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Jako niezależny web developer stosuję nowoczesną architekturę Jamstack. Twoja strona nie potrzebuje drogiej machiny serwerowej.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  NAJCZĘŚCIEJ WYBIERANE
                </span>
                <h3 className="font-bold text-white text-base mt-2">Darmowy Hosting w Chmurze</h3>
                <div className="text-2xl font-black text-emerald-400 my-2">0 zł / miesiąc</div>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>0 zł za serwer (Cloudflare / Vercel)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Darmowy certyfikat SSL (kłódeczka HTTPS)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Płacisz tylko za domenę .pl (~15 zł / rok)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>100% odporność na wirusy i awarie</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-500/20 text-[11px] text-zinc-400">
                Idealne dla wizytówek One-Page.
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                  GDY CHCESZ POCZTĘ E-MAIL
                </span>
                <h3 className="font-bold text-white text-base mt-2">Polski Hosting Biznes (NVMe)</h3>
                <div className="text-2xl font-black text-white my-2">~79 zł / rok</div>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Nielimitowane skrzynki pocztowe w domenie</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Serwery w Polsce (SeoHost.pl)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Polska pomoc techniczna 24/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Stała niska cena odnowienia</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400">
                Dla firm wymagających tradycyjnej poczty IMAP.
              </div>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  PUŁAPKA RYNKOWA
                </span>
                <h3 className="font-bold text-white text-base mt-2">Typowa Agencja Marketingowa</h3>
                <div className="text-2xl font-black text-rose-400 my-2">600 - 1 200 zł / rok</div>
                <ul className="space-y-2 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Drogi serwer po 1. roku</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Odnowienie domeny po zawyżonych cenach</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Płatne certyfikaty SSL i ukryte opłaty</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-500/20 text-[11px] text-rose-300 font-semibold">
                Ze mną oszczędzasz te kwoty co roku!
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PRICING PACKAGES */}
        <section id="zamow" className="rounded-3xl border border-zinc-800 bg-[#12141c] p-6 sm:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4 text-center max-w-xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
              4. Cennik Wdrożenia (Stawki Uczciwe)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              Wybierz pakiet dopasowany do potrzeb Twojej firmy
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Jednorazowy koszt wdrożenia pod klucz. Płacisz dopiero po zaakceptowaniu działającej strony!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Package 1: Start */}
            <div
              onClick={() => setSelectedPackage('start')}
              className={`cursor-pointer rounded-2xl p-6 border transition flex flex-col justify-between ${
                selectedPackage === 'start'
                  ? 'border-purple-500 bg-purple-950/20 shadow-xl shadow-purple-900/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {proposal.pricingPackages?.start?.name || 'Pakiet Start'}
                </div>
                <div className="text-2xl font-black text-white my-3">
                  {proposal.pricingPackages?.start?.price || '890 PLN'}
                </div>
                <p className="text-xs text-zinc-400 mb-4">Szybki start dla lokalnej firmy</p>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Nowoczesna strona One-Page w Tailwind CSS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>100% dopasowanie do smartfonów i tabletów</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Darmowy hosting w chmurze (0 zł / mc)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Certyfikat SSL i podpięcie domeny .pl</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Czas realizacji: 48h</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                  selectedPackage === 'start'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {selectedPackage === 'start' ? '✓ Wybrany pakiet' : 'Wybierz Pakiet Start'}
              </button>
            </div>

            {/* Package 2: Standard (Bestseller) */}
            <div
              onClick={() => setSelectedPackage('business')}
              className={`cursor-pointer rounded-2xl p-6 border transition flex flex-col justify-between relative ${
                selectedPackage === 'business'
                  ? 'border-purple-500 bg-purple-950/40 shadow-2xl shadow-purple-900/30 ring-1 ring-purple-500'
                  : 'border-purple-500/40 bg-zinc-900/80 hover:border-purple-400'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-md">
                Bestseller • Rekomendowany
              </div>
              <div>
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider mt-1">
                  {proposal.pricingPackages?.business?.name || 'Pakiet Standard'}
                </div>
                <div className="text-3xl font-black text-purple-200 my-3">
                  {proposal.pricingPackages?.business?.price || '1 490 PLN'}
                </div>
                <p className="text-xs text-purple-300/80 mb-4">Pełne wdrożenie zwiększające liczbę klientów</p>
                <ul className="space-y-2.5 text-xs text-zinc-200">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Wszystko z pakietu Start</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Pływający przycisk szybkiego kontaktu Click-to-Call</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Interaktywny formularz kontaktowy z powiadomieniami</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Sekcja opinii klientów z Google i mapa dojazdu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Optymalizacja szybkości ładowania (&lt;0.5s)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Zgodność z RODO i baner cookies</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                  selectedPackage === 'business'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-zinc-800 text-purple-200 hover:bg-zinc-700'
                }`}
              >
                {selectedPackage === 'business' ? '✓ Wybrany pakiet (Zalecany)' : 'Wybierz Pakiet Standard'}
              </button>
            </div>

            {/* Package 3: VIP */}
            <div
              onClick={() => setSelectedPackage('vip')}
              className={`cursor-pointer rounded-2xl p-6 border transition flex flex-col justify-between ${
                selectedPackage === 'vip'
                  ? 'border-purple-500 bg-purple-950/20 shadow-xl shadow-purple-900/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {proposal.pricingPackages?.vip?.name || 'Pakiet Kompleksowy + Opieka'}
                </div>
                <div className="text-2xl font-black text-white my-3">
                  {proposal.pricingPackages?.vip?.price || '2 190 PLN'}
                </div>
                <p className="text-xs text-zinc-400 mb-4">Dla firm wymagających pełnego serwisu</p>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Wszystko z pakietu Standard</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Autorski copywriting branżowy (unikalne teksty)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Konfiguracja firmowej poczty w domenie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Kompletne zgłoszenie i indeksacja w Google</span>
                  </li>
                  <li className="flex items-start gap-2 text-emerald-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>{proposal.supportWarrantyDays || 30} dni bezpłatnej gwarancji wsparcia</strong></span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                  selectedPackage === 'vip'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {selectedPackage === 'vip' ? '✓ Wybrany pakiet' : 'Wybierz Pakiet VIP'}
              </button>
            </div>
          </div>

          {/* CONFIRMATION / ORDER FORM */}
          <div className="mt-8 rounded-2xl border border-purple-500/30 bg-[#0d0f17] p-6 sm:p-8 space-y-6">
            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Dziękujemy za potwierdzenie zamówienia!
                </h3>
                <p className="mx-auto max-w-lg text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Zgłoszenie zostało pomyślnie zarejestrowane. Skontaktujemy się z Państwem w ciągu 2-4 godzin w celu ustalenia terminu wdrożenia.
                </p>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 max-w-md mx-auto text-xs text-emerald-300">
                  Przypomnienie: Nie ponoszą Państwo żadnych opłat przed ostatecznym zaakceptowaniem działającej witryny na Państwa domenie!
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Zatwierdź Propozycję i Zamów Wdrożenie
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Wypełnij krótki formularz kontaktowy. Oddzwonię lub odpiszę, aby potwierdzić szczegóły i uruchomić stronę.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Imię i nazwisko / Osoba kontaktowa *</label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="np. Jan Kowalski"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Numer telefonu do kontaktu *</label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="np. 500 123 456"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Adres e-mail (opcjonalnie)</label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="np. kontakt@firma.pl"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300">Wybrany pakiet</label>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-purple-500/40 bg-purple-950/30 px-3.5 py-2 text-xs font-bold text-purple-200">
                      <span>
                        {selectedPackage === 'start'
                          ? proposal.pricingPackages?.start?.name || 'Pakiet Start'
                          : selectedPackage === 'vip'
                          ? proposal.pricingPackages?.vip?.name || 'Pakiet VIP'
                          : proposal.pricingPackages?.business?.name || 'Pakiet Standard'}
                      </span>
                      <span className="text-white font-black">
                        {selectedPackage === 'start'
                          ? proposal.pricingPackages?.start?.price || '890 PLN'
                          : selectedPackage === 'vip'
                          ? proposal.pricingPackages?.vip?.price || '2 190 PLN'
                          : proposal.pricingPackages?.business?.price || '1 490 PLN'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">Dodatkowe uwagi / preferencje</label>
                  <textarea
                    rows={2}
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="np. Proszę o kontakt po godz. 14:00..."
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="text-[11px] text-zinc-400">
                    <span className="text-emerald-400 font-semibold">{proposal.supportWarrantyDays || 30} dni Gwarancji Wsparcia: </span>
                    Płatność dopiero po wdrożeniu i Państwa pełnej akceptacji.
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/40 hover:bg-purple-500 disabled:opacity-50 transition"
                  >
                    {isSubmitting ? (
                      <span>Przesyłanie zgłoszenia...</span>
                    ) : (
                      <>
                        <span>Potwierdzam chęć wdrożenia nowej strony</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-zinc-800/80 pt-8 text-center text-xs text-zinc-500 space-y-2">
          <div>
            Projekt przygotowany dla: <strong>{proposal.name}</strong> • Realizacja: Jan Kowalski
          </div>
          <div>
            Uczciwe wdrożenia stron internetowych dla lokalnych firm • Bez abonamentów za serwer • 30 dni bezpłatnego wsparcia
          </div>
          {!isEmbeddedPreview && onBackToAdmin && (
            <div className="pt-4">
              <button
                onClick={onBackToAdmin}
                className="text-[11px] text-zinc-600 hover:text-purple-400 underline"
              >
                Jesteś wykonawcą? Przejdź do panelu Workspace
              </button>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}
