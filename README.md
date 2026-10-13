# giova_water

Portafolio personal de **Giovanni X. Guevara Duque** — Ingeniero de Procesos especializado en agua potable, saneamiento, infraestructura industrial y gemelos digitales / SCADA / IoT.

Sitio desplegado en Vercel (https://giovawater.vercel.app). Esta rama es una versión para revisar en local; no está desplegada.

---

## 1. Resumen

Single-page application en **React 18 + Vite 6**, trilingüe (ES/EN/FR), con cuatro paletas conmutables en caliente. El estilo es un sistema visual de "instrumentación técnica" — tipografía mono, grilla, callouts de sensores, líneas de cuadro estilo P&ID.

- **Idiomas:** Español (default), Inglés, Francés — switch persistente en `localStorage`.
- **Audiencia:** clientes, recruiters técnicos y socios de proyecto (UE / LATAM).
- **Mensaje núcleo:** «Ingeniería del agua, de la necesidad a la operación». 11 años de experiencia profesional; proyectos con responsabilidad, resultado y evidencia. Las cifras en disputa (capacidad y coste de Montebello, población atendida) no se muestran hasta confirmarlas.

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
| Tests e2e | Playwright (Chromium): estructura, filtros, modal, contacto, responsive 390/768/1440, consola y red sin errores |
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
│   ├── data/projects.js          # Metadata lang-agnostic de proyectos: slug, destacado, ficheros de evidencia
│   ├── data/sections.js          # Orden y numeración de las secciones (nav, rail, pie)
│   ├── hooks/useNavigation.js    # Altura real de la cabecera (--nav-h) y scroll inicial a un fragmento
│   ├── lib/twinSim.js            # Simulación ilustrativa de la demo (escenarios, estados, reducer)
│   └── components/
│       ├── App.jsx               # Shell: ScrollRail, TweaksPanel, ficha de proyecto en la URL
│       ├── Nav.jsx               # Nav fija + selector ES/EN/FR; publica su altura
│       ├── Hero.jsx              # Titular, dos acciones y esquema PTAP (compacto en pantallas estrechas)
│       ├── Projects.jsx          # Tres destacados, «Ver todos», filtros con contadores
│       ├── About.jsx             # Perfil, competencias con enlaces a proyectos, cronología
│       ├── Method.jsx            # Método en cuatro etapas con detalle desplegable
│       ├── ProjectModal.jsx      # Ficha con focus trap, Escape, URL estable, presupuestos de P-007
│       ├── DigitalTwins.jsx      # Demo con escenarios, pausa y restablecer
│       ├── Faq.jsx               # Preguntas frecuentes (details nativos)
│       ├── Contact.jsx           # Form + tarjeta + Footer (export nombrado)
│       └── primitives.jsx        # Hooks + componentes compartidos
└── tests/
    ├── setup.js                  # jest-dom matchers para Vitest
    ├── unit/
    │   ├── i18n.test.jsx         # Resolución, fallback, persistencia, completeness
    │   └── primitives.test.jsx   # Determinismo de jitter()
    └── e2e/
        ├── site.spec.js          # e2e: estructura, proyectos, contacto, responsive
        └── __screenshots__/      # Baselines visual regression (en git)
```

---

## 4. Secciones de la página

| § | id | Componente | Contenido |
|---|---|---|---|
| 00 | `inicio` | `Hero` | Titular, «Ver proyectos» (principal) y «Consultar un proyecto», esquema PTAP ilustrativo. |
| 01 | `proyectos` | `Projects` + `ProjectModal` | Tres destacados (Montebello, PTAPs rurales UAESP, La Vorágine), «Ver todos los proyectos» (7) y filtros con contadores. |
| 02 | `sobre` | `About` + `Method` | Perfil, competencias ↔ proyectos, método en cuatro etapas y cronología breve. |
| 03 | `gemelos` | `DigitalTwins` | Demo con datos simulados: escenarios, pausa y restablecer. |
| 04 | `faq` | `Faq` | Preguntas frecuentes. |
| 05 | `contacto` | `Contact` | Formulario que prepara un email, tarjeta de contacto y pie. |

Cada proyecto tiene una URL estable `/#proyecto/<slug>` (los slugs están en `src/data/projects.js` y no se renombran). Es una ruta por fragmento: no necesita reescrituras en el servidor y abre la ficha correcta al cargarla directamente.

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

npm test             # Vitest una vez
npm run test:watch   # Vitest en watch mode
npm run test:e2e     # Playwright (necesita `npx playwright install chromium` la 1ª vez; con CHROMIUM_PATH=/ruta/a/chromium usa uno ya instalado)
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
- Licencia: `CPQCOL PQ-6061`
- Ubicación: Sant Feliu de Llobregat (`41.3879°N, 2.0456°E`)

`uploads/` (CVs y screenshots) está en `.gitignore`.

---

## 10. Pendientes conocidos

- **Form de contacto** — prepara un email en la aplicación del visitante (`mailto:`); no envía nada. El envío directo queda pendiente de definir proveedor, configuración y tratamiento de datos.
- **i18n** — sin extracción a archivos `.json` por idioma; todo en `src/i18n.jsx`. Si crece, conviene separar.

---

Recursos y requisitos pendientes de la mejora de octubre de 2026: [docs/mejora-2026-10.md](docs/mejora-2026-10.md).

_Última revisión: 2026-10-13_
