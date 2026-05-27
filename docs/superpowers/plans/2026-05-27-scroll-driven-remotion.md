# Scroll-Driven Remotion Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un fondo animado controlado por scroll — un único `<Player>` de `@remotion/player` fijo en el viewport que muestra 4 escenas SVG de ingeniería hídrica sincronizadas con el progreso de scroll.

**Architecture:** `ScrollBackground.jsx` escucha el evento `scroll`, calcula `progress = scrollY / (scrollHeight - innerHeight)` y llama `playerRef.current.seekTo(Math.round(progress * 479))` vía `requestAnimationFrame`. La composición `ScrollBG` usa `useCurrentFrame()` y distribuye el frame a 4 escenas: AboutScene (0-119), ProjectsScene (120-239), DigitalTwinsScene (240-359), ContactScene (360-479).

**Tech Stack:** `@remotion/player` 4.x, `remotion` 4.x, React 18, Vitest + @testing-library/react

---

### File map

| File | Acción | Responsabilidad |
|------|--------|-----------------|
| `src/remotion/ScrollBG.jsx` | Create | Composición raíz; llama `useCurrentFrame()`, pasa frame a escenas |
| `src/remotion/scenes/AboutScene.jsx` | Create | Red hídrica animada (frames 0–119) |
| `src/remotion/scenes/ProjectsScene.jsx` | Create | Gráfica de caudal (frames 120–239) |
| `src/remotion/scenes/DigitalTwinsScene.jsx` | Create | Gemelo digital (frames 240–359) |
| `src/remotion/scenes/ContactScene.jsx` | Create | Ondas ripple + GPS (frames 360–479) |
| `src/components/ScrollBackground.jsx` | Create | Wrapper: scroll → `seekTo`, monta `<Player>` |
| `src/components/App.jsx` | Modify | Agrega `<ScrollBackground />` antes de `<Nav>` |
| `tests/unit/ScrollBackground.test.jsx` | Create | Montaje, seekTo en scroll, prefers-reduced-motion |
| `tests/unit/remotion/ScrollBG.test.jsx` | Create | Smoke test composición |
| `tests/unit/remotion/scenes/AboutScene.test.jsx` | Create | Renders dentro/fuera de rango |
| `tests/unit/remotion/scenes/ProjectsScene.test.jsx` | Create | Renders dentro/fuera de rango |
| `tests/unit/remotion/scenes/DigitalTwinsScene.test.jsx` | Create | Renders dentro/fuera de rango |
| `tests/unit/remotion/scenes/ContactScene.test.jsx` | Create | Renders dentro/fuera de rango |

---

### Task 1: Instalar @remotion/player y crear stub ScrollBG

**Files:**
- Create: `src/remotion/ScrollBG.jsx` (stub)
- Create: `src/remotion/scenes/` (directorio vacío con .gitkeep)

- [ ] **Step 1: Instalar @remotion/player**

```bash
npm install @remotion/player@^4.0.468
```

Expected: `@remotion/player` aparece en `package.json` > `dependencies`.

- [ ] **Step 2: Crear el stub `src/remotion/ScrollBG.jsx`**

```jsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export function ScrollBG() {
  useCurrentFrame();
  return <AbsoluteFill style={{ background: 'transparent' }} />;
}
```

- [ ] **Step 3: Crear directorio de escenas**

```bash
mkdir -p src/remotion/scenes
touch src/remotion/scenes/.gitkeep
```

- [ ] **Step 4: Verificar que los tests existentes siguen pasando**

```bash
npm test
```

Expected: todos los tests en verde (18 tests).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/remotion/ScrollBG.jsx src/remotion/scenes/.gitkeep
git commit -m "feat: install @remotion/player, add ScrollBG stub"
```

---

### Task 2: ScrollBackground component (TDD)

**Files:**
- Create: `tests/unit/ScrollBackground.test.jsx`
- Create: `src/components/ScrollBackground.jsx`

- [ ] **Step 1: Escribir el test**

Crear `tests/unit/ScrollBackground.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { ScrollBackground } from '../../src/components/ScrollBackground.jsx';

const seekToSpy = vi.fn();

