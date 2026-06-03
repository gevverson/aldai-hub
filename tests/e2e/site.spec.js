import { test, expect } from '@playwright/test';

// ── warm up the backend before anything else ─────────────────────────────────
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.close();
});

// ─── API ─────────────────────────────────────────────────────────────────────
test.describe('API', () => {
  test('health endpoint returns ok + db connected', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
  });

  test('projects endpoint returns 14 seeded projects', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/api/projects');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.length).toBe(14);
  });

  test('wards endpoint returns all 6 wards', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/api/projects/wards');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.length).toBe(6);
  });

  test('stats endpoint returns correct project count', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/api/projects/stats');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.projectsTracked).toBe(14);
    expect(body.data.ghostProjects).toBeGreaterThanOrEqual(1);
  });

  test('audit status endpoint responds', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/api/audit/status');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(['online', 'offline']).toContain(body.python_service);
  });
});

// ─── Home page ───────────────────────────────────────────────────────────────
test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('hero heading is visible', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
    const text = await page.locator('h1').first().textContent();
    expect(text).toMatch(/money|pesa/i);
  });

  test('alert ticker is rendered', async ({ page }) => {
    // The ticker scrolls project names at top of page
    const ticker = page.locator('text=/ABANDONED|GHOST PROJECT|STALLED/i').first();
    await expect(ticker).toBeVisible();
  });

  test('all 6 ward cards are rendered', async ({ page }) => {
    await page.waitForTimeout(3000);
    const wardLinks = page.locator('a[href*="/ward/"]');
    await expect(wardLinks).toHaveCount(6);
  });

  test('"Ask the AI Auditor" button navigates to /audit', async ({ page }) => {
    const btn = page.locator('a, button').filter({ hasText: /Ask the AI/i }).first();
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page).toHaveURL(/\/audit/);
  });

  test('"View Your Ward" button is present', async ({ page }) => {
    const btn = page.locator('a, button').filter({ hasText: /View Your Ward/i }).first();
    await expect(btn).toBeVisible();
  });
});

