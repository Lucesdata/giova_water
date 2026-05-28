# Mobile Responsive Design Spec

**Date:** 2026-05-28
**Project:** giova_water portfolio (React + Vite)

---

## Goal

Hacer el portfolio completamente usable en dispositivos móviles (375px–768px). El sitio actualmente es 100% desktop-only — cero media queries de layout existen.

---

## Decisions

| Tema | Decisión |
|---|---|
| Breakpoint | `isMobile` = `≤ 768px` (único breakpoint) |
| Enfoque | `useBreakpoint` hook + inline styles condicionales |
| Nav móvil | Hamburger + overlay full-screen |
| Card videos en touch | Autoplay cuando la tarjeta entra al viewport (IntersectionObserver) |
| ScrollBackground | Oculto en móvil (`return null`) |

---

## Architecture

### Nuevo archivo: `src/hooks/useBreakpoint.js`

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

Usa `matchMedia` con listener de cambio — no hay polling, no hay re-renders en resize. El estado inicial se evalúa lazy en el servidor/cliente.

---

## Components

### `src/components/Nav.jsx`

**Estado actual:** banner top siempre visible, 5 nav items horizontales, selector de idioma, reloj UTC, GPS.

**Cambios:**
- Añadir `const [open, setOpen] = useState(false)` para el overlay
- En móvil: mostrar solo brand + botón hamburger (3 líneas → X al abrir)
- Ocultar en móvil: reloj UTC, coordenadas GPS
- Al abrir: `<div>` con `position: fixed, inset: 0, zIndex: 100, background: C.bg` con los 5 items en lista vertical
- Cada ítem: `padding: '16px 20px'`, `borderBottom: '1px solid var(--line)'`, `fontSize: 13` — touch targets de ≥44px
- Ítem activo: color `C.accent` + indicador `●` a la derecha
- Selector de idioma al pie del overlay
- GPS en footer del overlay, muy tenue (`C.lineHi`)
- Al tocar ítem: navega + `setOpen(false)`
- Tecla `Escape` y click fuera del menú cierran el overlay

**En desktop:** comportamiento idéntico al actual — el hook `isMobile` asegura zero impacto.

---

### `src/components/App.jsx`

**Cambios:**
- `<main style={{ padding: isMobile ? '72px 16px 0' : '120px 64px 0', maxWidth: 1440 }}`
- ScrollRail: `{!isMobile && <ScrollRail ... />}` — oculto en móvil

---

### `src/components/ScrollBackground.jsx`

**Cambio:** añadir `isMobile` al check existente de `reduced`:

```jsx
const [reduced] = useState(
  () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
       || window.innerWidth <= 768
);
```

En móvil retorna `null` desde el mount inicial, sin registrar listeners. Rendimiento óptimo.

---

### `src/components/Hero.jsx`

El Hero tiene 3 variantes (`HeroSchematic`, `HeroTypographic`, `HeroTerminal`). Cada una importa `useBreakpoint` directamente.

**HeroSchematic (default):**
- Grid 2 cols → 1 col en móvil: `gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.05fr) minmax(0,1fr)'`
- En móvil: texto arriba, video/SVG debajo
- Stats 4 cols → 2×2: `gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'`
- Padding de sección: `padding: isMobile ? '48px 0' : '80px 0'`

**HeroTypographic:**
- Grid 3 cols bio → 1 col en móvil

**HeroTerminal:**
- Grid 2 cols → 1 col en móvil (terminal panel debajo del texto)

---

### `src/components/About.jsx`

**Cambios por bloque:**

1. **Header de sección** (`gridTemplateColumns: '180px 1fr'`):
   - → `gridTemplateColumns: isMobile ? '1fr' : '180px 1fr'`
   - En móvil: `SectionIndex` ocupa full width (número + título apilados)

2. **ID card sidebar** (`gridTemplateColumns: '340px 1fr'`):
   - → `gridTemplateColumns: isMobile ? '1fr' : '340px 1fr'`
   - ID card pasa a full width, contenido textual debajo

3. **Timeline rows** (`gridTemplateColumns: '140px 1fr'`):
   - → `gridTemplateColumns: isMobile ? '80px 1fr' : '140px 1fr'`
   - La columna de año/label se reduce pero no desaparece

4. **Stats grid** (`gridTemplateColumns: '1fr 1fr'`):
   - → `gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)'` (sin cambio — 2 cols ya es correcto en móvil)

5. **Skills grid** (`gridTemplateColumns: '1fr 1fr'`):
   - → `gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'`

---

### `src/components/Projects.jsx`

**Grid de tarjetas** (`gridTemplateColumns: 'repeat(3, 1fr)'`):
- → `gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)'`

**Video en touch — `IntersectionObserver`:**

En móvil no existe hover. Cada `ProjectCard` usa un `ref` + `IntersectionObserver` para detectar cuando la tarjeta es ≥40% visible en el viewport. Cuando entra: `setVisible(true)`.

```jsx
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

En el elemento `<video>`:
```jsx
opacity: isMobile ? (visible ? 1 : 0) : (hover ? 1 : 0),
transition: 'opacity 350ms var(--ease)',
```

El video ya tiene `autoPlay muted loop playsInline preload="auto"` — en móvil el browser lo reproduce en cuanto el elemento es visible. `visible` es `true` una vez activado y no regresa a `false`; el observer se desconecta al desmontar el componente (cleanup del `useEffect`).

**Filter bar** (horizontal): en móvil mantiene el layout horizontal — los 3 botones caben en 375px con `font-size: 10px`.

---

### `src/components/DigitalTwins.jsx`

- Métricas 4 cols → 2 cols: `gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'`
- Sensor grid 4 cols → 2 cols: `gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'`
- Split `3fr 1fr` → 1 col en móvil: `gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr'`
- Cards 3 cols → 1 col: `gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)'`

---

### `src/components/Contact.jsx`

- Sidebar 340px → full width: `gridTemplateColumns: isMobile ? '1fr' : '340px 1fr'`
- Campos del formulario 2 cols → 1 col: `gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'`
- Footer 4 cols → 2 cols: `gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '2fr 1fr 1fr 1fr'`

---

## Elements Hidden on Mobile

| Elemento | Componente | Motivo |
|---|---|---|
| ScrollBackground | `ScrollBackground.jsx` | Rendimiento / batería |
| ScrollRail | `App.jsx` | No útil en touch |
| Reloj UTC | `Nav.jsx` | No hay espacio |
| Coordenadas GPS (Nav) | `Nav.jsx` | Se mueven al overlay |
| TweaksPanel toggle | `App.jsx` | Función de desarrollo, no para usuarios móviles |

---

## Testing

- Tests unitarios para `useBreakpoint`: mock de `window.matchMedia`, verifica que `isMobile` es `true` cuando width ≤768 y `false` cuando >768
- Test de `Nav`: verifica que el botón hamburger renderiza en móvil (mock `isMobile=true`) y que el overlay aparece al clickear
- Test de `ScrollBackground`: verifica que retorna `null` cuando `isMobile=true`
- Tests existentes (39) no se tocan — todos deben seguir pasando

**Archivos de test:**
- `tests/unit/hooks/useBreakpoint.test.js`
- `tests/unit/Nav.test.jsx` (nuevo, o extensión del existente si hay)
- `tests/unit/ScrollBackground.test.jsx` (extensión — añadir caso `isMobile`)

---

## Out of Scope

- Tablet breakpoint separado (768px–1024px) — se deja para versión futura
- Animaciones específicas para móvil (swipe, etc.)
- Versión PWA / instalable
- Optimización de imágenes para móvil (srcset)
- Modo landscape específico
