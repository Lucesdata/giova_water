# Inventario de parámetros y dependencias — SPEC-DEC-001/002

Primer entregable del orden de trabajo (spec §15). Documenta qué entra, qué se decide, qué se calcula
y qué componente depende de qué. La versión ejecutable de la tabla de dependencias está en
`packages/equipment-library/src/primary-clarifier/definition/components.ts` (`COMPONENT_DEPENDENCIES`),
y la trazabilidad completa de cada valor calculado se obtiene en tiempo de ejecución
(`design.values[clave].inputs`, `CalcTrace.dependenciesOf`).

Convenciones: longitudes en m, cotas `y` respecto al fondo en pared (y = 0), eje Y vertical, ángulos
de entrada en grados (convertidos a rad en el motor), caudales de entrada en L/s.

## 1. Tipos de magnitud

| Tipo | Qué es | Dónde vive | Se congela en modos B/C |
|---|---|---|---|
| **Entrada** (`input.*`) | Dato del proyectista, validado por esquema (nivel 1) | `DesignInput` (zod) | — |
| **Criterio** | Límite de aceptación con fuente | Perfil de diseño + `criteriaOverrides` | — |
| **Decisión** (`decision.*`) | Valor que el motor elige (diámetro adoptado, DN…) | `SizingDecisions` | Sí |
| **Valor calculado** | Consecuencia de entradas y decisiones | `CalcTrace` | No (se recalcula) |
| **Regla de modelado** | Convención geométrica sin valor normativo | `MODELLING_RULES`, `MECH_RULES`, `DEFLECTOR_RULES` | — |

## 2. Entradas

### 2.1 Bases de diseño (spec §4.1)

| Clave | Símbolo | Unidad | Obligatoria | Uso |
|---|---|---|---|---|
| `flow.averageLps` | Qmed | L/s | sí | Superficie, TRH, CLV media |
| `flow.peak` = `{method:'factor', factor}` **o** `{method:'direct', peakLps}` | Fp / Qmax | — / L/s | sí, una sola forma | Superficie en punta, conducciones, vertedero, canal |
| `influent.tssMgL`, `bod5MgL`, `temperatureC` | SSTin, DBOin, T | mg/L, °C | no | Dato técnico; V1 no calcula rendimientos |
| `designCriteria.surfaceLoadingAvgM_h` | CHSmed | m³/(m²·h) | sí | Área requerida a Qmed |
| `designCriteria.surfaceLoadingPeakM_h` | CHSmax | m³/(m²·h) | no | Área requerida a Qmax |
| `designCriteria.hrtTargetMinH` | TRH | h | no | Comprobación (no dimensiona) |
| `designCriteria.weirLoadingMaxM3_md` | CLV | m³/(m·d) | no | Comprobación a Qmax |
| `geometry.sideWaterDepthM` | H | m | sí | Volumen, cotas, pozo, puente |
| `profileId` | — | — | sí | Selecciona criterios y estado de aprobación |
| `criteriaOverrides.<criterio>` | — | — | no | Criterio adicional; exige `sourceId` y `note` |

### 2.2 Geometría, obra civil, hidráulica de componentes y mecánica

| Grupo | Claves | Observación |
|---|---|---|
| `geometry` | `diameterRoundingStepM`, `minDiameterM`, `adoptedDiameterM?`, `freeboardM`, `floorSlope`, `slopeStartRadiusM?`, `sumpDiameterM`, `sumpDepthM`, `sludgeBlanketDepthM?`, `excludeFeedwellFromEffectiveVolume` | `adoptedDiameterM` < requerido ⇒ FAIL, nunca se corrige. `sludgeBlanketDepthM` (sobre y = 0) descuenta tolva + capa del volumen efectivo |
| `civil` | `wallThicknessM`, `baseSlabThicknessM`, `slabProjectionM`, `minFillThicknessM`, `sumpWallThicknessM`, `launderWidthM`, `launderDepthM`, `channelWallThicknessM`, `channelFloorThicknessM`, `concrete`, `fillConcrete`, `thicknessStatus`, `structuralVerificationRef?` | Espesores **explícitos**; no escalan con D. `PRELIMINARY_UNVERIFIED` ⇒ `STR-THICKNESS` crítica NOT_EVALUATED |
| `hydraulics` | velocidades máx./mín. de entrada, ventanas y efluente; nº de ventanas; espesores de columna, chapas y tubos; `feedwellDiameterRatio`, `feedwellMinDiameterM`, `feedwellDepthM`; DN mínimo, velocidad y fracción de caudal de lodos; escotaduras (`vNotchAngleDeg`, `notchSpacingM`, `notchDepthM`, `weirCd`); `weirExclusionLengthM`; `launderFreeFallMinM`; materiales | Las velocidades son criterios del proyectista (fuente `USER`) |
| `mechanical` | `bridgeType` (explícito, no se infiere de D), anchura, canto y apoyo del puente, gálibo mínimo, nº de brazos, canto de celosía, holguras (muro, fondo, jaula, pozo, barredor), paletas (altura, longitud, ángulo), deflector y caja de flotantes, accionamiento (envolvente), materiales | Representación paramétrica: no dimensiona para fabricación |
| `site` | `groundLevelM?`, `excavationWorkingSpaceM`, `groundwaterLevelM?` | Sin cota de terreno no se mide excavación; sin freático no se evalúa flotación |
| `meshResolution` | `circularSegments` | Solo render; no afecta a mediciones (Pappus exacto) |

