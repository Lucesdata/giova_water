import { test, expect } from '@playwright/test';

const HEROES = ['schematic', 'typographic', 'terminal'];
const PALETTES = ['instrument', 'teal', 'copper', 'paper'];

async function seedLang(page, lang = 'es') {
  await page.addInitScript((l) => {
    localStorage.setItem('giova_water:lang', l);
  }, lang);
}

async function seedTweaks(page, hero, palette) {
  await page.addInitScript(({ hero, palette }) => {
    localStorage.setItem('giova_water:tweaks', JSON.stringify({ hero, palette, grid: true }));
    localStorage.setItem('giova_water:lang', 'es');
  }, { hero, palette });
}

test.beforeEach(async ({ page }) => {
  await seedLang(page, 'es');
});

test.describe('visual regression — hero variants × paletas', () => {
  for (const hero of HEROES) {
    for (const palette of PALETTES) {
      test(`${hero} / ${palette}`, async ({ page }) => {
        await seedTweaks(page, hero, palette);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const heroEl = page.locator('#inicio');
        await expect(heroEl).toBeVisible();
        // Stabilize: disable in-flight animations on SVG values that jitter.
        await page.addStyleTag({ content: `* { animation-duration: 0ms !important; transition-duration: 0ms !important; }` });
        await expect(heroEl).toHaveScreenshot(`hero-${hero}-${palette}.png`, { fullPage: false });
      });
    }
  }
});

test.describe('smoke', () => {
  test('home renders with 5 sections and the nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').first()).toBeVisible();
    const sections = page.locator('section');
    await expect(sections).toHaveCount(5);
  });

  test('switching to EN updates the html lang and hero copy', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1').first()).toContainText('Process Engineer');
  });

  test('clicking a project opens the modal, Escape closes it', async ({ page }) => {
    await page.goto('/');
    await page.locator('#proyectos article button[aria-label*="Abrir"]').first().click();
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });
});
