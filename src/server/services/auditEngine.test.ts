import test from 'node:test';
import assert from 'node:assert/strict';
import { runHeuristicAudit } from './auditEngine.ts';
import type { ScrapedData } from '../../types/index.ts';

test('Heuristic Audit flags missing SSL and missing mobile CTA', () => {
  const mockScraped: ScrapedData = {
    title: 'Stomatolog Janusz',
    metaDescription: 'Krótki opis',
    hasSSL: false,
    hasMobileMeta: false,
    formsCount: 0,
    imagesCount: 5,
    headingsCount: 1,
    ctaButtonsCount: 0,
    headings: ['Witamy'],
    ctaButtons: [],
  };

  const audit = runHeuristicAudit(mockScraped, {
    name: 'Gabinet Janusz',
    city: 'Poznań',
    industry: 'Stomatologia',
  });

  assert.ok(audit.score < 50, 'Score should be low for insecure, non-mobile site without CTA');
  assert.equal(audit.issues.length, 3, 'Should produce 3 critical issues');

  const hasSslIssue = audit.issues.some((i) => i.title.includes('SSL'));
  assert.equal(hasSslIssue, true, 'Should detect SSL issue');

  const hasCtaIssue = audit.issues.some((i) => i.title.includes('Click-to-Call') || i.title.includes('kontaktu'));
  assert.equal(hasCtaIssue, true, 'Should detect missing CTA issue');
});

test('Heuristic Audit rewards high quality modern responsive sites', () => {
  const mockScraped: ScrapedData = {
    title: 'Klinika Stomatologiczna DentaMed Poznań — Nowoczesne Leczenie',
    metaDescription: 'Klinika Stomatologiczna DentaMed w Poznaniu. Kompleksowa stomatologia estetyczna, implanty, bezbolesne leczenie i szybkie terminy.',
    hasSSL: true,
    hasMobileMeta: true,
    formsCount: 1,
    imagesCount: 8,
    headingsCount: 5,
    ctaButtonsCount: 4,
    headings: ['Klinika DentaMed', 'Nasza oferta', 'Cennik', 'Opinie', 'Kontakt'],
    ctaButtons: ['Zadzwoń: +48 61 800 90 90', 'Umów wizytę', 'Cennik', 'Kontakt'],
  };

  const audit = runHeuristicAudit(mockScraped, {
    name: 'DentaMed',
    city: 'Poznań',
    industry: 'Stomatologia',
  });

  assert.ok(audit.score >= 70, 'Score should be high for secure, mobile site with forms and CTA');
  assert.ok(audit.metrics.seo >= 70, 'SEO score should be high');
  assert.ok(audit.metrics.conversion >= 70, 'Conversion score should be high');
});
