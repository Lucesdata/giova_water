import { test, expect } from '@playwright/test';

const WIDTHS = [
  { name: 'movil-360', width: 360, height: 800 },
  { name: 'movil-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'escritorio-1024', width: 1024, height: 768 },
  { name: 'escritorio-1440', width: 1440, height: 900 },
];
const SECTION_IDS = ['inicio', 'proyectos', 'sobre', 'gemelos', 'faq', 'contacto'];

async function seedLang(page, lang = 'es') {
  await page.addInitScript((l) => { localStorage.setItem('giova_water:lang', l); }, lang);
}

// Google Fonts is not reachable from every test environment: answer with an empty stylesheet.
async function offlineFonts(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
}

// Collects console errors and failed/4xx requests so a missing asset fails the test.
function watch(page) {
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => { problems.push(`requestfailed: ${r.url()}`); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  return problems;
}

const openMenu = async (page) => { await page.getByRole('button', { name: 'Abrir menú' }).click(); };
const FEATURED = ['3 plantas de lixiviados · BMA', 'Monitoreo y automatización de PTAP rurales · UAESP, Cali', 'PTAR y alcantarillado · Montebello, Cali', 'Gemelo digital · PTAP La Soledad'];

test.beforeEach(async ({ page }) => { await seedLang(page, 'es'); await offlineFonts(page); });

test.describe('estructura', () => {
  test('six sections in the requested order, a skip link and one h1', async ({ page }) => {
    await page.goto('/');
    // Solo las secciones de primer nivel: el hero lleva dentro «scope» y «cycle».
    await expect(page.locator('main > section')).toHaveCount(6);
    const ids = await page.locator('main > section').evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(SECTION_IDS);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Ingeniería del agua, de la necesidad a la operación.');
    await expect(page.locator('a.skip-link')).toHaveCount(1);
  });

  test('the nav numbers follow the page order', async ({ page }) => {
    await page.goto('/');
    const items = await page.locator('nav a.nav-link').allTextContents();
    expect(items.map((t) => t.replace(/\s+/g, '').trim())).toEqual(
      ['00Inicio', '01Proyectos', '02Perfil', '03Demo', '04Preguntas', '05Contacto']);
  });

  for (const [lang, h1, projects, demo] of [
    ['en', 'Water engineering, from need to operation.', 'Projects', 'Demo'],
    ['fr', 'Ingénierie de l’eau', 'Projets', 'Démo'],
  ]) {
    test(`${lang.toUpperCase()}: html lang, h1, nav, demo controls and project cards are translated`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: lang.toUpperCase(), exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toContainText(h1);
      await expect(page.locator('nav a.nav-link', { hasText: projects })).toBeVisible();
      await expect(page.locator('nav a.nav-link', { hasText: demo })).toBeVisible();
      await expect(page.locator('#gemelos .seg button')).toHaveCount(5);
      await expect(page.locator('main')).not.toContainText(/ Mostrando | Ver detalle | Qué cambió /);
      await expect(page.locator('#contacto')).not.toContainText('CET');
    });
  }

  test('no console errors or failed requests on load, while scrolling the whole page', async ({ page }) => {
    const problems = watch(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    for (const id of SECTION_IDS) await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    expect(problems).toEqual([]);
  });
});

test.describe('anclas y cabecera', () => {
  const places = [{ name: 'escritorio', width: 1440, height: 900 }, { name: 'móvil', width: 390, height: 844 }];

  async function placement(page, id) {
    return page.evaluate((i) => {
      const nav = document.querySelector('nav').getBoundingClientRect().bottom;
      const sec = document.getElementById(i);
      const title = sec.querySelector('h1, h2').getBoundingClientRect();
      const label = sec.querySelector('.label-accent, .label')?.getBoundingClientRect();
      return { nav, secTop: sec.getBoundingClientRect().top, titleTop: title.top, titleBottom: title.bottom, labelTop: label?.top ?? title.top, vh: innerHeight };
    }, id);
  }

  for (const vp of places) {
    test(`${vp.name}: pulsar un enlace deja el rótulo y el título completos bajo la cabecera`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      for (const id of SECTION_IDS) {
        if (vp.width < 769) { await openMenu(page); await page.locator(`#menu-movil a.menu-link[href="#${id}"]`).click(); }
        else await page.locator(`nav a.nav-link[href="#${id}"]`).click();
        await page.waitForTimeout(900);
        const p = await placement(page, id);
        expect(Math.abs(p.secTop - p.nav), `${id} borde de sección`).toBeLessThanOrEqual(2);
        expect(p.titleTop, `${id} título`).toBeGreaterThanOrEqual(p.nav);
        expect(p.labelTop, `${id} rótulo`).toBeGreaterThanOrEqual(p.nav);
        expect(p.titleBottom, `${id} título visible`).toBeLessThanOrEqual(p.vh);
      }
    });

    test(`${vp.name}: abrir la URL con fragmento deja la misma posición`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const id of SECTION_IDS) {
        await page.goto(`/#${id}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1300);
        const p = await placement(page, id);
        expect(Math.abs(p.secTop - p.nav), `${id} borde de sección`).toBeLessThanOrEqual(2);
        expect(p.titleTop, `${id} título`).toBeGreaterThanOrEqual(p.nav);
        expect(p.labelTop, `${id} rótulo`).toBeGreaterThanOrEqual(p.nav);
      }
    });
  }

  test('the offset exists once: scroll-padding from the real header height, no section margins', async ({ page }) => {
    await page.goto('/');
    const r = await page.evaluate(() => ({
      pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
      nav: document.querySelector('nav').getBoundingClientRect().height,
      margins: [...document.querySelectorAll('main section')].map((s) => getComputedStyle(s).scrollMarginTop),
    }));
    expect(Math.abs(r.pad - r.nav)).toBeLessThanOrEqual(1);
    expect(r.margins.every((m) => m === '0px')).toBe(true);
  });

  test('the active section indicator follows the scroll', async ({ page }) => {
    await page.goto('/');
    for (const id of ['proyectos', 'sobre', 'gemelos', 'faq', 'contacto']) {
      await page.locator(`nav a.nav-link[href="#${id}"]`).click();
      await expect(page.locator(`nav a.nav-link[href="#${id}"]`)).toHaveAttribute('aria-current', 'page');
    }
  });

  test('skip link is hidden until focused, then visible, and moves focus to the content', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('a.skip-link');
    expect((await skip.boundingBox()).y).toBeLessThan(0);
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await page.waitForTimeout(400);
    const box = await skip.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.height).toBeGreaterThanOrEqual(30);
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
});

test.describe('movimiento', () => {
  test('entry animations: no blur, ≤ 12 px, ≤ 250 ms, no stagger', async ({ page }) => {
    await page.goto('/');
    const r = await page.evaluate(() => {
      const el = document.querySelector('.reveal:not(.is-in)') || document.querySelector('.reveal');
      const cs = getComputedStyle(el);
      return { filter: cs.filter, transform: cs.transform, dur: cs.transitionDuration, delay: cs.transitionDelay };
    });
    expect(r.filter).toBe('none');
    expect(r.dur.split(',').every((d) => parseFloat(d) <= 0.25)).toBe(true);
    expect(r.delay.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
    const ty = Math.abs(Number(r.transform.replace(/matrix\(|\)/g, '').split(',')[5]));
    expect(ty).toBeLessThanOrEqual(12);
  });

  test('content is readable at once when jumping far down (no waiting for an animation)', async ({ page }) => {
    await page.goto('/#faq');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect.poll(() => page.locator('#faq .reveal').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('smooth scrolling only when motion is allowed', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  });

  test('with prefers-reduced-motion everything is visible, nothing animates, the demo starts paused', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.reveal:not(.is-in)')).toHaveCount(0);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length);
    expect(running).toBe(0);
    await page.locator('#gemelos').scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Reanudar simulación' })).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(page.locator('#gemelos')).toContainText('muestra #0');
    // The decorative scroll background is not mounted at all.
    await expect(page.locator('[data-remotion-canvas], .__remotion-player')).toHaveCount(0);
  });

  test('no scroll hijacking: wheel scrolling moves the page by the wheel delta', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(700, 450);
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(before + 300);
  });
});

test.describe('proyectos', () => {
  test('selection shows the leachate plants, UAESP monitoring, Montebello and the digital twin first; “Ver todos” reveals the seven', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#proyectos article');
    await expect(cards).toHaveCount(4);
    await expect(cards.locator('h3')).toHaveText(FEATURED);
    await expect(page.locator('#proyectos [role=status]')).toContainText('Mostrando 4 de 7');
    const all = page.locator('#proyectos [aria-controls="lista-proyectos"]');
    await expect(all).toHaveText(/Ver todos los proyectos \(7\)/);
    await all.click();
    await expect(cards).toHaveCount(7);
    await expect(page.locator('#proyectos [role=status]')).toContainText('Mostrando 7 de 7');
    await expect(all).toBeFocused();
    await expect(all).toHaveText('Mostrar solo destacados');
    await all.click();
    await expect(cards).toHaveCount(4);
  });

  test('filters keep correct counters and narrow the grid', async ({ page }) => {
    await page.goto('/');
    const names = await page.locator('#proyectos .filter-btn').allTextContents();
    expect(names.map((n) => n.replace(/\s+/g, ' ').replace(/\s?\[/, ' [').trim())).toEqual(['Todos [7]', 'Agua y saneamiento [5]', 'Digital e IoT [3]']);
    const cards = page.locator('#proyectos article');
    await page.getByRole('button', { name: /Digital e IoT/ }).click();
    await expect(cards).toHaveCount(3);
    await expect(page.getByRole('button', { name: /Digital e IoT/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Agua y saneamiento/ }).click();
    await expect(cards).toHaveCount(5);
    await page.getByRole('button', { name: /^Todos/ }).click();
    await expect(cards).toHaveCount(7);
  });

  test('every card shows title, responsibility, main result and a link to the detail; no budgets', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Ver todos los proyectos/ }).click();
    const cards = page.locator('#proyectos article');
    for (let i = 0; i < 7; i++) {
      const c = cards.nth(i);
      await expect(c.locator('h3')).not.toBeEmpty();
      await expect(c).toContainText('Mi responsabilidad');
      await expect(c).toContainText('Resultado');
      await expect(c.locator('a.card-open')).toHaveAttribute('href', /^#proyecto\/[a-z0-9-]+$/);
      await expect(c).not.toContainText(/COP \d/);
    }
  });

  test('the five budget amounts are not in the main route', async ({ page }) => {
    await page.goto('/');
    const main = await page.locator('main').innerText();
    expect(main).not.toMatch(/9\.433\.328\.555|9\.544\.068\.544|1\.019\.830\.000|104\.338/);
    await expect(page.locator('#sobre')).not.toContainText('Presupuesto institucional');
  });

  test('opening a project: stable URL, structure, Escape closes and returns focus', async ({ page }) => {
    await page.goto('/');
    const opener = page.locator('#proyectos article a.card-open').nth(2);
    await opener.focus();
    await page.keyboard.press('Enter');
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page).toHaveURL(/#proyecto\/montebello-ptar-alcantarillado$/);
    for (const h of ['Reto', 'Responsabilidad personal', 'Solución', 'Resultado', 'Evidencia', 'Tecnologías', 'Contacto']) {
      await expect(modal.getByRole('heading', { name: new RegExp(h) })).toBeVisible();
    }
    await expect(modal).toContainText('Fotografía real');
    await expect(modal).not.toContainText('Todavía no hay documentos');
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page).not.toHaveURL(/#proyecto\//);
  });

  test('a project without photographs says so and keeps its conceptual scheme (IOTIO)', async ({ page }) => {
    await page.goto('/#proyecto/iotio-telemetria');
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Todavía no hay documentos ni capturas publicados');
    await expect(modal).toContainText('Esquema conceptual');
    await expect(modal.locator('figure')).toHaveCount(0);
  });

  test('the browser Back button closes the project', async ({ page }) => {
    await page.goto('/');
    await page.locator('#proyectos article a.card-open').nth(1).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  for (const [slug, title] of [
    ['montebello-ptar-alcantarillado', 'PTAR y alcantarillado · Montebello, Cali'],
    ['gemelo-digital-la-voragine', 'Gemelo digital · PTAP La Soledad'],
    ['monitoreo-automatizacion-uaesp', 'Monitoreo y automatización de PTAP rurales · UAESP, Cali'],
    ['psmv-rural-inalter', 'PSMV rural · INALTER'],
  ]) {
    test(`direct URL #proyecto/${slug} shows the right project`, async ({ page }) => {
      await page.goto(`/#proyecto/${slug}`);
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('heading', { level: 2 })).toHaveText(title);
      await page.keyboard.press('Escape');
      await expect(modal).toHaveCount(0);
      await expect(page).toHaveURL(/#proyectos$/);
    });
  }

  test('“Compartir proyecto” and “Copiar enlace” use the project URL, not #proyectos', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/#proyecto/gemelo-digital-la-voragine');
    const share = page.getByRole('link', { name: /Compartir proyecto/ });
    const href = decodeURIComponent(await share.getAttribute('href'));
    expect(href).toContain('#proyecto/gemelo-digital-la-voragine');
    expect(href).not.toMatch(/#proyectos(?!\/)/);
    await expect(page.getByRole('button', { name: /Copiar enlace/ })).toBeVisible();
  });

  test('the monitoring project holds the five budget references, distinct and not summed', async ({ page }) => {
    await page.goto('/#proyecto/monitoreo-automatizacion-uaesp');
    const modal = page.getByRole('dialog');
    for (const tag of ['Presupuesto institucional', 'Presupuesto técnico', 'Presupuesto definitivo 2023', 'Interventoría', 'Meta de entrega']) {
      await expect(modal.getByText(tag, { exact: true })).toBeVisible();
    }
    for (const n of ['104.338', '9.433.328.555', '9.544.068.544', '1.019.830.000', '10 de 12']) await expect(modal).toContainText(n);
    await expect(modal).toContainText('Los importes no se suman');
    await expect(modal).toContainText('pendientes de cotejar');
    await expect(modal).toContainText('Mi rol');
    await expect(modal).toContainText('no son cifras que yo haya ejecutado');
  });

  test('the UAESP project shows real photographs with descriptions, phases with status and the role', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('#proyectos article', { hasText: 'UAESP' }).first();
    await expect(card.locator('img')).toBeVisible();
    await expect(card).toContainText('Fotografía real');
    await expect(card).toContainText('Responsable del proyecto');
    await card.locator('a.card-open').click();
    const modal = page.getByRole('dialog');
    const imgs = modal.locator('figure img');
    await expect(imgs).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await imgs.nth(i).scrollIntoViewIfNeeded();
      await expect.poll(() => imgs.nth(i).evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
      expect((await imgs.nth(i).getAttribute('alt')).length).toBeGreaterThan(10);
    }
    await expect(modal.locator('figure figcaption')).toHaveCount(6);
    const phases = modal.locator('ol li');
    await expect(phases).toHaveCount(6);
    await expect(phases.nth(1)).toContainText('Entregado');
    await expect(phases.nth(2)).toContainText('Planificado');
    await expect(modal).not.toContainText('Todavía no hay documentos');
  });

  test('cards with a real photograph say so; IOTIO and the sewer plan keep the conceptual scheme', async ({ page }) => {
    await page.goto('/#proyectos');
    await page.getByRole('button', { name: /Ver todos los proyectos/ }).click();
    const cards = page.locator('#proyectos article');
    for (const title of ['PTAR y alcantarillado', 'PTAPs rurales · UAESP', '3 plantas de lixiviados', 'Monitoreo y automatización de PTAP rurales']) {
      const c = cards.filter({ hasText: title }).first();
      await expect(c.locator('img'), title).toBeVisible();
      await expect(c, title).toContainText('Fotografía real');
    }
    // The twin is a software capture, not a photograph: its badge says so.
    const twin = cards.filter({ hasText: 'Gemelo digital' }).first();
    await expect(twin.locator('img')).toBeVisible();
    await expect(twin).toContainText('Captura de la plataforma');
    await expect(twin).not.toContainText('Fotografía real');
    for (const title of ['IOTIO', 'PSMV rural']) {
      const c = cards.filter({ hasText: title }).first();
      await expect(c.locator('img'), title).toHaveCount(0);
      await expect(c, title).toContainText('Esquema conceptual');
    }
  });

  test('the digital twin sheet shows the platform capture and the plant photo, and P-006 only its gallery', async ({ page }) => {
    await page.goto('/#proyecto/gemelo-digital-la-voragine');
    let modal = page.getByRole('dialog');
    await expect(modal.locator('figure img')).toHaveCount(2);
    await expect(modal.locator('figure figcaption').first()).toContainText('datos simulados');
    await expect(modal).not.toContainText('Todavía no hay documentos');
    await page.keyboard.press('Escape');
    await page.goto('/#proyecto/psmv-rural-inalter');
    modal = page.getByRole('dialog');
    await expect(modal.locator('figure img')).toHaveCount(1);
    await expect(modal).toContainText('Esquema conceptual');
  });

  test('the leachate plants project shows its own photograph on the card and in the sheet', async ({ page }) => {
    await page.goto('/#proyectos');
    await page.getByRole('button', { name: /Ver todos los proyectos/ }).click();
    const card = page.locator('#proyectos article', { hasText: '3 plantas de lixiviados' });
    await expect(card.locator('img')).toBeVisible();
    await expect(card).toContainText('Fotografía real');
    await expect.poll(() => card.locator('img').evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    await card.locator('a.card-open').click();
    const modal = page.getByRole('dialog');
    const imgs = modal.locator('figure img');
    await expect(imgs).toHaveCount(1);
    await imgs.first().scrollIntoViewIfNeeded();
    await expect.poll(() => imgs.first().evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(modal.locator('figure figcaption')).toHaveText('Planta de lixiviados de BMA, Buenaventura (2021).');
    await expect(modal).not.toContainText('Todavía no hay documentos');
  });

  test('the UAESP project has no horizontal overflow on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#proyecto/monitoreo-automatizacion-uaesp');
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('.modal-panel').scrollWidth <= document.querySelector('.modal-panel').clientWidth + 1)).toBe(true);
  });

  test('the “Consultar un proyecto” button in a project closes it and lands on the contact section', async ({ page }) => {
    await page.goto('/#proyecto/ptaps-rurales-uaesp');
    const modal = page.getByRole('dialog');
    await modal.getByRole('link', { name: 'Consultar un proyecto' }).click();
    await expect(modal).toHaveCount(0);
    await expect(page).toHaveURL(/#contacto$/);
    await page.waitForTimeout(900);
    const gap = await page.evaluate(() => Math.abs(document.getElementById('contacto').getBoundingClientRect().top - document.querySelector('nav').getBoundingClientRect().bottom));
    expect(gap).toBeLessThanOrEqual(2);
  });

  test('focus stays inside the open project (Tab and Shift+Tab wrap)', async ({ page }) => {
    await page.goto('/');
    await page.locator('#proyectos article a.card-open').first().click();
    const modal = page.getByRole('dialog');
    const inside = () => page.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement));
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); expect(await inside()).toBe(true); }
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Shift+Tab'); expect(await inside()).toBe(true); }
    await expect(modal).toBeVisible();
  });

  test('on a phone the project scrolls inside and the close button never leaves the screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#proyecto/monitoreo-automatizacion-uaesp');
    const close = page.getByRole('button', { name: /Cerrar/ });
    await page.locator('.modal-panel > div').nth(1).evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const box = await close.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    // Key facts: no empty fourth cell.
    const cells = page.locator('.modal-body dl.cells > div');
    const n = await cells.count();
    expect(n).toBe(3);
  });

  test('The digital twin key facts have three cells and no empty fourth one at 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#proyecto/gemelo-digital-la-voragine');
    const info = await page.locator('.modal-body dl.cells').evaluate((el) => ({
      children: el.children.length,
      cols: getComputedStyle(el).gridTemplateColumns.split(' ').length,
    }));
    expect(info.children).toBe(3);
    expect(info.cols).toBe(1);
  });
});

