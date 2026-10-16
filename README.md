# Sales Navigator Workspace
### Mini-CRM · Automatyczny Audyt DOM/SEO · Generator Ofert & Landing Page
**Author:** Szymon Kochanowski  
**License:** MIT  
**Version:** 1.0.0

---

## 🇵🇱 Opis Projektu (Polish)

**Sales Navigator Workspace** to w 100% autorskie, pełnostosowe narzędzie inżynierskie stworzone do automatyzacji pozyskiwania klientów B2B oraz generowania stron internetowych typu One-Page dla lokalnych firm usługowych (stomatolodzy, mechanicy, kancelarie, kliniki medyczne).

System integruje w jednym miejscu:
1. **Mini-CRM dla Lokalnych Przedsiębiorstw** – zarządzanie bazą firm, etapami lejka sprzedażowego, statusami i notatkami.
2. **Heurystyczny Silnik Audytu DOM & SEO** – zautomatyzowane parsowanie kodu stron internetowych w czasie rzeczywistym przy użyciu biblioteki `cheerio`:
   - Weryfikacja szyfrowania SSL (HTTPS vs HTTP)
   - Analiza tagów meta (`title`, `description`, `viewport`, `og:title`)
   - Kontrola struktury nagłówków semantycznych (`H1`–`H3`)
   - Wykrywanie przycisków akcji CTA, bezpośrednich połączeń `tel:` (Click-to-Call) oraz formularzy kontaktowych
   - Algorytmiczne wyliczanie wskaźników jakości: *Design & UX*, *SEO & Meta*, *Konwersja & CTA* oraz *Szybkość/Mobile* (skala 0–100)
3. **Generator Spersonalizowanych Ofert Handlowych (Szablony CRO)** – deterministyczny silnik tworzący zindywidualizowane wiadomości Cold Mail i sekwencje Follow-up, bezpośrednio odnoszące się do usterek technicznych wykrytych w audycie danej firmy.
4. **Generator Nowoczesnych Stron One-Page (Tailwind CSS)** – automatyczne tworzenie kompletnych, responsywnych stron WWW Dark Mode zoptymalizowanych pod kątem urządzeń mobilnych, z wbudowaną ochroną antyspamową Honeypot, danymi strukturalnymi `Schema.org LocalBusiness` oraz pływającym paskiem szybkiego połączenia.
5. **Eksport Paczki Produkcyjnej (.ZIP)** – generowanie gotowego do wdrożenia archiwum z `index.html`, `robots.txt`, `sitemap.xml` oraz regułami bezpieczeństwa `Content-Security-Policy (CSP)` i `vercel.json`.
6. **Studio Dokumentów & Fakturowania** – gotowy generator Faktur Proforma (z zadatkiem 50%), Rachunków Działalności Nierejestrowanej (art. 113 ust. 1 i 9 ustawy o VAT), Umów o Dzieło z przeniesieniem praw autorskich (50% KUP) oraz Protokołów Zdawczo-Odbiorczych.
7. **Publiczny Portal Prezentacji dla Klienta** – dedykowany adres URL dla klienta (np. `/?proposal=xyz`) umożliwiający interaktywny podgląd strony demonstracyjnej oraz 1-klikowe zatwierdzenie zamówienia.

---

## 🇬🇧 Project Overview (English)

**Sales Navigator Workspace** is an original full-stack engineering workspace designed for local B2B lead generation, technical website audits, and rapid client landing page deployment.

Key architectural pillars:
- **Client Management (Mini-CRM):** Tracks prospects, audit metrics, outreach statuses, and client deal pipeline.
- **Cheerio DOM & SEO Scraper:** Real-time server-side HTML parser verifying SSL certificates, meta tags, semantic headings (`H1`-`H3`), forms, and Click-to-Call anchors.
- **CRO & Heuristic Scoring Engine:** Deterministic scoring algorithm evaluating Design, Local SEO, Conversion Rate Optimization (CTA density), and mobile readability.
- **Tailwind CSS Landing Page Generator:** Generates high-conversion, mobile-first one-page sites featuring `Schema.org LocalBusiness` structured data, spam-honeypot form fields, and sticky call buttons.
- **Production Packager (JSZip):** Bundles hardened HTML5 code, Content-Security-Policy headers, `sitemap.xml`, `robots.txt`, and deployment configuration into a deployable `.zip`.
- **Document & Billing Studio:** Built-in PDF/A4 printable contracts, proforma invoices with 50% deposit milestones, and legal acceptance protocols.

---

## 🛠️ Architektura Technologiczna (Tech Stack)

