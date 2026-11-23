# engineering-objects

Objetos de ingeniería tridimensionales, paramétricos, reutilizables y verificables.
Primer objeto: **decantador primario circular** con alimentación central, flujo radial, canal
perimetral exterior y rasquetas de fondo (SPEC-DEC-001 + SPEC-DEC-002, v1.0).

> Principio rector: *Engineering First — Geometry Before Simulation.* La geometría se deriva del
> cálculo; nunca se escala un modelo 3D para "dimensionar".

> **Ningún resultado de este repositorio es un diseño aprobado.** Los espesores estructurales son datos
> de partida sin verificar, el equipo mecánico no está dimensionado para fabricación y las fuentes
> bibliográficas están marcadas `TO_VERIFY`. El sistema lo declara en cada variante (estado `INCOMPLETE`).

## Uso rápido

```bash
cd engineering-objects
npm install
npm test               # 120 pruebas (unitarias + integración + arquitectura)
npm run typecheck      # capas puras sin DOM/React/Three + proyecto completo
npm run lab            # laboratorio visual (Vite, http://localhost:5173)
npm run examples:presets   # regenera examples/output (variantes JSON + memorias)
```

```ts
import { DEC_005_DIDACTIC, createBaseVariant, createVariant, regenerate, renderReport } from '@eo/equipment-library';

const dec005 = createBaseVariant(DEC_005_DIDACTIC);                                   // 5 L/s
const dec010 = createVariant(dec005, { tag: 'DEC-010', flow: { averageLps: 10 } });  // modo A: nuevo diseño
const eval10 = createVariant(dec005, { tag: 'EVAL', flow: { averageLps: 10 } }, { mode: 'B' }); // equipo existente
const c10 = createVariant(dec005, { tag: 'C', flow: { averageLps: 10 } }, { mode: 'C', allowedResize: ['inlet', 'effluent'] });

dec010.calculatedOutputs.values['tank.diameter'];   // { value: 5.528, unit: 'm', equation, inputs, origin, ... }
dec010.validationStatus;                              // 'INCOMPLETE' (estructura y mecánica pendientes)
const design = regenerate(dec010);                    // geometría + mediciones + comprobaciones, determinista
renderReport(design, dec010);                         // memoria de cálculo en Markdown
```

## Arquitectura (spec §2.3, §9)

```
packages/
  engineering-core/    Unidades, CalcTrace (trazabilidad), restricciones, validación 4 niveles,
                       fórmulas hidráulicas, referencias con estado de verificación, contrato
                       EngineeringObject. Sin dependencias del monorepo, sin DOM.
  material-library/    Catálogo técnico (densidad, fck, fy, exposición, protección) con fuentes.
  geometry-engine/     Descriptores geométricos neutros (revolución, caja, cilindro, tubo, viga),
                       ensamblajes, conexiones, diff por hash, mediciones exactas (Pappus-Guldin).
  equipment-library/   primary-clarifier/
                         definition/  esquema (zod), perfiles, motor, diseño, variantes, reporte
                         civil/       geometría civil, mediciones, comprobaciones constructivas
                         hydraulics/  geometría hidráulica
                         mechanical/  geometría mecánica, holguras e interferencias
                         presets/     configuraciones de partida
  three-adapter/       Descriptores → Three.js; materiales compartidos; pool de geometría con
                       recuento de referencias; SceneSync regenera solo lo que cambia.
  r3f-components/      <EngineeringAssembly/> (React Three Fiber).
apps/object-lab/       Laboratorio visual: parámetros · visor 3D · resultados.
specs/                 Inventario de parámetros y dependencias.
tests/                 Pruebas de arquitectura y de reproducibilidad de ejemplos.
examples/              Generador del caso de prueba y salidas (JSON + memorias).
extensions/            Reservado (simulación, diagnóstico, optimización): no implementado en V1.
```

Las cuatro primeras capas **no importan Three.js ni React** (lo comprueban `tests/architecture.test.ts`
y `tsconfig.core.json`, que compila sin `DOM`). El objeto se integra en otra aplicación importando solo
`@eo/equipment-library`.

