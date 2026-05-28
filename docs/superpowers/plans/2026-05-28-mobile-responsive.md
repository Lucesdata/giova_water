# Mobile Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the giova_water React + Vite portfolio fully usable on mobile devices (375px–768px) using a single `isMobile` breakpoint driven by a `useBreakpoint` hook, inline conditional styles, and a hamburger + full-screen overlay nav.

**Architecture:** Single `useBreakpoint` hook using `window.matchMedia('(max-width: 768px)')` with an `addEventListener('change')` listener — no polling, no re-renders on resize. Each component that needs responsive behavior imports and calls the hook directly. No CSS media queries are added anywhere.

**Tech Stack:** React 18 + Vite, Vitest + @testing-library/react, existing inline-style architecture.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/hooks/useBreakpoint.js` | Responsive breakpoint hook |
| Create | `tests/unit/hooks/useBreakpoint.test.js` | Hook unit tests |
| Create | `tests/unit/Nav.test.jsx` | Nav mobile behavior tests |
| Modify | `src/components/ScrollBackground.jsx` | Return null on mobile (performance) |
| Modify | `src/components/App.jsx` | Responsive padding, hide ScrollRail + TweaksToggle |
| Modify | `src/components/Nav.jsx` | Hamburger button + full-screen overlay |
| Modify | `src/components/Hero.jsx` | Responsive grids for all 3 hero variants |
| Modify | `src/components/About.jsx` | Stacked layout: header, ID card, timeline, skills |
| Modify | `src/components/Projects.jsx` | 1-col grid + IntersectionObserver for video |
| Modify | `src/components/DigitalTwins.jsx` | 4-col to 2-col grids |
| Modify | `src/components/Contact.jsx` | Stacked sidebar, 1-col form, 2-col footer |
| Modify | `tests/unit/ScrollBackground.test.jsx` | Add isMobile test case + fix beforeEach |

---

### Task 1: `useBreakpoint` hook

**Files:**
- Create: `src/hooks/useBreakpoint.js`
- Create: `tests/unit/hooks/useBreakpoint.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/hooks/useBreakpoint.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint } from '../../../src/hooks/useBreakpoint.js';

describe('useBreakpoint', () => {
  let changeHandler;
  const mockMQ = {
    matches: false,
    addEventListener: vi.fn((_, h) => { changeHandler = h; }),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    changeHandler = undefined;
    mockMQ.matches = false;
    mockMQ.addEventListener.mockClear();
    mockMQ.removeEventListener.mockClear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => mockMQ),
    });
  });

  it('returns isMobile=true when innerWidth <= 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.isMobile).toBe(true);
  });

  it('returns isMobile=false when innerWidth > 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.isMobile).toBe(false);
  });

  it('updates isMobile when matchMedia fires change event', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.isMobile).toBe(false);
    act(() => { changeHandler({ matches: true }); });
    expect(result.current.isMobile).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/hooks/useBreakpoint.test.js
```

Expected: FAIL — `Cannot find module '../../../src/hooks/useBreakpoint.js'`

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useBreakpoint.js`:

```js
import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return { isMobile };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/hooks/useBreakpoint.test.js
```