// ─── Navbar ──────────────────────────────────────────────────────────────────
test.describe('Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('all desktop nav links are visible', async ({ page }) => {
    for (const href of ['/', '/map', '/report', '/audit', '/about']) {
      await expect(page.locator(`nav a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test('live report count badge is visible', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('nav').locator('text=LIVE').first()).toBeVisible();
  });

  test('mobile hamburger opens nav overlay', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const ham = page.locator('button[aria-expanded]').first();
    await expect(ham).toBeVisible();
    await ham.click();
    await page.waitForTimeout(500);
    const mobileLinks = page.locator('.md\\:hidden a');
    const count = await mobileLinks.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});

// ─── All 6 ward pages ────────────────────────────────────────────────────────
const WARDS = [
  { slug: 'kabwareng',      projects: 1 },
  { slug: 'terik',          projects: 2 },
  { slug: 'kemeloi-maraba', projects: 2 },
  { slug: 'kobujoi',        projects: 3 },
  { slug: 'kaptumo-kaboi',  projects: 2 },
  { slug: 'koyo-ndurio',    projects: 1 },
];

test.describe('Ward pages', () => {
  for (const { slug, projects } of WARDS) {
    test(`${slug} — loads with ${projects} project(s)`, async ({ page }) => {
      await page.goto(`/ward/${slug}`);
      // Wait for data — the h1 changes from spinner to "X Ward Ledger"
      await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
        .toBeVisible({ timeout: 25_000 });
      await expect(page.locator('h1').filter({ hasText: /Not Found/i }))
        .not.toBeVisible();
      // Correct number of project cards
      const cards = page.locator('text=Audit Finding');
      await expect(cards).toHaveCount(projects, { timeout: 10_000 });
    });
  }

  test('kobujoi — verify buttons are present', async ({ page }) => {
    await page.goto('/ward/kobujoi');
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 25_000 });
    await expect(page.locator('button', { hasText: 'Verify This Site' }))
      .toHaveCount(3, { timeout: 10_000 });
  });

  test('kobujoi — filter buttons work', async ({ page }) => {
    await page.goto('/ward/kobujoi');
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 25_000 });
    for (const f of ['All Projects', 'Critical', 'Disputed', 'Verified Complete']) {
      const btn = page.locator('button').filter({ hasText: new RegExp(f, 'i') }).first();
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(300);
    }
  });

  test('back to overview link navigates home', async ({ page }) => {
    await page.goto('/ward/kobujoi');
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 25_000 });
    await page.locator('a', { hasText: /Back to Overview/i }).first().click();
    await expect(page).toHaveURL(/\/?$/);
  });
});

// ─── Verify modal ─────────────────────────────────────────────────────────────
test.describe('Verify modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ward/kobujoi');
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 25_000 });
  });

  test('opens when Verify button is clicked', async ({ page }) => {
    await page.locator('button', { hasText: 'Verify This Site' }).first().click();
    await expect(page.locator('text=Uthibitisho wa Raia')).toBeVisible();
  });

  test('has status option buttons inside', async ({ page }) => {
    await page.locator('button', { hasText: 'Verify This Site' }).first().click();
    await expect(page.locator('text=Uthibitisho wa Raia')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /I went there/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /abandoned.*stalled/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /wrong.*incomplete/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /working.*complete/i }).first()).toBeVisible();
  });

  test('description textarea accepts input', async ({ page }) => {
    await page.locator('button', { hasText: 'Verify This Site' }).first().click();
    await expect(page.locator('text=Uthibitisho wa Raia')).toBeVisible();
    await page.locator('textarea').first().fill('CI test observation');
    await expect(page.locator('textarea').first()).toHaveValue('CI test observation');
  });

  test('close button dismisses modal', async ({ page }) => {
    await page.locator('button', { hasText: 'Verify This Site' }).first().click();
    await expect(page.locator('text=Uthibitisho wa Raia')).toBeVisible();
    await page.locator('button[aria-label="Close"]').click();
    await expect(page.locator('text=Uthibitisho wa Raia')).not.toBeVisible();
  });

  test('clicking backdrop dismisses modal', async ({ page }) => {
    await page.locator('button', { hasText: 'Verify This Site' }).first().click();
    await expect(page.locator('text=Uthibitisho wa Raia')).toBeVisible();
    await page.mouse.click(50, 400);
    await expect(page.locator('text=Uthibitisho wa Raia')).not.toBeVisible();
  });
});

// ─── Evidence map ─────────────────────────────────────────────────────────────
test.describe('Map page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3000);
  });

  test('Leaflet map renders', async ({ page }) => {
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('14 project markers are plotted', async ({ page }) => {
    await expect(page.locator('path.leaflet-interactive')).toHaveCount(14);
  });

  test('filter buttons are clickable', async ({ page }) => {
    // Buttons contain status text — use partial match
    for (const f of ['All Projects', 'Ghost', 'Stalled', 'Abandoned', 'Disputed']) {
      const btn = page.locator('button').filter({ hasText: f }).first();
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(300);
    }
  });

  test('clicking a marker opens a popup', async ({ page }) => {
    await page.locator('path.leaflet-interactive').first().click({ force: true });
    await expect(page.locator('.leaflet-popup')).toBeVisible({ timeout: 5_000 });
  });

  test('popup contains a Verify button', async ({ page }) => {
    await page.locator('path.leaflet-interactive').first().click({ force: true });
    await expect(page.locator('.leaflet-popup')).toBeVisible({ timeout: 5_000 });
    const verifyBtn = page.locator('.leaflet-popup').locator('button, a')
      .filter({ hasText: /verify/i }).first();
    await expect(verifyBtn).toBeVisible();
  });

  test('zoom controls are present', async ({ page }) => {
    await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible();
    await expect(page.locator('.leaflet-control-zoom-out')).toBeVisible();
  });
});

// ─── AI Audit Translator ──────────────────────────────────────────────────────
test.describe('AI Audit Translator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  });

  test('page loads with heading', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /AI AUDIT/i })).toBeVisible();
  });

  test('suggested question buttons are visible (at least 4)', async ({ page }) => {
    // Count buttons containing question-related text
    const btns = page.locator('button').filter({ hasText: /Kobujoi|Kimaren|payroll|bursary|ghost|abandoned|bursaries/i });
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('clicking a suggested question populates textarea', async ({ page }) => {
    const firstBtn = page.locator('button').filter({ hasText: /Kobujoi|Kimaren/i }).first();
    await firstBtn.click();
    const val = await page.locator('textarea').first().inputValue();
    expect(val.length).toBeGreaterThan(10);
  });

  test('Kiswahili / English language toggle works', async ({ page }) => {
    await page.locator('button', { hasText: /Kiswahili/i }).first().click();
    await page.waitForTimeout(200);
    const phSw = await page.locator('textarea').first().getAttribute('placeholder');
    expect(phSw).toMatch(/swali|Andika/i);

    await page.locator('button', { hasText: /English/i }).first().click();
    await page.waitForTimeout(200);
    const phEn = await page.locator('textarea').first().getAttribute('placeholder');
    expect(phEn).toMatch(/question|Type/i);
  });

  test('audit API returns a structured answer', async ({ page }) => {
    const res = await page.request.post('/api/audit/query', {
      data: { question: 'How much was spent on Kobujoi hospital?', language: 'en' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.answer).toBeTruthy();
    expect(body.answer.length).toBeGreaterThan(50);
    // Should contain structured sections
    expect(body.answer).toMatch(/JIBU|📋|Answer/i);
  });

  test('session history accordion appears after submitting a question', async ({ page }) => {
    // Submit a question first — history only renders once messages exist
    await page.locator('button').filter({ hasText: /Kobujoi|Kimaren/i }).first().click();
    await page.locator('textarea').first().press('Control+Enter');
    // Wait briefly then check history section appears
    await page.waitForTimeout(1000);
    await expect(
      page.locator('text=HISTORIA').or(page.locator('text=SESSION HISTORY')).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Report page ──────────────────────────────────────────────────────────────
test.describe('Report page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/report');
    await page.waitForLoadState('networkidle');
  });

  test('page heading is visible', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /REPORT CORRUPTION/i })).toBeVisible();
  });

  test('ward dropdown has 7 options (blank + 6 wards)', async ({ page }) => {
    await expect(page.locator('select').first().locator('option')).toHaveCount(7);
  });

  test('issue type dropdown has options', async ({ page }) => {
    const count = await page.locator('select').nth(1).locator('option').count();
    expect(count).toBeGreaterThan(3);
  });

  test('description textarea and submit button are visible', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /submit|tuma/i }).first()).toBeVisible();
  });

  test('empty form submission does not show tracking code', async ({ page }) => {
    await page.locator('button').filter({ hasText: /submit|tuma/i }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/NANDI-/')).not.toBeVisible();
  });

  test('report API accepts submission and returns tracking code', async ({ page }) => {
    const res = await page.request.post('/api/reports', {
      data: {
        ward: 'Terik',
        category: 'stalled',
        description: 'CI automated pipeline test — please ignore this submission.',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.trackingCode).toMatch(/^NANDI-\d{4}-[A-F0-9]+$/);
  });
});

// ─── About page ───────────────────────────────────────────────────────────────
test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
  });

  test('loads with correct heading', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /About Macho/i })).toBeVisible();
  });

  test('mission section is visible', async ({ page }) => {
    await expect(page.locator('text=The Mission')).toBeVisible();
  });

  test('data sources section is visible', async ({ page }) => {
    await expect(page.locator('text=/Official Data Sources/i')).toBeVisible();
  });
});

// ─── Footer ───────────────────────────────────────────────────────────────────
test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });

  test('builder credit shows Gevverson Kipkoech', async ({ page }) => {
    await expect(page.locator('text=Gevverson Kipkoech')).toBeVisible();
  });

  test('LinkedIn link points to correct profile', async ({ page }) => {
    const li = page.locator('a[href*="linkedin.com"]').first();
    await expect(li).toBeVisible();
    const href = await li.getAttribute('href');
    expect(href).toContain('gevverson-kipkoech');
  });

  test('GitHub link points to correct profile', async ({ page }) => {
    const gh = page.locator('a[href*="github.com/gevverson"]').first();
    await expect(gh).toBeVisible();
  });

  test('EACC hotline number is displayed', async ({ page }) => {
    await expect(page.locator('text=0800 720 629')).toBeVisible();
  });
});
