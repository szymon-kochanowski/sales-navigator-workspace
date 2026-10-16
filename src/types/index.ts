export interface Issue {
  title: string;
  severity: 'Wysoka' | 'Średnia' | 'Niska' | string;
  impact: string;
}

export interface Recommendation {
  title: string;
  details: string;
  expectedResult: string;
}

export interface AuditMetrics {
  design: number;
  seo: number;
  conversion: number;
  speed: number;
}

export interface ScrapedData {
  title: string;
  metaDescription: string;
  hasSSL: boolean;
  hasMobileMeta: boolean;
  formsCount: number;
  imagesCount: number;
  headingsCount: number;
  ctaButtonsCount: number;
  headings?: string[];
  ctaButtons?: string[];
}

export interface Audit {
  score: number;
  analyzedAt: string;
  metrics: AuditMetrics;
  executiveSummary: string;
  issues: Issue[];
  missingElements: string[];
  recommendations: Recommendation[];
  scrapedData?: ScrapedData;
}

export type LeadStatus =
  | 'Nowy'
  | 'Po audycie'
  | 'Oferta gotowa'
  | 'Skontaktowano'
  | 'Oferta zaakceptowana'
  | string;

export interface PricingPackage {
  name: string;
  price: string;
  features: string[];
}

export interface AcceptedProposal {
  packageName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientNotes?: string;
  acceptedAt?: string;
}

export interface LeadOutreach {
  tone: string;
  subjectLines: string[];
  emailBody: string;
  followUp1?: string;
  followUp2?: string;
  roiEstimate?: {
    monthlyLostRevenue: string;
    lostClientsPerMonth: string;
    projectedAnnualGain: string;
  };
  pricingPackages?: {
    start: PricingPackage;
    business: PricingPackage;
    vip: PricingPackage;
  };
  keyAngles: string[];
  generatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  website: string;
  address?: string;
  phone?: string;
  googleMapsUrl?: string;
  googleSearchUrl?: string;
  googleRating?: string;
  industry?: string;
  city?: string;
  notes?: string;
  status: LeadStatus;
  createdAt?: string;
  updatedAt?: string;
  audit?: Audit | null;
  outreach?: LeadOutreach | null;
  outreachSubject?: string;
  outreachBody?: string;
  outreachFollowUp1?: string;
  outreachFollowUp2?: string;
  roiEstimate?: {
    monthlyLostRevenue?: string;
    lostClientsPerMonth?: string;
    projectedAnnualGain?: string;
  };
  pricingPackages?: {
    start?: PricingPackage;
    business?: PricingPackage;
    vip?: PricingPackage;
  };
  supportWarrantyDays?: number;
  acceptedProposal?: AcceptedProposal;
  demoSiteHtml?: string | null;
  demoSitePrompt?: string | null;
  productionZipBuffer?: string | null;
  productionZipGeneratedAt?: string | null;
}

export interface DiscoveredLead {
  name: string;
  website: string;
  address?: string;
  phone?: string;
  googleMapsUrl?: string;
  googleSearchUrl?: string;
  googleRating?: string;
  industry?: string;
  city?: string;
  notes?: string;
  detectedIssues?: string[];
  suspectedIssues?: string[];
  estimatedScore?: number;
  estimatedWebsiteHealth?: string;
}

export interface UpsellItem {
  id: string;
  name: string;
  category: 'onetime' | 'recurring';
  pricePLN: number;
  periodText?: string;
  badge?: string;
  description: string;
  benefitToClient: string;
  whySells: string;
}

export interface ObjectionItem {
  id: string;
  objection: string;
  context: string;
  response: string;
  psychologyTip: string;
}

export type CrmFilter =
  | 'ALL'
  | 'Nowy'
  | 'Po audycie'
  | 'Oferta gotowa'
  | 'Skontaktowano'
  | 'Oferta zaakceptowana';

export type WorkspaceTab =
  | 'audit'
  | 'outreach'
  | 'demo'
  | 'hosting'
  | 'proposal'
  | 'accelerator';

