import { test, expect } from '@playwright/test';

/**
 * County → Constituency → Projects drill-down.
 *
 * Guards the two things that make this platform trustworthy:
 *   1. a citizen can navigate from county down to an individual project, and
 *   2. every project shown carries the audit report and page it came from.
 */

// Empty by default so gotos are relative and resolve against playwright.config
// baseURL (BASE_URL) — the same convention as site.spec.js, so CI (port 4173)
// and local runs both work. Set E2E_BASE_URL only to override explicitly.
const BASE = process.env.E2E_BASE_URL || '';

test.describe('geography drill-down', () => {
  test('county list shows counties with audited totals', async ({ page }) => {
    await page.goto(`${BASE}/counties`);

    await expect(page.getByRole('heading', { name: /select your county/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Nandi/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Uasin Gishu/i }).first()).toBeVisible();
  });

  test('counties without a project register are shown honestly, not as fake zeros', async ({ page }) => {
    await page.goto(`${BASE}/counties`);

    // The national catalogue lists every county. A county is only shown under
    // "Live now" once it has an ingested project register; the many counties
    // whose OAG reports are narrative-only sit under "Audit findings
    // available" with their real cited findings, never as a misleading zero
    // card. Counties with neither fall back to "Coming soon" — that section is
    // absent whenever every county has some data, which is the current state.
    await expect(page.getByRole('heading', { name: /Live now/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Audit findings available/i })).toBeVisible();
    await expect(page.getByText(/Mombasa/).first()).toBeVisible();

    // Whichever tier a county lands in, it is never rendered as "0 projects"
    // dressed up as a finished audit.
    const comingSoon = page.getByRole('heading', { name: /Coming soon/i });
    if (await comingSoon.count()) {
      await expect(comingSoon.first()).toContainText(/Coming soon · \d+ counties/);
    }
  });

  test('drills county -> constituency -> cited projects', async ({ page }) => {
    await page.goto(`${BASE}/counties`);

    await page.getByRole('link', { name: /Nandi/i }).first().click();
    // Exact: "Nandi County" also appears in the "Nandi County Executive" card.
    await expect(page.getByRole('heading', { name: 'Nandi County', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Constituencies$/i })).toBeVisible();

    await page.getByRole('link', { name: /Aldai/i }).first().click();
    await expect(page.getByRole('heading', { name: /Tracked Projects/i })).toBeVisible();

    // The core promise: a visible OAG citation with a page number.
    await expect(page.getByText(/OAG .*Audit FY\d{4}\/\d{4}, p\d+/).first()).toBeVisible();
  });

  test('ghost projects surface with their allocation', async ({ page }) => {
    await page.goto(`${BASE}/constituency/aldai`);
    await expect(page.getByText(/GHOST PROJECT/i).first()).toBeVisible();
    await expect(page.getByText(/Kimaren/i).first()).toBeVisible();
  });

  test('completed projects read as a calm note, not a red audit finding', async ({ page }) => {
    await page.goto(`${BASE}/constituency/aldai`);
    await expect(page.getByRole('heading', { name: /Tracked Projects/i })).toBeVisible();
    // The cry-wolf fix: a COMPLETE project shows "Auditor's Note", never "Audit Finding".
    await expect(page.getByText(/Auditor.s Note/i).first()).toBeVisible();
  });

  test('the Complete filter returns projects (not a broken zero)', async ({ page }) => {
    await page.goto(`${BASE}/constituency/aldai`);
    const completeBtn = page.getByRole('button', { name: /^Complete \((\d+)\)/ });
    await expect(completeBtn).toBeVisible();
    // It must not be the old broken "(0)".
    await expect(completeBtn).not.toHaveText(/\(0\)/);
    await completeBtn.click();
    await expect(page.getByText(/No projects match the selected filter/i)).toHaveCount(0);
  });

  test('narrative-only constituency shows cited audit findings', async ({ page }) => {
    // Gatundu North (Kiambu) has no project register but real audit findings.
    await page.goto(`${BASE}/constituency/gatundu%20north`);
    await expect(page.getByRole('heading', { name: /Audit Findings/i })).toBeVisible();
    // An opinion badge and a page citation must be present.
    await expect(page.getByText(/Qualified Opinion|Adverse Opinion|Disclaimer/i).first()).toBeVisible();
    await expect(page.getByText(/OAG .*NG-CDF Audit FY\d{4}\/\d{4}, p\d+/).first()).toBeVisible();
  });

  test('counties page surfaces findings-only counties as a distinct tier', async ({ page }) => {
    await page.goto(`${BASE}/counties`);
    await expect(page.getByRole('heading', { name: /Audit findings available/i })).toBeVisible();
    await expect(page.getByText(/Kiambu/).first()).toBeVisible();
  });

  test('unknown county fails gracefully instead of crashing', async ({ page }) => {
    // A name that is not one of Kenya's 47 counties.
    await page.goto(`${BASE}/counties/atlantis`);
    await expect(page.getByRole('heading', { name: /not covered yet/i })).toBeVisible();
  });

  test('no project card renders a null location', async ({ page }) => {
    await page.goto(`${BASE}/constituency/aldai`);
    // Wait on the assertion (auto-retrying) rather than a bare selector wait,
    // which raced the async project fetch and made this test flaky.
    await expect(page.getByRole('heading', { name: /Tracked Projects/i })).toBeVisible();
    const body = await page.textContent('body');
    expect(body).not.toContain('null ·');
    expect(body).not.toContain('undefined ·');
  });
});