## 3. Decisiones de dimensionamiento (`SizingDecisions`)

| Decisión | Regla en modo A | Grupo de redimensionamiento |
|---|---|---|
| `diameterM` | `⌈max(√(4·max(Amed, Amax)/π), Dmín)/paso⌉·paso`, o `adoptedDiameterM` | `tank` |
| `sideWaterDepthM` | = entrada H | `tank` |
| `inletDn` | menor DN (ISO 6708) con v(Qmax) ≤ vmax | `inlet` |
| `portHeightM` | Qmax / (vmax,ventana · n · b) | `inlet` |
| `feedwellDiameterM` | max(k · D, Dpozo,mín) | `feedwell` |
| `notchCount` | ⌊Lef / paso⌋ | `weir` |
| `effluentDn` | menor DN con v(Qmax) ≤ vmax | `effluent` |
| `sludgeDn` | max(DNmín, menor DN con v ≤ vdiseño) | `sludge` |

Modo B congela todas; modo C congela las de los grupos no permitidos y añade la comprobación
`MODE-C-CONSTRAINTS`, que enumera los criterios que las restricciones impiden cumplir.

## 4. Cadena de cálculo (spec §5)

```
Qmed[L/s] ─3,6→ Qmed[m³/h] ─┬─ /CHSmed → Amed ─┐
Qmax = Fp·Qmed (o dato) ─────┴─ /CHSmax → Amax ─┴→ A = max → D = √(4A/π) → D adoptado
Qmed[m³/d] · SST/1000 ─→ carga de SST [kg/d] ─ /A → SLR = Q·Cs/A (media y punta; indicador)
D, H, s, rs, rp ─→ Vcil + Vfondo = Vbruto ─ Vcolumna ─ Vpozo ─ Vmanto = Vef → TRH = Vef / Q
D, e_chapa ─→ L = 2π(R − e/2) ─ Lexcl = Lef → CLV = Qdiario / Lef ; n escotaduras → h(Qmax) → lámina
Qmax/2, b canal ─→ y₀ = √3·yc → resguardo de caída libre
Qmax ─→ DN entrada → columna → ventanas → deflectores
D, H, H_pozo, holguras ─→ jaula, brazos (siguen la pendiente), paletas, barredor, puente
```

## 5. Dependencias de componentes (spec §6.3)

| Componente | Depende de | Cambia con Q |
|---|---|---|
| CIV-001 Losa | D, espesor de muro, espesor de losa, vuelo, relleno mínimo, pendiente, poceta | sí (vía D) |
| CIV-002 Muro | D, H, espesor de muro, relleno mínimo, pendiente | sí (D) |
| CIV-003 Fondo | D, pendiente, rs, poceta, relleno mínimo | sí (D) |
| CIV-004 Poceta | Ø y profundidad de poceta, espesor, pendiente, D, DN lodos (pasamuros) | según DN lodos / D |
| CIV-005 Canal | D, H, ancho y profundidad de canal, espesores, resguardo | sí (D) |
| HYD-001 Entrada | DN entrada, ventanas, D (longitud enterrada) | sí |
| HYD-002 Pozo | Ø pozo (k·D o mínimo), profundidad, H, tipo de puente (cuelgues) | según mínimo |
| HYD-003 Deflectores | DN entrada, ventanas | sí (DN) |
| HYD-004 Vertedero | D, nº escotaduras, H | sí |
| HYD-005 Efluente | DN efluente, D, canal | sí |
| HYD-006 Lodos | DN lodos, poceta, D | normalmente no (DN mínimo) |
| MEC-001 Puente | tipo (explícito), D, canal, resguardo | sí (luz) |
| MEC-002 Accionamiento | envolvente (dato), tipo de puente | no |
| MEC-003 Jaula | DN entrada (columna), semiancho, H, cota del tablero | sí |
| MEC-004 Brazos | D, pendiente, nº de brazos, canto | sí |
| MEC-005 Paletas | D, pendiente, longitud, holgura | sí |
| MEC-006 Flotantes | D, Ø pozo, desplazamiento del deflector | sí |
| Espesores estructurales | **dato**; no dependen de Q en V1 | no (pendiente de cálculo estructural) |

