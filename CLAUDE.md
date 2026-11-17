# giova_water — reglas para Claude Code

Portafolio en producción (giovawater.vercel.app). React 18 + Vite 6, CSS plano con tokens (`src/styles/tokens.css`), i18n ES/EN/FR, Remotion para vídeo y fondo de scroll.

## Diseño aprobado
- No cambies el sistema visual aprobado (paletas `data-palette`, tipografías, estética de instrumentación / P&ID) sin pedirlo explícitamente.
- No elimines código ni secciones. Las cifras en disputa siguen ocultas (ver README §1).
- Accesibilidad no negociable: `prefers-reduced-motion`, focus visible, contraste AA (hay tests en `tests/unit/contrast.test.js`).

## Motion
- Motor único: **GSAP** (`gsap` + `@gsap/react`, gratuito con todos sus plugins). Skills en `.claude/skills/gsap-*`.
- En React: `useGSAP()` con `scope`, nunca `useEffect` sin limpieza. Si GSAP se carga de forma diferida (patrón de `src/lib/flip.js`), `useLayoutEffect` que mata la animación en la limpieza.
- Presupuesto aprobado (test e2e «movimiento»): ≤ 250 ms, sin retardo, sin stagger, sin desenfoque, sin animación de entrada en el hero.
- GSAP no va en el bundle inicial: se descarga cuando la sección está cerca de la pantalla, y nunca con reduced-motion.
- Envuelve todo en `gsap.matchMedia()` con una rama `(prefers-reduced-motion: reduce)` que deja el estado final sin animar.
- Anima solo `transform` / `opacity` (ver `gsap-performance`). Registra plugins una sola vez.
- Importa GSAP solo en componentes que lo usen; los plugins pesados (SplitText, MorphSVG) con `import()` dinámico.
- No añadir Motion (`motion`), Lenis ni ScrollSmoother: duplican GSAP o interfieren con el scroll por fragmento (`/#proyecto/<slug>`), `ScrollRail` y `useNavigation`.
- Remotion sigue siendo la vía para vídeo renderizado; GSAP para interacción en vivo.

## 3D (pendiente de decisión)
- `@react-three/fiber` v9 / `drei` v10 exigen React 19. No instalar sin migrar antes React (y verificar Remotion y Testing Library).
- Cualquier escena 3D irá en `React.lazy` + `Suspense`, fuera del bundle inicial, con póster estático para reduced-motion y móviles lentos.
- Modelos `.glb` comprimidos (Draco/Meshopt) en `public/assets/3d/`.

## Validación antes de entregar
```
npm test            # vitest (371+ tests)
npm run build       # vigilar tamaño del chunk principal
npm run test:e2e    # Playwright; si Chromium no está, CHROMIUM_PATH=/ruta/chrome
```
- MCP de Playwright (`.mcp.json`, headless e aislado) para revisar visualmente animaciones en 390 / 768 / 1440.
- Diseño: skill `frontend-design` para dirección visual, siempre dentro del sistema existente.