export const DEMO_LEAD_IDS: string[] = [
  'lead_mv56uaqp_wxyvr',
  'lead_gdansk_lipami_01',
  'lead_poznan_candeo_02',
  'lead_krakow_rehamed_03',
  'lead_gdansk_warsztat_04',
];

export const UPSELL_OPTIONS: UpsellItem[] = [
  {
    id: 'retainer_care',
    name: 'Stała Opieka Techniczna, Aktualizacje & Backupy',
    category: 'recurring',
    pricePLN: 149,
    periodText: '/ mc',
    badge: 'Abonament MRR (Święty Spokój)',
    description:
      'Monitorowanie działania 24/7, comiesięczne kopie zapasowe, drobne zmiany w treściach (menu, cennik, godziny) w 24h.',
    benefitToClient:
      'Gwarancja, że strona nigdy nie przestanie działać, a zmiany w ofercie są wprowadzane od ręki bez angażowania programistów.',
    whySells:
      'Klienci boją się, że strona po wdrożeniu zepsuje się lub zdezaktualizuje. 149 zł/mc to dla firmy ułamek kosztu etatu.',
  },
  {
    id: 'google_maps_seo',
    name: 'Optymalizacja Wizytówki Google Maps & Lokalne SEO',
    category: 'onetime',
    pricePLN: 490,
    badge: 'Błyskawiczny Efekt',
    description:
      'Audyt i optymalizacja profilu firmy w Google, uzupełnienie atrybutów, słowa kluczowe, poprawa kategorii i system pozyskiwania opinii.',
    benefitToClient:
      'Wyższa pozycja w lokalnych wynikach wyszukiwania i 2-3x więcej telefonów od pacjentów/klientów z okolicy.',
    whySells:
      'Większość ma zaniedbaną wizytówkę Google. Zobaczenie wzrostu połączeń w pierwszym tygodniu buduje zaufanie.',
  },
  {
    id: 'booking_sms',
    name: 'Formularz Szybkiej Rezerwacji / Click-to-WhatsApp / SMS',
    category: 'onetime',
    pricePLN: 390,
    badge: 'Wzrost Konwersji +60%',
    description:
      'Integracja dedykowanego systemu powiadomień SMS / WhatsApp o zapytaniach lub podpięcie kalendarza wizyt (np. Booksy / Calendly).',
    benefitToClient:
      'Automatyczne zapisywanie klientów również po godzinach pracy firmy, zero uciekających zleceń do konkurencji.',
    whySells:
      'Klienci dzwoniący po 18:00 normalnie uciekają. Ten moduł bezpośrednio generuje pieniądze dla firmy.',
  },
  {
    id: 'rodo_cookies',
    name: 'Pakiet Zgodności z RODO & Baner Zgód Cookies',
    category: 'onetime',
    pricePLN: 290,
    badge: 'Ochrona Prawna',
    description:
      'Wdrożenie profesjonalnego baneru zgód na pliki cookies, polityki prywatności oraz klauzul informacyjnych pod formularzem.',
    benefitToClient:
      'Pełne bezpieczeństwo prawne, brak ryzyka kar od UODO i budowanie zaufania w oczach klientów.',
    whySells:
      'Każda firma dba o zgodność prawną. 290 zł za spokój to formalność przy zleceniu strony.',
  },
  {
    id: 'sales_copywriting',
    name: 'Autorski Copywriting Sprzedażowy & Nagłówki H1-H3',
    category: 'onetime',
    pricePLN: 350,
    badge: 'Mocna Perswazja',
    description:
      'Indywidualne napisanie unikalnych tekstów sprzedażowych, chwytliwych nagłówków i opisów usług dopasowanych do psychologii klienta.',
    benefitToClient:
      'Teksty, które faktycznie sprzedają usługi i rozwiewają wątpliwości klientów, zamiast nudnych zdań.',
    whySells:
      'Przedsiębiorcy nie mają czasu pisać tekstów i często to przez brak treści projekty wiszą miesiącami.',
  },
];

