# giova_water

Portafolio personal de **Giovanni X. Guevara Duque** — Ingeniero de Procesos especializado en agua potable, saneamiento, infraestructura industrial y gemelos digitales / SCADA / IoT.

Sitio en producción desplegado en Vercel.

---

## 1. Resumen

Single-page application en **React 18 + Vite 6**, trilingüe (ES/EN/FR), con cuatro paletas conmutables en caliente. El estilo es un sistema visual de "instrumentación técnica" — tipografía mono, grilla, callouts de sensores, líneas de cuadro estilo P&ID.

- **Idiomas:** Español (default), Inglés, Francés — switch persistente en `localStorage`.
- **Audiencia:** clientes, recruiters técnicos y socios de proyecto (UE / LATAM).
- **Mensaje núcleo:** 11 años · 42 plantas · 150 000+ habitantes servidos · €6M+ en obra pública.

---

## 2. Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime | React 18.3.1 (npm) |
| Bundler | Vite 6 + `@vitejs/plugin-react` |
| Estilos | CSS plano con design tokens (`src/styles/tokens.css`) y `data-palette` attribute para temas |
| i18n | Context + hook propio (`src/i18n.jsx`), diccionario único en memoria, persistencia en `localStorage` |
| Tipografía | JetBrains Mono · Inter · Instrument Serif (Google Fonts) |
| Tests unitarios | Vitest + Testing Library + jsdom |
| Tests visuales | Playwright (Chromium) — 3 hero variants × 4 paletas |
| Hosting | Vercel (framework preset `vite`) |
| Gráficos | SVG inline + Canvas 2D (LGH) — sin librerías de charts en el bundle |

Build de producción: **~256 KB JS / 75 KB gzip · 6 KB CSS**.

---

## 3. Estructura del repositorio

```
giova_water/
├── index.html                    # Vite entry — meta SEO/OG, favicon SVG, fonts
├── package.json
├── vite.config.js                # Vite + Vitest config
├── playwright.config.js          # Playwright + webServer (vite preview en 4173)
├── vercel.json                   # Framework preset Vite — output en dist/
├── public/
│   └── assets/                   # Imágenes JPG optimizadas (~580 KB total)
│       ├── giovanni-field.jpg
│       └── giovanni-portrait.jpg
├── src/
│   ├── main.jsx                  # Entry — monta <App/> con <LangProvider/>
│   ├── i18n.jsx                  # LangProvider, useT, useLang + diccionario ES/EN/FR
│   ├── styles/tokens.css         # Tokens, paletas, focus rings, skip-link, modal
│   ├── data/projects.js          # Metadata lang-agnostic de proyectos
│   └── components/
│       ├── App.jsx               # Shell: ScrollRail, TweaksPanel, modal wiring
│       ├── Nav.jsx               # Nav fija + reloj UTC + selector ES/EN/FR
│       ├── Hero.jsx              # 3 variantes: schematic / typographic / terminal
│       ├── About.jsx             # ID card, bio, skills, timeline
│       ├── Projects.jsx          # Grid filtrable de 6 proyectos
│       ├── ProjectModal.jsx      # Detalle con focus trap, Escape, body scroll lock
│       ├── DigitalTwins.jsx      # Dashboard SCADA con gauges, sparklines, LGH canvas
│       ├── Contact.jsx           # Form + tarjeta + Footer (export nombrado)
│       └── primitives.jsx        # Hooks + componentes compartidos
└── tests/
    ├── setup.js                  # jest-dom matchers para Vitest
    ├── unit/
    │   ├── i18n.test.jsx         # Resolución, fallback, persistencia, completeness
    │   └── primitives.test.jsx   # Determinismo de jitter()
    └── e2e/
        ├── visual.spec.js        # 3 heroes × 4 paletas + smoke
        └── __screenshots__/      # Baselines visual regression (en git)
```

---

## 4. Secciones de la página

