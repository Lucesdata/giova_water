# Hero Remotion Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una intro animada al Hero: Remotion renderiza el proceso PTAP arrancando paso a paso (800×440px, 30fps, 6s), el .mp4 pre-generado se reproduce al cargar y hace crossfade al esquema SVG live existente.

**Architecture:** Remotion compila y renderiza `src/remotion/HeroPTAP.jsx` offline con `node src/remotion/render.mjs`, produciendo `public/assets/ptap-intro.mp4`. En producción no hay bundle de Remotion — el browser reproduce un `<video>` estándar. Hero.jsx gestiona `phase: 'video' | 'live'`; `onEnded` dispara el paso al SVG live. `prefers-reduced-motion: reduce` salta el vídeo directamente.

**Tech Stack:** Remotion 4.x, `@remotion/bundler`, `@remotion/renderer`, React 18, Vitest, @testing-library/react.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/remotion/colors.js` | Crear | Constantes de color hardcodeadas (Remotion no usa CSS vars) |
| `src/remotion/components/PTAPModule.jsx` | Crear | Wrapper SVG `<g>` con fade-in interpolado por frame |
| `src/remotion/components/SensorBox.jsx` | Crear | Readout de sensor (línea guía + rectángulo + texto) |
| `src/remotion/components/FlowPipes.jsx` | Crear | Tuberías + partículas animadas |
| `src/remotion/HeroPTAP.jsx` | Crear | Composición principal — orquesta todos los módulos |
| `src/remotion/Root.jsx` | Crear | Registra la composición PTAPIntro (800×440, 30fps, 180fr) |
| `src/remotion/render.mjs` | Crear | Script CLI para renderizar a .mp4 |
| `public/assets/ptap-intro.mp4` | Generar | Output del render — NO versionar en git |
| `src/components/Hero.jsx` | Modificar | Añade `phase` state + `<video>` + crossfade a `HydraulicSchematic` |
| `tests/unit/remotion/PTAPModule.test.jsx` | Crear | Verifica que PTAPModule pasa children + aplica opacity |
| `tests/unit/remotion/SensorBox.test.jsx` | Crear | Verifica que SensorBox renderiza id y value |
| `tests/unit/HeroIntroVideo.test.jsx` | Crear | Verifica las 3 condiciones de phase en Hero |

---

## Task 1: Instalar dependencias de Remotion

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar paquetes**

```bash
npm install remotion @remotion/bundler @remotion/renderer
```

Expected: instalación completa sin errores. Remotion instala su propio Chromium (~150MB) para rendering.

- [ ] **Step 2: Verificar instalación**

```bash
node -e "import('@remotion/renderer').then(m => console.log('OK', Object.keys(m).slice(0,3)))"
```

Expected output: `OK [ 'renderFrames', 'renderMedia', ... ]`

- [ ] **Step 3: Añadir script de render a package.json**

Abrir `package.json`. Añadir `"render:hero"` a `"scripts"`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:update": "playwright test --update-snapshots",
    "render:hero": "node src/remotion/render.mjs"
  }
}
```

- [ ] **Step 4: Añadir .mp4 a .gitignore**

Abrir `.gitignore`. Añadir al final:

```
# Remotion rendered outputs
public/assets/ptap-intro.mp4
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: install remotion deps + render:hero script"
```

---

## Task 2: Constantes de color

**Files:**
- Create: `src/remotion/colors.js`

Remotion corre en webpack (no Vite) y no puede acceder a CSS custom properties. Los valores vienen de `src/styles/tokens.css`.

- [ ] **Step 1: Crear `src/remotion/colors.js`**

```js
export const C = {
  bg:         '#06090c',
  bg1:        '#0a0f14',
  bg2:        '#0e141b',
  lineHi:     '#3a4a5e',
  accent:     '#4ee8d1',
  accentSoft: 'rgba(78, 232, 209, 0.12)',
  accentLine: 'rgba(78, 232, 209, 0.35)',
  ink:        '#e6edf3',
  ink1:       '#aab4c0',
  ink3:       '#475261',
  fMono:      '"JetBrains Mono", ui-monospace, monospace',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/remotion/colors.js
git commit -m "feat: add Remotion color constants"
```

