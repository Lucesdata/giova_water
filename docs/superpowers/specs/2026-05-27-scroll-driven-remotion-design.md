# Sub-proyecto 2: Scroll-driven Remotion Background — Design Spec

**Date:** 2026-05-27
**Project:** giova_water portfolio (React + Vite)

---

## Goal

Al hacer scroll por el portfolio, la posición del window controla `currentFrame` de una composición Remotion que se renderiza como fondo fijo. Cada sección del portfolio tiene su propia escena animada temáticamente relacionada con ingeniería hídrica.

---

## Architecture

### Approach

Un único `<Player>` de `@remotion/player` fijo en el viewport (position: fixed, z-index: 0, opacity: 0.18). El scroll total de la página (0%→100%) mapea linealmente al rango de frames (0→479). El contenido HTML de cada sección flota encima en z-index normal.

### Scroll → Frame mapping

```js
const progress = scrollY / (document.body.scrollHeight - window.innerHeight);
frame = Math.round(progress * 479);
playerRef.current?.seekTo(frame);
```

El listener usa `{ passive: true }` y se protege con `requestAnimationFrame` para evitar doble-fire a 60fps+.

El `#inicio` (Hero) no tiene escena propia — la animación del fondo empieza desde el primer scroll hacia `#sobre`.

### Composition specs

| Property | Value |
|----------|-------|
| Total frames | 480 |
| FPS | 30 |
| Duration | 16 s |
| Width | `window.innerWidth` (responsive) |
| Height | `window.innerHeight` |

### Scene chapters

| Frames | Sección | Escena |
|--------|---------|--------|
| 0–119 | `#sobre` (About) | Red hídrica: nodos + tuberías + etiquetas de presión |
| 120–239 | `#proyectos` (Projects) | Gráfica de caudal: ejes + curva + marcadores |
| 240–359 | `#gemelos` (DigitalTwins) | Gemelo digital: esquema físico + espejo + partículas |
| 360–479 | `#contacto` (Contact) | Ondas ripple + coordenadas GPS + pulso de señal |

---

## Components

### New files

**`src/remotion/ScrollBG.jsx`**
Composición principal. Renderiza las 4 escenas usando `useCurrentFrame()`. Cada escena recibe `frame` como prop y calcula sus propias interpolaciones locales (`localFrame = frame - sceneStart`).

**`src/remotion/scenes/AboutScene.jsx`**
- Frames 0–30: 6 nodos circulares con fade-in escalonado (captación → planta → depósitos × 2 → usuarios × 2)
- Frames 30–80: Líneas SVG entre nodos con `strokeDashoffset` animado
- Frames 80–119: Etiquetas de presión/caudal con counter animado (`AnimatedNumber`-style)

**`src/remotion/scenes/ProjectsScene.jsx`**
- Frames 0–30 (local): Ejes X/Y con líneas que crecen desde el origen
- Frames 30–90 (local): Polyline de caudal se dibuja progresivamente con `strokeDashoffset`
- Frames 90–119 (local): 3 marcadores de proyecto (círculo + etiqueta) aparecen sobre la curva

**`src/remotion/scenes/DigitalTwinsScene.jsx`**
- Frames 0–30 (local): Esquema físico (izquierda) — versión simplificada del HeroPTAP con fade-in
- Frames 30–60 (local): Esquema digital (derecha) aparece como espejo horizontal
- Frames 60–119 (local): Partículas (círculos pequeños) fluyen de izquierda a derecha entre esquemas

**`src/remotion/scenes/ContactScene.jsx`**
- Frames 0–40 (local): 5 círculos concéntricos se expanden desde el centro
- Frames 40–80 (local): Texto de coordenadas GPS aparece carácter a carácter (clip de ancho animado)
- Frames 80–119 (local): Pulso de señal — opacidad oscilante en los círculos exteriores

**`src/components/ScrollBackground.jsx`**
Wrapper de React que:
1. Mide `vw`/`vh` al montar y en `resize`
2. Escucha `scroll` con `{ passive: true }`, llama `playerRef.current?.seekTo(frame)` via `requestAnimationFrame`
3. Renderiza `<Player ref={playerRef} component={ScrollBG} ... autoPlay={false} />`
4. Respeta `prefers-reduced-motion`: si está activo, no monta el Player

### Modified files

**`src/components/App.jsx`**
Agrega `<ScrollBackground />` inmediatamente antes del `<Nav>` en el return, fuera del `<main>`. El componente es puramente decorativo (`aria-hidden`).

**`src/remotion/Root.jsx`** *(opcional)*
Agregar `<Composition id="ScrollBG" ...>` para permitir previsualización en Remotion Studio. No requerido para el funcionamiento en el navegador.

---

## Shared utilities

Los colores usan `src/remotion/colors.js` (ya existente). Las escenas reutilizan el helper `interp()` de `HeroPTAP.jsx` o lo redefinen localmente. No se introduce nueva abstracción de colores.

---

## Visual parameters

| Parameter | Value |
|-----------|-------|
| Player opacity | 0.18 |
| Accent color | `C.accent` (#4ee8d1) |
| Background | transparent (el bg de la página ya existe) |
| Stroke width de tuberías | 1.5px |
| Nodo radius | 8px |
| Partícula radius | 3px |

---

## Performance

- `seekTo()` via `requestAnimationFrame` — máximo una llamada por frame de browser
- `{ passive: true }` en el scroll listener — no bloquea el thread principal
- Composición en SVG puro (no canvas) — sin overhead de WebGL
- Sin re-renders de React en scroll — toda la lógica va por `playerRef.current.seekTo()`

---

## Testing

- Unit tests en `tests/unit/ScrollBackground.test.jsx`: monta el componente, verifica que `seekTo` se llama al disparar evento scroll, verifica que no monta Player con `prefers-reduced-motion: reduce`
- Unit tests en `tests/unit/remotion/ScrollBG.test.jsx`: smoke test de cada escena en frame representativo
- No se testea la animación visual pixel-perfect — solo que los componentes renderizan sin crash

---

## Out of scope

- Snap scroll (el scroll del navegador no se modifica)
- Audio sincronizado
- Controles de play/pause visibles al usuario
- Prerenderizado a video del fondo de scroll