vi.mock('@remotion/player', () => ({
  Player: React.forwardRef((_props, ref) => {
    React.useImperativeHandle(ref, () => ({ seekTo: seekToSpy }));
    return React.createElement('div', { 'data-testid': 'remotion-player' });
  }),
}));

vi.mock('../../src/remotion/ScrollBG.jsx', () => ({
  ScrollBG: () => null,
}));

describe('ScrollBackground', () => {
  beforeEach(() => {
    seekToSpy.mockClear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    vi.stubGlobal('requestAnimationFrame', (fn) => { fn(); return 0; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  it('mounts the Player', () => {
    const { getByTestId } = render(<ScrollBackground />);
    expect(getByTestId('remotion-player')).not.toBeNull();
  });

  it('calls seekTo when scroll event fires', async () => {
    Object.defineProperty(document.body, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    vi.stubGlobal('scrollY', 600);

    render(<ScrollBackground />);

    await act(async () => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(seekToSpy).toHaveBeenCalledWith(expect.any(Number));
  });

  it('does not mount Player when prefers-reduced-motion is reduce', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { queryByTestId } = render(<ScrollBackground />);
    expect(queryByTestId('remotion-player')).toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que los tests fallan**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|ScrollBackground"
```

Expected: 3 tests FAIL (el archivo de implementación no existe).

- [ ] **Step 3: Implementar `src/components/ScrollBackground.jsx`**

```jsx
import React, { useRef, useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { ScrollBG } from '../remotion/ScrollBG.jsx';

const TOTAL_FRAMES = 479;

export function ScrollBackground() {
  const playerRef = useRef(null);
  const rafRef = useRef(null);
  const [dims, setDims] = useState({
    w: window.innerWidth || 1440,
    h: window.innerHeight || 900,
  });
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reduced) return;
    const onResize = () =>
      setDims({ w: window.innerWidth || 1440, h: window.innerHeight || 900 });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const max = document.body.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        playerRef.current?.seekTo(Math.round(progress * TOTAL_FRAMES));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        opacity: 0.18, pointerEvents: 'none',
      }}
    >
      <Player
        ref={playerRef}
        component={ScrollBG}
        durationInFrames={480}
        fps={30}
        compositionWidth={dims.w}
        compositionHeight={dims.h}
        style={{ width: '100%', height: '100%' }}
        autoPlay={false}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npm test
```

Expected: todos los tests en verde.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScrollBackground.jsx tests/unit/ScrollBackground.test.jsx
git commit -m "feat: add ScrollBackground — scroll drives Remotion Player seekTo"
```

---

### Task 3: AboutScene (TDD)

**Files:**
- Create: `tests/unit/remotion/scenes/AboutScene.test.jsx`
- Create: `src/remotion/scenes/AboutScene.jsx`

- [ ] **Step 1: Escribir el test**

Crear `tests/unit/remotion/scenes/AboutScene.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AboutScene } from '../../../../src/remotion/scenes/AboutScene.jsx';

vi.mock('remotion', () => ({
  interpolate: () => 0.5,
}));

describe('AboutScene', () => {
  it('returns null when frame < 0', () => {
    const { container } = render(<svg><AboutScene frame={-1} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 119', () => {
    const { container } = render(<svg><AboutScene frame={120} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 60', () => {
    const { container } = render(<svg><AboutScene frame={60} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que los tests fallan**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "AboutScene"
```

Expected: 3 tests FAIL.

- [ ] **Step 3: Implementar `src/remotion/scenes/AboutScene.jsx`**

```jsx
import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 0;
const END = 119;

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const NODES = [
  { id: 'CAP',  x: 180,  y: 450, label: 'CAPTACIÓN',  val: '42 L/s'   },
  { id: 'BOMB', x: 390,  y: 450, label: 'BOMBEO',      val: '3.2 bar'  },
  { id: 'PTAP', x: 620,  y: 450, label: 'PTAP',        val: '0.8 NTU'  },
  { id: 'RES1', x: 870,  y: 250, label: 'RESERVA N',   val: '1 200 m³' },
  { id: 'RES2', x: 870,  y: 650, label: 'RESERVA S',   val: '800 m³'   },
  { id: 'USR',  x: 1150, y: 450, label: 'RED URBANA',  val: '98 %'     },
];

const PIPES = [
  [0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5],
];

export function AboutScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const labelOpacity = interp(lf, 78, 95, 0, 1);

  return (
    <g opacity={sceneOpacity}>
      {PIPES.map(([a, b], i) => {
        const na = NODES[a], nb = NODES[b];
        const len = Math.hypot(nb.x - na.x, nb.y - na.y);
        const offset = interp(lf, 28 + i * 7, 75 + i * 4, len, 0);
        return (
          <line key={i}
            x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
            stroke={C.accentLine} strokeWidth="1.5"
            strokeDasharray={len} strokeDashoffset={offset}
          />
        );
      })}
      {NODES.map((n, i) => {
        const op = interp(lf, i * 5, i * 5 + 10, 0, 1);
        return (
          <g key={n.id} opacity={op}>
            <circle cx={n.x} cy={n.y} r="20" fill={C.bg2} stroke={C.lineHi} strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r="6"  fill={C.accent} />
          </g>
        );
      })}
      <g opacity={labelOpacity} fontFamily={C.fMono} textAnchor="middle">
        {NODES.map(n => (
          <React.Fragment key={n.id + '-l'}>
            <text x={n.x} y={n.y + 40} fontSize="10" fill={C.ink1}>{n.label}</text>
            <text x={n.x} y={n.y + 54} fontSize="9"  fill={C.ink3}>{n.val}</text>
          </React.Fragment>
        ))}
      </g>
    </g>
  );
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npm test
```

Expected: todos en verde.

- [ ] **Step 5: Commit**

```bash
git add src/remotion/scenes/AboutScene.jsx tests/unit/remotion/scenes/AboutScene.test.jsx
git commit -m "feat: add AboutScene — hydraulic network animation (frames 0-119)"
```

---

### Task 4: ProjectsScene (TDD)

**Files:**
- Create: `tests/unit/remotion/scenes/ProjectsScene.test.jsx`
- Create: `src/remotion/scenes/ProjectsScene.jsx`

- [ ] **Step 1: Escribir el test**

Crear `tests/unit/remotion/scenes/ProjectsScene.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProjectsScene } from '../../../../src/remotion/scenes/ProjectsScene.jsx';

vi.mock('remotion', () => ({ interpolate: () => 0.5 }));

describe('ProjectsScene', () => {
  it('returns null when frame < 120', () => {
    const { container } = render(<svg><ProjectsScene frame={119} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 239', () => {
    const { container } = render(<svg><ProjectsScene frame={240} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 180', () => {
    const { container } = render(<svg><ProjectsScene frame={180} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que los tests fallan**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "ProjectsScene"
```

Expected: 3 tests FAIL.

- [ ] **Step 3: Implementar `src/remotion/scenes/ProjectsScene.jsx`**

```jsx
import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 120;
const END = 239;
const CURVE = 'M 200,650 L 380,520 L 560,440 L 740,470 L 920,380 L 1100,300 L 1280,310';
const CURVE_LEN = 1210;

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const MARKERS = [
  { x: 380,  y: 520, label: 'PTAP LLANO GRANDE' },
  { x: 740,  y: 470, label: 'RED URBANA'         },
  { x: 1100, y: 300, label: 'GEMELO EAAB'         },
];

export function ProjectsScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const axisXLen       = interp(lf, 0, 28, 0, 1080);
  const axisYLen       = interp(lf, 5, 28, 0, 600);
  const curveDashOffset = interp(lf, 28, 90, CURVE_LEN, 0);
  const markerOpacity  = interp(lf, 88, 100, 0, 1);

  return (
    <g opacity={sceneOpacity} fontFamily={C.fMono}>
      <line x1="200" y1="750" x2={200 + axisXLen} y2="750"
        stroke={C.lineHi} strokeWidth="1.5" />
      <line x1="200" y1="750" x2="200" y2={750 - axisYLen}
        stroke={C.lineHi} strokeWidth="1.5" />
      <text x="740" y="790"  fontSize="10" fill={C.ink3} textAnchor="middle">TIEMPO (años)</text>
      <text x="158" y="450" fontSize="10" fill={C.ink3} textAnchor="middle"
        transform="rotate(-90 158 450)">CAUDAL (L/s)</text>
      <path d={CURVE}
        fill="none" stroke={C.accent} strokeWidth="2"
        strokeDasharray={CURVE_LEN} strokeDashoffset={curveDashOffset}
        strokeLinecap="round"
      />
      <g opacity={markerOpacity}>
        {MARKERS.map(m => (
          <g key={m.label}>
            <circle cx={m.x} cy={m.y} r="6"
              fill={C.bg2} stroke={C.accent} strokeWidth="1.5" />
            <text x={m.x} y={m.y - 14} fontSize="9" fill={C.ink1} textAnchor="middle">
              {m.label}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npm test
```

Expected: todos en verde.

- [ ] **Step 5: Commit**

```bash
git add src/remotion/scenes/ProjectsScene.jsx tests/unit/remotion/scenes/ProjectsScene.test.jsx
git commit -m "feat: add ProjectsScene — flow chart animation (frames 120-239)"
```

---

### Task 5: DigitalTwinsScene (TDD)

**Files:**
- Create: `tests/unit/remotion/scenes/DigitalTwinsScene.test.jsx`
- Create: `src/remotion/scenes/DigitalTwinsScene.jsx`

- [ ] **Step 1: Escribir el test**

Crear `tests/unit/remotion/scenes/DigitalTwinsScene.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DigitalTwinsScene } from '../../../../src/remotion/scenes/DigitalTwinsScene.jsx';

vi.mock('remotion', () => ({ interpolate: () => 0.5 }));

describe('DigitalTwinsScene', () => {
  it('returns null when frame < 240', () => {
    const { container } = render(<svg><DigitalTwinsScene frame={239} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 359', () => {
    const { container } = render(<svg><DigitalTwinsScene frame={360} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 300', () => {
    const { container } = render(<svg><DigitalTwinsScene frame={300} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que los tests fallan**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "DigitalTwinsScene"
```

Expected: 3 tests FAIL.

- [ ] **Step 3: Implementar `src/remotion/scenes/DigitalTwinsScene.jsx`**

```jsx
import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 240;
const END = 359;

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const PHYS = [
  { x: 200, label: 'CAPTACIÓN'   },
  { x: 420, label: 'TRATAMIENTO' },
  { x: 640, label: 'RESERVA'     },
];
const DIGI = [
  { x: 800,  label: 'CAPTACIÓN'   },
  { x: 1020, label: 'TRATAMIENTO' },
  { x: 1240, label: 'RESERVA'     },
];
const N_PARTICLES = 8;

export function DigitalTwinsScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const physOpacity     = interp(lf, 0,  25, 0, 1);
  const digiOpacity     = interp(lf, 28, 55, 0, 1);
  const particlesOpacity = interp(lf, 55, 70, 0, 1);

  return (
    <g opacity={sceneOpacity} fontFamily={C.fMono} textAnchor="middle">
      <line x1="720" y1="200" x2="720" y2="700"
        stroke={C.lineHi} strokeWidth="1" strokeDasharray="6 4" />
      <text x="360"  y="360" fontSize="10" fill={C.accent}>SISTEMA FÍSICO</text>
      <text x="1020" y="360" fontSize="10" fill={C.accent}>GEMELO DIGITAL</text>

      <g opacity={physOpacity}>
        {PHYS.map((b, i) => (
          <g key={b.label + 'p'}>
            <rect x={b.x - 65} y="390" width="130" height="50"
              fill={C.bg2} stroke={C.lineHi} strokeWidth="1" />
            <text x={b.x} y="420" fontSize="9" fill={C.ink1}>{b.label}</text>
            {i < PHYS.length - 1 && (
              <line x1={b.x + 65} y1="415" x2={PHYS[i + 1].x - 65} y2="415"
                stroke={C.accentLine} strokeWidth="1.5" />
            )}
          </g>
        ))}
      </g>

      <g opacity={digiOpacity}>
        {DIGI.map((b, i) => (
          <g key={b.label + 'd'}>
            <rect x={b.x - 65} y="390" width="130" height="50"
              fill={C.bg1} stroke={C.accent} strokeWidth="1" strokeDasharray="3 2" />
            <text x={b.x} y="420" fontSize="9" fill={C.accent}>{b.label}</text>
            {i < DIGI.length - 1 && (
              <line x1={b.x + 65} y1="415" x2={DIGI[i + 1].x - 65} y2="415"
                stroke={C.accentLine} strokeWidth="1.5" />
            )}
          </g>
        ))}
      </g>

      <g opacity={particlesOpacity}>
        {Array.from({ length: N_PARTICLES }, (_, i) => {
          const localProgress = Math.max(0, lf - 55);
          const progress = ((localProgress + i * 10) % 60) / 60;
          return (
            <circle key={i}
              cx={660 + progress * 80}
              cy={390 + (i % 4) * 20}
              r="3" fill={C.accent} opacity="0.7"
            />
          );
        })}
      </g>
    </g>
  );
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npm test
```

Expected: todos en verde.

- [ ] **Step 5: Commit**

```bash
git add src/remotion/scenes/DigitalTwinsScene.jsx tests/unit/remotion/scenes/DigitalTwinsScene.test.jsx
git commit -m "feat: add DigitalTwinsScene — twin schema animation (frames 240-359)"
```

---

### Task 6: ContactScene (TDD)

**Files:**
- Create: `tests/unit/remotion/scenes/ContactScene.test.jsx`
- Create: `src/remotion/scenes/ContactScene.jsx`

- [ ] **Step 1: Escribir el test**

Crear `tests/unit/remotion/scenes/ContactScene.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ContactScene } from '../../../../src/remotion/scenes/ContactScene.jsx';

vi.mock('remotion', () => ({ interpolate: () => 0.5 }));

describe('ContactScene', () => {
  it('returns null when frame < 360', () => {
    const { container } = render(<svg><ContactScene frame={359} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 479', () => {
    const { container } = render(<svg><ContactScene frame={480} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 420', () => {
    const { container } = render(<svg><ContactScene frame={420} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que los tests fallan**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "ContactScene"
```

Expected: 3 tests FAIL.

- [ ] **Step 3: Implementar `src/remotion/scenes/ContactScene.jsx`**

```jsx
import React from 'react';
import { interpolate } from 'remotion';
import { C } from '../colors.js';

const START = 360;
const END = 479;
const CX = 720;
const CY = 430;
const GPS = 'LAT: 4.6097° N  ·  LON: 74.0817° W';
const RADII = [70, 145, 220, 295, 370];

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function ContactScene({ frame }) {
  if (frame < START || frame > END) return null;

  const lf = frame - START;
  const sceneOpacity = interpolate(
    frame, [START, START + 8, END - 8, END], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const gpsWidth   = interp(lf, 40, 78, 0, 380);
  const pulseBase  = lf > 80 ? 0.4 + 0.3 * Math.sin((lf - 80) * 0.3) : 0;

  return (
    <g opacity={sceneOpacity}>
      {RADII.map((maxR, i) => {
        const r = interp(lf, i * 8, i * 8 + 38, 0, maxR);
        const ringOp = i >= 3 ? pulseBase : interp(lf, i * 8, i * 8 + 38, 0.7, 0.3);
        return (
          <circle key={i} cx={CX} cy={CY} r={r}
            fill="none" stroke={C.accentLine}
            strokeWidth={i === 0 ? 1.5 : 1}
            opacity={ringOp}
          />
        );
      })}
      <circle cx={CX} cy={CY} r="5" fill={C.accent} />
      <clipPath id="gps-reveal">
        <rect x={CX - gpsWidth / 2} y={CY + 58} width={gpsWidth} height={28} />
      </clipPath>
      <text x={CX} y={CY + 78}
        fontFamily={C.fMono} fontSize="12" fill={C.ink1} textAnchor="middle"
        clipPath="url(#gps-reveal)"
      >
        {GPS}
      </text>
    </g>
  );
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npm test
```

Expected: todos en verde.

- [ ] **Step 5: Commit**

```bash
git add src/remotion/scenes/ContactScene.jsx tests/unit/remotion/scenes/ContactScene.test.jsx
git commit -m "feat: add ContactScene — ripple waves + GPS animation (frames 360-479)"
```

---

### Task 7: ScrollBG full implementation (TDD)

**Files:**
- Modify: `src/remotion/ScrollBG.jsx` (reemplaza el stub)
- Create: `tests/unit/remotion/ScrollBG.test.jsx`

- [ ] **Step 1: Escribir el test**

Crear `tests/unit/remotion/ScrollBG.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ScrollBG } from '../../../src/remotion/ScrollBG.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 60,
}));

vi.mock('../../../src/remotion/scenes/AboutScene.jsx', () => ({
  AboutScene: () => React.createElement('g', { 'data-testid': 'about-scene' }),
}));
vi.mock('../../../src/remotion/scenes/ProjectsScene.jsx', () => ({
  ProjectsScene: () => React.createElement('g', { 'data-testid': 'projects-scene' }),
}));
vi.mock('../../../src/remotion/scenes/DigitalTwinsScene.jsx', () => ({
  DigitalTwinsScene: () => React.createElement('g', { 'data-testid': 'twins-scene' }),
}));
vi.mock('../../../src/remotion/scenes/ContactScene.jsx', () => ({
  ContactScene: () => React.createElement('g', { 'data-testid': 'contact-scene' }),
}));

describe('ScrollBG', () => {
  it('renders an SVG with viewBox "0 0 1440 900"', () => {
    const { container } = render(<ScrollBG />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 1440 900');
  });

  it('renders all four scene slots', () => {
    const { getByTestId } = render(<ScrollBG />);
    expect(getByTestId('about-scene')).not.toBeNull();
    expect(getByTestId('projects-scene')).not.toBeNull();
    expect(getByTestId('twins-scene')).not.toBeNull();
    expect(getByTestId('contact-scene')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que los tests fallan**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "ScrollBG"
```

Expected: 2 tests FAIL (el stub no tiene el viewBox correcto ni las escenas).

- [ ] **Step 3: Reemplazar el stub con la implementación completa de `src/remotion/ScrollBG.jsx`**

```jsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AboutScene } from './scenes/AboutScene.jsx';
import { ProjectsScene } from './scenes/ProjectsScene.jsx';
import { DigitalTwinsScene } from './scenes/DigitalTwinsScene.jsx';
import { ContactScene } from './scenes/ContactScene.jsx';

export function ScrollBG() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <AboutScene frame={frame} />
        <ProjectsScene frame={frame} />
        <DigitalTwinsScene frame={frame} />
        <ContactScene frame={frame} />
      </svg>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 4: Verificar que todos los tests pasan**

```bash
npm test
```

Expected: todos en verde (≥ 30 tests).

- [ ] **Step 5: Commit**

```bash
git add src/remotion/ScrollBG.jsx tests/unit/remotion/ScrollBG.test.jsx
git commit -m "feat: implement ScrollBG — assembles 4 hydraulic scenes"
```

---

### Task 8: Wire ScrollBackground into App.jsx

**Files:**
- Modify: `src/components/App.jsx`

- [ ] **Step 1: Agregar el import**

En `src/components/App.jsx`, línea 1-11 (imports), añadir al final de los imports:

```jsx
import { ScrollBackground } from './ScrollBackground.jsx';
```

- [ ] **Step 2: Agregar `<ScrollBackground />` en el return**

En `src/components/App.jsx`, dentro de `App()`, en el `return (...)`, añadir `<ScrollBackground />` justo antes de `<Nav active={active} />`:

```jsx
return (
  <>
    <a href="#main" className="skip-link">Saltar al contenido</a>
    {tweaks.grid && <div className="grid-bg" aria-hidden="true"/>}
    <ScrollBackground />
    <Nav active={active} />
    <ScrollRail active={active} />
    <main id="main" ...>
```

- [ ] **Step 3: Verificar que todos los tests siguen pasando**

```bash
npm test
```

Expected: todos en verde.

- [ ] **Step 4: Levantar el servidor y verificar visualmente**

```bash
npm run dev
```

Abrir `http://localhost:5173`. Al hacer scroll:
- La sección About debe mostrar un fondo con nodos y tuberías
- La sección Projects debe mostrar una gráfica de caudal dibujándose
- La sección DigitalTwins debe mostrar dos esquemas simétricos
- La sección Contact debe mostrar ondas concéntricas y texto GPS
- En todos los casos el contenido HTML (texto, cards) debe flotar encima legible

- [ ] **Step 5: Commit**

```bash
git add src/components/App.jsx
git commit -m "feat: wire ScrollBackground into App — scroll-driven Remotion bg live"
```