---

## Task 3: PTAPModule — componente wrapper con fade-in (TDD)

**Files:**
- Create: `src/remotion/components/PTAPModule.jsx`
- Test: `tests/unit/remotion/PTAPModule.test.jsx`

`PTAPModule` envuelve cualquier grupo SVG con una animación de aparición interpolada por frame. `startFrame` es el frame en que empieza a aparecer, `durationFrames` es cuántos frames tarda en llegar a opacity 1.

- [ ] **Step 1: Escribir el test fallido**

Crear `tests/unit/remotion/PTAPModule.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PTAPModule } from '../../../src/remotion/components/PTAPModule.jsx';

vi.mock('remotion', () => ({
  useCurrentFrame: () => 90,
  interpolate: (_frame, _input, output) => output[1],
  Easing: { bezier: () => (t) => t },
}));

describe('PTAPModule', () => {
  it('renders children inside a <g> element', () => {
    const { container } = render(
      <svg>
        <PTAPModule startFrame={15} durationFrames={15}>
          <rect data-testid="child" x="0" y="0" width="10" height="10" />
        </PTAPModule>
      </svg>
    );
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it('applies opacity style to the wrapper <g>', () => {
    const { container } = render(
      <svg>
        <PTAPModule startFrame={15} durationFrames={15}>
          <circle cx="5" cy="5" r="5" />
        </PTAPModule>
      </svg>
    );
    const g = container.querySelector('g');
    expect(g.getAttribute('style')).toContain('opacity');
  });
});
```

- [ ] **Step 2: Ejecutar — verificar que falla**

```bash
npm test -- --reporter=verbose tests/unit/remotion/PTAPModule.test.jsx
```

Expected: FAIL — `Cannot find module '../../../src/remotion/components/PTAPModule.jsx'`

- [ ] **Step 3: Implementar PTAPModule**

Crear `src/remotion/components/PTAPModule.jsx`:

```jsx
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export function PTAPModule({ startFrame, durationFrames = 15, children }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return <g style={{ opacity }}>{children}</g>;
}
```

- [ ] **Step 4: Ejecutar — verificar que pasa**

```bash
npm test -- --reporter=verbose tests/unit/remotion/PTAPModule.test.jsx
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/remotion/components/PTAPModule.jsx tests/unit/remotion/PTAPModule.test.jsx
git commit -m "feat: add PTAPModule Remotion component"
```

---

## Task 4: SensorBox — readout de sensor (TDD)

**Files:**
- Create: `src/remotion/components/SensorBox.jsx`
- Test: `tests/unit/remotion/SensorBox.test.jsx`

`SensorBox` renderiza: una línea guía vertical punteada, un rectángulo con el id del sensor y el valor. Se usa 4 veces en la composición (FIT-01, PIT-02, TIT-03, AIT-04).

- [ ] **Step 1: Escribir el test fallido**