| § | id | Componente | Contenido |
|---|---|---|---|
| 00 | `inicio` | `Hero` | Tres variantes intercambiables (default: schematic con sensores en vivo + foto en campo). |
| 01 | `sobre` | `About` | ID card con foto + bio en tres párrafos + 8 skill bars + timeline 2009–2025. |
| 02 | `proyectos` | `Projects` + `ProjectModal` | 6 cards filtrables (Todos / Agua & Saneamiento / Digital & IoT) — abren modal de detalle. |
| 03 | `gemelos` | `DigitalTwins` | Dashboard SCADA con gauges, sparklines y canvas de LGH (Línea de Gradiente Hidráulico). |
| 04 | `contacto` | `Contact` | Form de contacto + tarjeta con email, teléfono, ubicación. |

Elementos transversales:
- **`Nav`** fija con coordenadas, reloj UTC, status dot y switcher ES/EN/FR.
- **`ScrollRail`** a la derecha — porcentaje de scroll vertical + índice de secciones.
- **`TweaksPanel`** — esquina inferior derecha (⚙). Cambia variante de hero, paleta y grid en runtime; persiste en `localStorage`.
- **Skip-link** invisible al inicio del DOM para usuarios de teclado.

---

## 5. Sistema de diseño

### Paletas (`data-palette` en `<html>`)
| Slug | Carácter | Accent |
|---|---|---|
| `instrument` (default) | Dark ink + telemetría | `#4ee8d1` cyan |
| `teal` | Verde-azul más cálido | `#3dd9a8` |
| `copper` | Industrial cálido | `#e89558` |
| `paper` | Light, papel técnico (contraste WCAG AA) | `#0e6354` |

### Accesibilidad
- `:focus-visible` con outline de 2 px en color accent.
- `aria-label` en botones de icono (close, copy, tweaks, project open).
- `aria-current="page"` en item de nav activo.
- `role="dialog"` + `aria-modal="true"` + focus trap en modal.
- `role="progressbar"` en skill bars y gauges.
- `role="img"` con `aria-label` en SVGs informativos; `aria-hidden="true"` en decorativos.
- `@media (prefers-reduced-motion: reduce)` desactiva animaciones.
- Paleta `paper` recalibrada para cumplir contraste AA.

---

## 6. Internacionalización

`src/i18n.jsx` expone:
- `<LangProvider>` — Context provider con detección automática (localStorage → navigator.language → `es`).
- `useT()` — devuelve `t(key, vars?)`. Acepta keys dotted (`hero.kicker`, `projects.data.P-001.title`), retorna strings, arrays u objetos. Interpolación `{var}` opcional.
- `useLang()` — `[lang, setLang, supported]`.

El diccionario único cubre **3 idiomas × ~150 keys** en memoria; no hay carga asíncrona. Términos técnicos (EPANET, PTAR, SCADA) se mantienen en todos los idiomas.

---

## 7. Desarrollo

```bash
npm install
npm run dev          # Vite dev server (HMR) en http://localhost:5173
npm run build        # Compila a dist/
npm run preview      # Sirve dist/ en http://localhost:4173

npm test             # Vitest una vez (9 tests)
npm run test:watch   # Vitest en watch mode
npm run test:e2e     # Playwright (necesita `npx playwright install chromium` la 1ª vez)
npm run test:e2e:update  # Regenera baselines visuales tras cambios intencionales
```

> Node ≥ 18. El proyecto está testeado con Node 22.

---

## 8. Despliegue

Vercel detecta automáticamente el framework Vite (ver [vercel.json](vercel.json)). Push a `main` → build → publica `dist/`.

---

## 9. Datos sensibles / contacto

Datos en código (intencionalmente públicos — es un portafolio):
- Email: `lucesproject@gmail.com`
- Tel: `+34 673 506 760`
- NIE: `Z3214507D`
- Licencia: `CPQCOL PQ-6061`
- Ubicación: Sant Feliu de Llobregat (`41.3879°N, 2.0456°E`)

`uploads/` (CVs y screenshots) está en `.gitignore`.

---

## 10. Pendientes conocidos

- **Form de contacto** — sigue en modo stub (sólo `setSent(true)`). Próximo paso: `mailto:` o servicio externo (decisión pendiente).
- **Modal de proyecto** — solo abre con click, sin trap de Tab perfecto (Escape + body scroll lock sí están).
- **i18n** — sin extracción a archivos `.json` por idioma; todo en `src/i18n.jsx`. Si crece, conviene separar.

---

_Última revisión: 2026-05-27_
