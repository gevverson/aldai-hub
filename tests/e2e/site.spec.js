import { test, expect } from '@playwright/test';

// Points at the local API in CI (hermetic run); falls back to production
// for ad-hoc smoke checks against the live deployment.
const SERVER = process.env.SERVER_URL || 'https://macho-ya-mwananchi-server.onrender.com';

// ── warm up the backend before anything else ─────────────────────────────────
test.beforeAll(async ({ request }) => {
  // Ping health directly — no page load, no extra API calls
  for (let i = 0; i < 5; i++) {
    const res = await request.get(`${SERVER}/api/health`).catch(() => null);
    if (res?.ok()) break;
    await new Promise(r => setTimeout(r, 5000));
  }
});

// ─── API (uses bare request fixture — no page navigation, no extra API calls) ──
test.describe('API', () => {
  test('health endpoint returns ok + db connected', async ({ request }) => {
    const res = await request.get(`${SERVER}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
  });

  test('projects endpoint returns the seeded national dataset', async ({ request }) => {
    const res = await request.get(`${SERVER}/api/projects`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Grows as more counties are ingested — assert a substantial floor, not an
    // exact count, so adding a county never breaks this test.
    expect(body.data.length).toBeGreaterThan(300);
  });

  test('wards endpoint returns all 6 wards', async ({ request }) => {
    const res = await request.get(`${SERVER}/api/projects/wards`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.length).toBe(6);
  });

  test('stats endpoint returns correct project count', async ({ request }) => {
    const res = await request.get(`${SERVER}/api/projects/stats`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.projectsTracked).toBeGreaterThan(300);
    expect(body.data.ghostProjects).toBeGreaterThanOrEqual(1);
  });

  test('audit status endpoint responds', async ({ request }) => {
    const res = await request.get(`${SERVER}/api/audit/status`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(['online', 'offline']).toContain(body.python_service);
  });

  test('ward endpoint returns projects for wards with data', async ({ request }) => {
    // Kobujoi (sub-county hospital) and Terik (Kapsengere) each retain a
    // county-level project tagged to that ward after the national migration.
    for (const ward of ['Kobujoi', 'Terik']) {
      const res = await request.get(`${SERVER}/api/projects/ward/${ward}`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data.projects.length).toBeGreaterThan(0);
    }
  });

  test('report submission returns tracking code', async ({ request }) => {
    const res = await request.post(`${SERVER}/api/reports`, {
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

  test('audit API returns a structured answer', async ({ request }) => {
    const res = await request.post(`${SERVER}/api/audit/query`, {
      data: { question: 'How much was spent on Kobujoi hospital?', language: 'en' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.answer).toBeTruthy();
    expect(body.answer).toMatch(/JIBU|📋|Answer/i);
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

// ─── Legacy ward pages (backward-compat behind the national drill-down) ───────
// After the national migration, county-level projects retain a ward tag; the
// canonical county → constituency flow is covered in drilldown.spec.js. Here we
// smoke-test that a ward with data still renders its ledger and cited card(s).
const WARDS = [
  { slug: 'kobujoi', minProjects: 1 },
  { slug: 'terik',   minProjects: 1 },
];

// A stable per-card selector: every project card has a "Verify This Site" button.
const cardButtons = (page) =>
  page.locator('button').filter({ hasText: /Verify This Site/i });

test.describe('Ward pages', () => {
  for (const { slug, minProjects } of WARDS) {
    test(`${slug} — ledger loads with cited project(s)`, async ({ page }) => {
      await page.goto(`/ward/${slug}`, { waitUntil: 'networkidle', timeout: 40_000 });
      await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
        .toBeVisible({ timeout: 30_000 });
      expect(await cardButtons(page).count()).toBeGreaterThanOrEqual(minProjects);
    });
  }

  test('kobujoi — verify buttons are present', async ({ page }) => {
    await page.goto('/ward/kobujoi', { waitUntil: 'networkidle', timeout: 40_000 });
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 30_000 });
    expect(await cardButtons(page).count()).toBeGreaterThanOrEqual(1);
  });

  test('kobujoi — filter buttons work', async ({ page }) => {
    await page.goto('/ward/kobujoi', { waitUntil: 'networkidle', timeout: 40_000 });
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 30_000 });
    // Filter labels are shared with the national ProjectList component.
    for (const f of ['All Projects', 'Critical', 'Disputed / Incomplete', 'Complete']) {
      const btn = page.locator('button').filter({ hasText: new RegExp(f, 'i') }).first();
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(300);
    }
  });

  test('back to overview link navigates home', async ({ page }) => {
    await page.goto('/ward/kobujoi', { waitUntil: 'networkidle', timeout: 40_000 });
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 30_000 });
    await page.locator('a', { hasText: /Back to Overview/i }).first().click();
    await expect(page).toHaveURL(/\/?$/);
  });
});

// ─── Verify modal ─────────────────────────────────────────────────────────────
test.describe('Verify modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ward/kobujoi', { waitUntil: 'networkidle', timeout: 40_000 });
    await expect(page.locator('h1').filter({ hasText: /Ledger/i }))
      .toBeVisible({ timeout: 30_000 });
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

  test('project markers are plotted', async ({ page }) => {
    // Only projects that carry coordinates are plotted (currently the
    // geolocated county projects). Assert markers exist rather than an exact
    // count, which changes as constituencies are geocoded.
    await expect(page.locator('path.leaflet-interactive').first()).toBeVisible();
    expect(await page.locator('path.leaflet-interactive').count()).toBeGreaterThanOrEqual(1);
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

  test('audit API returns a structured answer', async ({ page, request }) => {
    // Live LLM dependency — skip when no AI backend is reachable (e.g. hermetic CI).
    const status = await request.get(`${SERVER}/api/audit/status`).then((r) => r.json()).catch(() => ({}));
    test.skip(
      status.python_service !== 'online' && status.fallback !== 'gemini-direct-fallback',
      'AI backend offline — live-answer test skipped'
    );
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

  test('session history accordion appears after submitting a question', async ({ page, request }) => {
    // Live LLM dependency — skip when no AI backend is reachable (e.g. hermetic CI).
    const status = await request.get(`${SERVER}/api/audit/status`).then((r) => r.json()).catch(() => ({}));
    test.skip(
      status.python_service !== 'online' && status.fallback !== 'gemini-direct-fallback',
      'AI backend offline — submit-and-history test skipped'
    );
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

  test('report API tested via API suite', async () => {
    // Covered by the API describe block using direct server requests
    // This avoids double-counting against the CDN rate limit
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