Expected: PASS — 3/3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBreakpoint.js tests/unit/hooks/useBreakpoint.test.js
git commit -m "feat: add useBreakpoint hook with matchMedia change listener"
```

---

### Task 2: ScrollBackground + App.jsx mobile

**Files:**
- Modify: `src/components/ScrollBackground.jsx:14-16`
- Modify: `tests/unit/ScrollBackground.test.jsx:20-28`
- Modify: `src/components/App.jsx:1,141,173-188`

- [ ] **Step 1: Extend ScrollBackground.test.jsx**

In `tests/unit/ScrollBackground.test.jsx`:

1. Add `Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });` to the existing `beforeEach` block (after the `matchMedia` mock line). This is needed so existing tests don't break when we add the `innerWidth <= 768` check to the component.

2. Add this test at the end of the `describe` block:

```js
it('does not mount Player when isMobile (innerWidth <= 768)', () => {
  Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
  const { queryByTestId } = render(<ScrollBackground />);
  expect(queryByTestId('remotion-player')).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify new test fails**

```bash
npx vitest run tests/unit/ScrollBackground.test.jsx
```

Expected: 3 pass, 1 fail (the new isMobile test)

- [ ] **Step 3: Update ScrollBackground.jsx lazy initializer**

In `src/components/ScrollBackground.jsx`, change lines 14–16:

```jsx
const [reduced] = useState(
  () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
);
```

to:

```jsx
const [reduced] = useState(
  () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
       || window.innerWidth <= 768
);
```

- [ ] **Step 4: Run ScrollBackground tests — all 4 pass**

```bash
npx vitest run tests/unit/ScrollBackground.test.jsx
```

Expected: 4/4 PASS

- [ ] **Step 5: Update App.jsx**

In `src/components/App.jsx`:

Add import after the last existing import line (line 11):
```jsx
import { useBreakpoint } from '../hooks/useBreakpoint.js';
```

Add `const { isMobile } = useBreakpoint();` as the second line of the `App` function body (after `const active = useActiveSection(...)`):
```jsx
const { isMobile } = useBreakpoint();
```

In the JSX return, change line 173–188 from:
```jsx
      <ScrollBackground />
      <Nav active={active} />
      <ScrollRail active={active} />
      <main id="main" style={{ position: 'relative', zIndex: 1, padding: '120px 64px 0', maxWidth: 1440, margin: '0 auto' }}>
        ...
      </main>
      <TweaksToggle onClick={() => setPanelOpen(o => !o)} />
      <TweaksPanel open={panelOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setPanelOpen(false)} />
```
to:
```jsx
      <ScrollBackground />
      <Nav active={active} />
      {!isMobile && <ScrollRail active={active} />}
      <main id="main" style={{ position: 'relative', zIndex: 1, padding: isMobile ? '72px 16px 0' : '120px 64px 0', maxWidth: 1440, margin: '0 auto' }}>
        ...
      </main>
      {!isMobile && <TweaksToggle onClick={() => setPanelOpen(o => !o)} />}
      {!isMobile && <TweaksPanel open={panelOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setPanelOpen(false)} />}
```

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 7: Commit**

```bash
git add src/components/ScrollBackground.jsx src/components/App.jsx tests/unit/ScrollBackground.test.jsx
git commit -m "feat: hide ScrollBackground/ScrollRail/TweaksToggle on mobile, responsive main padding"
```

---

### Task 3: Nav.jsx hamburger + overlay

**Files:**
- Modify: `src/components/Nav.jsx:1-90` (full rewrite)
- Create: `tests/unit/Nav.test.jsx`

- [ ] **Step 1: Write Nav mobile test**

Create `tests/unit/Nav.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Nav from '../../src/components/Nav.jsx';

vi.mock('../../src/i18n.jsx', () => ({
  useT: () => (key) => key,
  useLang: () => ['es', vi.fn(), ['es', 'en']],
}));

vi.mock('../../src/hooks/useBreakpoint.js', () => ({
  useBreakpoint: vi.fn(),
}));

import { useBreakpoint } from '../../src/hooks/useBreakpoint.js';

describe('Nav — mobile', () => {
  beforeEach(() => {
    useBreakpoint.mockReturnValue({ isMobile: true });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it('renders hamburger button in mobile', () => {
    render(<Nav active="inicio" />);
    expect(screen.getByLabelText('Abrir menú')).toBeTruthy();
  });

  it('opens overlay when hamburger is clicked', () => {
    render(<Nav active="inicio" />);
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    expect(screen.getByLabelText('Cerrar menú')).toBeTruthy();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('closes overlay on Escape key', () => {
    render(<Nav active="inicio" />);
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('Cerrar menú')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/Nav.test.jsx
```

Expected: FAIL — Nav doesn't have hamburger or `useBreakpoint` yet

- [ ] **Step 3: Rewrite Nav.jsx**

Replace the full contents of `src/components/Nav.jsx` with:

```jsx
import React, { useState, useEffect } from 'react';
import { Logo, StatusDot } from './primitives.jsx';
import { useT, useLang } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

export default function Nav({ active }) {
  const t = useT();
  const [lang, setLang, supported] = useLang();
  const { isMobile } = useBreakpoint();
  const items = [
    { id: 'inicio', n: '00' },
    { id: 'sobre', n: '01' },
    { id: 'proyectos', n: '02' },
    { id: 'gemelos', n: '03' },
    { id: 'contacto', n: '04' },
  ];
  const [time, setTime] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const z = (n) => String(n).padStart(2, '0');
      setTime(`${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <nav aria-label="Principal" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backdropFilter: 'blur(10px)',
        background: 'color-mix(in srgb, var(--bg) 78%, transparent)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 32px', borderBottom: '1px solid var(--line)',
          fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--ink-3)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {isMobile ? (
            <StatusDot label={t('nav.banner.available')} />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 18 }}>
                <span>41.3879°N &nbsp; 2.0456°E</span>
                <span style={{ color: 'var(--ink-2)' }}>· {t('nav.banner.location')}</span>
              </div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                <StatusDot label={t('nav.banner.available')} />
                <span>{time}</span>
              </div>
            </>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '14px 32px',
        }}>
          <Logo />
          {isMobile ? (
            <button
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={open}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 5, padding: 4,
              }}
            >
              {open ? (
                <span style={{ color: 'var(--ink-1)', fontSize: 18, lineHeight: 1 }}>✕</span>
              ) : (
                <>
                  <div style={{ width: 20, height: 1.5, background: 'var(--ink-1)' }}/>
                  <div style={{ width: 20, height: 1.5, background: 'var(--ink-1)' }}/>
                  <div style={{ width: 14, height: 1.5, background: 'var(--ink-1)' }}/>
                </>
              )}
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {items.map(it => (
                  <a key={it.id} href={`#${it.id}`} aria-current={active === it.id ? 'page' : undefined} style={{
                    padding: '8px 14px',
                    fontFamily: 'var(--f-mono)', fontSize: 11.5,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: active === it.id ? 'var(--accent)' : 'var(--ink-1)',
                    borderBottom: active === it.id ? '1px solid var(--accent)' : '1px solid transparent',
                    display: 'flex', gap: 8, alignItems: 'baseline',
                    transition: 'color 160ms',
                  }}>
                    <span style={{ fontSize: 9.5, color: active === it.id ? 'var(--accent)' : 'var(--ink-3)' }}>
                      {it.n}
                    </span>
                    {t(`nav.items.${it.id}`)}
                  </a>
                ))}
              </div>
              <div role="group" aria-label="Selector de idioma" style={{
                display: 'flex', border: '1px solid var(--line-2)',
                fontFamily: 'var(--f-mono)', fontSize: 11,
              }}>
                {supported.map(l => (
                  <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} style={{
                    padding: '6px 12px',
                    background: lang === l ? 'var(--accent)' : 'transparent',
                    color: lang === l ? 'var(--bg)' : 'var(--ink-1)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 'inherit',
                  }}>{l.toUpperCase()}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      {isMobile && open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Logo />
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-1)', fontSize: 18, lineHeight: 1 }}
            >✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.map(it => (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={() => setOpen(false)}
                aria-current={active === it.id ? 'page' : undefined}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', borderBottom: '1px solid var(--line)',
                  fontFamily: 'var(--f-mono)', fontSize: 13,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: active === it.id ? 'var(--accent)' : 'var(--ink)',
                  background: active === it.id ? 'var(--bg-1)' : 'transparent',
                }}
              >
                <span>{t(`nav.items.${it.id}`)}</span>
                <span style={{ fontSize: 10, color: active === it.id ? 'var(--accent)' : 'var(--ink-3)' }}>
                  {it.n}{active === it.id ? ' ●' : ''}
                </span>
              </a>
            ))}
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--ink-3)', marginRight: 4 }}>IDIOMA</span>
            {supported.map(l => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} style={{
                padding: '3px 10px', fontSize: 10,
                background: lang === l ? 'var(--accent)' : 'transparent',
                color: lang === l ? 'var(--bg)' : 'var(--ink-2)',
                border: `1px solid ${lang === l ? 'var(--accent)' : 'var(--line-2)'}`,
                fontFamily: 'var(--f-mono)', cursor: 'pointer',
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.06em', color: 'var(--line-hi)' }}>
              41.3879°N · 2.0456°E
            </span>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run Nav tests**

```bash
npx vitest run tests/unit/Nav.test.jsx
```

Expected: 3/3 PASS

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/Nav.jsx tests/unit/Nav.test.jsx
git commit -m "feat: Nav hamburger + full-screen overlay for mobile"
```

---

### Task 4: Hero.jsx responsive layouts

**Files:**
- Modify: `src/components/Hero.jsx:1-437`

No new tests — existing tests cover Hero rendering.

- [ ] **Step 1: Add `useBreakpoint` import**

In `src/components/Hero.jsx`, add after line 3:

```jsx
import { useBreakpoint } from '../hooks/useBreakpoint.js';
```

- [ ] **Step 2: Make HeroSchematic responsive**

In `HeroSchematic` (starts at line 180), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

Change the outer grid style (line 191). Find:
```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: 48, alignItems: 'center', minHeight: 'calc(100vh - 76px)', padding: '64px 0 48px' }}>
```
Replace with:
```jsx
<div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: isMobile ? 32 : 48, alignItems: 'center', minHeight: 'calc(100vh - 76px)', padding: isMobile ? '48px 0' : '64px 0 48px' }}>
```

Change the stats grid (line 219). Find:
```jsx
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
```
Replace with:
```jsx
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
```

- [ ] **Step 3: Make HeroTypographic responsive**

In `HeroTypographic` (starts at line 310), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

Change the bio grid (line 346). Find:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48, marginTop: 56,
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 24 : 48, marginTop: 56,
```