test.describe('perfil y trayectoria', () => {
  test('mobile: synthesis before the portrait, portrait ≤ 320 px tall', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const r = await page.evaluate(() => {
      const text = document.querySelector('.profile-text').getBoundingClientRect();
      const card = document.querySelector('.profile-card').getBoundingClientRect();
      const portrait = document.querySelector('.portrait').getBoundingClientRect();
      return { textTop: text.top, cardTop: card.top, portraitH: portrait.height };
    });
    expect(r.textTop).toBeLessThan(r.cardTop);
    expect(r.portraitH).toBeLessThanOrEqual(320);
  });

  test('desktop: the card sits beside the text and the text plus chronology column is not shorter than it', async ({ page }) => {
    await page.goto('/');
    const r = await page.evaluate(() => {
      const text = document.querySelector('.profile-text').getBoundingClientRect();
      const tl = document.querySelector('.profile-timeline').getBoundingClientRect();
      const card = document.querySelector('.profile-card').getBoundingClientRect();
      return { sameRow: Math.abs(text.top - card.top) < 8, colH: tl.bottom - text.top, cardH: card.height, portraitH: document.querySelector('.portrait').getBoundingClientRect().height };
    });
    expect(r.sameRow).toBe(true);
    expect(r.colH).toBeGreaterThanOrEqual(r.cardH);
    expect(r.portraitH).toBeLessThanOrEqual(320);
  });

  test('the card shows education with the degree year, the licence and that the portrait is illustrative', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.profile-card');
    await expect(card).toContainText('UPEC Paris-Est Créteil');
    await expect(card).toContainText('título 2012');
    await expect(card).toContainText('CPQCOL PQ-6061');
    await expect(card.locator('.portrait-note')).toHaveCount(0);
    await expect(card).not.toContainText('Experiencia profesional');
  });

  test('the chronology comes right after the introduction, most recent first, each job opens and closes', async ({ page }) => {
    await page.goto('/');
    const [text, tl] = await Promise.all([
      page.locator('.profile-text').boundingBox(), page.locator('.profile-timeline').boundingBox(),
    ]);
    expect(tl.y).toBeGreaterThan(text.y);
    const rows = page.locator('#sobre .timeline-row details');
    await expect(rows).toHaveCount(5);
    await expect(rows.first()).toHaveAttribute('open', '');
    await expect(rows.nth(1)).not.toHaveAttribute('open', '');
    const summary = rows.nth(1).locator('summary');
    expect((await summary.boundingBox()).height).toBeGreaterThanOrEqual(43.5);
    await summary.click();
    await expect(rows.nth(1)).toHaveAttribute('open', '');
    await expect(rows.nth(1).locator('.timeline-body')).toBeVisible();
    await summary.click();
    await expect(rows.nth(1)).not.toHaveAttribute('open', '');
  });

  test('the method section is gone, the contracting note stays and points to the hero chain', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.method-stage')).toHaveCount(0);
    await expect(page.locator('#sobre')).not.toContainText('Cuatro etapas');
    await expect(page.locator('#sobre')).toContainText('Las decisiones de contratación y adjudicación corresponden a cada entidad');
    await expect(page.locator('#sobre .profile-text a.text-link')).toHaveAttribute('href', '#inicio');
  });

  test('the profile has no competences block repeating the projects; the chronology lists five roles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#sobre h3', { hasText: 'Competencias' })).toHaveCount(0);
    await expect(page.locator('#sobre .chip-btn')).toHaveCount(0);
    const roles = await page.locator('#sobre .timeline-row h4').allTextContents();
    expect(roles.join(' ')).not.toMatch(/Project Lead|Technical Director|Specialist/);
    expect(roles).toHaveLength(5);
  });

  test('no horizontal overflow in the profile at any width', async ({ page }) => {
    for (const vp of WIDTHS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/#sobre');
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), vp.name).toBe(true);
    }
  });
});