| Warstwa / Moduł | Wykorzystane Technologie |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion |
| **Backend & API** | Node.js (v20+), Express 4, TypeScript, Axios |
| **DOM Parsing** | Cheerio 1.2+ (Scraping i analiza drzewa DOM bez przeglądarki headless) |
| **Pakowanie & Pliki** | JSZip 3.10 (Generowanie archiwów ZIP po stronie serwera) |
| **Bezpieczeństwo** | Tokeny sesyjne HMAC-SHA256, Content-Security-Policy, Honeypot antispam |
| **Build & Dev Tooling** | Vite 8, esbuild, tsx |

---

## 🚀 Uruchomienie Lokalne (Quick Start)

### 1. Wymagania wstępne
- Node.js w wersji **20.0.0** lub nowszej
- Menedżer pakietów `npm`

### 2. Instalacja zależności
```bash
git clone https://github.com/SzymonKochanowski/sales-navigator-workspace.git
cd sales-navigator-workspace
npm install
```

### 3. Konfiguracja zmiennych środowiskowych
Skopiuj plik `.env.example` do `.env`:
```bash
cp .env.example .env
```
Zawartość `.env`:
```env
PORT=3000
WORKSPACE_PASSWORD="admin2026"
SENDER_NAME="Jan Kowalski — Web Developer"
```

### 4. Uruchomienie deweloperskie
```bash
npm run dev
```
Aplikacja uruchomi się pod adresem: **http://localhost:3000**

- **Tryb demonstracyjny:** Na ekranie logowania kliknij przycisk **„⚡ Wejdź w tryb Demo (1-Click)”**, aby natychmiast przetestować wszystkie moduły na 4 przygotowanych firmach pokazowych.
- **Dostęp administracyjny:** Hasło domyślne to `admin2026`.

### 5. Budowanie produkcyjne
```bash
npm run build
npm start
```

---

## 📁 Struktura Katalogów

```
sales-navigator-workspace/
├── data/
│   ├── demo-template.json      # 4 fikcyjne firmy pokazowe z kompletnymi audytami
│   └── leads.json              # Główna baza CRM (lokalna persistencja)
├── src/
│   ├── components/
│   │   ├── crm/
│   │   │   ├── Sidebar.tsx     # Lista firm, wyszukiwarka, filtry
│   │   │   ├── LeadHeader.tsx  # Pasek statusu, szybkie akcje
│   │   │   └── tabs/
│   │   │       ├── AuditTab.tsx         # Wyniki audytu DOM/SEO
│   │   │       ├── OutreachTab.tsx      # Szablony maili i follow-upy CRO
│   │   │       ├── DemoPreviewTab.tsx   # Podgląd strony One-Page
│   │   │       ├── HostingTab.tsx       # Porównywarka i koszty hostingu
│   │   │       └── AcceleratorTab.tsx   # Upselle, kalkulator i umowy
│   │   ├── DocumentStudioModal.tsx      # Generator faktur, proform i umów
│   │   └── PublicClientProposalPortal.tsx # Portal akceptacji dla klienta
│   ├── hooks/
│   │   ├── useAuth.ts          # Autoryzacja i tryb Demo 1-Click
│   │   └── useLeads.ts         # Zarządzanie stanem i akcjami CRM
│   ├── server/
│   │   ├── services/
│   │   │   ├── auditEngine.ts    # Cheerio DOM scraper & scoring heurystyczny
│   │   │   ├── outreachEngine.ts # Generator cold maili CRO
│   │   │   ├── siteGenerator.ts  # Generator stron One-Page Tailwind CSS
│   │   │   └── packager.ts       # Generator paczek produkcyjnych ZIP
│   │   ├── routes/
│   │   │   └── publicProposal.ts # Endpointy publicznego portalu klienta
│   │   └── storage.ts            # Odporny silnik zapisu danych
│   ├── types/
│   │   └── index.ts              # Definicje typów TypeScript
│   ├── App.tsx                   # Główny widok i routing
│   ├── main.tsx                  # Punkt wejścia React 19
│   └── index.css                 # Importy Tailwind CSS
├── server.ts                     # Serwer Express (API + middleware Vite)
├── LICENSE                       # Licencja MIT
├── package.json                  # Konfiguracja projektu
└── vite.config.ts                # Konfiguracja bundlera Vite
```

---

## ⚖️ Licencja

Projekt jest udostępniony na warunkach licencji **MIT**. Szczegóły znajdują się w pliku `LICENSE`.  
Copyright (c) 2026 Szymon Kochanowski.
