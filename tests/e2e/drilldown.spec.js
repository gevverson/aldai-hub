import { test, expect } from '@playwright/test';

/**
 * County → Constituency → Projects drill-down.
 *
 * Guards the two things that make this platform trustworthy:
 *   1. a citizen can navigate from county down to an individual project, and
 *   2. every project shown carries the audit report and page it came from.
 */

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:4199';

test.describe('geography drill-down', () => {
  test('county list shows counties with audited totals', async ({ page }) => {
    await page.goto(`${BASE}/counties`);

    await expect(page.getByRole('heading', { name: /select your county/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Nandi/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Uasin Gishu/i }).first()).toBeVisible();
  });

  test('counties with no data are shown honestly as "coming soon", not fake zeros', async ({ page }) => {
    await page.goto(`${BASE}/counties`);
    // The national catalogue lists every county; those without ingested data
    // appear under a "Coming soon" section rather than as misleading zero cards.
    await expect(page.getByRole('heading', { name: /Coming soon/i })).toBeVisible();
    await expect(page.getByText(/Mombasa/).first()).toBeVisible();
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