- [ ] **Step 4: Make HeroTerminal responsive**

In `HeroTerminal` (starts at line 365), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

Change the outer grid (line 389). Find:
```jsx
    <div style={{ minHeight: 'calc(100vh - 76px)', padding: '48px 0', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: 48, alignItems: 'center' }}>
```
Replace with:
```jsx
    <div style={{ minHeight: 'calc(100vh - 76px)', padding: '48px 0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: isMobile ? 24 : 48, alignItems: 'center' }}>
```

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero.jsx
git commit -m "feat: Hero.jsx responsive — 2-col to 1-col, stats 4-col to 2x2 on mobile"
```

---

### Task 5: About.jsx responsive layouts

**Files:**
- Modify: `src/components/About.jsx:1-248`

No new tests.

- [ ] **Step 1: Add `useBreakpoint` import**

In `src/components/About.jsx`, add after line 4 (`import { useT } from '../i18n.jsx';`):

```jsx
import { useBreakpoint } from '../hooks/useBreakpoint.js';
```

- [ ] **Step 2: Add `isMobile` to `TimelineRow`**

In `TimelineRow` (starts at line 49), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

Change the grid style (line 53). Find:
```jsx
      display: 'grid', gridTemplateColumns: '140px 1fr',
      gap: 32,
```
Replace with:
```jsx
      display: 'grid', gridTemplateColumns: isMobile ? '80px 1fr' : '140px 1fr',
      gap: isMobile ? 16 : 32,