Crear `tests/unit/remotion/SensorBox.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SensorBox } from '../../../src/remotion/components/SensorBox.jsx';

vi.mock('remotion', () => ({
  useCurrentFrame: () => 160,
  interpolate: (_frame, _input, output) => output[1],
  Easing: { bezier: () => (t) => t },
}));

describe('SensorBox', () => {
  it('renders sensor id and value as text', () => {
    const { container } = render(
      <svg>
        <SensorBox
          startFrame={150}
          lineX={210} lineY1={248} lineY2={330}
          x={168} y={332}
          id="FIT-01" label="Caudal"
          value="42.3" unit="L/s"
        />
      </svg>
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts.some(t => t.includes('FIT-01'))).toBe(true);
    expect(texts.some(t => t.includes('42.3'))).toBe(true);
  });

  it('renders a guide line and a rect', () => {
    const { container } = render(
      <svg>
        <SensorBox
          startFrame={150}
          lineX={210} lineY1={248} lineY2={330}
          x={168} y={332}
          id="FIT-01" label="Caudal"
          value="42.3" unit="L/s"
        />
      </svg>
    );
    expect(container.querySelector('line')).not.toBeNull();
    expect(container.querySelector('rect')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar — verificar que falla**

```bash
npm test -- --reporter=verbose tests/unit/remotion/SensorBox.test.jsx
```

Expected: FAIL — `Cannot find module '../../../src/remotion/components/SensorBox.jsx'`

- [ ] **Step 3: Implementar SensorBox**

Crear `src/remotion/components/SensorBox.jsx`:

```jsx
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { C } from '../colors.js';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export function SensorBox({ startFrame, lineX, lineY1, lineY2, x, y, id, label, value, unit }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return (
    <g opacity={opacity}>
      <line x1={lineX} y1={lineY1} x2={lineX} y2={lineY2} stroke={C.accentLine} strokeDasharray="2 2" />
      <rect x={x} y={y} width="84" height="38" fill={C.bg1} stroke={C.accentLine} />
      <text x={x + 6} y={y + 12} fontFamily={C.fMono} fontSize="8" fill={C.accent}>{id} · {label}</text>
      <text x={x + 6} y={y + 30} fontFamily={C.fMono} fontSize="13" fill={C.ink}>
        {value} <tspan fill={C.ink3} fontSize="8">{unit}</tspan>
      </text>
    </g>
  );
}
```

- [ ] **Step 4: Ejecutar — verificar que pasa**

```bash
npm test -- --reporter=verbose tests/unit/remotion/SensorBox.test.jsx
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/remotion/components/SensorBox.jsx tests/unit/remotion/SensorBox.test.jsx
git commit -m "feat: add SensorBox Remotion component"
```

---

## Task 5: FlowPipes — tuberías y partículas

**Files:**
- Create: `src/remotion/components/FlowPipes.jsx`

Renderiza las 6 conexiones entre módulos PTAP (mismas coordenadas que el SVG original) y 10 partículas que fluyen de izquierda a derecha. Sin unit test — componente puramente visual, verificado en Task 6 con Remotion still.

- [ ] **Step 1: Crear `src/remotion/components/FlowPipes.jsx`**

```jsx
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { C } from '../colors.js';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const PIPES = [
  { x1: 140, y1: 240, x2: 180, y2: 248 },
  { x1: 212, y1: 248, x2: 260, y2: 240 },
  { x1: 320, y1: 240, x2: 370, y2: 240 },
  { x1: 490, y1: 240, x2: 520, y2: 240 },
  { x1: 590, y1: 240, x2: 630, y2: 240 },
  { x1: 660, y1: 240, x2: 720, y2: 240 },
];

export function FlowPipes({ startFrame }) {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;

  const progress = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  const flow = ((frame - startFrame) * 0.6) % 40;

  return (
    <g>
      <g fill="none" stroke={C.accent} strokeWidth="1.3" opacity={progress * 0.7}>
        {PIPES.map((p, i) => (
          <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
        ))}
      </g>
      <g fill={C.accent} opacity={progress}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
          const x = 140 + ((flow + i * 60) % 600);
          return <circle key={i} cx={x} cy="240" r="1.6" opacity="0.9" />;
        })}
      </g>
    </g>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/remotion/components/FlowPipes.jsx
git commit -m "feat: add FlowPipes Remotion component"
```

---

## Task 6: HeroPTAP + Root.jsx — composición completa

**Files:**
- Create: `src/remotion/HeroPTAP.jsx`
- Create: `src/remotion/Root.jsx`
- Test: `tests/unit/remotion/HeroPTAP.test.jsx`

Timeline completo: 180 frames / 30fps / 6s. Cada módulo aparece en orden (captación → bomba → coag → sed → filtración → desin → reserva → tuberías → sensores → LIVE badge → fade-out).

- [ ] **Step 1: Escribir el test fallido**

Crear `tests/unit/remotion/HeroPTAP.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HeroPTAP } from '../../../src/remotion/HeroPTAP.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 90,
  interpolate: (_frame, _input, output) => output[1],
  Easing: { bezier: () => (t) => t },
}));