test.describe('demo de gemelo digital', () => {
  const value = (page, label) => page.locator('#gemelos [role=progressbar]', { }).evaluateAll((els, l) => {
    const el = els.find((e) => e.getAttribute('aria-label') === l); return el ? el.getAttribute('aria-valuenow') : null;
  }, label);

  test('always shows the illustrative, not-for-sizing label and says it is simulated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#gemelos')).toContainText('Simulación ilustrativa; no usar para dimensionamiento.');
    await expect(page.locator('#gemelos')).toContainText('Demo · datos simulados');
    for (const name of ['Demanda alta', 'Caudal reducido']) {
      await page.getByRole('button', { name }).click();
      await expect(page.locator('#gemelos')).toContainText('Simulación ilustrativa; no usar para dimensionamiento.');
    }
  });

  test('scenarios change values coherently and explain what changed and what to review', async ({ page }) => {
    await page.goto('/#gemelos');
    const normalQ = Number(await value(page, 'CAUDAL Q'));
    const normalP = Number(await value(page, 'PRESIÓN P'));
    await page.getByRole('button', { name: 'Demanda alta' }).click();
    await expect(page.getByRole('button', { name: 'Demanda alta' })).toHaveAttribute('aria-pressed', 'true');
    expect(Number(await value(page, 'CAUDAL Q'))).toBeGreaterThan(normalQ + 5);
    expect(Number(await value(page, 'PRESIÓN P'))).toBeLessThan(normalP - 0.5);
    await expect(page.locator('#gemelos [role=status]')).toContainText('Sube el caudal, baja la presión');
    await expect(page.locator('#gemelos [role=status]')).toContainText('Qué debería revisar el operador');
    await expect(page.locator('#gemelos')).toContainText('ATENCIÓN');
    await page.getByRole('button', { name: 'Caudal reducido' }).click();
    expect(Number(await value(page, 'CAUDAL Q'))).toBeLessThan(normalQ - 10);
    await expect(page.locator('#gemelos [role=status]')).toContainText('El caudal cae por debajo del rango esperado');
  });

  test('pause stops the updates, resume restarts them, reset recovers the initial state', async ({ page }) => {
    await page.goto('/#gemelos');
    const sample = async () => Number((/#(\d+)/.exec(await page.locator('#gemelos').innerText()) || [])[1]);
    await expect.poll(sample, { timeout: 5000 }).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Pausar simulación' }).click();
    await expect(page.getByRole('button', { name: 'Reanudar simulación' })).toBeVisible();
    const frozen = await sample();
    const frozenQ = await value(page, 'CAUDAL Q');
    await page.waitForTimeout(2600);
    expect(await sample()).toBe(frozen);
    expect(await value(page, 'CAUDAL Q')).toBe(frozenQ);
    await page.getByRole('button', { name: 'Reanudar simulación' }).click();
    await expect.poll(sample, { timeout: 5000 }).toBeGreaterThan(frozen);
    await page.getByRole('button', { name: 'Demanda alta' }).click();
    await page.getByRole('button', { name: 'Restablecer' }).click();
    await expect(page.getByRole('button', { name: 'Operación normal' })).toHaveAttribute('aria-pressed', 'true');
    expect(await sample()).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', { name: 'Pausar simulación' })).toBeVisible();
  });

  test('says it is simulated once, shortly, and explains each scenario in two readable cards', async ({ page }) => {
    await page.goto('/#gemelos');
    await expect(page.locator('#gemelos .chip', { hasText: 'Demo · datos simulados' })).toHaveCount(1);
    const intro = await page.locator('#gemelos > p.prose').innerText();
    expect(intro.length).toBeLessThan(330);
    const cards = page.locator('#gemelos [role=status] p');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText('Qué cambió');
    await expect(cards.nth(1)).toContainText('Qué debería revisar el operador');
    await page.getByRole('button', { name: 'Demanda alta' }).click();
    await expect(cards.nth(0)).toContainText('Sube el caudal');
  });

  test('shows the actual twin (La Soledad capture, simulated values) next to the panel and links to its sheet', async ({ page }) => {
    await page.goto('/#gemelos');
    const real = page.locator('#gemelos .twin-real');
    await expect(real).toBeVisible();
    await real.scrollIntoViewIfNeeded();
    await expect.poll(() => real.locator('img').evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(real).toContainText('Captura de la plataforma');
    await expect(real).toContainText('datos simulados');
    await expect(real).toContainText('23');
    await expect(real).not.toContainText('Vorágine');
    await real.getByRole('link', { name: /Ver el proyecto/ }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Gemelo digital · PTAP La Soledad');
  });

  test('the demo panel starts higher on a phone and nothing overflows horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#gemelos');
    await page.waitForTimeout(400);
    const top = await page.locator('#gemelos .seg').first().evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(844 * 1.15);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('the section does not claim a plant connection or a 3D scene', async ({ page }) => {
    await page.goto('/#gemelos');
    const t = await page.locator('#gemelos').innerText();
    expect(t).not.toMatch(/LIVE|ONLINE|UPTIME|latencia|tiempo real|en vivo/i);
    await expect(page.locator('#gemelos canvas')).toHaveCount(1);
    await expect(page.locator('#gemelos')).toContainText('no es un modelo 3D');
  });
});

test.describe('FAQ', () => {
  test('answers open and close with the keyboard', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('#faq details').first();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await page.keyboard.press('Enter');
    await expect(first).not.toHaveAttribute('open', '');
  });
});

test.describe('contacto', () => {
  test('invalid submit shows errors; a valid one prepares the email without claiming it was sent', async ({ page }) => {
    await page.goto('/');
    await page.route('mailto:*', (r) => r.abort());
    const form = page.locator('#contacto form');
    await expect(form).toContainText('esta página no envía nada');
    await expect(form.getByRole('button', { name: 'Preparar email' })).toBeVisible();
    await expect(form.getByRole('button', { name: /^Enviar/ })).toHaveCount(0);
    await form.getByRole('button', { name: 'Preparar email' }).click();
    await expect(form.getByText('Escribe tu nombre.')).toBeVisible();
    await expect(form.getByText('Escribe un email válido')).toBeVisible();
    await expect(form.getByText('Escribe un mensaje.')).toBeVisible();
    await expect(page.locator('#f-name')).toBeFocused();
    await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');

    await page.locator('#f-name').fill('Ana Pérez');
    await page.locator('#f-email').fill('no-es-un-email');
    await page.locator('#f-msg').fill('Necesito un presupuesto técnico.');
    await form.getByRole('button', { name: 'Preparar email' }).click();
    await expect(form.getByText('Escribe un email válido')).toBeVisible();
    await expect(page.locator('#f-email')).toBeFocused();

    await page.locator('#f-email').fill('ana@empresa.com');
    await page.locator('#f-type').selectOption('presupuestos');
    await form.getByRole('button', { name: 'Preparar email' }).click();
    await expect(form.getByRole('status')).toContainText('Todavía no se ha enviado');
    await expect(page.locator('body')).not.toContainText(/mensaje recibido|mensaje enviado/i);
  });

  test('no network request is made when the form is submitted', async ({ page }) => {
    await page.goto('/');
    await page.route('mailto:*', (r) => r.abort());
    const posts = [];
    page.on('request', (r) => { if (r.method() !== 'GET') posts.push(r.url()); });
    await page.locator('#f-name').fill('Ana');
    await page.locator('#f-email').fill('ana@empresa.com');
    await page.locator('#f-msg').fill('Hola');
    await page.getByRole('button', { name: 'Preparar email' }).click();
    await page.waitForTimeout(300);
    expect(posts).toEqual([]);
  });

  test('direct channels point at the right destinations; hours in Madrid time; no “React · Vite” in the footer', async ({ page }) => {
    await page.goto('/');
    const c = page.locator('#contacto');
    await expect(c.locator('a[href="mailto:lucesproject@gmail.com"]')).toBeVisible();
    await expect(c.locator('a[href="tel:+34673506760"]')).toBeVisible();
    await expect(c.locator('a[href^="https://wa.me/34673506760"]')).toBeVisible();
    await expect(c).toContainText('hora de Madrid');
    await expect(c).not.toContainText('CET');
    await expect(page.locator('footer')).not.toContainText(/React|Vite/);
    await expect(page.locator('footer')).toContainText('ilustrativos');
  });

  test('mobile: the form is a single column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const xs = await page.locator('#contacto form input, #contacto form textarea, #contacto form select').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(new Set(xs).size).toBe(1);
  });
});