La regeneración selectiva se basa en el hash de geometría de cada componente: solo se
reconstruyen los componentes cuyo hash cambia (`diffAssemblies`, `SceneSync`). Ejemplo verificado por
test: cambiar el DN mínimo de lodos solo regenera CIV-004 y HYD-006.

## 6. Criterios y fuentes

| Perfil | Criterios | Tratamiento |
|---|---|---|
| `didactic` | ninguno (CHS = 1,5 m/h solo como entrada) | resto NOT_EVALUATED |
| `conceptual` | Metcalf & Eddy 5.ª ed. (CHS, TRH, CLV, H, pendiente, pozo, D) | WARNING fuera de banda |
| `preliminary-hydraulic` | M&E con máximos duros + Ten States (CLV) + EN ISO 14122-2 (pasarela) | FAIL / WARNING |
| `project-criteria` | vacío por diseño | exige `criteriaOverrides` con fuente |
| `existing-evaluation` | igual que preliminar, para el modo B | FAIL / WARNING |

Todas las fuentes bibliográficas están marcadas `TO_VERIFY`: se transcribieron de la bibliografía
y deben contrastarse con la edición citada antes de usarlas en proyecto. **No se ha transcrito
ningún valor de UNE-EN 12255-4:2023**; sus requisitos deben introducirse como criterios de proyecto.

## 6 bis. Datos de operación (contrato, V1.1)

`operations/record.ts` define el formato `engineering-objects/primary-clarifier-operational-record`
(v1) para que una extensión aporte datos medidos sin tocar la definición del equipo:

| Variable | Unidad | Se compara con |
|---|---|---|
| `flowLps` | L/s | `flow.avg.Ls` / `flow.peak.Ls` |
| `influentTssMgL`, `effluentTssMgL` | mg/L | — (eliminación observada) |
| `influentBod5MgL`, `effluentBod5MgL` | mg/L | — (eliminación observada) |
| `influentTurbidityNtu`, `effluentTurbidityNtu` | NTU | — |
| `temperatureC` | °C | `input.influent.temperatureC` |
| `sludgeBlanketDepthM` | m (sobre y = 0) | `input.geometry.sludgeBlanketDepthM`, `level.feedwellBottom` |
| `sludgeWithdrawalM3h` | m³/h | `sludge.flow` |
| `sludgeSolidsPercent` | % | — |

`readAgainstDesign` solo hace aritmética sobre datos medidos; no diagnostica ni modifica la variante:

- `flowLps` y `sludgeBlanketDepthM`: lecturas con estado (dentro / fuera de diseño).
- Resto de variables con referencia de diseño (SST y DBO₅ de entrada, temperatura, purga): lectura
  `INFORMATIVE` observado frente a diseño; si la variante no define ese valor, se indica.
- Pares entrada/salida de SST y DBO₅: eliminación observada (`INFORMATIVE`).

## 7. Reglas de modelado (no normativas)

| Regla | Valor | Motivo |
|---|---|---|
| `portWidthToPitch` | 0,5 | Ventana = 50 % del paso circunferencial |
| `portMarginInFeedwellM` | 0,10 m | Margen de ventanas dentro del pozo |
| `feedwellTopAboveWaterM`, `baffleTopAboveWaterM` | 0,15 m | Coronación sobre lámina en punta |
| `buriedPipeCoverM` | 0,30 m | Separación tubería enterrada – hormigón |
| `cageMemberM`, `chordSection` | 0,08 m | Sección representativa (no resistente) |
| `bladeThicknessM` | 6 mm | Chapa de paleta |
| `bladeRadialOverlap` | 10 % | Solape radial entre paletas |
| `handrailHeight` | 1,1 m | Representación de barandilla |
| Deflectores | desplazamiento 0,5·b, 1,5·b × 1,5·h | Representación |

## 8. Pendiente (NOT_EVALUATED explícito)

Estructura (espesores, fisuración/estanqueidad EN 1992-3, geotecnia, flotación, armaduras);
mecánica (puente, par/potencia del accionamiento, jaula/brazos/paletas, aptitud para fabricación,
interacción barredor–playa); hidráulica de purga de lodos; rendimientos de eliminación de SST/DBO₅ previstos;
criterio con fuente para la carga de sólidos en primarios (la SLR se calcula, pero no hay límite por defecto).
