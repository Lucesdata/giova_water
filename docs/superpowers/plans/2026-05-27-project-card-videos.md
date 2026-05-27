# Project Card Videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pre-rendered 3s looping Remotion animations to each of the 6 project cards, crossfading in on hover.

**Architecture:** Two Remotion compositions (`AguaCardVideo` / `DigitalCardVideo`) are pre-rendered to 6 `.mp4` files via a Node.js script. Each `ProjectCard` renders a `<video>` element positioned absolutely inside the image area; its opacity is driven by the existing `hover` state. Videos are excluded from git.

**Tech Stack:** Remotion 4.x (`@remotion/bundler`, `@remotion/renderer`, `remotion`), React 18, Vitest + @testing-library/react (jsdom)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `.gitignore` | Modify | Exclude `public/assets/cards/` |
| `package.json` | Modify | Add `render:cards` npm script |
| `src/remotion/cards/AguaCardVideo.jsx` | Create | Water-themed 90-frame SVG animation |
| `src/remotion/cards/DigitalCardVideo.jsx` | Create | Digital-network 90-frame SVG animation |
| `src/remotion/cards/RootCards.jsx` | Create | Remotion root registering both compositions |
| `src/remotion/cards/render-cards.mjs` | Create | Node.js script rendering 6 .mp4 files |
| `src/data/projects.js` | Modify | Add `video` property to all 6 projects |
| `src/components/Projects.jsx` | Modify | Add `<video>` overlay in `ProjectCard` |
| `tests/unit/remotion/cards/AguaCardVideo.test.jsx` | Create | Render-without-crash unit test |
| `tests/unit/remotion/cards/DigitalCardVideo.test.jsx` | Create | Render-without-crash unit test |

---

### Task 1: Bootstrap — .gitignore, npm script

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Add `public/assets/cards/` to `.gitignore`**

Open `.gitignore` (currently contains `public/assets/ptap-intro.mp4` among other entries). Add a new line:

```
public/assets/cards/
```

- [ ] **Step 2: Add `render:cards` script to `package.json`**

In `package.json` under `"scripts"`, add after the existing `"render:hero"` line:

```json
"render:cards": "node src/remotion/cards/render-cards.mjs"
```

The `scripts` block should look like:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:update": "playwright test --update-snapshots",
  "render:hero": "node src/remotion/render.mjs",
  "render:cards": "node src/remotion/cards/render-cards.mjs"
},
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore package.json
git commit -m "chore: add render:cards script and gitignore cards output"
```

---

### Task 2: AguaCardVideo component + test

**Files:**
- Create: `src/remotion/cards/AguaCardVideo.jsx`
- Create: `tests/unit/remotion/cards/AguaCardVideo.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/remotion/cards/AguaCardVideo.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AguaCardVideo } from '../../../../src/remotion/cards/AguaCardVideo.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 45,
}));