test.describe('responsive y accesibilidad', () => {
  for (const vp of WIDTHS) {
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
        document.querySelectorAll('button, a.btn, .filter-btn, .chip-btn, summary, input:not([type=checkbox]), select, textarea, nav a.nav-link').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.height < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.id || '').trim().slice(0, 24)}" h=${r.height.toFixed(1)}`);
        });
        return out;
      });
      expect(small).toEqual([]);
    });
  }

  test('the hero is compact: the photo banner does not impose a full-screen height', async ({ page }) => {
    for (const vp of [WIDTHS[4], WIDTHS[1]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const h = await page.locator('.hero').evaluate((el) => el.getBoundingClientRect().height);
      if (vp.width > 1000) expect(h).toBeLessThan(vp.height - 150);
      expect(await page.locator('.hero').evaluate((el) => parseFloat(getComputedStyle(el).minHeight) || 0)).toBe(0);
    }
  });

  test('the hero photo sits behind the text on desktop, above it on phones, and is marked illustrative', async ({ page }) => {
    await page.goto('/');
    const d = await page.evaluate(() => {
      const ph = document.querySelector('.hero-photo').getBoundingClientRect();
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const copy = document.querySelector('.hero-copy').getBoundingClientRect();
      return { phW: ph.width, heroW: hero.width, overlap: copy.left < ph.right && copy.top < ph.bottom };
    });
    expect(d.phW).toBeGreaterThan(d.heroW - 4);
    expect(d.overlap).toBe(true);
    await expect(page.locator('.hero-photo-note')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const m = await page.evaluate(() => ({ ph: document.querySelector('.hero-photo').getBoundingClientRect().height, bottom: document.querySelector('.hero-photo').getBoundingClientRect().bottom, copyTop: document.querySelector('.hero-copy h1').getBoundingClientRect().top }));
    expect(m.ph).toBeLessThanOrEqual(240);
    expect(m.copyTop).toBeGreaterThanOrEqual(m.bottom);
  });

  test('hero text keeps AA contrast over the photo (measured on the rendered pixels)', async ({ page }) => {
    for (const vp of [WIDTHS[4], WIDTHS[3], WIDTHS[1]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.addStyleTag({ content: '.hero-copy *{color:transparent!important;border-color:transparent!important;background:transparent!important}.hero-copy .btn{background:transparent!important}' });
      await page.waitForTimeout(300);
      const boxes = await page.evaluate(() => [...document.querySelectorAll('.hero-copy h1, .hero-copy p, .hero-copy .label, .hero-copy .label-accent')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; }));
      const shot = await page.screenshot({ fullPage: true });
      const worst = await page.evaluate(async ({ b64, boxes }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
        const lum = (r, g, bl) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl); };
        let max = 0;
        for (const b of boxes) { const d = cx.getImageData(Math.max(0, b.x), Math.max(0, b.y), Math.max(1, Math.min(b.w, img.width - b.x)), Math.max(1, b.h)).data; for (let i = 0; i < d.length; i += 16) max = Math.max(max, lum(d[i], d[i + 1], d[i + 2])); }
        return max;
      }, { b64: shot.toString('base64'), boxes });
      // Lightest pixel behind any hero text vs. the weakest text colour used there (--ink-1 #aab4c0).
      const text = 0.4505; // relative luminance of #aab4c0
      expect((text + 0.05) / (worst + 0.05), vp.name).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('360 px: the hero buttons are stacked with room between them', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    const [a, b] = await page.locator('.hero-actions a.btn').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(b.top).toBeGreaterThan(a.bottom + 8);
    expect(Math.abs(a.left - b.left)).toBeLessThan(1);
  });

  test('the hero shows the real SCADA footage with a visible pause control and no overflow at any width', async ({ page }) => {
    for (const vp of WIDTHS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const video = page.locator('#inicio figure video');
      await expect(video).toHaveCount(1);
      await expect(video).toHaveJSProperty('muted', true);
      await expect(page.locator('#inicio figure .hero-video-badge')).toContainText('Video real');
      const toggle = page.locator('#inicio figure .hero-video-toggle');
      await toggle.scrollIntoViewIfNeeded();
      const box = await toggle.boundingBox();
      expect(box.height, vp.name).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), vp.name).toBe(true);
    }
  });

  test('the pause button stops the footage and play restarts it', async ({ page }) => {
    await page.goto('/');
    const video = page.locator('#inicio figure video');
    const toggle = page.locator('#inicio figure .hero-video-toggle');
    await toggle.scrollIntoViewIfNeeded();
    await expect.poll(() => video.evaluate((v) => !v.paused)).toBe(true);
    await toggle.click();
    await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
    await toggle.click();
    await expect.poll(() => video.evaluate((v) => !v.paused)).toBe(true);
  });

  test('the hero says it is real footage and lists the supervised variables', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('#inicio figure')).toContainText('Video real de la UAESP');
    await expect(page.locator('#inicio figure .hero-vars li')).toHaveCount(6);
  });

  test('projects grid uses 1, 2 and 3 columns by width', async ({ page }) => {
    const cols = {};
    for (const vp of [WIDTHS[1], WIDTHS[2], WIDTHS[4]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      cols[vp.width] = await page.evaluate(() => getComputedStyle(document.querySelector('.projects-grid')).gridTemplateColumns.split(' ').length);
    }
    expect(cols).toEqual({ 390: 1, 768: 2, 1440: 3 });
  });

  test('filters are readable on a phone: names and counters are not truncated', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    const clipped = await page.locator('#proyectos .filter-btn').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length);
    expect(clipped).toBe(0);
  });

  test('keyboard: skip link is first; the mobile menu traps focus and returns it on close', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('a.skip-link')).toBeFocused();
    const toggle = page.getByRole('button', { name: 'Abrir menú' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    const inside = () => page.evaluate(() => document.querySelector('#menu-movil').contains(document.activeElement));
    for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); expect(await inside()).toBe(true); }
    for (let i = 0; i < 14; i++) { await page.keyboard.press('Shift+Tab'); expect(await inside()).toBe(true); }
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  });

  test('keyboard: every interactive element shows a visible focus ring', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => {
        const cs = getComputedStyle(document.activeElement);
        return { w: parseFloat(cs.outlineWidth), style: cs.outlineStyle };
      });
      expect(ring.style).not.toBe('none');
      expect(ring.w).toBeGreaterThanOrEqual(2);
    }
  });
});