### Pipeline de regeneración (spec §6.4)

`INPUT → validación (zod, nivel 1) → cálculo hidráulico → resolución geométrica → geometría de
componentes → verificación del ensamblaje (nivel 3, sobre la geometría generada) → comprobaciones
constructivas (nivel 4) → variante versionada e inmutable`.

Cada variante registra `objectId`, `variantId`, `parentVariantId`, `schemaVersion`,
`engineeringModelVersion`, `createdAt`, `designInputs`, `calculatedOutputs`, `validationStatus` y un
`outputsHash` que permite comprobar que se reproduce bit a bit (`reproduces()`, `importVariant()`).

### Validación

Cuatro niveles (Datos, Hidráulica, Geometría, Ingeniería constructiva) con estados `PASS`, `WARNING`,
`FAIL`, `NOT_EVALUATED`. Estado global: `FAILED` si hay un FAIL; `INCOMPLETE` si queda alguna
comprobación **crítica** sin evaluar; solo entonces `VALIDATED[_WITH_WARNINGS]`. En V1 ninguna variante
puede pasar de `INCOMPLETE` porque estructura y mecánica están, a propósito, sin evaluar.

## Caso de prueba obligatorio (spec §6.2)

Escenario didáctico, CHS = 1,5 m/h, sin restricciones adicionales (`examples/output/comparison.md`):

| Variante | Qmed | Área mínima | Diámetro teórico | Estado |
|---|---:|---:|---:|---|
| DEC-003 | 3 L/s | 7,20 m² | 3,03 m | INCOMPLETE |
| DEC-005 | 5 L/s | 12,00 m² | 3,91 m | INCOMPLETE |
| DEC-010 | 10 L/s | 24,00 m² | 5,53 m | INCOMPLETE |

DEC-010 y DEC-003 son variantes en modo A de DEC-005, que permanece intacto (objeto congelado; test).
Al pasar de 5 a 10 L/s, D crece √2 (no ×2), la profundidad y los espesores no cambian, el DN de entrada pasa de
125 a 150, las escotaduras de 61 a 86, el DN de lodos se mantiene en 150 por normalización y el
pozo de alimentación en 1,0 m por mínimo constructivo.

Evaluar el equipo de 5 L/s a 10 L/s (modo B) da `FAILED` (CHS real 3,0 > 1,5 m/h; TRH 1,0 h).

## Estado frente a los criterios de aceptación (spec §14)

| Criterio | Estado | Evidencia |
|---|---|---|
| Núcleo sin Three.js | ✔ | `tests/architecture.test.ts`, `tsconfig.core.json` |
| 5 L/s regenerable de forma determinista | ✔ | hash de salidas y ensamblaje idénticos (test) |
| Variantes independientes de 10 y 3 L/s | ✔ | tests del caso §6.2 e inmutabilidad |
| Dimensiones calculadas, no escaladas | ✔ | D₁₀/D₅ = √2; H y espesores constantes |
| Componentes afectados se adaptan | ✔ | 17 componentes, conexiones coincidentes, holguras medidas |
| Espesores como parámetros técnicos | ✔ | entradas explícitas, estado `PRELIMINARY_UNVERIFIED` |
| Materiales independientes del render | ✔ | `material-library` vs `three-adapter/renderMaterials` |
| Resultados verificables | ✔ | `CalcTrace` (ecuación, dependencias, versión, origen) + memoria |
| Advertencias presentadas | ✔ | panel de validación y memoria de cálculo |
| Originales conservados | ✔ | variantes congeladas (`deepFreeze`) |
| Exportar/importar configuraciones | ✔ | `exportVariant` / `importVariant` con recálculo e integridad |
| Pruebas automatizadas | ✔ | 120 pruebas |
| Integrable sin el laboratorio | ✔ | `@eo/equipment-library` es independiente |
| Verificaciones pendientes identificadas | ✔ | comprobaciones críticas NOT_EVALUATED |

## Cambios V1.1 (modelo `PC-ENG-1.1.0`)

Tras revisar una guía técnica sobre tipos de clarificadores (SOR, SLR, TRH, WLR y monitorización):

