import React, { useState, useEffect } from 'react';
import {
  Receipt,
  FileText,
  Printer,
  Download,
  Copy,
  X,
  Save,
  Shield,
  Building2,
  User,
  CreditCard,
  FileCheck,
  Eye,
  Sliders,
  DollarSign,
} from 'lucide-react';

export type DocumentType =
  | 'proforma'
  | 'ndg_invoice'
  | 'work_contract'
  | 'b2b_contract'
  | 'acceptance_protocol';

export interface DocumentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any | null;
  initialDocType?: DocumentType;
  showToast: (msg: string) => void;
  leadsList?: any[];
  onSelectLead?: (lead: any) => void;
}

interface SellerProfile {
  name: string;
  taxId: string;
  address: string;
  iban: string;
  bank: string;
  email: string;
  phone: string;
}

const DEFAULT_SELLER_PROFILE: SellerProfile = {
  name: 'Szymon Kochanowski — Web Development',
  taxId: 'Zwolnienie z VAT (art. 113 ust. 1 i 9)',
  address: 'ul. Dąbrowskiego 45, 60-842 Poznań',
  iban: '84 1020 4027 0000 1234 5678 9012',
  bank: 'PKO Bank Polski',
  email: 'kontakt@developer-portfolio.pl',
  phone: '+48 500 000 000',
};