vi.mock('../../../src/remotion/components/PTAPModule.jsx', () => ({
  PTAPModule: ({ children }) => React.createElement('g', null, children),
}));

vi.mock('../../../src/remotion/components/SensorBox.jsx', () => ({
  SensorBox: () => React.createElement('g', null),
}));

vi.mock('../../../src/remotion/components/FlowPipes.jsx', () => ({
  FlowPipes: () => React.createElement('g', null),
}));

describe('HeroPTAP', () => {
  it('renders without throwing', () => {
    expect(() => render(<HeroPTAP />)).not.toThrow();
  });

  it('renders an SVG with viewBox 0 0 800 440', () => {
    const { container } = render(<HeroPTAP />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 800 440');
  });
});
```

- [ ] **Step 2: Ejecutar — verificar que falla**

```bash
npm test -- --reporter=verbose tests/unit/remotion/HeroPTAP.test.jsx
```

Expected: FAIL — `Cannot find module '../../../src/remotion/HeroPTAP.jsx'`

- [ ] **Step 3: Crear `src/remotion/HeroPTAP.jsx`**

```jsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { C } from './colors.js';
import { PTAPModule } from './components/PTAPModule.jsx';
import { SensorBox } from './components/SensorBox.jsx';
import { FlowPipes } from './components/FlowPipes.jsx';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

function interp(frame, f0, f1, v0, v1) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
}

