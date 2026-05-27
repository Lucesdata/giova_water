# Sub-proyecto 3: Project Card Videos — Design Spec

**Date:** 2026-05-27
**Project:** giova_water portfolio (React + Vite)

---

## Goal

Cada tarjeta de proyecto en la sección `#proyectos` muestra un video Remotion de 3s en loop al hacer hover. Los videos reemplazan visualmente el área de imagen con una animación temática relacionada con el tipo de proyecto (agua o digital).

---

## Architecture

### Compositions

Dos composiciones Remotion, una por tema:

| Composición | Proyectos | inputProps |
|-------------|-----------|------------|
| `AguaCardVideo` | P-001, P-002, P-005, P-006 | `{ color: string, id: string }` |
| `DigitalCardVideo` | P-003, P-004 | `{ color: string, id: string }` |

**Specs comunes:**
- ViewBox: `0 0 640 400` (16/10, coincide con el aspect ratio de las tarjetas)
- FPS: 30
- Duration: 90 frames (3 segundos)
- Background: transparente — el gradiente del card se ve detrás

### Output

6 archivos pre-renderizados en `public/assets/cards/`:

| Archivo | Proyecto | Composición |
|---------|----------|-------------|
| `p001.mp4` | P-001 | AguaCardVideo |
| `p002.mp4` | P-002 | AguaCardVideo |
| `p003.mp4` | P-003 | DigitalCardVideo |
| `p004.mp4` | P-004 | DigitalCardVideo |
| `p005.mp4` | P-005 | AguaCardVideo |
| `p006.mp4` | P-006 | AguaCardVideo |

Los videos se excluyen de git vía `.gitignore`.

### Render script

`src/remotion/cards/render-cards.mjs` — itera los 6 proyectos, detecta el tema (`agua`/`digital`) y renderiza cada uno con su `color` e `id` como `inputProps`.

Nuevo npm script en `package.json`:
```json
"render:cards": "node src/remotion/cards/render-cards.mjs"
```

---

## Components

### New files

**`src/remotion/cards/AguaCardVideo.jsx`**

Animación de flujo hídrico continuo. Usa `frame % 90` para seamless loop.

- **Grid técnico (fondo):** líneas de grid 640×400, opacidad 0.15, `C.lineHi`
- **Tuberías:** 3 líneas horizontales en y=120, 200, 280 — stroke `C.lineHi`, strokeWidth 1.5
- **Partículas de flujo:** 12 círculos — `cx = (frame * 5 + i * 53) % 640`, cy según tubería (distribución 4/4/4), r=3, fill `color` prop, opacidad oscila con `Math.sin(frame * 0.1 + i)`
- **Lecturas de sensor** (bottom-right): 3 etiquetas monoespaciadas — valores oscilan con `Math.sin(frame * 0.07 + i)` en rangos realistas (caudal: 38–46 L/s, presión: 2.8–3.6 bar, turbidez: 0.5–1.2 NTU)
- **Label de ID** (top-left): `id` prop en texto monoespaciado pequeño, `C.ink3`

**`src/remotion/cards/DigitalCardVideo.jsx`**

Animación de red de datos. Usa `frame % 90` para seamless loop.

- **Aristas (fondo):** 6 líneas entre nodos — `strokeDashoffset = (frame * 2 + i * 15) % 60`, stroke `C.accentLine`
- **Nodos:** 6 círculos en posiciones fijas (2 hubs centrales r=14, 4 periféricos r=8) — radio oscila con `Math.sin(frame * 0.12 + i * 0.8)` ±3px, fill `color` prop
- **Contador** (top-right): número en loop — `String((frame * 3) % 999).padStart(3, '0')`, label "NODES ACTIVE", fuente monoespaciada `C.accent`
- **Label de ID** (top-left): `id` prop en texto monoespaciado pequeño, `C.ink3`

**`src/remotion/cards/RootCards.jsx`**

Registra las 2 composiciones para Remotion Studio:
```jsx
<Composition id="AguaCardVideo" component={AguaCardVideo} durationInFrames={90} fps={30} width={640} height={400} defaultProps={{ color: '#1e3a5f', id: 'P-001' }} />
<Composition id="DigitalCardVideo" component={DigitalCardVideo} durationInFrames={90} fps={30} width={640} height={400} defaultProps={{ color: '#3a2660', id: 'P-003' }} />
```

**`src/remotion/cards/render-cards.mjs`**

Script ESM. Para cada proyecto:
1. Determina la composición según `filters` (`agua` → `AguaCardVideo`, `digital` → `DigitalCardVideo`)
2. Llama `bundle()` + `renderMedia()` con `inputProps: { color: p.color, id: p.id }`
3. Output: `public/assets/cards/p001.mp4` (lowercase, sin guión)

### Modified files

**`src/data/projects.js`**

Agrega `video` a cada proyecto:
```js
{ id: 'P-001', ..., video: '/assets/cards/p001.mp4' },
{ id: 'P-002', ..., video: '/assets/cards/p002.mp4' },
// etc.
```

**`src/components/Projects.jsx`**

En `ProjectCard`, dentro del div de imagen (después del bloque `{p.image ? ... : ...}` y antes de los corner markers), agrega:

```jsx
{p.video && (
  <video
    src={p.video}
    autoPlay muted loop playsInline
    style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      objectFit: 'cover',
      opacity: hover ? 1 : 0,
      transition: 'opacity 350ms var(--ease)',
    }}
  />
)}
```

**.gitignore**

Agrega `public/assets/cards/`.

---

## Animation details

### AguaCardVideo — node positions for sensor labels

```
Bottom-right cluster at x=480, y=300:
- Caudal:  x=480, y=308 — value: (38 + 8 * Math.sin(frame*0.07)) L/s
- Presión: x=480, y=324 — value: (3.2 + 0.4 * Math.sin(frame*0.07+2)) bar
- Turbidez: x=480, y=340 — value: (0.85 + 0.35 * Math.sin(frame*0.07+4)) NTU
```

### DigitalCardVideo — node positions

```
Hub nodes:    (280, 180), (380, 240)
Peripheral:   (160, 120), (500, 120), (140, 300), (520, 300)
Edges:        hub1↔hub2, hub1↔p1, hub1↔p3, hub2↔p2, hub2↔p4, p1↔p2
```

---

## Testing

- Unit tests en `tests/unit/remotion/cards/AguaCardVideo.test.jsx` y `DigitalCardVideo.test.jsx`
- Pattern idéntico a las scene tests existentes: mock `remotion`, verifica que renderiza sin crash
- No se testea el render script (Node.js, no React)

---

## Out of scope

- Diferentes animaciones por proyecto individual dentro del mismo tema
- Audio
- Controles de play/pause visibles
- Lazy loading del video (siempre en DOM, opacity 0 cuando no está en hover)
