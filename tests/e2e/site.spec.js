import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'movil-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'escritorio-1440', width: 1440, height: 900 },
];

async function seedLang(page, lang = 'es') {
  await page.addInitScript((l) => { localStorage.setItem('giova_water:lang', l); }, lang);
}

// Collects console errors and failed/4xx requests so a missing asset fails the test.
function watch(page) {
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    // Google Fonts is not reachable from every test environment.
    if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) problems.push(`requestfailed: ${r.url()}`);
  });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  return problems;
}

test.beforeEach(async ({ page }) => { await seedLang(page, 'es'); });

test.describe('estructura', () => {
  test('home renders its 7 sections, a skip link and one h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').first()).toBeVisible();
    await expect(page.locator('main section')).toHaveCount(7);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Ingeniería del agua, de la necesidad a la operación.');
    await expect(page.locator('a.skip-link')).toHaveCount(1);
  });

  test('switching to EN and FR updates html lang and the h1', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Water engineering, from need to operation.');
    await page.getByRole('button', { name: 'FR', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toContainText('Ingénierie de l’eau');
  });

  test('no console errors or failed requests (e.g. missing media) on load', async ({ page }) => {
    const problems = watch(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#contacto').scrollIntoViewIfNeeded();
    expect(problems).toEqual([]);
  });
});

test.describe('scroll', () => {
  test('sections reveal as they enter the viewport', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('#proyectos article').nth(3);
    await expect(card).not.toHaveClass(/is-in/);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/is-in/);
    await expect.poll(() => card.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('the tagline wakes word by word and dims again when scrolling back up', async ({ page }) => {
    await page.goto('/');
    const words = page.locator('#eslogan .tagline-word');
    const total = await words.count();
    expect(total).toBeGreaterThan(12);
    await page.locator('#eslogan').scrollIntoViewIfNeeded();
    // Put the last word above the trigger line.
    await words.last().evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await expect.poll(() => page.locator('#eslogan .tagline-word.on').count()).toBe(total);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.locator('#eslogan .tagline-word.on').count()).toBeLessThan(total);
  });

  test('the work cycle advances with the scroll on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const stage = page.locator('.cycle-stage');
    await expect(stage).toBeAttached();
    const current = () => page.locator('.cycle-item[aria-current="step"]').evaluate((el) => el.querySelector('.cycle-item-title').textContent);
    await stage.scrollIntoViewIfNeeded();
    const first = await current();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2.4));
    await expect.poll(current).not.toBe(first);
  });

  test('with prefers-reduced-motion everything is visible at once and the cycle is a plain list', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.reveal:not(.is-in)')).toHaveCount(0);
    await expect(page.locator('.cycle-stage')).toHaveCount(0);
    await expect(page.locator('#eslogan .tagline-word:not(.on)')).toHaveCount(0);
  });

  test('FAQ answers open and close', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('#faq details').first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).not.toHaveAttribute('open', '');
  });
});

test.describe('proyectos', () => {
  test('filters narrow the grid and mark the active filter', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#proyectos article');
    await expect(cards).toHaveCount(7);
    await page.getByRole('button', { name: /Digital e IoT/ }).click();
    await expect(cards).toHaveCount(3);
    await expect(page.getByRole('button', { name: /Digital e IoT/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /^Todos/ }).click();
    await expect(cards).toHaveCount(7);
  });

  test('opening a project shows the five blocks; Escape closes and returns focus', async ({ page }) => {
    await page.goto('/');
    const opener = page.locator('#proyectos article button.card-open').first();
    await opener.focus();
    await page.keyboard.press('Enter');
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    for (const h of ['Reto', 'Responsabilidad', 'Solución', 'Resultado', 'Evidencia']) {
      await expect(modal.getByRole('heading', { name: new RegExp(h) })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});

test.describe('contacto', () => {
  test('invalid submit shows errors; a valid one prepares the email without claiming it was sent', async ({ page }) => {
    await page.goto('/');
    // A mailto: navigation must never leave the page or reach a real mail client in tests.
    await page.route('mailto:*', (r) => r.abort());
    const form = page.locator('#contacto form');
    await form.getByRole('button', { name: 'Preparar email' }).click();
    await expect(form.getByText('Escribe tu nombre.')).toBeVisible();
    await expect(page.locator('#f-name')).toBeFocused();

    await page.locator('#f-name').fill('Ana Pérez');
    await page.locator('#f-email').fill('ana@empresa.com');
    await page.locator('#f-type').selectOption('presupuestos');
    await page.locator('#f-msg').fill('Necesito un presupuesto técnico.');
    await form.getByRole('button', { name: 'Preparar email' }).click();
    await expect(form.getByRole('status')).toContainText('Todavía no se ha enviado');
    await expect(page.locator('body')).not.toContainText(/mensaje recibido/i);
  });

  test('direct channels point at the right destinations', async ({ page }) => {
    await page.goto('/');
    const c = page.locator('#contacto');
    await expect(c.locator('a[href="mailto:lucesproject@gmail.com"]')).toBeVisible();
    await expect(c.locator('a[href="tel:+34673506760"]')).toBeVisible();
    await expect(c.locator('a[href^="https://wa.me/34673506760"]')).toBeVisible();
  });
});

test.describe('gemelos digitales', () => {
  test('the panel says it is a simulated demo and offers a contact action', async ({ page }) => {
    await page.goto('/');
    const s = page.locator('#gemelos');
    await expect(s.getByText('Demo · datos simulados').first()).toBeVisible();
    await expect(s.getByRole('link', { name: 'Consultar una demostración' })).toHaveAttribute('href', '#contacto');
    await expect(s).not.toContainText(/LIVE|ONLINE|UPTIME|latencia/i);
  });
});

test.describe('responsive y accesibilidad', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name}: sin desbordamiento horizontal y con objetivos táctiles de 44 px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const over = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const bad = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (getComputedStyle(el).position === 'fixed' || r.width === 0 || el.closest('svg')) return;
          if (r.right > vw + 1) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} → ${Math.round(r.right)}>${vw}`);
        });
        return { scrollW: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 8) };
      });
      expect(over.scrollW).toBeLessThanOrEqual(over.vw);
      expect(over.bad).toEqual([]);

      const small = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('button, a.btn, .filter-btn, input:not([type=checkbox]), select, textarea').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.height < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.id || '').trim().slice(0, 24)}" h=${r.height.toFixed(1)}`);
        });
        return out;
      });
      expect(small).toEqual([]);
    });
  }

  test('projects grid uses 1, 2 and 3 columns by width', async ({ page }) => {
    const cols = {};
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      cols[vp.width] = await page.evaluate(() => getComputedStyle(document.querySelector('.projects-grid')).gridTemplateColumns.split(' ').length);
    }
    expect(cols).toEqual({ 390: 1, 768: 2, 1440: 3 });
  });

  test('keyboard: skip link is first and the mobile menu returns focus on close', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('a.skip-link')).toBeFocused();
    const toggle = page.getByRole('button', { name: 'Abrir menú' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  });
});