export function HeroPTAP() {
  const frame = useCurrentFrame();

  const globalOpacity = interp(frame, 175, 180, 1, 0);
  const gridOpacity   = interp(frame, 0, 15, 0, 1);

  const waterHeight = interp(frame, 25, 35, 0, 42);
  const waterY      = 80 - waterHeight;

  const pumpDeg = frame > 35 ? (frame - 35) * 9 : 0;

  const desR      = interp(frame, 100, 115, 0, 28);
  const desInnerR = interp(frame, 105, 115, 0, 20);

  const fil1 = interp(frame, 85,  97,  0, 1);
  const fil2 = interp(frame, 89,  101, 0, 1);
  const fil3 = interp(frame, 93,  105, 0, 1);

  const liveOpacity = frame >= 165
    ? (Math.floor((frame - 165) / 8) % 2 === 0 ? 1 : 0.3)
    : 0;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg viewBox="0 0 800 440" width="100%" height="100%" style={{ display: 'block' }}>
        <g opacity={globalOpacity}>

          {/* ── Border + coordinate grid ── */}
          <g opacity={gridOpacity}>
            <rect x="0.5" y="0.5" width="799" height="439" fill="none" stroke={C.lineHi} />
            {[[0,0],[800,0],[0,440],[800,440]].map(([x,y],i) => (
              <g key={i} stroke={C.lineHi} strokeWidth="1">
                <line x1={x-6} y1={y} x2={x+6} y2={y} />
                <line x1={x} y1={y-6} x2={x} y2={y+6} />
              </g>
            ))}
            <g fontFamily={C.fMono} fontSize="8" fill={C.ink3}>
              {[0,1,2,3,4,5,6,7,8].map(i => (
                <text key={'gx'+i} x={i*100+4} y="12">{String(i*100).padStart(3,'0')}</text>
              ))}
              {[0,1,2,3,4].map(i => (
                <text key={'gy'+i} x="4" y={i*100+20} transform={`rotate(-90 4 ${i*100+20})`}>{String(i*100).padStart(3,'0')}</text>
              ))}
            </g>
          </g>

          {/* ── T-101 Captación — frames 15-30 + water rise 25-35 ── */}
          <PTAPModule startFrame={15} durationFrames={15}>
            <g transform="translate(80, 200)">
              <rect x="0" y="0" width="60" height="80" fill="none" stroke={C.lineHi} strokeWidth="1" />
              <rect x="2" y={waterY} width="56" height={waterHeight} fill={C.accentSoft} />
              <text x="30" y="-8" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Captación</text>
              <text x="30" y="95" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">T-101</text>
            </g>
          </PTAPModule>

          {/* ── P-201 Bomba — frames 35-50 ── */}
          <PTAPModule startFrame={35} durationFrames={15}>
            <g transform="translate(180, 232)">
              <circle cx="16" cy="16" r="15" fill={C.bg2} stroke={C.lineHi} />
              <g transform={`rotate(${pumpDeg} 16 16)`}>
                <line x1="16" y1="4" x2="16" y2="28" stroke={C.accent} strokeWidth="1.5" />
                <line x1="4" y1="16" x2="28" y2="16" stroke={C.accent} strokeWidth="1.5" />
              </g>
              <text x="16" y="-6" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">P-201</text>
            </g>
          </PTAPModule>

          {/* ── M-301 Coag/Floc — frames 50-65 ── */}
          <PTAPModule startFrame={50} durationFrames={15}>
            <g transform="translate(260, 200)">
              <path d="M0,0 L70,0 L60,80 L10,80 Z" fill={C.bg2} stroke={C.lineHi} />
              <path d="M0,0 L70,0 L62,40 L8,40 Z" fill={C.accentSoft} stroke="none" />
              <text x="35" y="-8" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Coag/Floc</text>
              <text x="35" y="95" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">M-301</text>
            </g>
          </PTAPModule>

          {/* ── Sedimentación — frames 65-80 ── */}
          <PTAPModule startFrame={65} durationFrames={15}>
            <g transform="translate(370, 180)">
              <rect x="0" y="0" width="120" height="120" fill={C.bg2} stroke={C.lineHi} />
              <rect x="3" y="40" width="114" height="77" fill={C.accentSoft} />
              {[0,1,2,3,4,5].map(i => (
                <line key={i} x1={10+i*18} y1="50" x2={20+i*18} y2="110" stroke={C.accentLine} strokeWidth="0.7" />
              ))}
              <text x="60" y="-8"  fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Sedimentación</text>
              <text x="60" y="135" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">Lamelar</text>
            </g>
          </PTAPModule>

          {/* ── F-501 Filtración — frames 85-105, capas escalonadas ── */}
          <g transform="translate(520, 200)">
            <PTAPModule startFrame={85} durationFrames={15}>
              <rect x="0" y="0" width="70" height="80" fill={C.bg2} stroke={C.lineHi} />
              <text x="35" y="-8" fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Filtración</text>
              <text x="35" y="95" fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">F-501</text>
            </PTAPModule>
            <g opacity={fil1}><rect x="3" y="6"  width="64" height="14" fill={C.lineHi} opacity="0.6" /></g>
            <g opacity={fil2}><rect x="3" y="22" width="64" height="24" fill={C.lineHi} opacity="0.4" /></g>
            <g opacity={fil3}><rect x="3" y="48" width="64" height="28" fill={C.lineHi} opacity="0.25" /></g>
          </g>

          {/* ── Desinfección — frames 100-115, círculo se expande ── */}
          <PTAPModule startFrame={100} durationFrames={15}>
            <g transform="translate(630, 200)">
              <circle cx="30" cy="40" r={desR}      fill={C.bg2}   stroke={C.lineHi} />
              <circle cx="30" cy="40" r={desInnerR} fill="none"    stroke={C.accentLine} strokeDasharray="2 3" />
              <text x="30" y="44"  fontFamily={C.fMono} fontSize="10" fill={C.accent} textAnchor="middle">Cl₂</text>
              <text x="30" y="-8"  fontFamily={C.fMono} fontSize="9"  fill={C.ink1}  textAnchor="middle">Desinfección</text>
            </g>
          </PTAPModule>

          {/* ── R-601 Reserva — frames 115-130 ── */}
          <PTAPModule startFrame={115} durationFrames={15}>
            <g transform="translate(720, 210)">
              <rect x="0" y="0" width="40" height="60" fill="none" stroke={C.lineHi} />
              <rect x="2" y="18" width="36" height="40" fill={C.accentSoft} />
              <text x="20" y="-8"  fontFamily={C.fMono} fontSize="9" fill={C.ink1} textAnchor="middle">Reserva</text>
              <text x="20" y="75"  fontFamily={C.fMono} fontSize="8" fill={C.ink3} textAnchor="middle">R-601</text>
            </g>
          </PTAPModule>

          {/* ── Tuberías + partículas — frames 130-150 ── */}
          <FlowPipes startFrame={130} />

          {/* ── Sensor readouts — frames 150-174, stagger 4fr ── */}
          <SensorBox startFrame={150} lineX={210} lineY1={248} lineY2={330}
            x={168} y={332} id="FIT-01" label="Caudal"   value="42.3" unit="L/s" />
          <SensorBox startFrame={154} lineX={435} lineY1={180} lineY2={110}
            x={393} y={72}  id="PIT-02" label="Presión"  value="3.24" unit="bar" />
          <SensorBox startFrame={158} lineX={555} lineY1={280} lineY2={350}
            x={513} y={352} id="TIT-03" label="Turbidez" value="0.80" unit="NTU" />
          <SensorBox startFrame={162} lineX={660} lineY1={220} lineY2={110}
            x={618} y={72}  id="AIT-04" label="pH"       value="7.21" unit="—" />

          {/* ── LIVE badge — frames 165-180 ── */}
          <g transform="translate(610, 20)" opacity={liveOpacity}>
            <rect x="0" y="0" width="170" height="24" fill={C.bg1} stroke={C.lineHi} />
            <circle cx="10" cy="12" r="3" fill={C.accent} />
            <text x="20" y="16" fontFamily={C.fMono} fontSize="9" fill={C.ink1}>SISTEMA ACTIVO · EN VIVO</text>
          </g>

          {/* ── Scale bar ── */}
          <g transform="translate(20, 415)" stroke={C.ink3} fontFamily={C.fMono} fontSize="8" fill={C.ink3} opacity={gridOpacity}>
            <line x1="0" y1="0" x2="80" y2="0" />
            <line x1="0" y1="-3" x2="0" y2="3" />
            <line x1="40" y1="-2" x2="40" y2="2" />
            <line x1="80" y1="-3" x2="80" y2="3" />
            <text x="0" y="14">0m</text>
            <text x="70" y="14">20m</text>
          </g>

        </g>
      </svg>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 4: Crear `src/remotion/Root.jsx`**

```jsx
import React from 'react';
import { Composition } from 'remotion';
import { HeroPTAP } from './HeroPTAP.jsx';

export const RemotionRoot = () => {
  return (
    <Composition
      id="PTAPIntro"
      component={HeroPTAP}
      durationInFrames={180}
      fps={30}
      width={800}
      height={440}
    />
  );
};
```

- [ ] **Step 5: Ejecutar tests — verificar que pasan**

```bash
npm test -- --reporter=verbose tests/unit/remotion/HeroPTAP.test.jsx
```

Expected: PASS — 2 tests passed

- [ ] **Step 6: Vista previa en Remotion Studio**

```bash
npx remotion studio src/remotion/Root.jsx
```

Expected: abre el browser en `http://localhost:3000`. Seleccionar composición `PTAPIntro`. Arrastrar el playhead de frame 0 a 180 para verificar la secuencia completa. Verificar visualmente:
- Frame 0-15: grid aparece
- Frame 15-35: T-101 y nivel de agua suben
- Frame 35-50: bomba aparece y rota
- Frame 130-150: tuberías y partículas
- Frame 175-180: fade-out a negro

Salir con `Ctrl+C` cuando termines.

- [ ] **Step 7: Renderizar un frame para verificación rápida**

```bash
npx remotion still src/remotion/Root.jsx PTAPIntro /tmp/ptap-frame90.png --frame=90
open /tmp/ptap-frame90.png
```

Expected: imagen PNG de 800×440 con todos los módulos hasta Sedimentación visibles (frame 90 está entre el módulo de Filtración apareciendo y los sensores).

- [ ] **Step 8: Commit**

```bash
git add src/remotion/HeroPTAP.jsx src/remotion/Root.jsx tests/unit/remotion/HeroPTAP.test.jsx
git commit -m "feat: add HeroPTAP Remotion composition"
```

---

## Task 7: Script de render — generar ptap-intro.mp4

**Files:**
- Create: `src/remotion/render.mjs`
- Generate: `public/assets/ptap-intro.mp4`

El script usa `@remotion/bundler` (webpack) y `@remotion/renderer` (Chromium headless). El render tarda ~2-5 minutos en la primera ejecución (descarga Chromium si no está en caché).

- [ ] **Step 1: Crear `src/remotion/render.mjs`**

```js
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Bundling composition...');
const bundled = await bundle({
  entryPoint: path.join(__dirname, 'Root.jsx'),
  webpackOverride: (config) => config,
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: 'PTAPIntro',
});

console.log(`Rendering ${composition.durationInFrames} frames at ${composition.fps}fps...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: path.join(__dirname, '../../public/assets/ptap-intro.mp4'),
});