- **Carga de sólidos** `SLR = Q·Cs/A` y carga de SST afluente (kg/d), a caudal medio y punta, con
  los SST de entrada que ya se pedían. Es un indicador: no hay criterio por defecto para primarios
  (`solidsLoadingPeak` admite un criterio con fuente).
- **Manto de lodos de diseño** (`geometry.sludgeBlanketDepthM`): se descuenta del volumen efectivo y se
  comprueba que no alcance el pozo de alimentación. Sin definir, nada cambia y la comprobación queda N/E.
- **Contrato de datos de operación** (`operations/record.ts`): formato validado de registros medidos y
  lectura frente al diseño. No es monitorización.
- Los rangos de la guía (Ontario Drinking Water Design Guidelines) son de agua potable y **no** se han
  incorporado a los perfiles de este decantador.

El cambio de versión del modelo es deliberado: los archivos exportados con `PC-ENG-1.0.0` se importan,
se recalculan con el modelo actual y se marcan como no verificados (test en `tests/examples.test.ts`).

## Cambios V1.2 (modelo `PC-ENG-1.2.0`): revisión del PR

- El motor no lanza excepciones con dimensiones absurdas: sin corona columna–pozo o con longitud
  de vertedero ≤ 0 se registra FAIL y los cálculos dependientes quedan no disponibles.
- Velocidad de la conducción de lodos comprobada también con DN fijado.
- Los `criteriaOverrides` añaden o endurecen: conservan los límites omitidos del perfil (con su
  fuente) y se rechazan si relajan un mínimo o máximo obligatorio.
- Los campos de hormigón solo admiten materiales de la familia hormigón.
- Modo B: la geometría instalada (coronación del pozo y del deflector, barredor, caja de flotantes)
  se construye con láminas de referencia bloqueadas; las láminas de operación se recalculan y se
  comprueba que no rebasen la coronación (`HYD-SHELLS-ABOVE-WATER`).
- Modos B y C: cualquier entrada que defina geometría instalada de un grupo bloqueado se rechaza
  (`inputGroups.ts`). Nuevo grupo `mechanical` para cambios mecánicos en modo C.
- Importación: los bloqueos se validan (nombres, dominios y conjunto exacto exigido por el modo).
- `VariantLibrary` no sustituye registros existentes ni admite una variante que sea su propio padre.

## Cambios V1.3 (modelo `PC-ENG-1.3.0`): segunda revisión

- Carga de SST afluente también a caudal punta (`solids.influentLoad.peak`); las SLR se calculan como
  `M / A` desde valores trazados, reproducibles con sus entradas.
- El tramo del pozo de alimentación que queda dentro del manto se descuenta una sola vez.
- Con 0 escotaduras fijadas y vertedero útil: `HYD-NOTCH-COUNT` = FAIL y láminas no disponibles,
  sin excepción. El visor no dibuja la lámina si no está calculada.
- Lecturas de operación informativas para todas las variables con referencia de diseño.
- Los límites mecánicos de solo comprobación (gálibo, pasarela, holguras mínimas) no exigen el grupo
  `mechanical` en modo C.

## Límites conocidos de V1

- **Estructura**: sin cálculo (espesores, fisuración, flotación, geotecnia, armaduras).
- **Mecánica**: puente, jaula, brazos y accionamiento son representaciones paramétricas; sin par,
  potencia ni selección comercial. Secciones representativas ⇒ masas `NOT_EVALUATED`.
- **Hidráulica**: no se calculan rendimientos de SST/DBO₅, purga de lodos ni pérdidas de carga.
- **Fuentes**: rangos de Metcalf & Eddy, Ten States, ISO 1438, Chow, Eurocódigos y EN ISO 14122-2
  transcritos de bibliografía y marcados `TO_VERIFY`. UNE-EN 12255-4 no se ha transcrito.
- **Geometría**: las escotaduras en V se cuentan y calculan pero se dibujan como chapa continua; la
  caja de flotantes y el labio del barredor son un contacto funcional no modelado en detalle.
- **Vista explotada**: prevista, no implementada.
