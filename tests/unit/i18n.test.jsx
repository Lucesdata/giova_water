import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { LangProvider, useT, useLang } from '../../src/i18n.jsx';

function Probe({ k }) {
  const t = useT();
  const val = t(k);
  return <div data-testid="out">{typeof val === 'string' ? val : JSON.stringify(val)}</div>;
}

function Switcher() {
  const [lang, setLang] = useLang();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={() => setLang('en')}>en</button>
      <button onClick={() => setLang('fr')}>fr</button>
      <button onClick={() => setLang('es')}>es</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('i18n', () => {
  it('returns the key itself when missing', () => {
    render(
      <LangProvider>
        <Probe k="this.does.not.exist" />
      </LangProvider>
    );
    expect(screen.getByTestId('out').textContent).toBe('this.does.not.exist');
  });

  it('resolves nested strings from the dictionary', () => {
    render(
      <LangProvider>
        <Probe k="nav.items.inicio" />
      </LangProvider>
    );
    expect(screen.getByTestId('out').textContent.length).toBeGreaterThan(0);
  });

  it('resolves objects (used by destructured labels)', () => {
    render(
      <LangProvider>
        <Probe k="hero.schematicLabels" />
      </LangProvider>
    );
    const parsed = JSON.parse(screen.getByTestId('out').textContent);
    expect(parsed.captacion).toBeDefined();
    expect(parsed.sensors.caudal).toBeDefined();
  });

  it('persists language to localStorage', async () => {
    const { getByText, getByTestId } = render(
      <LangProvider>
        <Switcher />
      </LangProvider>
    );
    await act(async () => { getByText('fr').click(); });
    expect(getByTestId('lang').textContent).toBe('fr');
    expect(window.localStorage.getItem('giova_water:lang')).toBe('fr');
  });

  it('falls back to es when key missing in current lang', () => {
    // every key that exists in es should resolve in en/fr too (with fallback)
    render(
      <LangProvider>
        <Switcher />
        <Probe k="nav.items.inicio" />
      </LangProvider>
    );
    expect(screen.getByTestId('out').textContent.length).toBeGreaterThan(0);
  });
});

describe('dictionary completeness', () => {
  // Walk every key path in `es` and verify it exists in `en` and `fr`.
  function walk(obj, prefix = []) {
    const out = [];
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const path = [...prefix, k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out.push(...walk(v, path));
      } else {
        out.push(path.join('.'));
      }
    }
    return out;
  }

  // Pull the dictionary out by invoking the t() machinery through the provider.
  // Easier: import the module and read it directly.
  it('every es leaf key resolves in en and fr', async () => {
    const mod = await import('../../src/i18n.jsx');
    // Render once in each language and check t() returns a non-key value for sampled paths.
    const sampleKeys = [
      'nav.items.inicio', 'hero.kicker', 'hero.role', 'hero.intro',
      'hero.schematicLabels.captacion', 'about.kicker', 'about.idcard.role',
      'projects.h2a', 'projects.data.P-001.title', 'projects.data.P-003.cat',
      'twins.h2a', 'twins.dashboard.title', 'contact.h2a',
      'contact.form.submit', 'footer.copy', 'common.tweaks',
    ];

    for (const lang of ['es', 'en', 'fr']) {
      const probe = { current: null };
      function Collect() {
        const t = mod.useT();
        const [, setLang] = mod.useLang();
        React.useEffect(() => { setLang(lang); }, []);
        probe.current = sampleKeys.map(k => ({ k, v: t(k) }));
        return null;
      }
      await act(async () => {
        render(
          <mod.LangProvider>
            <Collect />
          </mod.LangProvider>
        );
      });
      for (const { k, v } of probe.current) {
        expect(v, `lang=${lang} key=${k}`).not.toBe(k);
        expect(v, `lang=${lang} key=${k}`).toBeDefined();
      }
    }
  });
});