console.log('✓ Render complete: public/assets/ptap-intro.mp4');
```

- [ ] **Step 2: Ejecutar el render**

```bash
npm run render:hero
```

Expected output (puede tardar 2-5 minutos):
```
Bundling composition...
Rendering 180 frames at 30fps...
✓ Render complete: public/assets/ptap-intro.mp4
```

Si aparece el error `Cannot find module 'remotion'` durante el bundle: verificar que `npm install remotion` completó en Task 1.

- [ ] **Step 3: Verificar que el archivo existe y tiene tamaño razonable**

```bash
ls -lh public/assets/ptap-intro.mp4
```

Expected: archivo de 500KB–3MB. Si es 0 bytes, el render falló.

- [ ] **Step 4: Reproducir el vídeo para verificación visual**

```bash
open public/assets/ptap-intro.mp4
```

Expected: vídeo de 6 segundos con la secuencia PTAP en negro, módulos apareciendo en orden, fade-out al final.

- [ ] **Step 5: Commit del script (NO del .mp4)**

```bash
git add src/remotion/render.mjs
git status
```

Verificar que `public/assets/ptap-intro.mp4` aparece como "untracked" y NO como "staged" (el .gitignore lo excluye).

```bash
git commit -m "feat: add Remotion render script for Hero intro video"
```

---

## Task 8: Modificar Hero.jsx — reproducir vídeo con crossfade (TDD)

**Files:**
- Modify: `src/components/Hero.jsx` (líneas 180-282, función `HeroSchematic`)
- Test: `tests/unit/HeroIntroVideo.test.jsx`

Solo se modifica `HeroSchematic` — las variantes `HeroTypographic` y `HeroTerminal` no cambian.

La lógica: `phase` empieza en `'video'`. Al cargar, comprueba `prefers-reduced-motion`; si es `reduce`, salta a `'live'`. El `<video>` tiene `onEnded` que dispara `setPhase('live')`. El vídeo termina con fade-out negro (frames 175-180), así que el corte al SVG live es natural.

- [ ] **Step 1: Escribir el test fallido**

Crear `tests/unit/HeroIntroVideo.test.jsx`:

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import Hero from '../../src/components/Hero.jsx';

vi.mock('../../src/i18n.jsx', () => ({
  LangProvider: ({ children }) => children,
  useT: () => (key) => key,
  useLang: () => ['es', vi.fn()],
}));

vi.mock('../../src/components/primitives.jsx', () => ({
  useTick: () => 0,
  jitter: () => 0,
  StatusDot: ({ label }) => React.createElement('span', null, label),
  Logo: () => React.createElement('span', null, 'logo'),
  AnimatedNumber: ({ value }) => React.createElement('span', null, String(value)),
  useInView: () => [React.createRef(), true],
}));

describe('Hero schematic — intro video phase', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it('renders a <video> pointing to /assets/ptap-intro.mp4 on first load', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video.getAttribute('src')).toBe('/assets/ptap-intro.mp4');
    expect(video.hasAttribute('autoplay') || video.getAttribute('autoPlay') !== null).toBe(true);
    expect(video.hasAttribute('muted')).toBe(true);
  });

  it('switches to live SVG schematic when video fires onEnded', async () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    await act(async () => {
      video.dispatchEvent(new Event('ended'));
    });

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('skips video and shows SVG immediately when prefers-reduced-motion is reduce', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { container } = render(<Hero />);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar — verificar que falla**

```bash
npm test -- --reporter=verbose tests/unit/HeroIntroVideo.test.jsx
```

Expected: FAIL — test "renders a video" falla porque Hero no renderiza ningún `<video>`.

- [ ] **Step 3: Modificar `src/components/Hero.jsx` — función HeroSchematic**

Abrir `src/components/Hero.jsx`. Localizar la función `HeroSchematic` en la línea 180.

**Cambio 1:** Añadir `useState` y `useEffect` para el phase (ya están importados en la línea 1 del archivo).

Reemplazar la línea:
```jsx
function HeroSchematic() {
  const t = useT();
  return (
```

Con:
```jsx
function HeroSchematic() {
  const t = useT();
  const [phase, setPhase] = useState('video');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('live');
    }
  }, []);

  return (
```

**Cambio 2:** En el bloque del right column, reemplazar el div que contiene `<HydraulicSchematic />`:

```jsx
        <div style={{
          border: '1px solid var(--line-hi)',
          background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%)',
          padding: 14,
          aspectRatio: '800/440',
          width: '100%',
        }}>
          <HydraulicSchematic />
        </div>
