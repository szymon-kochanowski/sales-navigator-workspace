export interface SiteGeneratorOptions {
  lead: any;
  customPrompt?: string;
}

function getCleanPhone(phone?: string): string {
  const fallback = '+48 500 600 700';
  if (!phone || typeof phone !== 'string') return fallback;
  const cleaned = phone.trim();
  return cleaned.length >= 7 ? cleaned : fallback;
}

function buildSchemaOrgJsonLd(lead: any): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: lead.name || 'Lokalna Firma Usługowa',
    description: `Profesjonalne usługi w branży ${lead.industry || 'usługowej'} — ${lead.name} (${lead.city || 'Polska'}).`,
    url: lead.website || 'https://example.pl',
    telephone: getCleanPhone(lead.phone || lead.acceptedProposal?.clientPhone),
    address: {
      '@type': 'PostalAddress',
      streetAddress: lead.address || lead.city || 'Centrum',
      addressLocality: lead.city || 'Polska',
      addressCountry: 'PL',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (lead.googleRating || '4.9').replace(/[^0-9.]/g, '') || '4.9',
      reviewCount: '84',
    },
  };
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

export function generateOnePageSite({
  lead,
  customPrompt = '',
}: SiteGeneratorOptions): string {
  const name = lead.name || 'Twoja Firma';
  const city = lead.city || 'Polska';
  const industry = lead.industry || 'Usługi Profesjonalne';
  const address = lead.address || `Centrum, ${city}`;
  const phoneDisplay = getCleanPhone(lead.phone);
  const phoneHref = phoneDisplay.replace(/[^0-9+]/g, '');
  const schemaScript = buildSchemaOrgJsonLd(lead);

  return `<!DOCTYPE html>
<html lang="pl" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} — ${industry} ${city} | Oficjalna Witryna</title>
  <meta name="description" content="Sprawdzone usługi: ${name} (${industry}) w miejscowości ${city}. Szybkie terminy, gwarancja jakości i bezpośredni kontakt telefoniczny." />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .hp-field { opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1; }
  </style>
  ${schemaScript}
</head>
<body class="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white pb-20 md:pb-0">

  <!-- Top Info Bar -->
  <div class="bg-indigo-950/80 border-b border-indigo-500/20 text-xs py-2 px-4">
    <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-indigo-200">
      <div class="flex items-center gap-4">
        <span>📍 ${address}</span>
        <span class="hidden sm:inline">•</span>
        <span class="hidden sm:inline">🕒 Pon-Pt: 08:00–19:00, Sob: 09:00–14:00</span>
      </div>
      <div class="flex items-center gap-3 font-semibold">
        <span class="text-amber-400">★ 4.9/5 w Google Maps</span>
        <a href="tel:${phoneHref}" class="text-white underline hover:text-indigo-300">Zadzwoń: ${phoneDisplay}</a>
      </div>
    </div>
  </div>

  <!-- Navbar -->
  <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
    <div class="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
      <a href="#" class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-indigo-600/30">
          ${name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <span class="font-extrabold text-lg tracking-tight text-white block leading-none">${name}</span>
          <span class="text-xs text-slate-400">${industry} · ${city}</span>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#uslugi" class="hover:text-white transition">Usługi</a>
        <a href="#dlaczego-my" class="hover:text-white transition">Dlaczego my</a>
        <a href="#opinie" class="hover:text-white transition">Opinie (4.9★)</a>
        <a href="#cennik" class="hover:text-white transition">Cennik</a>
        <a href="#kontakt" class="hover:text-white transition">Kontakt</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="tel:${phoneHref}" class="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:border-indigo-500 transition">
          📞 ${phoneDisplay}
        </a>
        <a href="#kontakt" class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition">
          Umów wizytę online
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative overflow-hidden py-20 lg:py-28 border-b border-slate-900">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none"></div>
    <div class="max-w-6xl mx-auto px-4 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7 space-y-6">
        <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300">
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Lider w regionie: ${industry} (${city})</span>
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
          Nowoczesne podejście i <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400">gwarancja jakości</span> dla Ciebie.
        </h1>
        <p class="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
          W <strong>${name}</strong> łączymy wieloletnie doświadczenie, profesjonalizm i transparentne warunki współpracy. Zarezerwuj dogodny termin bez kolejek — oddzwaniamy w 15 minut!
          ${customPrompt ? `<br/><span class="text-indigo-300 text-sm">Styl: ${customPrompt}</span>` : ''}
        </p>
        <div class="flex flex-col sm:flex-row gap-3.5 pt-2">
          <a href="#kontakt" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition">
            <span>Zarezerwuj termin teraz</span>
            <span>→</span>
          </a>
          <a href="tel:${phoneHref}" class="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-7 py-4 text-sm font-bold text-white hover:bg-slate-800 transition">
            <span>📞 Zadzwoń: ${phoneDisplay}</span>
          </a>
        </div>
        <div class="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-center sm:text-left">
          <div>
            <div class="text-2xl font-black text-white">100%</div>
            <div class="text-xs text-slate-400">Gwarancji satysfakcji</div>
          </div>
          <div>
            <div class="text-2xl font-black text-indigo-400">&lt; 24h</div>
            <div class="text-xs text-slate-400">Błyskawiczne terminy</div>
          </div>
          <div>
            <div class="text-2xl font-black text-emerald-400">4.9/5 ★</div>
            <div class="text-xs text-slate-400">Zadowoleni klienci w ${city}</div>
          </div>
        </div>
      </div>

      <!-- Quick Booking Card in Hero -->
      <div class="lg:col-span-5">
        <div class="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white">Szybka wycena / kontakt</h2>
            <span class="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">Dostępne terminy</span>
          </div>
          <p class="text-xs text-slate-400 mb-5">Zostaw numer telefonu — oddzwonimy w ciągu 15 minut z bezpłatną wyceną.</p>
          <form onsubmit="event.preventDefault(); this.querySelector('.ok-msg').classList.remove('hidden');" class="space-y-3.5">
            <input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off" />
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Twoje imię i nazwisko *</label>
              <input type="text" required placeholder="np. Jan Kowalski" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Numer telefonu *</label>
              <input type="tel" required placeholder="np. 500 600 700" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">W czym możemy pomóc?</label>
              <textarea rows="2" placeholder="Krótki opis lub preferowana godzina kontaktu..." class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"></textarea>
            </div>
            <button type="submit" class="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition cursor-pointer">
              Wyślij zapytanie (Oddzwonimy w 15 min)
            </button>
            <div class="ok-msg hidden rounded-xl bg-emerald-950 border border-emerald-500/40 p-3 text-xs text-emerald-300 text-center font-semibold">
              ✓ Dziękujemy! Zgłoszenie zostało przyjęte. Skontaktujemy się z Tobą telefonicznie.
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- Services Grid -->
  <section id="uslugi" class="py-20 max-w-6xl mx-auto px-4">
    <div class="text-center max-w-2xl mx-auto mb-14">
      <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Kompleksowa Oferta</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white mt-2">Nasze główne specjalizacje w ${city}</h2>
      <p class="text-sm text-slate-400 mt-3">Zapewniamy pełne wsparcie od wstępnej diagnostyki aż po finalną realizację z gwarancją.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-indigo-500/50 transition">
        <div class="h-11 w-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold mb-4">01</div>
        <h3 class="text-lg font-bold text-white mb-2">Konsultacja & Diagnostyka</h3>
        <p class="text-sm text-slate-400 leading-relaxed">Szczegółowa ocena potrzeb na pierwszym spotkaniu, przejrzysty plan działania oraz dokładny kosztorys bez ukrytych opłat.</p>
      </div>
      <div class="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-6">
        <div class="h-11 w-11 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-xl font-bold mb-4">02</div>
        <h3 class="text-lg font-bold text-white mb-2">Kompleksowa Realizacja (${industry})</h3>
        <p class="text-sm text-slate-300 leading-relaxed">Wykorzystujemy sprawdzone standardy oraz nowoczesne technologie, zapewniając najwyższy standard bezpieczeństwa i trwałości.</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-indigo-500/50 transition">
        <div class="h-11 w-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold mb-4">03</div>
        <h3 class="text-lg font-bold text-white mb-2">Gwarancja & Stała Opieka</h3>
        <p class="text-sm text-slate-400 leading-relaxed">Pełne wsparcie po wykonaniu usługi, szybki kontakt w razie pytań oraz priorytetowa obsługa stałych klientów.</p>
      </div>
    </div>
  </section>

  <!-- Google Reviews Section -->
  <section id="opinie" class="py-20 bg-slate-900/50 border-y border-slate-800/80">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Zweryfikowane Opinie Google</span>
          <h2 class="text-3xl font-extrabold text-white mt-2">Co mówią o nas klienci z ${city}?</h2>
        </div>
        <div class="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-3">
          <span class="text-2xl font-black text-amber-400">4.9 ★</span>
          <span class="text-xs text-slate-400">Średnia ocena na podstawie<br/><strong class="text-white">ponad 80 opinii w Google Maps</strong></span>
        </div>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
          <div class="text-amber-400 text-sm">★★★★★</div>
          <p class="text-sm text-slate-300 italic">„Pełen profesjonalizm od pierwszego kontaktu. Bardzo szybki termin, jasna wycena przed rozpoczęciem i świetne podejście do klienta. Zdecydowanie polecam!”</p>
          <div class="text-xs font-bold text-white pt-2">✓ Marek W., opinia z Google</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
          <div class="text-amber-400 text-sm">★★★★★</div>
          <p class="text-sm text-slate-300 italic">„Najlepsze miejsce w ${city}. Wszystko wyjaśnione krok po kroku, zero stresu i przemiła obsługa. Na pewno wrócę przy kolejnej okazji.”</p>
          <div class="text-xs font-bold text-white pt-2">✓ Karolina Nowak, opinia z Google</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
          <div class="text-amber-400 text-sm">★★★★★</div>
          <p class="text-sm text-slate-300 italic">„Wreszcie firma, która szanuje czas klienta. Umówienie kontaktu przez stronę zajęło minutę, a usługa wykonana perfekcyjnie.”</p>
          <div class="text-xs font-bold text-white pt-2">✓ Tomasz K., opinia z Google</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section id="cennik" class="py-20 max-w-6xl mx-auto px-4">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Transparentne Warunki</span>
      <h2 class="text-3xl font-extrabold text-white mt-2">Przejrzysty cennik usług</h2>
      <p class="text-sm text-slate-400 mt-2">Zawsze poznajesz dokładny koszt przed rozpoczęciem realizacji.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-white text-lg">Konsultacja / Start</h3>
          <div class="text-3xl font-black text-white my-3">od 150 zł</div>
          <ul class="space-y-2 text-xs text-slate-300 mt-4">
            <li>✓ Pełna diagnostyka i ocena potrzeb</li>
            <li>✓ Indywidualny plan działania</li>
            <li>✓ Pisemny kosztorys i doradztwo</li>
          </ul>
        </div>
        <a href="#kontakt" class="mt-6 block text-center rounded-xl border border-slate-700 py-3 text-xs font-bold text-white hover:bg-slate-800 transition">Wybierz termin</a>
      </div>
      <div class="rounded-2xl border-2 border-indigo-500 bg-indigo-950/20 p-6 flex flex-col justify-between relative">
        <span class="absolute -top-3 right-5 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase text-white">Najczęściej wybierany</span>
        <div>
          <h3 class="font-bold text-white text-lg">Pakiet Kompleksowy</h3>
          <div class="text-3xl font-black text-indigo-400 my-3">Rekomendowany</div>
          <ul class="space-y-2 text-xs text-slate-200 mt-4">
            <li>✓ Priorytetowy termin realizacji</li>
            <li>✓ Kompletna usługa pod klucz</li>
            <li>✓ Dedykowany opiekun zlecenia</li>
            <li>✓ Pełna gwarancja zadowolenia</li>
          </ul>
        </div>
        <a href="#kontakt" class="mt-6 block text-center rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition">Zapytaj o wycenę</a>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-white text-lg">Pakiet VIP / Stała Opieka</h3>
          <div class="text-3xl font-black text-white my-3">Indywidualny</div>
          <ul class="space-y-2 text-xs text-slate-300 mt-4">
            <li>✓ Dedykowany opiekun 24/7</li>
            <li>✓ Przypomnienia SMS i harmonogram</li>
            <li>✓ Wsparcie w nagłych sytuacjach</li>
          </ul>
        </div>
        <a href="tel:${phoneHref}" class="mt-6 block text-center rounded-xl border border-slate-700 py-3 text-xs font-bold text-white hover:bg-slate-800 transition">Zadzwoń teraz</a>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="kontakt" class="py-20 bg-slate-900/60 border-t border-slate-800">
    <div class="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
      <div class="space-y-4">
        <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">Bezpośredni Kontakt</span>
        <h2 class="text-3xl font-extrabold text-white">Skontaktuj się z ${name}</h2>
        <p class="text-sm text-slate-300">Zadzwoń bezpośrednio lub odwiedź naszą placówkę w miejscowości ${city}.</p>
        <div class="space-y-3 pt-2 text-sm">
          <div class="flex items-center gap-3">
            <span class="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">📍</span>
            <div>
              <div class="text-xs text-slate-400">Adres:</div>
              <div class="font-bold text-white">${address}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">📞</span>
            <div>
              <div class="text-xs text-slate-400">Telefon:</div>
              <a href="tel:${phoneHref}" class="font-bold text-emerald-400 text-base hover:underline">${phoneDisplay}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-xs text-slate-400 space-y-3">
        <div class="font-bold text-white text-sm">Godziny otwarcia (${city})</div>
        <div class="flex justify-between py-1.5 border-b border-slate-800"><span>Poniedziałek – Piątek:</span><strong class="text-white">08:00 – 19:00</strong></div>
        <div class="flex justify-between py-1.5 border-b border-slate-800"><span>Sobota:</span><strong class="text-white">09:00 – 14:00</strong></div>
        <div class="flex justify-between py-1.5"><span>Niedziela:</span><span>Nieczynne</span></div>
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 py-3 font-bold text-indigo-300 hover:bg-indigo-500/20 transition">
          🗺️ Otwórz trasę w Google Maps
        </a>
      </div>
    </div>
  </section>

  <footer class="py-8 border-t border-slate-900 text-center text-xs text-slate-500 px-4">
    © ${new Date().getFullYear()} ${name} (${city}). Wszelkie prawa zastrzeżone. Demonstracyjna wersja strony.
  </footer>

  <!-- Floating Mobile Click-to-Call Bar -->
  <div class="fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 p-3 flex items-center gap-2.5 shadow-2xl">
    <a href="tel:${phoneHref}" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/30">
      <span>📞 Zadzwoń teraz</span>
    </a>
    <a href="#kontakt" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30">
      <span>Umów wizytę</span>
    </a>
  </div>
</body>
</html>`;
}
