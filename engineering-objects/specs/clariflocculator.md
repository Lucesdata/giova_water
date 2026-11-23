# Clarifloculador circular — parámetros, cálculo y criterios

Segundo objeto de la biblioteca (`packages/equipment-library/src/clariflocculator/`). Es un tanque
circular de alimentación central con **floculación mecánica en una cámara central** y
**sedimentación en la corona exterior**, típico de potabilización con agua coagulada.

> **Ningún resultado es un diseño aprobado.** Las fuentes de los criterios están marcadas
> `TO_VERIFY`; los espesores estructurales y la mecánica (rascador, agitador y sus accionamientos)
> quedan como verificaciones críticas sin evaluar (estado `INCOMPLETE`).

## 1. Arquitectura: qué es común y qué es propio

El motor del decantador primario se generalizó como **motor de tanque circular** con una
*estrategia de zona central* (`CentralZoneStrategy`):

| Etapa | Decantador primario | Clarifloculador |
|---|---|---|
| Superficie y diámetro | `A = Q / CHS` sobre la superficie **bruta** | `As = Q / CHS` sobre la **corona**; `D = √(4·(As + π·Df²/4)/π)` |
| Zona central | Pozo de alimentación `k·D` (con mínimo constructivo) | Cámara de floculación `V = Q·tf` |
| Resto (columna, ventanas, vertedero, canal, lodos, volúmenes, obra civil, puente, rascador, flotantes, mediciones, comprobaciones) | común | común |

La refactorización no cambió ni un bit las salidas del decantador: los ejemplos versionados de
`examples/output/DEC-*` se reproducen exactamente (prueba `tests/examples.test.ts`).

El ciclo de vida de variantes (modos BASE/A/B/C, exportación/importación con control de
integridad, biblioteca y comparación) es común: `src/shared/variants.ts`, parametrizado por una
`EquipmentDefinition`.

## 2. Entradas propias (`flocculation`)

| Clave | Unidad | Uso |
|---|---|---|
| `designFlow` | `average` \| `peak` | Caudal con el que se dimensiona el volumen de floculación |
| `detentionTimeMin` | min | Tiempo de floculación de diseño |
| `chamberDepthM` | m | Profundidad de la cámara bajo la cresta |
| `chamberWallThicknessM`, `chamberMinInnerDiameterM` | m | Virola y mínimo constructivo |
| `velocityGradientS` | s⁻¹ | G de diseño |
| `designTemperatureC` | °C | Viscosidad y densidad del agua (explícita: suele gobernar la mínima de invierno) |
| `paddles.tipSpeedM_s` | m/s | Velocidad periférica de la paleta más exterior (operación, regulable) |
| `paddles.relativeVelocityFactor` | — | Velocidad relativa agua–paleta (hipótesis habitual 0,75) |
| `paddles.dragCoefficient` | — | CD de la paleta (depende de su esbeltez) |
| `paddles.armCount`, `bladeWidthM`, `bladeHeightRatio`, `bladeThicknessM` | — / m | Geometría de las paletas |
| `paddles.wallClearanceM`, `sleeveClearanceM`, `sleeveWallThicknessM` | m | Holguras y tubo de giro |
| `paddles.maxRings` | — | Máximo de anillos por brazo antes de declarar FAIL |
| `drive.footprintM`, `drive.heightM` | m | Envolvente del accionamiento |
| `materials.chamber`, `materials.paddles` | — | Catálogo técnico |

Los criterios de sedimentación son `designCriteria.settlingLoadingAvgM_h` (y punta), evaluados sobre
la corona. Caudal, geometría, obra civil, hidráulica (sin `feedwell*`) y mecánica del rascador son los
mismos bloques que en el decantador.

Los criterios del pozo de alimentación del decantador (`feedwellDiameterRatio`, `feedwellDepth`) no
aplican: el motor nunca los evalúa, así que `criteriaOverrides` los rechaza con un error explícito.

## 3. Cadena de cálculo

```
Q(diseño) · tf ─→ Vf,req → Af = Vf / hf → Df,int = √(4·(Af + π·rc²)/π) → Df = Df,int + 2e   [decisión feedwellDiameterM]
Qmed / CHSmed (y punta) ─→ As → D = √(4·(As + π·Df²/4)/π) → redondeo                          [decisión diameterM]
As,real = π·(D² − Df²)/4 → CHS real, carga de sólidos sobre la corona
Vf = π·(rf,int² − rc²)·hf → tf real (diseño y punta)
μ(T), ρ(T) (CRC Handbook) → P = G²·μ·Vf
ω = vpunta / rpunta;  P(anillo j) = narm · ½·CD·ρ·b·hp·(k·ω·rj)³  → menor nº de anillos con ΣP ≥ P   [decisión paddleRings]
G real = √(ΣP / (μ·Vf));  Gt = G·tf;  Ap / (2·rf,int·hp)
```