```

Con:

```jsx
        {phase === 'video' ? (
          <video
            autoPlay
            muted
            playsInline
            src="/assets/ptap-intro.mp4"
            aria-label="Secuencia de arranque del sistema PTAP"
            style={{
              border: '1px solid var(--line-hi)',
              background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%)',
              aspectRatio: '800/440',
              width: '100%',
              display: 'block',
            }}
            onEnded={() => setPhase('live')}
          />
        ) : (
          <div style={{
            border: '1px solid var(--line-hi)',
            background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%)',
            padding: 14,
            aspectRatio: '800/440',
            width: '100%',
          }}>
            <HydraulicSchematic />
          </div>
        )}
```

- [ ] **Step 4: Ejecutar tests — verificar que pasan**

```bash
npm test -- --reporter=verbose tests/unit/HeroIntroVideo.test.jsx
```

Expected: PASS — 3 tests passed

- [ ] **Step 5: Ejecutar toda la suite para detectar regresiones**

```bash
npm test
```

Expected: todos los tests existentes pasan (i18n.test.jsx, primitives.test.jsx + los nuevos).

- [ ] **Step 6: Verificar en el navegador**

```bash
npm run dev
```

Abrir `http://localhost:5173`. Verificar:
1. La página carga y el Hero muestra el `<video>` (puede estar en negro si el .mp4 no está generado aún — si no está, genera primero con `npm run render:hero`)
2. Al terminar el vídeo (~6s), el SVG live con sensores y partículas aparece
3. Inspeccionar con DevTools: reducer motion OFF → empieza en video. ON → empieza en SVG

