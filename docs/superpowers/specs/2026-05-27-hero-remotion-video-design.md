# Hero Remotion Video — Design Spec

**Goal:** Añadir una secuencia de intro animada al Hero del portafolio: Remotion renderiza el proceso PTAP arrancando paso a paso (~5s), el vídeo pre-renderizado se reproduce al cargar la página y hace crossfade al esquema SVG live existente.

**Architecture:** El vídeo se genera offline con `npx remotion render` y se sirve como `public/assets/ptap-intro.mp4`. El browser reproduce un `<video>` estándar sin bundle Remotion en producción. Al terminar el vídeo (`onEnded`), Hero.jsx hace crossfade de 400ms al `<HydraulicSchematic />` live actual.

**Tech Stack:** Remotion 4.x, `@remotion/bundler`, `@remotion/renderer`, React 18, Vite. Sin TypeScript — todos los archivos usan `.jsx` para consistencia con el proyecto.

---

## Paleta de colores (hardcoded en Remotion)

Remotion no puede consumir CSS custom properties, los colores se hardcodean:

| Token          | Valor                       |
|----------------|-----------------------------|
| `bg`           | `#06090c`                   |
| `bg-1`         | `#0a0f14`                   |
| `bg-2`         | `#0e141b`                   |
| `line-hi`      | `#3a4a5e`                   |
| `accent`       | `#4ee8d1`                   |
| `accent-soft`  | `rgba(78, 232, 209, 0.12)`  |
| `accent-line`  | `rgba(78, 232, 209, 0.35)`  |
| `ink`          | `#e6edf3`                   |
| `ink-1`        | `#aab4c0`                   |
| `ink-3`        | `#475261`                   |

---

## Composición Remotion

- **Dimensiones:** 800 × 440 px (igual que el SVG viewBox actual)
- **FPS:** 30
- **Duración:** 180 frames (6 segundos)
- **ID:** `PTAPIntro`
- **Easing global:** `Easing.bezier(0.16, 1, 0.3, 1)` en todas las transiciones

### Timeline de animación

| Frames    | Evento                                                                 |
|-----------|------------------------------------------------------------------------|
| 0 – 15    | Grid de fondo: fade-in opacity 0 → 1                                  |
| 15 – 35   | T-101 Captación: tanque se dibuja + nivel de agua sube (height 0→42)  |
| 35 – 50   | P-201 Bomba: aparece + rotación arranca (0° → 720°)                   |
| 50 – 65   | M-301 Coag/Floc: trapecio se dibuja + fill accent-soft aparece        |
| 65 – 85   | Sedimentación: rectángulo + 6 láminas inclinadas (stagger 3fr cada una)|
| 85 – 100  | F-501 Filtración: 3 capas de filtro aparecen de arriba a abajo        |
| 100 – 115 | Desinfección Cl₂: círculo se expande desde r=0 hasta r=28             |
| 115 – 130 | R-601 Reserva: tanque + fill aparece                                  |
| 130 – 150 | Tuberías: stroke-dashoffset 600→0 izq→der, partículas (10 círculos)   |
| 150 – 165 | Sensor readouts: FIT-01, PIT-02, TIT-03, AIT-04 con stagger de 4fr   |
| 165 – 175 | Badge "● LIVE": parpadeo opacity 1→0.3→1                              |
| 175 – 180 | Fade-out global: opacity 1 → 0 (Hero.jsx hace crossfade al SVG live)  |

---

## Estructura de archivos

| Archivo                                  | Acción   | Responsabilidad                                     |
|------------------------------------------|----------|-----------------------------------------------------|
| `src/remotion/Root.jsx`                  | Crear    | Registra la composición PTAPIntro                   |
| `src/remotion/HeroPTAP.jsx`              | Crear    | Composición principal — orquesta todos los módulos  |
| `src/remotion/components/PTAPModule.jsx` | Crear    | Componente reutilizable: cada módulo PTAP (SVG)     |
| `src/remotion/components/SensorBox.jsx`  | Crear    | Readout de sensor (rectángulo + label + valor)      |
| `src/remotion/components/FlowPipes.jsx`  | Crear    | Tuberías + partículas animadas                      |
| `src/remotion/render.mjs`                | Crear    | Script CLI para renderizar a .mp4                   |
| `public/assets/ptap-intro.mp4`           | Generar  | Output del render (no se versiona en git)           |
| `src/components/Hero.jsx`                | Modificar| Añade estado `phase` + crossfade video→SVG          |

---

## Lógica Hero.jsx

### Estado
```jsx
const [phase, setPhase] = useState('video'); // 'video' | 'live'
```

### Detección de reduced motion
```jsx
useEffect(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) setPhase('live');
}, []);
```

### Render condicional (solo en HeroSchematic)
```jsx
<div style={{ position: 'relative', minHeight: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
  {phase === 'video' && (
    <video
      autoPlay
      muted
      playsInline
      src="/assets/ptap-intro.mp4"
      style={{
        width: '100%',
        aspectRatio: '800/440',
        display: 'block',
        border: '1px solid var(--line-hi)',
      }}
      onEnded={() => setPhase('live')}
    />
  )}
  {phase === 'live' && (
    <>
      {/* header label + StatusDot — igual que ahora */}
      <div style={{ border: '1px solid var(--line-hi)', ... }}>
        <HydraulicSchematic />
      </div>
      {/* foto campo + labels — igual que ahora */}
    </>
  )}
</div>
```

La transición es instantánea en el DOM (el vídeo termina en fade-out negro, el SVG arranca desde el estado live normal). Si se quiere un crossfade suave, ambos elementos pueden coexistir brevemente con `opacity` mientras se anima, pero esto se considera una mejora opcional.

---

## Script de render

`src/remotion/render.mjs`:
```js
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundled = await bundle({
  entryPoint: path.join(__dirname, 'Root.jsx'),
  webpackOverride: (config) => config,
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: 'PTAPIntro',
});

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: path.join(__dirname, '../../public/assets/ptap-intro.mp4'),
});

console.log('Render complete: public/assets/ptap-intro.mp4');
```

Ejecutar con:
```bash
node src/remotion/render.mjs
```

---

## Accesibilidad

- `<video>` tiene `aria-label="Secuencia de arranque del sistema PTAP"` y `aria-hidden="false"`
- Con `prefers-reduced-motion: reduce`: se salta el vídeo y se muestra directamente el SVG live
- El SVG live ya tiene `role="img"` y `aria-label` definidos — no cambia

---

## Out of scope (sub-proyectos 2 y 3)

- Scroll-driven Remotion (sub-proyecto 2)
- Vídeos por tarjeta de proyecto (sub-proyecto 3)
- Audio en el vídeo
- Variantes `typographic` y `terminal` del Hero (solo se modifica `HeroSchematic`)
