# giova_water

Portafolio profesional de **Giovanni X. Guevara Duque** — ingeniero de procesos especializado en agua potable, saneamiento, infraestructura industrial y operación digital (SCADA, IoT, gemelos digitales).

Sitio desplegado en Vercel: https://giovawater.vercel.app

---

## 1. Resumen

Página única en **React 18 + Vite 6**, en español, inglés y francés.

- **Audiencia:** clientes, reclutadores técnicos y socios de proyecto (UE / LATAM).
- **Mensaje:** «Ingeniería del agua, de la necesidad a la operación». 11 años de experiencia; cada proyecto con responsabilidad, resultado y evidencia. Las cifras en disputa (capacidad y coste de Montebello, población atendida) no se muestran hasta confirmarlas.
- **Diseño:** tema oscuro con acento turquesa. Inter para lectura y títulos; JetBrains Mono solo para rótulos y cifras.

## 2. Secciones

| id | Componente | Contenido |
|---|---|---|
| `inicio` | `Hero` + `Cycle.jsx` | Titular, dos acciones, datos breves; cuatro cifras clave enlazadas a su proyecto; método en cinco etapas con evidencia (`#metodo`). |
| `proyectos` | `Projects` + `ProjectModal` | Cuatro destacados, «Ver todos los proyectos (7)», filtros con contadores y ficha por proyecto. |
| `sobre` | `About` | Perfil, tarjeta con formación y licencia, trayectoria desplegable. |
| `gemelos` | `Digital` | Video real de supervisión SCADA (UAESP), captura del gemelo digital de La Soledad y laboratorio 3D de equipos (`#objetos`). |
| `contacto` | `Contact` | Canales directos, formulario que prepara un email y preguntas frecuentes (`#faq`). |

El pie (`Footer`) va fuera de `<main>`. Los ids `sobre`, `gemelos`, `objetos` y `faq` se conservan para que los enlaces antiguos sigan funcionando.

Cada proyecto tiene una URL estable `/#proyecto/<slug>` (slugs en `src/data/projects.js`; no se renombran). Es una ruta por fragmento: no necesita reescrituras en el servidor y abre la ficha correcta al cargarla directamente.

## 3. Estructura del repositorio

```
giova_water/
├── index.html                 # Entrada de Vite: SEO/OG, favicon, fuentes
├── vite.config.js             # Vite + Vitest
├── playwright.config.js       # Playwright + servidor (vite preview, puerto 4173)
├── vercel.json
├── public/
│   ├── assets/                # Fotos, capturas y video (JPG/WebM/MP4 optimizados)
│   ├── engineering-objects/   # Laboratorio 3D publicado como página estática
│   └── leachate-jelly/
├── engineering-objects/       # Código fuente del laboratorio 3D (monorepo propio)
├── src/
│   ├── main.jsx
│   ├── i18n.jsx               # LangProvider, useT, useLang + diccionario ES/EN/FR
│   ├── styles/tokens.css      # Tokens de diseño y estilos
│   ├── data/projects.js       # Metadatos de proyectos (slug, destacado, fotos)
│   ├── data/sections.js       # Orden de las secciones (menú, sección activa, pie)
│   ├── hooks/                 # useNavigation (altura de cabecera, fragmento inicial), useBreakpoint
│   ├── lib/contact.js         # Validación y mailto del formulario
│   └── components/
│       ├── App.jsx            # Estructura y ficha de proyecto en la URL
│       ├── Nav.jsx            # Cabecera de una fila + menú móvil + idioma
│       ├── Hero.jsx           # Portada
│       ├── Cycle.jsx          # Cifras clave y método
│       ├── Projects.jsx       # Rejilla, filtros y «ver todos»
│       ├── ProjectModal.jsx   # Ficha con foco atrapado, Escape y URL estable
│       ├── ProjectScheme.jsx  # Esquemas conceptuales de los proyectos sin foto
│       ├── About.jsx          # Perfil y trayectoria
│       ├── Digital.jsx        # Video SCADA, gemelo digital y laboratorio 3D
│       ├── Contact.jsx        # Contacto, preguntas frecuentes y pie
│       └── primitives.jsx     # Hooks y piezas compartidas
└── tests/
    ├── unit/                  # Vitest + Testing Library
    └── e2e/site.spec.js       # Playwright: estructura, anclas, proyectos, contacto, responsive, axe
```

## 4. Accesibilidad

- Enlace para saltar al contenido, foco visible (2 px) y objetivos táctiles de 44 px.
- Ficha de proyecto y menú móvil con `role="dialog"`, foco atrapado y Escape.
- Video sin sonido, con botón de pausa siempre visible; no arranca solo con `prefers-reduced-motion`.
- Animaciones de entrada ≤ 200 ms y 12 px; desplazamiento suave solo si no se pide movimiento reducido.
- Contraste AA de los tokens (prueba unitaria) y del texto del hero sobre la foto (medido en píxeles, e2e).
- Auditoría axe-core (WCAG 2.0/2.1/2.2 A y AA) de la página completa en ES/EN/FR, móvil y escritorio, y de la ficha abierta.

## 5. Internacionalización

`src/i18n.jsx` expone `<LangProvider>` (localStorage → idioma del navegador → `es`), `useT()` (claves con puntos e interpolación `{var}`) y `useLang()`. Una prueba comprueba que cada clave de `es` existe en `en` y `fr` con la misma forma.

## 6. Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/
npm run preview      # http://localhost:4173
npm test             # Vitest
npm run test:e2e     # Playwright (con CHROMIUM_PATH=/ruta/a/chromium usa uno ya instalado)
```

Node ≥ 18 (probado con Node 22). Build de producción: **~275 KB JS (85 KB gzip) · 22 KB CSS**.

## 7. Despliegue

Vercel detecta Vite (ver [vercel.json](vercel.json)). Push a `main` → build → publica `dist/`.

## 8. Datos de contacto

Intencionalmente públicos (es un portafolio): email `lucesproject@gmail.com`, teléfono `+34 673 506 760`, licencia `CPQCOL PQ-6061`, Sant Feliu de Llobregat (Barcelona). `uploads/` (CV y capturas) está en `.gitignore`.

## 9. Pendientes conocidos

- **Formulario de contacto:** prepara un email en la aplicación del visitante (`mailto:`); no envía nada. El envío directo queda pendiente de definir proveedor y tratamiento de datos.
- **Recursos reales pendientes** (documentos, capturas, CV, retrato natural, foto del hero): ver [docs/mejora-2026-10.md](docs/mejora-2026-10.md).

_Última revisión: 2026-11-24_