- [ ] **Step 7: Commit**

```bash
git add src/components/Hero.jsx tests/unit/HeroIntroVideo.test.jsx
git commit -m "feat: Hero shows Remotion intro video then transitions to live SVG"
```

---

## Self-review

**Spec coverage:**
- ✓ Composición Remotion 800×440 / 30fps / 180 frames — Task 6
- ✓ Timeline módulo a módulo — Task 6 (HeroPTAP.jsx)
- ✓ Colores hardcodeados — Task 2
- ✓ PTAPModule / SensorBox / FlowPipes — Tasks 3, 4, 5
- ✓ Render script + .mp4 — Task 7
- ✓ Hero.jsx phase state + onEnded — Task 8
- ✓ prefers-reduced-motion — Task 8
- ✓ .mp4 excluido de git — Task 1

**Sin placeholders:** verificado.

**Consistencia de nombres:**
- `PTAPModule` — usado igual en Tasks 3 y 6
- `SensorBox` — usado igual en Tasks 4 y 6
- `FlowPipes` — usado igual en Tasks 5 y 6
- `C.fMono`, `C.accent`, etc. — definidos en Task 2, usados en Tasks 3-6
- `phase` / `setPhase` — definidos y usados en Task 8
- `HeroPTAP` export named — coincide con import en Root.jsx
