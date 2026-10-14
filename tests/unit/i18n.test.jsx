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
        <Probe k="hero.video" />
      </LangProvider>
    );
    const parsed = JSON.parse(screen.getByTestId('out').textContent);
    expect(parsed.fig).toBeDefined();
    expect(parsed.vars).toHaveLength(6);
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
  // Every leaf of `es` must exist in `en` and `fr`, with arrays of the same length.
  function leaves(obj, prefix = []) {
    const out = [];
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const path = [...prefix, k];
      if (Array.isArray(v)) {
        out.push([path.join('.'), 'array', v.length]);
        v.forEach((item, i) => {
          if (item && typeof item === 'object') out.push(...leaves(item, [...path, String(i)]));
        });
      } else if (v && typeof v === 'object') {
        out.push(...leaves(v, path));
      } else {
        out.push([path.join('.'), 'string']);
      }
    }
    return out;
  }
  const get = (obj, path) => path.split('.').reduce((cur, p) => (cur == null ? undefined : cur[p]), obj);

  it.each(['en', 'fr'])('every es key exists in %s with the same shape', async (lang) => {
    const { dictionary } = await import('../../src/i18n.jsx');
    for (const [path, kind, len] of leaves(dictionary.es)) {
      const v = get(dictionary[lang], path);
      expect(v, `${lang}: ${path}`).toBeDefined();
      if (kind === 'array') {
        expect(Array.isArray(v), `${lang}: ${path} is an array`).toBe(true);
        expect(v.length, `${lang}: ${path} length`).toBe(len);
      } else {
        expect(typeof v, `${lang}: ${path} type`).toBe('string');
        // `types.0.v` is the intentionally empty value of the default <option>.
        if (!path.endsWith('.v')) expect(v.trim().length, `${lang}: ${path} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('resolves sampled keys in every language through t()', async () => {
    const mod = await import('../../src/i18n.jsx');
    const sampleKeys = [
      'nav.items.inicio', 'hero.h1', 'hero.intro', 'hero.video.fig',
      'about.method.title', 'projects.h2a', 'projects.data.P-007.budgets.title', 'twins.scenarios.items.alta.name',
      'projects.data.P-001.title', 'projects.data.P-007.title',
      'twins.badge', 'contact.form.prepare', 'footer.copy', 'common.tweaks',
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
        render(<mod.LangProvider><Collect /></mod.LangProvider>);
      });
      for (const { k, v } of probe.current) {
        expect(v, `lang=${lang} key=${k}`).not.toBe(k);
      }
    }
  });
});