describe('AguaCardVideo', () => {
  it('renders an SVG without crash', () => {
    const { container } = render(<AguaCardVideo color="#1e3a5f" id="P-001" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the ID label text', () => {
    const { container } = render(<AguaCardVideo color="#1c4a3a" id="P-002" />);
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts.some(t => t.textContent.includes('P-002'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm test -- --reporter=verbose tests/unit/remotion/cards/AguaCardVideo.test.jsx
```

Expected: FAIL — `Cannot find module '../../../../src/remotion/cards/AguaCardVideo.jsx'`

- [ ] **Step 3: Create `src/remotion/cards/AguaCardVideo.jsx`**

```jsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../colors.js';

const PIPES = [120, 200, 280];

export function AguaCardVideo({ color, id }) {
  const frame = useCurrentFrame();
  const lf = frame % 90;

  const particles = Array.from({ length: 12 }, (_, i) => ({
    cx: (lf * 5 + i * 53) % 640,
    cy: PIPES[Math.floor(i / 4)],
    opacity: 0.5 + 0.4 * Math.sin(lf * 0.1 + i),
  }));

  const sensors = [
    { label: 'CAUDAL', value: (38 + 8 * Math.sin(lf * 0.07)).toFixed(1), unit: 'L/s', y: 308 },
    { label: 'PRESIÓN', value: (3.2 + 0.4 * Math.sin(lf * 0.07 + 2)).toFixed(2), unit: 'bar', y: 324 },
    { label: 'TURBIDEZ', value: (0.85 + 0.35 * Math.sin(lf * 0.07 + 4)).toFixed(2), unit: 'NTU', y: 340 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width="640" height="400" viewBox="0 0 640 400">
        <defs>
          <pattern id="agua-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={C.lineHi} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="640" height="400" fill="url(#agua-grid)" opacity={0.15} />

        {PIPES.map((y, i) => (
          <line key={i} x1={0} y1={y} x2={640} y2={y}
            stroke={C.lineHi} strokeWidth={1.5} />
        ))}

        {particles.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={3} fill={color} opacity={p.opacity} />
        ))}

        {sensors.map((s, i) => (
          <text key={i} x={480} y={s.y}
            fontFamily={C.fMono} fontSize={9} fill={C.ink1} textAnchor="start">
            {`${s.label}  ${s.value} ${s.unit}`}
          </text>
        ))}

        <text x={12} y={20} fontFamily={C.fMono} fontSize={9} fill={C.ink3}>{id}</text>
      </svg>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm test -- --reporter=verbose tests/unit/remotion/cards/AguaCardVideo.test.jsx
```

Expected: `✓ AguaCardVideo > renders an SVG without crash`, `✓ AguaCardVideo > renders the ID label text`

- [ ] **Step 5: Commit**

```bash
git add src/remotion/cards/AguaCardVideo.jsx tests/unit/remotion/cards/AguaCardVideo.test.jsx
git commit -m "feat: add AguaCardVideo Remotion composition + unit test"
```

---

### Task 3: DigitalCardVideo component + test

**Files:**
- Create: `src/remotion/cards/DigitalCardVideo.jsx`
- Create: `tests/unit/remotion/cards/DigitalCardVideo.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/remotion/cards/DigitalCardVideo.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DigitalCardVideo } from '../../../../src/remotion/cards/DigitalCardVideo.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 45,
}));

describe('DigitalCardVideo', () => {
  it('renders an SVG without crash', () => {
    const { container } = render(<DigitalCardVideo color="#3a2660" id="P-003" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the ID label text', () => {
    const { container } = render(<DigitalCardVideo color="#2c2a10" id="P-004" />);
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts.some(t => t.textContent.includes('P-004'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm test -- --reporter=verbose tests/unit/remotion/cards/DigitalCardVideo.test.jsx
```

Expected: FAIL — `Cannot find module '../../../../src/remotion/cards/DigitalCardVideo.jsx'`

- [ ] **Step 3: Create `src/remotion/cards/DigitalCardVideo.jsx`**

```jsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../colors.js';

const HUBS = [{ x: 280, y: 180 }, { x: 380, y: 240 }];
const PERIPHERALS = [
  { x: 160, y: 120 },
  { x: 500, y: 120 },
  { x: 140, y: 300 },
  { x: 520, y: 300 },
];
const NODES = [...HUBS, ...PERIPHERALS];
const EDGES = [
  [HUBS[0], HUBS[1]],
  [HUBS[0], PERIPHERALS[0]],
  [HUBS[0], PERIPHERALS[2]],
  [HUBS[1], PERIPHERALS[1]],
  [HUBS[1], PERIPHERALS[3]],
  [PERIPHERALS[0], PERIPHERALS[1]],
];

export function DigitalCardVideo({ color, id }) {
  const frame = useCurrentFrame();
  const lf = frame % 90;

  const counter = String((lf * 3) % 999).padStart(3, '0');

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width="640" height="400" viewBox="0 0 640 400">
        {EDGES.map(([a, b], i) => (
          <line key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={C.accentLine} strokeWidth={1}
            strokeDasharray="8 4"
            strokeDashoffset={(lf * 2 + i * 15) % 60}
          />
        ))}

        {NODES.map((n, i) => {
          const baseR = i < 2 ? 14 : 8;
          const r = baseR + 3 * Math.sin(lf * 0.12 + i * 0.8);
          return (
            <circle key={i} cx={n.x} cy={n.y} r={r} fill={color} opacity={0.85} />
          );
        })}

        <text x={628} y={20} fontFamily={C.fMono} fontSize={20} fill={C.accent}
          textAnchor="end">{counter}</text>
        <text x={628} y={32} fontFamily={C.fMono} fontSize={8} fill={C.ink3}
          textAnchor="end">NODES ACTIVE</text>

        <text x={12} y={20} fontFamily={C.fMono} fontSize={9} fill={C.ink3}>{id}</text>
      </svg>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm test -- --reporter=verbose tests/unit/remotion/cards/DigitalCardVideo.test.jsx
```

Expected: `✓ DigitalCardVideo > renders an SVG without crash`, `✓ DigitalCardVideo > renders the ID label text`

- [ ] **Step 5: Commit**

```bash
git add src/remotion/cards/DigitalCardVideo.jsx tests/unit/remotion/cards/DigitalCardVideo.test.jsx
git commit -m "feat: add DigitalCardVideo Remotion composition + unit test"
```

---

### Task 4: RootCards — Remotion Studio root

**Files:**
- Create: `src/remotion/cards/RootCards.jsx`

No unit test needed — this file only registers compositions for Remotion Studio / the render script.

- [ ] **Step 1: Create `src/remotion/cards/RootCards.jsx`**

```jsx
import React from 'react';
import { Composition } from 'remotion';
import { AguaCardVideo } from './AguaCardVideo.jsx';
import { DigitalCardVideo } from './DigitalCardVideo.jsx';

export function RootCards() {
  return (
    <>
      <Composition
        id="AguaCardVideo"
        component={AguaCardVideo}
        durationInFrames={90}
        fps={30}
        width={640}
        height={400}
        defaultProps={{ color: '#1e3a5f', id: 'P-001' }}
      />
      <Composition
        id="DigitalCardVideo"
        component={DigitalCardVideo}
        durationInFrames={90}
        fps={30}
        width={640}
        height={400}
        defaultProps={{ color: '#3a2660', id: 'P-003' }}
      />
    </>
  );
}
```

- [ ] **Step 2: Run all tests to confirm nothing broke**

```bash
npm test
```

Expected: all existing tests pass (should be 35+ passing, 0 failing).

- [ ] **Step 3: Commit**

```bash
git add src/remotion/cards/RootCards.jsx
git commit -m "feat: add RootCards Remotion root for card compositions"
```

---

### Task 5: render-cards.mjs — Node.js render script

**Files:**
- Create: `src/remotion/cards/render-cards.mjs`

No unit test — Node.js script, excluded from test scope per spec.

- [ ] **Step 1: Create `src/remotion/cards/render-cards.mjs`**

This script follows the same pattern as `src/remotion/render.mjs`. It iterates the 6 projects, selects the correct composition based on the `filters` array, and renders each to `public/assets/cards/pXXX.mp4`.

```js
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projects = [
  { id: 'P-001', color: '#1e3a5f', filters: ['agua'] },
  { id: 'P-002', color: '#1c4a3a', filters: ['agua'] },
  { id: 'P-003', color: '#3a2660', filters: ['digital'] },
  { id: 'P-004', color: '#2c2a10', filters: ['digital'] },
  { id: 'P-005', color: '#1c3628', filters: ['agua'] },
  { id: 'P-006', color: '#2a1f38', filters: ['agua'] },
];

const outDir = path.join(__dirname, '../../../public/assets/cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Bundling card compositions...');
const bundled = await bundle({
  entryPoint: path.join(__dirname, 'RootCards.jsx'),
  webpackOverride: (config) => config,
});

for (const p of projects) {
  const compId = p.filters.includes('agua') ? 'AguaCardVideo' : 'DigitalCardVideo';
  const slug = p.id.toLowerCase().replace('-', ''); // 'P-001' → 'p001'
  const outputLocation = path.join(outDir, `${slug}.mp4`);

  console.log(`Rendering ${p.id} → ${slug}.mp4 (${compId})...`);
  const composition = await selectComposition({
    serveUrl: bundled,
    id: compId,
    inputProps: { color: p.color, id: p.id },
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation,
    inputProps: { color: p.color, id: p.id },
  });

  console.log(`  ✓ ${slug}.mp4`);
}

console.log('✓ All 6 card videos rendered to public/assets/cards/');
```

- [ ] **Step 2: Commit**

```bash
git add src/remotion/cards/render-cards.mjs
git commit -m "feat: add render-cards.mjs script for pre-rendering card videos"
```

---

### Task 6: Add `video` field to projects.js

**Files:**
- Modify: `src/data/projects.js`

- [ ] **Step 1: Add `video` property to each project**

Replace the entire content of `src/data/projects.js` with:

```js
// Project metadata that's language-agnostic. Translated text lives in i18n.jsx
// under projects.data.<id>.
export const projectsData = [
  {
    id: 'P-001', year: '2022–25', loc: 'Cali, CO',
    tags: ['EPA-SWMM', 'P&IDs', 'CVC', 'Res.330/2017'],
    metricKeys: ['PE diseño', 'Red', 'Pozos'],
    filters: ['agua'],
    color: '#1e3a5f',
    image: '/assets/giovanni-field.jpg',
    video: '/assets/cards/p001.mp4',
  },
  {
    id: 'P-002', year: '2018–24', loc: 'Cali, CO',
    tags: ['EPANET', 'Python', 'Power BI', 'SCADA'],
    metricKeys: ['Plantas', 'Hab. servidos', 'Red PSMV'],
    filters: ['agua'],
    color: '#1c4a3a',
    video: '/assets/cards/p002.mp4',
  },
  {
    id: 'P-003', year: '2024', loc: 'Cali, CO',
    tags: ['Three.js', 'Chart.js', 'Motor HID'],
    metricKeys: ['Sensores', 'Refresh', 'Nodos'],
    filters: ['digital'],
    color: '#3a2660',
    featured: true,
    video: '/assets/cards/p003.mp4',
  },
  {
    id: 'P-004', year: '2023', loc: 'Remoto',
    tags: ['Django', 'React', 'InfluxDB'],
    metricKeys: ['Clientes', 'Puntos', 'Uptime'],
    filters: ['digital'],
    color: '#2c2a10',
    video: '/assets/cards/p004.mp4',
  },
  {
    id: 'P-005', year: '2018–25', loc: 'Buenaventura, CO',
    tags: ['Fisicoquímico', 'Biológico', 'SCADA', 'P&IDs'],
    metricKeys: ['Capacidad', 'Volumen', 'Permisos'],
    filters: ['agua'],
    color: '#1c3628',
    video: '/assets/cards/p005.mp4',
  },
  {
    id: 'P-006', year: '2019', loc: 'Cali, CO',
    tags: ['EPA-SWMM', 'Manning', 'MAGNA-SIRGAS', 'PSMV'],
    metricKeys: ['Pozos', 'Red modelada', 'PSMV'],
    filters: ['agua'],
    color: '#2a1f38',
    video: '/assets/cards/p006.mp4',
  },
];
```

- [ ] **Step 2: Run all tests to confirm nothing broke**

```bash
npm test
```

Expected: all existing tests pass, 0 failing.

- [ ] **Step 3: Commit**

```bash
git add src/data/projects.js
git commit -m "feat: add video field to all projects pointing to pre-rendered .mp4"
```

---

### Task 7: ProjectCard video overlay in Projects.jsx

**Files:**
- Modify: `src/components/Projects.jsx` (lines 72–73 — after the image/placeholder block, before the corner markers)

The `ProjectCard` component already has `const [hover, setHover] = useState(false)`. The video element sits inside the image area div (which already has `position: 'relative'` and `overflow: 'hidden'`).

- [ ] **Step 1: Add the video element to `ProjectCard`**

In `src/components/Projects.jsx`, find the closing `}` of the `{p.image ? (...) : (...)}` block (currently line 72), and insert the video overlay immediately after it, before the corner markers array:

The section to modify is inside the image div (the one with `aspectRatio: '16/10'`). After the `{p.image ? ... : ...}` expression and before `{[[8,8],[null,8],...].map(...)}`, add:

```jsx
        {p.video && (
          <video
            src={p.video}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: hover ? 1 : 0,
              transition: 'opacity 350ms var(--ease)',
            }}
          />
        )}
```

The complete image div after the change (lines 34–85 in the original) should look like:

```jsx
      <div style={{
        aspectRatio: '16/10',
        position: 'relative',
        background: `linear-gradient(135deg, ${p.color}55 0%, ${p.color}22 100%), var(--bg-2)`,
        borderBottom: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        {p.image ? (
          <>
            <img src={p.image} alt={i18n.title || p.id} loading="lazy" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)',
              transform: hover ? 'scale(1.03)' : 'scale(1)', transition: 'transform 500ms var(--ease)',
            }}/>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(6,9,12,0.55) 100%)' }}/>
          </>
        ) : (
          <>
            <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
              <defs>
                <pattern id={`grid-${p.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line-2)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${p.id})`}/>
            </svg>
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 16,
              border: '1px dashed var(--line-hi)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 10,
            }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.15em' }}>
                [ PROJECT FIGURE · 640×400 ]
              </span>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>{p.loc} · {p.year}</span>
            </div>
          </>
        )}
        {p.video && (
          <video
            src={p.video}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: hover ? 1 : 0,
              transition: 'opacity 350ms var(--ease)',
            }}
          />
        )}
        {[[8,8],[null,8],[8,null],[null,null]].map(([l,top],i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            left: l !== null ? l : 'auto', right: l === null ? 8 : 'auto',
            top: top !== null ? top : 'auto', bottom: top === null ? 8 : 'auto',
            width: 8, height: 8,
            borderColor: 'var(--accent)', borderStyle: 'solid',
            borderWidth: `${top !== null ? 1 : 0}px ${l === null ? 1 : 0}px ${top === null ? 1 : 0}px ${l !== null ? 1 : 0}px`,
            transition: 'opacity 200ms',
            opacity: hover ? 1 : 0.5,
          }}/>
        ))}
      </div>
```

- [ ] **Step 2: Run all tests — confirm nothing broke**

```bash
npm test
```

Expected: all tests pass (37+ passing), 0 failing.

- [ ] **Step 3: Commit**

```bash
git add src/components/Projects.jsx
git commit -m "feat: add hover video overlay to ProjectCard"
```

---

## Rendering the videos

After all 7 tasks are committed, pre-render the 6 `.mp4` files by running:

```bash
npm run render:cards
```

Expected output:
```
Bundling card compositions...
Rendering P-001 → p001.mp4 (AguaCardVideo)...
  ✓ p001.mp4
Rendering P-002 → p002.mp4 (AguaCardVideo)...
  ✓ p002.mp4
Rendering P-003 → p003.mp4 (DigitalCardVideo)...
  ✓ p003.mp4
Rendering P-004 → p004.mp4 (DigitalCardVideo)...
  ✓ p004.mp4
Rendering P-005 → p005.mp4 (AguaCardVideo)...
  ✓ p005.mp4
Rendering P-006 → p006.mp4 (AguaCardVideo)...
  ✓ p006.mp4
✓ All 6 card videos rendered to public/assets/cards/
```

The rendered `.mp4` files live in `public/assets/cards/` (gitignored) and are served by Vite's static file handler at `/assets/cards/pXXX.mp4`. Hover over any project card in the browser to verify the animation crossfades in.