export default function DocumentStudioModal({
  isOpen,
  onClose,
  lead,
  initialDocType = 'proforma',
  showToast,
  leadsList,
  onSelectLead,
}: DocumentStudioModalProps) {
  const [docType, setDocType] = useState<DocumentType>(initialDocType);
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');

  const [seller, setSeller] = useState<SellerProfile>(() => {
    try {
      const saved = localStorage.getItem('sn_seller_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SELLER_PROFILE;
  });

  const [buyer, setBuyer] = useState({
    name: '',
    taxId: '',
    address: '',
    representative: '',
    email: '',
    phone: '',
    website: '',
  });

  const [params, setDocParams] = useState({
    docNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
    paymentDueDays: 7,
    serviceTitle:
      'Kompleksowy projekt i wdrożenie responsywnej strony One-Page Tailwind CSS z optymalizacją mobilną i SSL',
    totalPrice: 1490,
    depositPercent: 50,
    depositAmount: 745,
    completionDays: 3,
    warrantyDays: 30,
    includeCopyright: true,
    invoiceScope: 'advance' as 'advance' | 'final' | 'full',
    notes:
      'Zwolnienie podmiotowe z VAT na podstawie art. 113 ust. 1 i 9 ustawy o podatku od towarów i usług.',
  });

  useEffect(() => {
    if (initialDocType) {
      setDocType(initialDocType);
    }
  }, [initialDocType, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const basePrice = lead
      ? parseInt((lead.pricingPackages?.business?.price || '1490').replace(/[^0-9]/g, ''), 10) || 1490
      : 1490;
    const deposit = Math.round(basePrice * 0.5);

    if (lead) {
      setBuyer({
        name: lead.name || '',
        taxId: lead.nip || '',
        address: lead.address || lead.city || 'Polska',
        representative: lead.acceptedProposal?.clientName || 'Właściciel / Reprezentant',
        email: lead.acceptedProposal?.clientEmail || '',
        phone: lead.phone || lead.acceptedProposal?.clientPhone || '',
        website: lead.website || '',
      });
    } else {
      setBuyer((prev) => ({
        ...prev,
        name: prev.name || 'Firma Klienta Sp. z o.o.',
        address: prev.address || 'ul. Przykładowa 10, 00-001 Warszawa',
        representative: prev.representative || 'Jan Kowalski — Właściciel',
      }));
    }

    const randomSuffix = String(Math.floor(Math.random() * 899 + 100));
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    let prefix = 'FP';
    if (docType === 'ndg_invoice') prefix = 'FV';
    else if (docType === 'work_contract') prefix = 'UOD';
    else if (docType === 'b2b_contract') prefix = 'B2B';
    else if (docType === 'acceptance_protocol') prefix = 'PZO';

    setDocParams((prev) => ({
      ...prev,
      totalPrice: basePrice,
      depositAmount: deposit,
      docNumber: `${prefix}/${year}/${month}/${randomSuffix}`,
    }));
  }, [isOpen, lead, docType]);

  if (!isOpen) return null;

  const handleSaveSellerProfile = () => {
    try {
      localStorage.setItem('sn_seller_profile', JSON.stringify(seller));
      showToast('Zapisano profil wykonawcy jako domyślny!');
    } catch (e) {
      showToast('Nie udało się zapisać profilu w pamięci.');
    }
  };

  const payableAmount =
    docType === 'proforma'
      ? params.invoiceScope === 'advance'
        ? params.depositAmount
        : params.invoiceScope === 'final'
        ? params.totalPrice - params.depositAmount
        : params.totalPrice
      : params.totalPrice;

  const issueDateObj = new Date(params.issueDate || Date.now());
  const dueDateObj = new Date(issueDateObj.getTime() + params.paymentDueDays * 24 * 60 * 60 * 1000);
  const formattedDueDate = dueDateObj.toLocaleDateString('pl-PL');
  const formattedIssueDate = issueDateObj.toLocaleDateString('pl-PL');

  const getDocumentHtml = (): string => {
    const docTitle =
      docType === 'proforma'
        ? `Faktura Proforma ${params.docNumber}`
        : docType === 'ndg_invoice'
        ? `Faktura bez VAT ${params.docNumber}`
        : docType === 'work_contract'
        ? `Umowa o Dzieło ${params.docNumber}`
        : docType === 'b2b_contract'
        ? `Umowa Wdrożeniowa B2B ${params.docNumber}`
        : `Protokół Zdawczo-Odbiorczy ${params.docNumber}`;

    let bodyContent = '';

    if (docType === 'proforma' || docType === 'ndg_invoice') {
      const isProforma = docType === 'proforma';
      bodyContent = `
        <div class="header">
          <div>
            <span class="badge">${
              isProforma
                ? 'DOKUMENT ROZLICZENIOWY B2B — ZADATEK'
                : 'DOKUMENT SPRZEDAŻY (DZIAŁALNOŚĆ NIEREJESTROWANA)'
            }</span>
            <h1 class="title">${isProforma ? 'FAKTURA PROFORMA' : 'FAKTURA / RACHUNEK BEZ VAT'}</h1>
            <div class="meta-line">Numer dokumentu: <strong>${params.docNumber}</strong></div>
          </div>
          <div style="text-align: right; font-size: 13px; line-height: 1.6;">
            <div>Data wystawienia: <strong>${formattedIssueDate}</strong></div>
            <div>Termin płatności: <strong style="color: #b91c1c;">${formattedDueDate} (${params.paymentDueDays} dni)</strong></div>
            <div>Forma płatności: <strong>Przelew bankowy</strong></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h4>Sprzedawca / Wykonawca:</h4>
            <div class="party-name">${seller.name}</div>
            <div class="party-sub">${seller.taxId}</div>
            <div class="party-sub">Adres: ${seller.address}</div>
            <div class="party-sub" style="margin-top: 6px;">Nr rachunku bankowego:</div>
            <div style="font-weight: 800; font-size: 14px; color: #0f172a; letter-spacing: 0.5px;">${seller.iban}</div>
            <div class="party-sub">Bank: ${seller.bank}</div>
            <div class="party-sub">E-mail: ${seller.email} | Tel: ${seller.phone}</div>
          </div>

          <div class="card">
            <h4>Nabywca / Zamawiający:</h4>
            <div class="party-name">${buyer.name || 'Brak nazwy klienta'}</div>
            ${buyer.taxId ? `<div class="party-sub">NIP: <strong>${buyer.taxId}</strong></div>` : '<div class="party-sub">NIP: Brak / Osoba fizyczna</div>'}
            <div class="party-sub">Adres: ${buyer.address || '-'}</div>
            ${buyer.representative ? `<div class="party-sub">Osoba reprezentująca: ${buyer.representative}</div>` : ''}
            ${buyer.email ? `<div class="party-sub">E-mail: ${buyer.email}</div>` : ''}
            ${buyer.phone ? `<div class="party-sub">Telefon: ${buyer.phone}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">Lp.</th>
              <th>Nazwa usługi / Przedmiot rozliczenia</th>
              <th style="width: 80px; text-align: center;">Ilość</th>
              <th style="width: 120px; text-align: right;">Cena jedn.</th>
              <th style="width: 130px; text-align: right;">Wartość brutto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1.</td>
              <td>
                <strong style="color: #0f172a;">${params.serviceTitle}</strong>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                  ${
                    isProforma
                      ? params.invoiceScope === 'advance'
                        ? 'Zadatek 50% na poczet realizacji projektu przed przystąpieniem do prac.'
                        : params.invoiceScope === 'final'
                        ? 'Płatność końcowa 50% po akceptacji i wdrożeniu strony na serwerze.'
                        : 'Kompletne jednorazowe rozliczenie wdrożenia serwisu One-Page.'
                      : 'Wykonanie, zakodowanie i uruchomienie serwisu internetowego.'
                  }
                </div>
              </td>
              <td style="text-align: center;">1 kpl.</td>
              <td style="text-align: right;">${payableAmount.toLocaleString('pl-PL')} PLN</td>
              <td style="text-align: right; font-weight: 800;">${payableAmount.toLocaleString('pl-PL')} PLN</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-inner">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Razem do zapłaty:</div>
            <div class="amount">${payableAmount.toLocaleString('pl-PL')} PLN</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">Słownie: ${payableAmount} złotych polskich 00/100</div>
          </div>
        </div>

        <div class="legal-notice">
          <strong>Podstawa prawna zwolnienia z podatku VAT:</strong><br />
          Podatnik zwolniony podmiotowo z podatku od towarów i usług na podstawie art. 113 ust. 1 i 9 ustawy z dnia 11 marca 2004 r. o podatku od towarów i usług (Dz.U. z 2023 r. poz. 1570 z późn. zm.).
          ${
            isProforma
              ? '<br /><em>Niniejsza faktura proforma stanowi podstawę do wykonania przelewu bankowego zadatku. Po zaksięgowaniu wpłaty Wykonawca przystępuje do realizacji prac.</em>'
              : ''
          }
        </div>

        <div class="signatures">
          <div class="sig-col">
            <div class="sig-line"></div>
            <div>Podpis osoby upoważnionej do wystawienia</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">(Wystawiono elektronicznie bez podpisu)</div>
          </div>
          <div class="sig-col">
            <div class="sig-line"></div>
            <div>Podpis osoby upoważnionej do odbioru</div>
          </div>
        </div>
      `;
    } else if (docType === 'work_contract') {
      bodyContent = `
        <div class="header">
          <div>
            <span class="badge">UMOWA CYWILNOPRAWNA Z PRAWAMI AUTORSKIMI</span>
            <h1 class="title">UMOWA O DZIEŁO nr ${params.docNumber}</h1>
            <div class="meta-line">z przeniesieniem autorskich praw majątkowych (50% KUP) oraz zadatkiem 50%</div>
          </div>
          <div style="text-align: right; font-size: 13px;">
            <div>Zawarta w dniu: <strong>${formattedIssueDate} r.</strong></div>
            <div>Miejsce zawarcia: <strong>Poznań / zdalnie</strong></div>
          </div>
        </div>

        <div class="contract-intro">
          Zawarta w dniu <strong>${formattedIssueDate} r.</strong> pomiędzy:<br /><br />
          <strong>1. WYKONAWCA:</strong><br />
          <strong>${seller.name}</strong>, zamieszkały: ${seller.address}, NIP/PESEL: ${seller.taxId}, e-mail: ${seller.email}, tel: ${seller.phone}, rachunek bankowy: <strong>${seller.iban}</strong> (${seller.bank})<br /><br />
          a<br /><br />
          <strong>2. ZAMAWIAJĄCY:</strong><br />
          <strong>${buyer.name}</strong>, z siedzibą: ${buyer.address}, ${buyer.taxId ? `NIP: ${buyer.taxId},` : ''} reprezentowany przez: <strong>${buyer.representative || 'Właściciela'}</strong>, e-mail: ${buyer.email || '-'}, tel: ${buyer.phone || '-'}
        </div>

        <div class="contract-section">
          <h3>§ 1. Przedmiot Umowy</h3>
          <p>1. Zamawiający zamawia, a Wykonawca zobowiązuje się do wykonania indywidualnego dzieła w postaci: <strong>${params.serviceTitle}</strong>.</p>
          <p>2. Dzieło obejmuje stworzenie responsywnego kodu źródłowego HTML5 & Tailwind CSS, optymalizację mobilną pod smartfony i tablety, konfigurację certyfikatu SSL (HTTPS) oraz konfigurację darmowego hostingu chmurowego (0 zł/mc opłat stałych).</p>
        </div>

        <div class="contract-section">
          <h3>§ 2. Wynagrodzenie i Zadatek 50%</h3>
          <p>1. Za wykonanie dzieła Zamawiający zapłaci Wykonawcy łączne wynagrodzenie ryczałtowe w kwocie: <strong>${params.totalPrice.toLocaleString('pl-PL')} PLN</strong> (słownie: ${params.totalPrice} zł).</p>
          <p>2. <strong>ZADATEK:</strong> Warunkiem rozpoczęcia realizacji dzieła przez Wykonawcę jest wpłata przez Zamawiającego bezzwrotnego zadatku w wysokości 50% wynagrodzenia, tj. kwoty <strong>${params.depositAmount.toLocaleString('pl-PL')} PLN</strong> na rachunek bankowy Wykonawcy w terminie 2 dni roboczych od zawarcia umowy.</p>
          <p>3. Pozostała część wynagrodzenia w kwocie <strong>${(params.totalPrice - params.depositAmount).toLocaleString('pl-PL')} PLN</strong> zostanie uregulowana przez Zamawiającego w terminie ${params.paymentDueDays} dni od dnia podpisania Protokołu Zdawczo-Odbiorczego i wdrożenia strony.</p>
        </div>

        <div class="contract-section">
          <h3>§ 3. Terminy i Procedura Odbioru</h3>
          <p>1. Wykonawca przedstawi działającą wersję roboczą dzieła w terminie <strong>${params.completionDays} dni roboczych</strong> od dnia zaksięgowania zadatku i otrzymania niezbędnych materiałów.</p>
          <p>2. Zamawiający ma prawo do zgłoszenia do 2 tur bezpłatnych poprawek kosmetycznych w ramach ustalonego zakresu w terminie 3 dni od prezentacji.</p>
        </div>

        <div class="contract-section">
          <h3>§ 4. Prawa Autorskie (50% KUP)</h3>
          <p>1. Z chwilą zapłaty całości wynagrodzenia Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do wykonanego kodu i projektu graficznego na wszelkich polach eksploatacji związanych z prowadzeniem działalności gospodarczej Zamawiającego (art. 41 ustawy o prawie autorskim).</p>
          <p>2. Do wynagrodzenia Wykonawcy mają zastosowanie 50% koszty uzyskania przychodów zgodnie z art. 22 ust. 9 pkt 3 ustawy o podatku dochodowym od osób fizycznych.</p>
        </div>

        <div class="contract-section">
          <h3>§ 5. Gwarancja i Wsparcie</h3>
          <p>1. Wykonawca udziela <strong>${params.warrantyDays} dni bezpłatnej gwarancji</strong> jakości i wsparcia technicznego liczonej od dnia odbioru dzieła.</p>
        </div>

        <div class="signatures" style="margin-top: 50px;">
          <div class="sig-col">
            <div class="sig-line"></div>
            <div><strong>WYKONAWCA</strong><br />${seller.name}</div>
          </div>
          <div class="sig-col">
            <div class="sig-line"></div>
            <div><strong>ZAMAWIAJĄCY</strong><br />${buyer.name}</div>
          </div>
        </div>
      `;
    } else {
      // acceptance_protocol
      bodyContent = `
        <div class="header">
          <div>
            <span class="badge">POTWIERDZENIE ODBIORU DZIEŁA</span>
            <h1 class="title">PROTOKÓŁ ZDAWCZO-ODBIORCZY</h1>
            <div class="meta-line">Numer protokołu: <strong>${params.docNumber}</strong></div>
          </div>
          <div style="text-align: right; font-size: 13px;">
            <div>Data odbioru: <strong>${formattedIssueDate} r.</strong></div>
          </div>
        </div>

        <div class="contract-intro">
          Spisany w dniu <strong>${formattedIssueDate} r.</strong> pomiędzy:<br />
          <strong>Wykonawcą:</strong> ${seller.name}<br />
          a<br />
          <strong>Zamawiającym:</strong> ${buyer.name}
        </div>

        <div class="contract-section">
          <h3>1. Przedmiot Odbioru</h3>
          <p>Przedmiotem odbioru jest wykonanie dzieła: <strong>${params.serviceTitle}</strong>.</p>
        </div>

        <div class="contract-section">
          <h3>2. Oświadczenie Zamawiającego</h3>
          <p>Zamawiający oświadcza, że:</p>
          <ul>
            <li>Dzieło zostało zaprezentowane i wdrożone w środowisku produkcyjnym,</li>
            <li>Strona wyświetla się poprawnie na urządzeniach mobilnych oraz komputerach,</li>
            <li>Certyfikat SSL jest aktywny i formularze kontaktowe/telefony działają poprawnie,</li>
            <li><strong>Zamawiający przyjmuje dzieło bez uwag i zastrzeżeń.</strong></li>
          </ul>
        </div>

        <div class="contract-section">
          <h3>3. Rozliczenie Końcowe</h3>
          <p>Podpisanie niniejszego protokołu stanowi podstawę do uregulowania pozostałej kwoty wynagrodzenia w wysokości <strong>${(params.totalPrice - params.depositAmount).toLocaleString('pl-PL')} PLN</strong> na rachunek Wykonawcy w terminie ${params.paymentDueDays} dni.</p>
          <p>Z dniem podpisania protokołu rozpoczyna się bieg <strong>${params.warrantyDays}-dniowego okresu gwarancji</strong> technicznej.</p>
        </div>

        <div class="signatures" style="margin-top: 60px;">
          <div class="sig-col">
            <div class="sig-line"></div>
            <div>Wykonawca (Oddający)<br /><strong>${seller.name}</strong></div>
          </div>
          <div class="sig-col">
            <div class="sig-line"></div>
            <div>Zamawiający (Odbierający)<br /><strong>${buyer.name}</strong></div>
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #0f172a;
      max-width: 820px;
      margin: 0 auto;
      padding: 36px 32px;
      font-size: 13px;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      padding: 3px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border: 1px solid #a7f3d0;
    }
    .title {
      margin: 0;
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .meta-line {
      color: #64748b;
      font-size: 12px;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }
    .card h4 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 700;
    }
    .party-name {
      font-weight: 800;
      color: #0f172a;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .party-sub {
      color: #475569;
      font-size: 12px;
      line-height: 1.4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      margin-bottom: 24px;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #cbd5e1;
      color: #475569;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .total-box {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }
    .total-inner {
      background: #faf5ff;
      border: 1px solid #d8b4fe;
      border-radius: 12px;
      padding: 16px 24px;
      text-align: right;
      min-width: 260px;
    }
    .total-inner .amount {
      font-size: 26px;
      font-weight: 900;
      color: #7c3aed;
      margin-top: 2px;
    }
    .legal-notice {
      margin-top: 24px;
      padding: 12px 16px;
      background: #f8fafc;
      border-left: 3px solid #7c3aed;
      font-size: 11px;
      color: #475569;
      line-height: 1.5;
    }
    .contract-intro {
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 20px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .contract-section {
      margin-bottom: 18px;
    }
    .contract-section h3 {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .contract-section p {
      margin: 4px 0;
      line-height: 1.6;
      color: #334155;
    }
    .contract-section ul {
      margin: 6px 0;
      padding-left: 20px;
      color: #334155;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      padding-top: 24px;
    }
    .sig-col {
      width: 44%;
      text-align: center;
      font-size: 12px;
      color: #475569;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-bottom: 8px;
    }
    @media print {
      body {
        margin: 0;
        padding: 15mm;
        font-size: 11pt;
      }
      .badge { border: none; }
      @page {
        size: A4;
        margin: 12mm;
      }
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = getDocumentHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
      showToast('Otwarto okno drukowania / zapisu do PDF!');
    } else {
      handleDownloadHtml();
      showToast('Pobrano plik HTML dokumentu. Otwórz go i wydrukuj (Ctrl+P).');
    }
  };

  const handleDownloadHtml = () => {
    const html = getDocumentHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanLeadName = (buyer.name || 'klient').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `${docType.toUpperCase()}_${cleanLeadName}_${params.docNumber.replace(/[\/\\:]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Pobrano plik dokumentu HTML!');
  };

  const handleCopyText = () => {
    const html = getDocumentHtml();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const plainText = tempDiv.innerText || tempDiv.textContent || '';
    navigator.clipboard.writeText(plainText);
    showToast('Skopiowano treść dokumentu do schowka!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl rounded-3xl border border-zinc-800 bg-[#10121a] shadow-2xl flex flex-col h-[94vh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131520]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg tracking-tight">
                  Generator Faktur & Umów
                </h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Druk A4 / PDF / NDG / B2B
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Tworzenie proform z zadatkiem 50%, umów o dzieło i rachunków działalności nierejestrowanej
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
              <button
                onClick={() => setViewMode('form')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'form'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Formularz</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'preview'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Podgląd A4</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Type Selector Bar */}
        <div className="px-6 py-2.5 border-b border-zinc-800/90 bg-[#11131c] flex flex-wrap items-center gap-2 overflow-x-auto">
          {[
            {
              id: 'proforma',
              label: '1. Faktura Proforma (Zadatek 50%)',
              icon: Receipt,
            },
            {
              id: 'ndg_invoice',
              label: '2. Faktura bez VAT (NDG - art. 113)',
              icon: CreditCard,
            },
            {
              id: 'work_contract',
              label: '3. Umowa o Dzieło (50% KUP)',
              icon: FileText,
            },
            {
              id: 'b2b_contract',
              label: '4. Umowa Wdrożeniowa B2B',
              icon: Shield,
            },
            {
              id: 'acceptance_protocol',
              label: '5. Protokół Zdawczo-Odbiorczy',
              icon: FileCheck,
            },
          ].map((tab) => {
            const isSelected = docType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setDocType(tab.id as DocumentType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 border ${
                  isSelected
                    ? 'bg-purple-600/15 border-purple-500 text-white shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-purple-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          {/* Left Column: Form */}
          <div
            className={`lg:col-span-6 p-6 overflow-y-auto space-y-6 ${
              viewMode === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {leadsList && leadsList.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Building2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Wybierz firmę do uzupełnienia danych:</span>
                </div>
                <select
                  value={lead?.id || ''}
                  onChange={(e) => {
                    const found = leadsList.find((l) => l.id === e.target.value);
                    if (found && onSelectLead) onSelectLead(found);
                  }}
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none max-w-[220px]"
                >
                  {leadsList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Seller Data */}
            <div className="rounded-2xl border border-zinc-800 bg-[#141622] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-400" />
                  <h4 className="font-bold text-white text-sm">1. Twoje Dane (Wykonawca)</h4>
                </div>
                <button
                  type="button"
                  onClick={handleSaveSellerProfile}
                  className="flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/20 transition"
                >
                  <Save className="h-3 w-3" />
                  <span>Zapisz domyślne</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Imię i nazwisko / Firma</label>
                  <input
                    type="text"
                    value={seller.name}
                    onChange={(e) => setSeller({ ...seller, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Status prawny / NIP / Podstawa</label>
                  <input
                    type="text"
                    value={seller.taxId}
                    onChange={(e) => setSeller({ ...seller, taxId: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">Adres zamieszkania / siedziby</label>
                  <input
                    type="text"
                    value={seller.address}
                    onChange={(e) => setSeller({ ...seller, address: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">Numer konta bankowego (IBAN)</label>
                  <input
                    type="text"
                    value={seller.iban}
                    onChange={(e) => setSeller({ ...seller, iban: e.target.value })}
                    className="w-full rounded-xl border border-emerald-500/40 bg-zinc-900 px-3 py-2 text-emerald-400 font-mono text-xs font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Nazwa Banku</label>
                  <input
                    type="text"
                    value={seller.bank}
                    onChange={(e) => setSeller({ ...seller, bank: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">E-mail kontaktowy</label>
                  <input
                    type="email"
                    value={seller.email}
                    onChange={(e) => setSeller({ ...seller, email: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Buyer Data */}
            <div className="rounded-2xl border border-zinc-800 bg-[#141622] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <Building2 className="h-4 w-4 text-purple-400" />
                <h4 className="font-bold text-white text-sm">2. Dane Klienta (Zamawiający)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Nazwa firmy / Klienta *</label>
                  <input
                    type="text"
                    required
                    value={buyer.name}
                    onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">NIP firmy klienta</label>
                  <input
                    type="text"
                    value={buyer.taxId}
                    onChange={(e) => setBuyer({ ...buyer, taxId: e.target.value })}
                    placeholder="np. 7781234567"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">Adres klienta</label>
                  <input
                    type="text"
                    value={buyer.address}
                    onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="rounded-2xl border border-zinc-800 bg-[#141622] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">3. Szczegóły Zlecenia & Kwoty</h4>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Przedmiot umowy / Nazwa usługi</label>
                  <input
                    type="text"
                    value={params.serviceTitle}
                    onChange={(e) => setDocParams({ ...params, serviceTitle: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Numer dokumentu</label>
                    <input
                      type="text"
                      value={params.docNumber}
                      onChange={(e) => setDocParams({ ...params, docNumber: e.target.value })}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Data wystawienia</label>
                    <input
                      type="date"
                      value={params.issueDate}
                      onChange={(e) => setDocParams({ ...params, issueDate: e.target.value })}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Termin płatności (dni)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={params.paymentDueDays}
                      onChange={(e) =>
                        setDocParams({
                          ...params,
                          paymentDueDays: Math.max(1, parseInt(e.target.value, 10) || 7),
                        })
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 space-y-1.5">
                    <label className="block text-zinc-400 font-medium text-[11px]">Łączna kwota zlecenia (PLN)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={params.totalPrice}
                        onChange={(e) => {
                          const tot = Math.max(1, parseInt(e.target.value, 10) || 0);
                          setDocParams({
                            ...params,
                            totalPrice: tot,
                            depositAmount: Math.round(tot * 0.5),
                          });
                        }}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-base font-black text-white focus:border-purple-500 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-zinc-400">PLN</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5">
                    <label className="block text-emerald-300 font-medium text-[11px]">Zadatek 50% (PLN)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={params.depositAmount}
                        onChange={(e) =>
                          setDocParams({
                            ...params,
                            depositAmount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="w-full rounded-lg border border-emerald-500/40 bg-zinc-950 px-3 py-1.5 text-base font-black text-emerald-400 focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-emerald-400">PLN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live A4 Preview */}
          <div
            className={`lg:col-span-6 p-4 sm:p-6 bg-[#0a0c12] overflow-y-auto flex flex-col items-center ${
              viewMode === 'form' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="w-full max-w-[560px] bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 text-[11px] leading-relaxed border border-slate-200">
              <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start gap-3">
                <div>
                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    {docType === 'proforma'
                      ? 'Faktura Proforma (Zadatek)'
                      : docType === 'ndg_invoice'
                      ? 'Rachunek bez VAT (NDG)'
                      : docType === 'work_contract'
                      ? 'Umowa o Dzieło (50% KUP)'
                      : docType === 'b2b_contract'
                      ? 'Umowa Wdrożeniowa B2B'
                      : 'Protokół Zdawczo-Odbiorczy'}
                  </span>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {docType === 'proforma'
                      ? 'Faktura Proforma'
                      : docType === 'ndg_invoice'
                      ? 'Faktura / Rachunek bez VAT'
                      : docType === 'work_contract'
                      ? 'Umowa o Dzieło'
                      : docType === 'b2b_contract'
                      ? 'Umowa Wdrożeniowa B2B'
                      : 'Protokół Zdawczo-Odbiorczy'}
                  </h2>
                  <div className="text-[10px] text-slate-500">Nr: <strong>{params.docNumber}</strong></div>
                </div>
                <div className="text-right text-[10px] text-slate-600 leading-tight">
                  <div>Data: <strong>{formattedIssueDate}</strong></div>
                  <div>Płatność: <strong>{formattedDueDate}</strong></div>
                  <div className="text-purple-700 font-bold">Przelew bankowy</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Wykonawca:</div>
                  <div className="font-bold text-slate-900">{seller.name}</div>
                  <div className="text-slate-600">{seller.taxId}</div>
                  <div className="font-mono text-[9px] font-bold text-emerald-700 pt-1">{seller.iban}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Nabywca:</div>
                  <div className="font-bold text-slate-900">{buyer.name || 'Nazwa klienta'}</div>
                  {buyer.taxId && <div className="text-slate-600">NIP: {buyer.taxId}</div>}
                  <div className="text-slate-600">{buyer.address || '-'}</div>
                </div>
              </div>

              <div className="space-y-2 text-[10px] text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p><strong>Usługa:</strong> {params.serviceTitle}</p>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Wartość brutto:</span>
                  <span className="text-purple-700 font-black text-sm">{payableAmount.toLocaleString('pl-PL')} PLN</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 mt-4 flex justify-between text-center text-[9px] text-slate-500">
                <div className="w-5/12">
                  <div className="border-t border-slate-400 mb-1"></div>
                  <div>Podpis Wykonawcy</div>
                </div>
                <div className="w-5/12">
                  <div className="border-t border-slate-400 mb-1"></div>
                  <div>Podpis Zamawiającego</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-[#131520] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Dokument w 100% zgodny z polskim prawem (NDG art. 113 / Umowa o Dzieło 50% KUP)</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Kopiuj Tekst</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:text-white transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Pobierz HTML</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Drukuj / Zapisz PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