export const OBJECTION_ITEMS: ObjectionItem[] = [
  {
    id: 'obj_1',
    objection: '„Mamy już stronę internetową i nam w zupełności wystarczy.”',
    context:
      'Właściciel uważa stronę za wizytówkę statyczną, nie zdając sobie sprawy, że traci klientów.',
    response:
      '„W pełni to rozumiem. Większość moich klientów uważała podobnie, dopóki nie zobaczyli, że ich obecna witryna ładuje się ponad 3 sekundy na smartfonach i brakuje na niej pływającego przycisku połączenia. Ponad 75% klientów w Państwa branży dzwoni bezpośrednio z telefonu komórkowego. Przygotowałem dla Państwa działające demo, które rozwiązuje ten problem. Nic to nie kosztuje, można rzucić okiem w 30 sekund.”',
    psychologyTip:
      'Nie atakuj ich starej strony. Zamiast tego powołaj się na zachowania ich klientów ze smartfonami i zaoferuj bezpłatne porównanie.',
  },
  {
    id: 'obj_2',
    objection: '„Ile to kosztuje? Pytaliśmy w agencji i chcieli 5 000 – 8 000 zł.”',
    context:
      'Klient jest zrażony wygórowanymi cennikami tradycyjnych agencji interaktywnych.',
    response:
      '„I właśnie dlatego działam w innym modelu. Agencje narzucają drogie serwery i marże biurowe. Ja tworzę ultraszybkie strony One-Page, które nie wymagają drogich serwerów. Kompletne wdrożenie pod klucz to jednorazowo od 890 do 1 490 zł, a koszt hostingu w chmurze wynosi 0 zł na zawsze. Taki wydatek zwraca się Państwu już po 1-2 nowych klientach.”',
    psychologyTip:
      'Zestaw swój jednorazowy koszt (1490 zł) z drogą agencją (6000 zł) i wskaż, że hosting wynosi 0 zł.',
  },
  {
    id: 'obj_3',
    objection: '„Nie mamy teraz budżetu na marketing ani nową stronę.”',
    context: 'Obawa przed zbędnym wydatkiem w trudniejszych miesiącach.',
    response:
      '„Rozumiem to doskonale. Zwróćmy jednak uwagę, że każdy kolejny miesiąc ze starą stroną to kilkunastu uciekających pacjentów lub klientów prosto do konkurencji za rogiem. Jeśli nowa strona przyniesie tylko 2 dodatkowe wizyty w miesiącu, to projekt finansuje się sam w 30 dni, a potem przynosi czysty zysk. Ponadto rozliczamy się dopiero po Państwa pełnej akceptacji.”',
    psychologyTip:
      'Przekształć „koszt” w „inwestycję z gwarancją zwrotu”. Zwróć uwagę na brak ryzyka.',
  },
  {
    id: 'obj_4',
    objection: '„Proszę wysłać wszystko na maila biuro@... to przekażę szefowi.”',
    context: 'Standardowa próba spławienia przez sekretariat lub pracownika recepcji.',
    response:
      "„Oczywiście, wyślę kompletną prezentację. Ponieważ jednak na skrzynkę biurową trafiają dziesiątki ofert, zatytułuję wiadomość: 'Dedykowana makieta demo dla [Nazwa Firmy] — Web Developer'. Czy mógłbym prosić o bezpośredni numer lub imię osoby decyzyjnej, abym mógł wysłać SMS z linkiem, by nie zginął w spamie?”",
    psychologyTip:
      'Bądź uprzejmy dla recepcji, ale zadbaj o to, aby wiadomość trafiła bezpośrednio na smartfon decydenta.',
  },
  {
    id: 'obj_5',
    objection: '„Ktoś ze znajomych / syn znajomej już nam robi nową stronę.”',
    context: 'Częsta wymówka lub niedokończony projekt wiszący od pół roku.',
    response:
      '„Świetnie, że dbają Państwo o nowoczesny wizerunek! Ponieważ moja wersja demonstracyjna jest już w 100% zaprojektowana i zakodowana, prześlę ją Państwu bezpłatnie jako punkt odniesienia (benchmark). Będą Państwo mogli sprawdzić szybkość ładowania i rozwiązania CTA u znajomego, a w razie potrzeby — projekt jest gotowy do wdrożenia w 48h.”',
    psychologyTip:
      'Wielu przedsiębiorców boryka się z niedokończonymi projektami od znajomych. Gotowe demo jest silnym argumentem.',
  },
];

