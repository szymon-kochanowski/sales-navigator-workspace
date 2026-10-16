import { LeadOutreach, PricingPackage } from '../../types/index';

export interface OutreachOptions {
  lead: any;
  tone?: 'advisory' | 'direct' | 'expert' | string;
  senderName?: string;
}

export function generateOutreachCopy({
  lead,
  tone = 'advisory',
  senderName = process.env.SENDER_NAME || 'Jan Kowalski — Web Developer',
}: OutreachOptions): LeadOutreach {
  const company = lead.name || 'Firma';
  const city = lead.city || 'regionie';
  const industry = (lead.industry || 'usług').toLowerCase();
  const website = lead.website || 'Państwa obecnej stronie';

  const firstIssue =
    lead.audit?.issues?.[0]?.title ||
    'brak pływającego przycisku szybkiego kontaktu na smartfonach';

  const subjectLines: string[] = [
    `${company} – krótka obserwacja techniczna strony (i przygotowane demo)`,
    `${company} – jak odzyskać 12-20 zapytań miesięcznie w mieście ${city}?`,
    `Bezpłatna makieta nowej strony One-Page dla ${company} [Podgląd]`,
  ];

  let emailBody = '';

  if (tone === 'direct') {
    emailBody = `Dzień dobry,

Nazywam się ${senderName}. Przeanalizowałem witrynę ${company} (${website}) i zauważyłem istotne wąskie gardło: ${firstIssue}.

Ponad 70% klientów w branży ${industry} poszukuje usług bezpośrednio ze smartfonów. Obecna witryna powoduje odpływ części zapytań do lokalnej konkurencji.

Zamiast pisać ogólnikami, przygotowałem dla Państwa bezpłatny, w pełni działający projekt nowoczesnej strony One-Page w technologii Tailwind CSS:
👉 [LINK_DO_DEMO]

Projekt można sprawdzić bez żadnych zobowiązań. Jeśli uznają Państwo, że warto go wdrożyć, koszt pod klucz to jednorazowo 1 490 zł (z bezpłatnym hostingiem chmurowym 0 zł/mc).

Czy moglibyśmy porozmawiać 5 minut przez telefon w tym tygodniu?

Pozdrawiam serdecznie,
${senderName}`;
  } else if (tone === 'expert') {
    emailBody = `Dzień dobry,

Zwracam się z uprzejmym zapytaniem technicznym. Jako niezależny programista stron internetowych przeprowadziłem analizę techniczną DOM & SEO witryny ${website} pod kątem konwersji mobilnej.

Główna obserwacja dotyczy: ${firstIssue}. Przy dzisiejszych standardach Core Web Vitals brak natychmiastowego połączenia Click-to-Call na telefonach obniża współczynnik konwersji o szacunkowo 30-45%.

W ramach analizy przygotowałem funkcjonalną, gotową do uruchomienia demonstrację nowoczesnej strony One-Page dla firmy ${company}:
👉 [LINK_DO_DEMO]

Kluczowe parametry wdrożenia:
- Czas ładowania: < 0.4s (100% responsywność na smartfony)
- Hosting: 0 zł / miesiąc (chmura Serverless Edge z darmowym SSL)
- Stała gwarancja wsparcia technicznego: 30 dni

Chętnie przedstawię szczegóły podczas krótkiej rozmowy telefonicznej.

Z poważaniem,
${senderName}`;
  } else {
    // Default: advisory
    emailBody = `Dzień dobry,

Nazywam się ${senderName} i pomagam lokalnym firmom z branży ${industry} w ${city ? 'mieście ' + city : 'Polsce'} pozyskiwać więcej zapytań bezpośrednio z internetu.

Trafiłem na firmę ${company} i przeprowadziłem krótki audyt techniczny Waszej obecnej strony ${website}. Zauważyłem, że pomimo świetnej oferty, witryna traci potencjalnych klientów przez ${firstIssue}.

Zamiast tylko o tym opowiadać, przygotowałem dla Państwa bezpłatny, w pełni responsywny projekt nowoczesnej strony One-Page, dopasowany do Waszej specyfiki:
👉 [LINK_DO_DEMO]

Mogą go Państwo sprawdzić na telefonie i komputerze bez żadnych zobowiązań. Jeśli propozycja się spodoba, możemy wdrożyć stronę na Państwa domenie w 48 godzin, za ułamek stawek tradycyjnych agencji (bez opłat abonamentowych za serwer).

Czy moglibyśmy zamienić dosłownie 5 minut przez telefon w tym tygodniu, abym pokazał, jak ten projekt pomoże Państwu zdobyć nowe zlecenia?

Pozdrawiam serdecznie,
${senderName}`;
  }

  const followUp1 = `Dzień dobry,

Nawiązując do mojej wiadomości sprzed 3 dni odnośnie strony ${company} — czy udało się Państwu rzucić okiem na przygotowaną makietę demo ([LINK_DO_DEMO])?

Wdrożenie nowoczesnego One-Page w Państwa branży w mieście ${city} pozwala odzyskać szacunkowo nawet 4 800 - 8 500 zł miesięcznie w postaci zapytań, które dziś uciekają do konkurencji.

Chętnie odpowiem na wszelkie pytania lub wprowadzę ewentualne poprawki do projektu.

Pozdrawiam,
${senderName}`;

  const followUp2 = `Dzień dobry,

Krótka informacja ode mnie — rozumiem, że mogą być Państwo obecnie bardzo zajęci, więc to moja ostatnia wiadomość w sprawie projektu strony dla ${company}.

Jeśli temat odświeżenia strony i zwiększenia liczby klientów będzie aktualny w przyszłości, projekt demo pozostawiam do Państwa dyspozycji pod adresem: [LINK_DO_DEMO].

W razie pytań pozostaję pod telefonem.

Pozdrawiam i życzę samych sukcesów,
${senderName}`;

  const pricingPackages: {
    start: PricingPackage;
    business: PricingPackage;
    vip: PricingPackage;
  } = {
    start: {
      name: 'Pakiet Mini / Start (Wdrożenie w 48h)',
      price: '890 PLN',
      features: [
        'Nowoczesna strona One-Page w Tailwind CSS',
        '100% responsywność na smartfony i tablety',
        'Darmowy hosting w chmurze (0 zł opłat miesięcznych!)',
        'Certyfikat SSL i podpięcie domeny .pl',
        'Czas realizacji: 48h',
      ],
    },
    business: {
      name: 'Pakiet Standard (Bestseller)',
      price: '1 490 PLN',
      features: [
        'Wszystko z pakietu Start',
        'Pływające przyciski szybkiego kontaktu na mobile (Sticky CTA)',
        'Interaktywny formularz kontaktowy z powiadomieniami',
        'Sekcja opinii klientów z Google i mapa dojazdu',
        'Optymalizacja szybkości (ładowanie < 0.5s)',
        'Zgodność z RODO i baner cookies',
      ],
    },
    vip: {
      name: 'Pakiet Kompleksowy + Opieka',
      price: '2 190 PLN',
      features: [
        'Wszystko z pakietu Standard',
        'Dedykowany perswazyjny copywriting bez szablonów',
        'Konfiguracja firmowej skrzynki pocztowej w domenie',
        'Paczka metatagów SEO i indeksacja w Google',
        'Opcjonalna miesięczna opieka techniczna: 89 PLN / mc',
        `${lead.supportWarrantyDays || 30} dni bezpłatnej gwarancji wsparcia`,
      ],
    },
  };

  return {
    tone,
    subjectLines,
    emailBody,
    followUp1,
    followUp2,
    roiEstimate: {
      monthlyLostRevenue: '4 800 - 8 500 PLN',
      lostClientsPerMonth: '12 - 20 klientów',
      projectedAnnualGain: '+28 000 PLN / rok',
    },
    pricingPackages,
    keyAngles: [
      'Odwołanie do konkretnego problemu wykrytego w audycie DOM/SEO',
      'Bezpłatna wartość z góry (gotowa makieta demonstracyjna)',
      'Niski próg wejścia (krótka, niezobowiązująca rozmowa telefoniczna)',
    ],
    generatedAt: new Date().toISOString(),
  };
}