Las paletas se colocan desde la pared hacia el centro con paso radial `2·b`
(`FLOC_RULES.ringPitchToBladeWidth`, regla de modelado). Su esquina exterior respeta la holgura
a la pared; el tubo de giro va por fuera de la jaula del rascador.

## 4. Decisiones y grupos de redimensionamiento

| Decisión | Grupo |
|---|---|
| Comunes (`diameterM`, `inletDn`, `notchCount`, …) | como en el decantador |
| `feedwellDiameterM` = diámetro exterior de la cámara | `feedwell` |
| `paddleRings` | `flocculator` (nuevo) |

En los modos B y C: profundidad, espesor y mínimo de la cámara exigen `feedwell`; la geometría de
paletas y accionamiento, `flocculator`. Tiempo de floculación, G, temperatura y **velocidad periférica**
son criterios u operación: pueden cambiarse con todo bloqueado (en modo B, más velocidad ⇒ más G).

## 5. Perfiles y fuentes

| Perfil | Criterios | Fuente (todas `TO_VERIFY`) |
|---|---|---|
| `didactic` | ninguno | — |
| `water-reference` | tf ≥ 30 min (duro) | Ten States Standards — Water Works, 2018 |
| | 0,15 ≤ vpunta ≤ 0,91 m/s (duro) | Ten States Standards — Water Works, 2018 |
| | G 10–75 s⁻¹ (banda) | MWH, *Water Treatment: Principles and Design*, 3.ª ed. |
| | Gt 10⁴–10⁵ (banda) | MWH, 3.ª ed. |
| | CHS corona 1,0–2,4 m/h (banda) | Ontario Design Guidelines for Drinking-Water Systems, 2008 |
| | Pasarela ≥ 0,6 m | EN ISO 14122-2 |
| `project-criteria` | vacío (exige `criteriaOverrides` con fuente) | — |

La relación área de paletas / sección no tiene criterio por defecto (se calcula; admite override).
Viscosidad y densidad del agua: CRC Handbook of Chemistry and Physics, tabla 0–40 °C.

## 6. Componentes

Los 17 del tanque circular (HYD-002 pasa a ser **Cámara de floculación**) más:

| ID | Componente | Movimiento |
|---|---|---|
| MEC-007 | Agitador de paletas de floculación (tubo de giro, brazos, paletas) | rotación, 1 GDL, independiente del rascador |
| MEC-008 | Accionamiento del floculador (anular alrededor de MEC-002) | salida giratoria |

Comprobaciones geométricas propias: `GEO-SLEEVE-CAGE`, `GEO-SLEEVE-BRIDGE` (el tubo de giro pasa
entre las vigas del puente), `GEO-FLOC-DRIVE-DECK` (el reductor anular apoya sobre el tablero),
`GEO-PADDLES-WALL`, `GEO-PADDLES-SLEEVE`, `GEO-PADDLES-VERTICAL`, `GEO-PADDLES-FIT`,
`GEO-SETTLING-ANNULUS`. Si no cabe ningún anillo de paletas no se generan brazos; con anillos fijados
que no caben, la traza `floc.paddle.rings` da los construidos y `GEO-PADDLES-FIT` explica la diferencia. Pendientes críticas propias:
`MEC-FLOC-DRIVE` (par, reductor, variador), `MEC-FLOC-STRUCTURE`.

## 7. Ejemplos (`examples/output/`)

| Variante | Modo | Estado | Nota |
|---|---|---|---|
| CLF-010 | BASE | INCOMPLETE | 10 L/s, Fp 1,5; Vf 27 m³, D 6,7 m, G ≈ 46 s⁻¹, 3,4 rpm; puente de 1,6 m para alojar tubo de giro y reductor |
| CLF-020 | A | INCOMPLETE | 20 L/s; la jaula se agranda a 0,30 m porque los deflectores de la columna mayor no cabían en la de 0,22 m |
| CLF-010-EVAL-15 | B | FAILED | El equipo de 10 L/s a 15 L/s da tf = 20 min < 30 min |