export const getWorkAgreementText = (lead: Lead, daysInput?: number | '', senderName: string = 'Jan Kowalski'): string => {
  const days =
    typeof daysInput === 'number' && !isNaN(daysInput)
      ? daysInput
      : typeof lead.supportWarrantyDays === 'number'
      ? lead.supportWarrantyDays
      : 30;
  const price = lead.pricingPackages?.business?.price || '1 490 PLN';
  const vipPrice = lead.pricingPackages?.vip?.price || '2 190 PLN';
  const vipName = lead.pricingPackages?.vip?.name || 'Pakiet Kompleksowy + Opieka';

  return `SPECYFIKACJA WDROŻENIA I ZAKRES PRAC DLA: ${lead.name}
Adres obecnej witryny: ${lead.website || 'Brak'}
Lokalizacja: ${lead.city || 'Polska'}
Wykonawca: ${senderName}

1. ZAKRES WDROŻENIA:
- Zaprojektowanie i uruchomienie nowoczesnej, responsywnej strony One-Page (Tailwind CSS)
- Wdrożenie pływającego przycisku szybkiego kontaktu Click-to-Call na smartfonach
- Interaktywny formularz kontaktowy z powiadomieniami e-mail o nowych zapytaniach
- Integracja z wizytówką Google Maps i sekcją opinii klientów
- Optymalizacja szybkości (błyskawiczne ładowanie poniżej 0.5s)
- Certyfikat bezpieczeństwa SSL (HTTPS) oraz konfiguracja domeny .pl

2. PAKIETY I WARUNKI FINANSOWE:
- Pakiet Standard (Rekomendowany): ${price} (jednorazowo pod klucz)
- ${vipName}: ${vipPrice} (z rozszerzonym copywritingiem i dedykowaną opieką)
- Koszt hostingu w chmurze: 0 zł / miesiąc (brak ukrytych opłat abonamentowych!)
- Koszt rejestracji domeny: wg cennika rejestratora (~15-55 zł rocznie)

3. TERMIN REALIZACJI:
- 48-72 godziny od potwierdzenia zamówienia.

4. GWARANCJA I WSPARCIE TECHNICZNE:
- ${days} dni bezpłatnego wsparcia technicznego po uruchomieniu (gwarancja bezawaryjności, pomoc powdrożeniowa i drobne poprawki).`;
};