test.describe('anuncios sobre el video SCADA', () => {
  const box = (page) => page.locator('#inicio .hero-video');
  const rect = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; });
  const inside = (a, o) => a.l >= o.l - 1 && a.t >= o.t - 1 && a.r <= o.r + 1 && a.b <= o.b + 1;
  const overlaps = (a, c) => a.l < c.r && a.r > c.l && a.t < c.b && a.b > c.t;

  for (const vp of [WIDTHS[1], WIDTHS[2], WIDTHS[4]]) {
    test(`${vp.name}: cada callout cabe en el video y no tapa el botón de pausa`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await box(page).scrollIntoViewIfNeeded();
      await page.locator('.hero-video-toggle').click();   // fija el cuadro: sin carreras con el ciclo
      for (let i = 0; i < 6; i++) {
        await page.locator('.hero-vars button').nth(i).click();
        const callout = page.locator('.scada-callout');
        await expect(callout).toBeVisible();
        const [c, v, t] = await Promise.all([rect(callout), rect(box(page)), rect(page.locator('.hero-video-toggle'))]);
        expect(inside(c, v), `${vp.name} variable ${i + 1} dentro del video`).toBe(true);
        expect(overlaps(c, t), `${vp.name} variable ${i + 1} sin tapar el botón`).toBe(false);
      }
    });
  }

  test('clic en «Turbiedad» salta a esa variable: callout, aria-pressed y anuncio al lector de pantalla', async ({ page }) => {
    await page.goto('/');
    await box(page).scrollIntoViewIfNeeded();
    const btn = page.getByRole('button', { name: 'Turbiedad', exact: true });
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    const callout = page.locator('.scada-callout');
    await expect(callout.locator('.scada-name')).toHaveText('Turbiedad');
    await expect(callout).toHaveAttribute('role', 'status');
    await expect.poll(() => page.locator('#inicio .hero-video video').evaluate((v) => v.currentTime)).toBeGreaterThan(4.3);
  });

  test('el ciclo automático avanza solo y no se anuncia', async ({ page }) => {
    await page.goto('/');
    await box(page).scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('#inicio .hero-video video').evaluate((v) => !v.paused)).toBe(true);
    await expect(page.locator('.scada-name')).not.toHaveText('Caudal', { timeout: 6000 });
    await expect(page.locator('.scada-callout')).not.toHaveAttribute('role', 'status');
  });

  test('la pausa detiene video y callouts (mismo reloj)', async ({ page }) => {
    await page.goto('/');
    await box(page).scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('#inicio .hero-video video').evaluate((v) => !v.paused)).toBe(true);
    await page.locator('.hero-video-toggle').click();
    const name = await page.locator('.scada-name, .scada-end-title').first().textContent();
    await page.waitForTimeout(2600);
    expect(await page.locator('.scada-name, .scada-end-title').first().textContent()).toBe(name);
  });

  test('con movimiento reducido el video no arranca y el callout 01 queda estático y visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await box(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(await page.locator('#inicio .hero-video video').evaluate((v) => v.paused)).toBe(true);
    const callout = page.locator('.scada-callout');
    await expect(callout.locator('.scada-name')).toHaveText('Caudal');
    expect(await callout.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length);
    expect(running).toBe(0);
    await page.getByRole('button', { name: 'Turbiedad', exact: true }).click();   // las etiquetas siguen saltando
    await expect(callout.locator('.scada-name')).toHaveText('Turbiedad');
  });

  test('el chip dice que son rótulos ilustrativos y que es una grabación; el cierre enlaza a la ficha UAESP', async ({ page }) => {
    await page.goto('/');
    await box(page).scrollIntoViewIfNeeded();
    await expect(page.locator('.scada-note')).toHaveText('Rótulos ilustrativos');
    await expect(page.locator('.scada-rec')).toContainText('grabación');
    await page.locator('.hero-video-toggle').click();
    await page.evaluate(() => { document.querySelector('#inicio .hero-video video').currentTime = 14.6; });
    const link = page.locator('.scada-end a.btn');
    await expect(link).toHaveAttribute('href', '#proyecto/monitoreo-automatizacion-uaesp');
  });

  for (const palette of ['instrument', 'teal', 'copper', 'paper']) {
    test(`axe: sin violaciones con el callout visible en la paleta ${palette}`, async ({ page }) => {
      const problems = watch(page);
      await page.goto('/');
      await page.evaluate((p) => document.documentElement.setAttribute('data-palette', p), palette);
      await box(page).scrollIntoViewIfNeeded();
      await page.locator('.hero-video-toggle').click();
      await page.getByRole('button', { name: 'pH', exact: true }).click();
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      const result = await page.evaluate(() => window.axe.run('#inicio .hero-video, #inicio .hero-vars', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }));
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`), palette).toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});