```

- [ ] **Step 3: Add `isMobile` to `About` and make section header responsive**

In the `About` function (line 86), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

Change the section header grid (line 95). Find:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, marginBottom: 48 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
```

- [ ] **Step 4: Responsive ID card sidebar**

Change the ID card grid (line 108). Find:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: isMobile ? 32 : 48 }}>
```

- [ ] **Step 5: Responsive skills grid**

Change the skills grid (line 216). Find:
```jsx
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
```
Replace with:
```jsx
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : '0 40px' }}>
```

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 7: Commit**

```bash
git add src/components/About.jsx
git commit -m "feat: About.jsx responsive — stacked layout on mobile"
```

---

### Task 6: Projects.jsx responsive + IntersectionObserver videos

**Files:**
- Modify: `src/components/Projects.jsx:1-224`

No new tests.

- [ ] **Step 1: Update React import and add `useBreakpoint`**

Change line 1 of `src/components/Projects.jsx` from:
```jsx
import React, { useState } from 'react';
```
to:
```jsx
import React, { useState, useRef, useEffect } from 'react';
```

Add after line 4 (`import { projectsData } from '../data/projects.js';`):
```jsx
import { useBreakpoint } from '../hooks/useBreakpoint.js';
```

- [ ] **Step 2: Add `isMobile`, `cardRef`, and IntersectionObserver to `ProjectCard`**

In `ProjectCard` (starts at line 6), add at the top of the function body (before the existing `const i18n = ...` line):

```jsx
const { isMobile } = useBreakpoint();
const cardRef = useRef(null);
const [visible, setVisible] = useState(false);