export const getWorkContractText = (
  lead: Lead,
  basePriceNum: number,
  basePackageName: string,
  totalUpfrontNum: number,
  advanceNum: number,
  monthlyRetainerNum: number,
  warrantyDays: number,
  activeUpsells: UpsellItem[],
  senderName: string = 'Szymon Kochanowski'
): string => {
  const dateStr = new Date().toLocaleDateString('pl-PL');
  const leadName = lead.name;
  const leadCity = lead.city || 'Polska';
  const leadWebsite = lead.website || '';

  const upsellsListText =
    activeUpsells.length > 0
      ? activeUpsells
          .map(
            (u, i) =>
              `   ${i + 1}. ${u.name} — ${u.pricePLN} PLN ${u.periodText || '(jednorazowo)'}`
          )
          .join('\n')
      : '   - Brak wybranych pakietów dodatkowych';

  return `UMOWA O WDROŻENIE STRONY INTERNETOWEJ I USŁUGI CYFROWE
(Wzór B2B / Umowa o Dzieło z Zabezpieczeniem Płatności Zadatkiem 50%)

Zawarta w dniu: ${dateStr} r.

POMIĘDZY STRONAMI:
1. WYKONAWCA:
   ${senderName} (Web Developer & UI/UX Specialist)
   Adres poczty elektronicznej: kontakt@developer-portfolio.pl

2. ZAMAWIAJĄCY:
   Nazwa firmy: ${leadName}
   Adres / Siedziba: ${lead.address || leadCity}
   Obecna witryna: ${leadWebsite}

§ 1. PRZEDMIOT UMOWY
1. Wykonawca zobowiązuje się do zaprojektowania, zakodowania i uruchomienia nowoczesnej, responsywnej strony internetowej typu One-Page w architekturze Tailwind CSS dla Zamawiającego (${basePackageName}).
2. Wdrożenie obejmuje pełne dostosowanie do urządzeń mobilnych (smartfony/tablety), konfigurację bezpłatnego certyfikatu bezpieczeństwa SSL (HTTPS), optymalizację szybkości ładowania (< 0.5s) oraz bezpłatny hosting chmurowy (0 zł / miesiąc).
3. Przedmiot umowy obejmuje ponadto następujące wybrane moduły dodatkowe:
${upsellsListText}

§ 2. WYNAGRODZENIE I ZABEZPIECZENIE PŁATNOŚCI (ZADATEK 50%)
1. Łączne wynagrodzenie ryczałtowe za wykonanie przedmiotu umowy wynosi: ${totalUpfrontNum.toLocaleString('pl-PL')} PLN (jednorazowo).
2. ZADATEK: Strony zgodnie ustalają, że warunkiem rozpoczęcia prac projektowych jest wpłata przez Zamawiającego bezzwrotnego zadatku w wysokości 50% wynagrodzenia, tj.: ${advanceNum.toLocaleString('pl-PL')} PLN.
3. Zadatek płatny jest przelewem na rachunek bankowy Wykonawcy w terminie 2 dni roboczych od przedstawienia niniejszych ustaleń.
4. Pozostała kwota wynagrodzenia (${advanceNum.toLocaleString('pl-PL')} PLN) płatna jest po wdrożeniu wersji produkcyjnej i jej ostatecznej akceptacji przez Zamawiającego.
${
  monthlyRetainerNum > 0
    ? `5. ABONAMENT NA OPIEKĘ TECHNICZNĄ: Zamawiający zleca Wykonawcy stałą comiesięczną opiekę techniczną i kopie zapasowe w kwocie ${monthlyRetainerNum} PLN / miesiąc, płatne do 10. dnia każdego miesiąca kalendarzowego z możliwością wypowiedzenia z 30-dniowym wyprzedzeniem.`
    : ''
}

§ 3. HARMONOGRAM I TERMIN REALIZACJI
1. Wykonawca zobowiązuje się przedstawić działającą wersję roboczą strony w terminie 48 - 72 godzin od momentu zaksięgowania zadatku i przekazania podstawowych materiałów.
2. Zamawiający ma prawo do zgłoszenia do 2 tur bezpłatnych poprawek kosmetycznych w ramach ustalonego zakresu.

§ 4. PRAWA AUTORSKIE I LICENCJE
1. Z chwilą zapłaty całości wynagrodzenia Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do wykonanego kodu i projektu strony na wszelkich polach eksploatacji związanych z prowadzeniem działalności gospodarczej Zamawiającego.
2. Zamawiający staje się wyłącznym właścicielem witryny, bez ukrytych opłat licencyjnych i bez uzależnienia od abonamentów zewnętrznych agencji.

§ 5. GWARANCJA I WSPARCIE TECHNICZNE
1. Wykonawca udziela ${warrantyDays} dni bezpłatnej gwarancji powdrożeniowej oraz wsparcia technicznego liczonej od dnia ostatecznego uruchomienia strony.
2. W okresie gwarancji Wykonawca bezpłatnie i priorytetowo usuwa wszelkie ewentualne usterki techniczne.

Podpisy Stron:

_____________________________                  _____________________________
Wykonawca (${senderName})                      Zamawiający (${leadName})
`;
};