useEffect(() => {
  if (!isMobile || !p.video) return;
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) setVisible(true); },
    { threshold: 0.4 }
  );
  if (cardRef.current) observer.observe(cardRef.current);
  return () => observer.disconnect();
}, [isMobile, p.video]);
```

Add `ref={cardRef}` to the `<article>` element (line 13). Find:
```jsx
    <article
      onMouseEnter={() => setHover(true)}
```
Replace with:
```jsx
    <article
      ref={cardRef}
      onMouseEnter={() => setHover(true)}
```

- [ ] **Step 3: Update video opacity for mobile**

In the `<video>` element (around line 83), find:
```jsx
              opacity: hover ? 1 : 0,
```
Replace with:
```jsx
              opacity: isMobile ? (visible ? 1 : 0) : (hover ? 1 : 0),
```

- [ ] **Step 4: Make `Projects` component responsive**

In the `Projects` function (starts at line 155), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

Change the section header grid (line 167). Find:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, marginBottom: 48 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
```

Change the cards grid (line 212). Find:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
```

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/Projects.jsx
git commit -m "feat: Projects.jsx responsive — 1-col grid + IntersectionObserver video autoplay on mobile"
```

---

### Task 7: DigitalTwins.jsx responsive

**Files:**
- Modify: `src/components/DigitalTwins.jsx:1-335`

No new tests.

- [ ] **Step 1: Add `useBreakpoint` import**

In `src/components/DigitalTwins.jsx`, add after line 3 (`import { useT } from '../i18n.jsx';`):

```jsx
import { useBreakpoint } from '../hooks/useBreakpoint.js';
```

- [ ] **Step 2: Add `isMobile` to DigitalTwins**

In the `DigitalTwins` function (line 197), add `const { isMobile } = useBreakpoint();` after the `const [ref, inView] = useInView(...)` line:

```jsx
const { isMobile } = useBreakpoint();
```

- [ ] **Step 3: Responsive section header**

Find (line 228):
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, marginBottom: 48 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
```

- [ ] **Step 4: Responsive gauges grid**

Find (line 261):
```jsx
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--line)' }}>
```
Replace with:
```jsx
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', borderBottom: '1px solid var(--line)' }}>
```

- [ ] **Step 5: Responsive chart split**

Find (line 268):
```jsx
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', borderBottom: '1px solid var(--line)' }}>
```
Replace with:
```jsx
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr', borderBottom: '1px solid var(--line)' }}>
```

- [ ] **Step 6: Responsive sparks grid**

Find (line 304):
```jsx
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
```
Replace with:
```jsx
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
```

- [ ] **Step 7: Responsive features grid**

Find (line 324):
```jsx
      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
```
Replace with:
```jsx
      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
```

- [ ] **Step 8: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 9: Commit**

```bash
git add src/components/DigitalTwins.jsx
git commit -m "feat: DigitalTwins.jsx responsive — 4-col to 2-col grids on mobile"
```

---

### Task 8: Contact.jsx + Footer responsive

**Files:**
- Modify: `src/components/Contact.jsx:1-204`

No new tests.

- [ ] **Step 1: Add `useBreakpoint` import**

In `src/components/Contact.jsx`, add after line 3 (`import { useT } from '../i18n.jsx';`):

```jsx
import { useBreakpoint } from '../hooks/useBreakpoint.js';
```

- [ ] **Step 2: Add `isMobile` to `Contact`**

In the `Contact` function (line 5), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

- [ ] **Step 3: Responsive Contact section header**

Find (line 21):
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, marginBottom: 48 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
```

- [ ] **Step 4: Responsive sidebar**

Find (line 34):
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: isMobile ? 32 : 48 }}>
```

- [ ] **Step 5: Responsive form name+email fields**

Find (line 117):
```jsx
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
```
Replace with:
```jsx
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
```

- [ ] **Step 6: Add `isMobile` to `Footer`**

In the `Footer` function (line 157), add as the first line of the function body:

```jsx
const { isMobile } = useBreakpoint();
```

- [ ] **Step 7: Responsive Footer grid**

Find (line 161):
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
```
Replace with:
```jsx
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '2fr 1fr 1fr 1fr', gap: isMobile ? 24 : 32, marginBottom: 40 }}>
```

- [ ] **Step 8: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass — 39 existing + 7 new = 46+ total

- [ ] **Step 9: Commit**

```bash
git add src/components/Contact.jsx
git commit -m "feat: Contact.jsx + Footer responsive — stacked sidebar and 2-col footer on mobile"
```
