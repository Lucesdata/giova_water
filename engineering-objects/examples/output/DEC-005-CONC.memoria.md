# Memoria de cálculo preliminar — DEC-005-CONC

Decantador primario 5 L/s — prediseño conceptual

> **Documento generado automáticamente. No es un proyecto aprobado.** Las verificaciones estructurales y mecánicas pendientes se enumeran en la sección 7.

## 1. Identificación

| Campo | Valor |
|---|---|
| objectId | `primary-clarifier/circular-center-feed:DEC-005-CONC` |
| variantId | `DEC-005-CONC@42e0059e6c` |
| parentVariantId | — |
| Modo | BASE |
| createdAt | 2026-11-22T00:00:00.000Z |
| outputsHash | `f83bb280634b1d1d` |
| Versión de esquema | 1.0.0 |
| Modelo de cálculo | PC-ENG-1.0.0 |
| Estado de validación | **INCOMPLETE** |

## 2. Perfil de diseño: Prediseño conceptual

Encaje inicial de dimensiones con rangos típicos de bibliografía. (aprobación: REFERENCE_RANGES).

- Los rangos bibliográficos se tratan como bandas orientativas: fuera de ellas se emite WARNING, nunca FAIL.
- La superficie se dimensiona con la mayor de las áreas requeridas a caudal medio y punta.
- Los valores de bibliografía están marcados TO_VERIFY hasta contrastarlos con la edición citada.

| Criterio | Restricción | Fuente | Nota |
|---|---|---|---|
| surfaceLoadingAvg | recomendado 1.250…2.083 | METCALF-EDDY-2014 | 30–50 m³/(m²·d) |
| surfaceLoadingPeak | recomendado 3.333…5 | METCALF-EDDY-2014 | 80–120 m³/(m²·d) |
| hrtAvg | recomendado 1.500…2.500 | METCALF-EDDY-2014 |  |
| weirLoadingPeak | recomendado —…500 | METCALF-EDDY-2014 | Rango típico 125–500 m³/(m·d); cargas bajas no son desfavorables. |
| sideWaterDepth | recomendado 3…4.900 | METCALF-EDDY-2014 |  |
| floorSlope | recomendado 0.0625…0.167 | METCALF-EDDY-2014 | 1/16 a 1/6 |
| feedwellDiameterRatio | recomendado 0.150…0.200 | METCALF-EDDY-2014 |  |
| feedwellDepth | recomendado 1…2.500 | METCALF-EDDY-2014 |  |
| diameter | recomendado 3…60 | METCALF-EDDY-2014 |  |

## 3. Datos de entrada

```json
{
  "tag": "DEC-005-CONC",
  "name": "Decantador primario 5 L/s — prediseño conceptual",
  "profileId": "conceptual",
  "flow": {
    "averageLps": 5,
    "peak": {
      "method": "factor",
      "factor": 2.5
    }
  },
  "influent": {
    "tssMgL": 250,
    "bod5MgL": 220,
    "temperatureC": 15
  },
  "designCriteria": {
    "surfaceLoadingAvgM_h": 1.5,
    "surfaceLoadingPeakM_h": 4,
    "hrtTargetMinH": 1.5,
    "weirLoadingMaxM3_md": 250
  },
  "criteriaOverrides": {},
  "geometry": {
    "sideWaterDepthM": 3,
    "diameterRoundingStepM": 0.1,
    "minDiameterM": 0,
    "freeboardM": 0.5,
    "floorSlope": 0.08333333333333333,
    "sumpDiameterM": 0.8,
    "sumpDepthM": 0.6,
    "excludeFeedwellFromEffectiveVolume": true
  },
  "civil": {
    "wallThicknessM": 0.3,
    "baseSlabThicknessM": 0.35,
    "slabProjectionM": 0.3,
    "minFillThicknessM": 0.1,
    "sumpWallThicknessM": 0.25,
    "launderWidthM": 0.4,
    "launderDepthM": 0.35,
    "channelWallThicknessM": 0.2,
    "channelFloorThicknessM": 0.2,
    "concrete": "CONC-C30/37-XC4-XA1",
    "fillConcrete": "CONC-C20/25-FILL",
    "thicknessStatus": "PRELIMINARY_UNVERIFIED"
  },
  "hydraulics": {
    "inletMaxVelocityM_s": 1.5,
    "inletMinVelocityM_s": 0.5,
    "portMaxVelocityM_s": 0.3,
    "columnPortCount": 4,
    "columnWallThicknessM": 0.008,
    "feedwellDiameterRatio": 0.18,
    "feedwellMinDiameterM": 1,
    "feedwellDepthM": 1,
    "feedwellPlateThicknessM": 0.005,
    "effluentMaxVelocityM_s": 1.5,
    "sludgePipeMinDn": 150,
    "sludgeDesignVelocityM_s": 1,
    "sludgeFlowFraction": 0.01,
    "pipeWallThicknessM": 0.008,
    "vNotchAngleDeg": 90,
    "notchSpacingM": 0.2,
    "notchDepthM": 0.05,
    "weirCd": 0.58,
    "weirPlateThicknessM": 0.005,
    "weirExclusionLengthM": 0,
    "launderFreeFallMinM": 0.05,
    "materials": {
      "plates": "SS-1.4301",
      "pipes": "PE-HD-PE100"
    }
  },
  "mechanical": {
    "bridgeType": "full-span",
    "bridgeWidthM": 0.8,
    "bridgeGirderDepthM": 0.3,
    "bridgeBearingHeightM": 0.1,
    "bridgeClearanceAboveWaterMinM": 0.3,
    "armCount": 2,
    "armTrussDepthM": 0.4,
    "armWallClearanceM": 0.05,
    "bladeHeightM": 0.3,
    "bladeFloorClearanceM": 0.03,
    "bladeLengthM": 0.6,
    "bladeAngleDeg": 30,
    "cageHalfWidthM": 0.22,
    "cageColumnClearanceM": 0.05,
    "feedwellArmClearanceMinM": 0.3,
    "skimmerClearanceM": 0.1,
    "scumBaffleOffsetM": 0.3,
    "scumBaffleDepthM": 0.3,
    "scumBoxLengthM": 0.3,
    "scumBoxWidthM": 0.4,
    "walkwayClearWidthMinM": 0.6,
    "driveFootprintM": 0.8,
    "driveHeightM": 0.7,
    "materials": {
      "bridge": "STEEL-S275JR-HDG",
      "mechanism": "STEEL-S275JR-HDG",
      "submerged": "SS-1.4301",
      "wipers": "EPDM-WIPER"
    }
  },
  "site": {
    "groundLevelM": 3.2,
    "excavationWorkingSpaceM": 0.5
  },
  "meshResolution": {
    "circularSegments": 96
  }
}
```

## 4. Cálculos (trazabilidad)

| Clave | Magnitud | Valor | Unidad | Ecuación / regla | Depende de | Origen |
|---|---|---:|---|---|---|---|
| `flow.avg.Ls` | Caudal medio | 5 | L/s | Qmed (dato) | `input.flow.averageLps` | INPUT |
| `flow.avg.m3h` | Caudal medio | 18 | m³/h | Q[m³/h] = 3,6 · Q[L/s] | `flow.avg.Ls` | CALCULATED |
| `flow.avg.m3d` | Caudal medio diario | 432.0 | m³/d | Q[m³/d] = 24 · Q[m³/h] | `flow.avg.m3h` | CALCULATED |
| `flow.peak.Ls` | Caudal punta | 12.500 | L/s | Qmax = Fp · Qmed | `flow.avg.Ls`, `input.flow.peak.factor` | CALCULATED |
| `flow.peak.m3h` | Caudal punta | 45 | m³/h | Q[m³/h] = 3,6 · Q[L/s] | `flow.peak.Ls` | CALCULATED |
| `flow.peak.m3d` | Caudal punta en base diaria | 1080 | m³/d | Q[m³/d] = 24 · Q[m³/h] | `flow.peak.m3h` | CALCULATED |
| `area.required.avg` | Superficie requerida a caudal medio | 12 | m² | A = Qmed / CHSmed | `flow.avg.m3h`, `input.designCriteria.surfaceLoadingAvgM_h` | CALCULATED |
| `area.required.peak` | Superficie requerida a caudal punta | 11.250 | m² | A = Qmax / CHSmax | `flow.peak.m3h`, `input.designCriteria.surfaceLoadingPeakM_h` | CALCULATED |
| `area.required` | Superficie requerida (gobierna caudal medio) | 12 | m² | A = max(Amed, Amax) | `area.required.avg`, `area.required.peak` | CALCULATED |
| `tank.diameter.theoretical` | Diámetro hidráulico teórico | 3.909 | m | D = √(4A/π) | `area.required` | CALCULATED |
| `tank.diameter` | Diámetro interior hidráulico adoptado | 4 | m | D = ⌈max(Dteórico, Dmín) / paso⌉ · paso | `tank.diameter.theoretical`, `input.geometry.diameterRoundingStepM`, `input.geometry.minDiameterM` | ADOPTED |
| `tank.area` | Superficie libre adoptada | 12.566 | m² | A = π·D²/4 | `tank.diameter` | CALCULATED |
| `loading.surface.avg` | Carga superficial real a caudal medio | 1.432 | m³/(m²·h) | CHS = Qmed / A | `flow.avg.m3h`, `tank.area` | CALCULATED |
| `loading.surface.peak` | Carga superficial real a caudal punta | 3.581 | m³/(m²·h) | CHS = Qmax / A | `flow.peak.m3h`, `tank.area` | CALCULATED |
| `tank.depth` | Profundidad útil en pared (fondo → cresta) | 3 | m | H (dato) | `input.geometry.sideWaterDepthM` | INPUT |
| `floor.slopeStartRadius` | Radio de comienzo de la pendiente | 2 | m | rs = D/2 | `tank.diameter`, `input.geometry.slopeStartRadiusM` | CALCULATED |
| `floor.dropAtSump` | Descenso del fondo hasta el borde de la poceta | 0.133 | m | Δy = s · (rs − rp) | `floor.slopeStartRadius`, `input.geometry.floorSlope`, `input.geometry.sumpDiameterM` | CALCULATED |
| `level.sumpBottom` | Cota del fondo de la poceta | -0.733 | m | y = −Δy − hp | `floor.dropAtSump`, `input.geometry.sumpDepthM` | CALCULATED |
| `inlet.dn` | DN de la tubería de entrada | 125 | mm | menor DN (ISO 6708) con v(Qmax) ≤ vmax | `flow.peak.m3h`, `input.hydraulics.inletMaxVelocityM_s` | ADOPTED |
| `inlet.velocity.peak` | Velocidad en la entrada a caudal punta | 1.019 | m/s | v = Qmax / (π·DN²/4) | `inlet.dn`, `flow.peak.m3h` | CALCULATED |
| `inlet.velocity.avg` | Velocidad en la entrada a caudal medio | 0.407 | m/s | v = Qmed / (π·DN²/4) | `inlet.dn`, `flow.avg.m3h` | CALCULATED |
| `column.outerRadius` | Radio exterior de la columna central | 0.0705 | m | rc = DN/2 + e | `inlet.dn`, `input.hydraulics.columnWallThicknessM` | CALCULATED |
| `feedwell.diameter` | Diámetro del pozo de alimentación | 1 | m | Dpa = max(k · D, Dpa,mín constructivo) | `tank.diameter`, `input.hydraulics.feedwellDiameterRatio`, `input.hydraulics.feedwellMinDiameterM` | ADOPTED ⚠ Gobierna el diámetro mínimo constructivo, no la proporción hidráulica. |
| `level.feedwellBottom` | Cota inferior del pozo de alimentación | 2 | m | y = H − hpa | `tank.depth`, `input.hydraulics.feedwellDepthM` | CALCULATED |
| `feedwell.downwardVelocity.peak` | Velocidad descendente en el pozo a caudal punta | 0.0166 | m/s | v = Qmax / (π·(rpa,int² − rc²)) | `flow.peak.m3h`, `feedwell.diameter`, `column.outerRadius` | CALCULATED |
| `column.portWidth` | Anchura de ventana de la columna | 0.0554 | m | b = 0,5 · 2π·rc / n (regla de modelado) | `column.outerRadius`, `input.hydraulics.columnPortCount` | CALCULATED |
| `column.portHeight` | Altura de ventana de la columna | 0.188 | m | h = Qmax / (vmax · n · b) | `flow.peak.m3h`, `input.hydraulics.portMaxVelocityM_s`, `column.portWidth` | CALCULATED |
| `column.portVelocity.peak` | Velocidad en ventanas a caudal punta | 0.300 | m/s | v = Qmax / (n · b · h) | `column.portHeight`, `column.portWidth`, `flow.peak.m3h` | CALCULATED |
| `weir.length.gross` | Longitud bruta de vertedero | 12.551 | m | L = 2π·(R − e/2) | `tank.diameter`, `input.hydraulics.weirPlateThicknessM` | CALCULATED |
| `weir.length.effective` | Longitud efectiva de vertedero | 12.551 | m | Lef = L − Lexcl | `weir.length.gross`, `input.hydraulics.weirExclusionLengthM` | CALCULATED |
| `loading.weir.avg` | Carga lineal de vertedero a caudal medio | 34.420 | m³/(m·d) | CLV = Qdiario / Lef | `flow.avg.m3d`, `weir.length.effective` | CALCULATED |
| `loading.weir.peak` | Carga lineal de vertedero a caudal punta | 86.051 | m³/(m·d) | CLV = Qmax,diario / Lef | `flow.peak.m3d`, `weir.length.effective` | CALCULATED |
| `weir.notchCount` | Número de escotaduras en V | 62 | — | n = ⌊Lef / paso⌋ | `weir.length.effective`, `input.hydraulics.notchSpacingM` | ADOPTED |
| `weir.head.peak` | Carga sobre escotaduras a caudal punta | 0.0293 | m | h = [q / (Cd·8/15·√(2g)·tan(θ/2))]^(2/5) | `weir.notchCount`, `flow.peak.m3h`, `input.hydraulics.weirCd`, `input.hydraulics.vNotchAngleDeg` | CALCULATED |
| `weir.head.avg` | Carga sobre escotaduras a caudal medio | 0.0203 | m | h = [q / (Cd·8/15·√(2g)·tan(θ/2))]^(2/5) | `weir.notchCount`, `flow.avg.m3h`, `input.hydraulics.weirCd`, `input.hydraulics.vNotchAngleDeg` | CALCULATED |
| `level.water.avg` | Cota de lámina a caudal medio | 3.020 | m | y = H + hmed | `tank.depth`, `weir.head.avg` | CALCULATED |
| `level.water.peak` | Cota de lámina a caudal punta | 3.029 | m | y = H + hmax | `tank.depth`, `weir.head.peak` | CALCULATED |
| `launder.upstreamDepth` | Calado aguas arriba en el canal (cada rama, Qmax/2) | 0.0506 | m | y₀ = √3 · (Q² / (g·b²))^(1/3), Q = Qmax/2 | `flow.peak.m3h`, `input.civil.launderWidthM` | CALCULATED |
| `launder.freeFall` | Resguardo de caída libre bajo la cresta | 0.299 | m | Δ = hcanal − y₀ | `launder.upstreamDepth`, `input.civil.launderDepthM` | CALCULATED |
| `effluent.dn` | DN del colector de efluente | 125 | mm | menor DN con v(Qmax) ≤ vmax | `flow.peak.m3h`, `input.hydraulics.effluentMaxVelocityM_s` | ADOPTED |
| `effluent.velocity.peak` | Velocidad en el colector de efluente a caudal punta | 1.019 | m/s | v = Qmax / (π·DN²/4) | `effluent.dn`, `flow.peak.m3h` | CALCULATED |
| `sludge.flow` | Caudal de purga para dimensionar la conducción | 0.180 | m³/h | Qlodo = f · Qmed (hipótesis de prediseño) | `flow.avg.m3h`, `input.hydraulics.sludgeFlowFraction` | CALCULATED |
| `sludge.dn` | DN de la conducción de lodos | 150 | mm | max(DNmín, menor DN con v ≤ v diseño) | `sludge.flow`, `input.hydraulics.sludgePipeMinDn`, `input.hydraulics.sludgeDesignVelocityM_s` | ADOPTED |
| `volume.cylinder` | Volumen cilíndrico sobre el fondo en pared | 37.699 | m³ | V = π·R²·H | `tank.diameter`, `tank.depth` | CALCULATED |
| `volume.floorCone` | Volumen del fondo en pendiente (sin poceta) | 0.693 | m³ | V = 2π·s·[rs·r²/2 − r³/3]rp→rs + π·rp²·s·(rs − rp) | `input.geometry.floorSlope`, `floor.slopeStartRadius`, `input.geometry.sumpDiameterM` | CALCULATED |
| `volume.gross` | Volumen hidráulico bruto | 38.392 | m³ | Vbruto = Vcil + Vfondo | `volume.cylinder`, `volume.floorCone` | CALCULATED |
| `volume.deduction.column` | Deducción: columna central | 0.0489 | m³ | V = π·rc²·(H + Δy) | `column.outerRadius`, `tank.depth`, `floor.dropAtSump` | CALCULATED |
| `volume.deduction.feedwell` | Deducción: interior del pozo de alimentación | 0.754 | m³ | V = π·(rpa,int² − rc²)·hpa | `feedwell.diameter`, `column.outerRadius`, `input.hydraulics.feedwellDepthM` | CALCULATED |
| `volume.effective` | Volumen efectivo de sedimentación | 37.589 | m³ | Vef = Vbruto − Vcolumna − Vpozo (se desprecian chapas y mecanismos) | `volume.gross`, `volume.deduction.column`, `volume.deduction.feedwell` | CALCULATED |
| `volume.sump` | Volumen de la poceta (almacenamiento de lodo, no efectivo) | 0.292 | m³ | V = π·(rp² − rc²)·hp | `input.geometry.sumpDiameterM`, `input.geometry.sumpDepthM`, `column.outerRadius` | CALCULATED |
| `hrt.avg` | TRH a caudal medio | 2.088 | h | TRH = Vef / Qmed | `volume.effective`, `flow.avg.m3h` | CALCULATED |
| `hrt.peak` | TRH a caudal punta | 0.835 | h | TRH = Vef / Qmax | `volume.effective`, `flow.peak.m3h` | CALCULATED |
| `level.slabTop` | Cota superior de la losa | -0.233 | m | y = −Δy − efill,mín | `floor.dropAtSump`, `input.civil.minFillThicknessM` | CALCULATED |
| `level.slabBottom` | Cota inferior de la losa | -0.583 | m | y = ylosa − elosa | `level.slabTop`, `input.civil.baseSlabThicknessM` | CALCULATED |
| `level.pitBottom` | Cota inferior del bloque de la poceta | -0.983 | m | y = min(yp − ep, ylosa,inf) | `level.sumpBottom`, `level.slabBottom`, `input.civil.sumpWallThicknessM` | CALCULATED |
| `civil.wallOuterRadius` | Radio exterior del muro | 2.300 | m | r = R + em | `tank.diameter`, `input.civil.wallThicknessM` | CALCULATED |
| `civil.structuralOuterDiameter` | Diámetro exterior estructural | 4.600 | m | Dext = D + 2·em | `civil.wallOuterRadius` | CALCULATED |
| `civil.channelOuterRadius` | Radio exterior del canal perimetral | 2.900 | m | r = Rext + b + ec | `civil.wallOuterRadius`, `input.civil.launderWidthM`, `input.civil.channelWallThicknessM` | CALCULATED |
| `civil.channelOuterDiameter` | Diámetro exterior del canal de recogida | 5.800 | m | Dcanal = 2·r | `civil.channelOuterRadius` | CALCULATED |
| `civil.slabRadius` | Radio de la losa | 2.600 | m | r = Rext + vuelo | `civil.wallOuterRadius`, `input.civil.slabProjectionM` | CALCULATED |
| `level.channelTop` | Coronación del canal perimetral | 3.500 | m | y = H + resguardo | `tank.depth`, `input.geometry.freeboardM` | CALCULATED |
| `level.inletAxis` | Cota del eje de la tubería de entrada | -1.354 | m | y = min(ylosa,inf, ypoceta,inf) − recubrimiento − rext | `level.slabBottom`, `level.pitBottom`, `inlet.dn` | CALCULATED |
| `bridge.span` | Luz del puente (vano completo) | 5.600 | m | L = 2·rapoyo | `civil.channelOuterRadius`, `input.mechanical.bridgeType` | CALCULATED |
| `level.bridgeDeck` | Cota del tablero del puente | 3.900 | m | y = ycoronación + apoyo + canto | `level.channelTop`, `input.mechanical.bridgeBearingHeightM`, `input.mechanical.bridgeGirderDepthM` | CALCULATED |
| `arm.tipRadius` | Radio de punta de los brazos | 1.950 | m | r = R − holgura | `tank.diameter`, `input.mechanical.armWallClearanceM` | CALCULATED |
| `arm.length` | Longitud de brazo portarrasquetas (en planta) | 1.730 | m | L = rpunta − rjaula | `arm.tipRadius`, `input.mechanical.cageHalfWidthM` | CALCULATED |

Reglas de modelado (no son criterios de diseño):

- `portWidthToPitch` = 0.5
- `portMarginInFeedwellM` = 0.1
- `feedwellTopAboveWaterM` = 0.15
- `baffleTopAboveWaterM` = 0.15
- `buriedPipeCoverM` = 0.3
- `cageMemberM` = 0.08
- `bladeThicknessM` = 0.006
- `effluentDropM` = 0.6

## 5. Inventario de componentes

| ID | Componente | Disciplina | Materiales | Masa | Movimiento | Conexiones |
|---|---|---|---|---|---|---|
| CIV-001 | Losa de cimentación | civil | Hormigón armado HA-30, estructura estanca en contacto con agua residual | 17421.1 kg (estimada) | fixed | 0 |
| CIV-002 | Muro circular | civil | Hormigón armado HA-30, estructura estanca en contacto con agua residual | 32759 kg (estimada) | fixed | 1 |
| CIV-003 | Fondo con pendiente | civil | Hormigón en masa para formación de pendientes | 5254.4 kg (estimada) | fixed | 0 |
| CIV-004 | Poceta central de lodos | civil | Hormigón armado HA-30, estructura estanca en contacto con agua residual | 1860.4 kg (estimada) | fixed | 1 |
| CIV-005 | Canal perimetral | civil | Hormigón armado HA-30, estructura estanca en contacto con agua residual | 12377.9 kg (estimada) | fixed | 3 |
| HYD-001 | Tubería de entrada y columna central | hydraulic | Polietileno de alta densidad PE100; Acero inoxidable austenítico X5CrNi18-10 (AISI 304) | 139.7 kg (estimada) | fixed | 3 |
| HYD-002 | Pozo central de alimentación | hydraulic | Acero inoxidable austenítico X5CrNi18-10 (AISI 304); Acero estructural S275JR galvanizado en caliente | PARTIAL | fixed | 3 |
| HYD-003 | Deflectores de distribución | hydraulic | Acero inoxidable austenítico X5CrNi18-10 (AISI 304) | 3.7 kg (estimada) | fixed | 0 |
| HYD-004 | Vertedero de salida | hydraulic | Acero inoxidable austenítico X5CrNi18-10 (AISI 304) | 109.1 kg (estimada) | fixed | 1 |
| HYD-005 | Colector de efluente | hydraulic | Polietileno de alta densidad PE100 | 8 kg (estimada) | fixed | 2 |
| HYD-006 | Conducción de lodos | hydraulic | Polietileno de alta densidad PE100 | 14 kg (estimada) | fixed | 2 |
| MEC-001 | Puente de soporte | mechanical | Acero estructural S275JR galvanizado en caliente | NOT_EVALUATED | fixed | 5 |
| MEC-002 | Accionamiento mecánico | mechanical | Acero estructural S275JR galvanizado en caliente | NOT_EVALUATED | rotation (1 GDL, eje Y) | 2 |
| MEC-003 | Mecanismo giratorio | mechanical | Acero inoxidable austenítico X5CrNi18-10 (AISI 304) | NOT_EVALUATED | rotation (1 GDL, eje Y) | 3 |
| MEC-004 | Brazos portarrasquetas | mechanical | Acero inoxidable austenítico X5CrNi18-10 (AISI 304) | NOT_EVALUATED | rotation (1 GDL, eje Y) | 5 |
| MEC-005 | Paletas de barrido | mechanical | Acero inoxidable austenítico X5CrNi18-10 (AISI 304) | 68.4 kg (estimada) | rotation (1 GDL, eje Y) | 2 |
| MEC-006 | Sistema de retirada de flotantes | mechanical | Banda de barrido EPDM; Acero inoxidable austenítico X5CrNi18-10 (AISI 304) | PARTIAL | rotation (1 GDL, eje Y) | 1 |

## 6. Mediciones

| Partida | Cantidad |
|---|---:|
| Hormigón estructural CIV-001 | 6.968 m³ |
| Hormigón estructural CIV-002 | 13.104 m³ |
| Hormigón estructural CIV-004 | 0.744 m³ |
| Hormigón estructural CIV-005 | 4.951 m³ |
| **Hormigón estructural total** | **25.767 m³** |
| Hormigón de formación de pendiente | 2.189 m³ |
| Revestimiento CIV-002 cara interior | 37.699 m² |
| Revestimiento CIV-003 fondo | 12.106 m² |
| Revestimiento CIV-004 poceta | 1.995 m² |
| Revestimiento CIV-005 canal | 17.279 m² |
| Excavación | 115.9 m³ |
| Longitud de perfiles/tubos STEEL-S275JR-HDG | 35.841 m |
| Longitud de perfiles/tubos SS-1.4301 | 38.314 m |
| Superficie de protección anticorrosiva (acero al carbono) | 26.532 m² |
| Armaduras | NOT_EVALUATED |

- Volúmenes de hormigón medidos sobre la geometría modelada (Pappus-Guldin), sin descontar pasamuros.
- Las piezas de sección representativa (celosías, vigas del puente, jaula) solo aportan longitud: su masa queda NOT_EVALUATED.
- La superficie de protección anticorrosiva incluye solo acero estructural no inoxidable.
- Armaduras: no se miden sin diseño estructural.
- Excavación de paredes verticales con sobreancho de trabajo; sin taludes ni entibación.

## 7. Validación

Estado global: **INCOMPLETE** — PASS 51 · WARNING 3 · FAIL 0 · NOT_EVALUATED 14

### Nivel 1 — Datos

| Estado | ID | Comprobación | Valor | Límite | Mensaje |
|---|---|---|---:|---|---|
| PASS | `DATA-SCHEMA` | Esquema de entradas |  |  | Entradas válidas (esquema 1.0.0). |
| PASS | `DATA-PEAK-GE-AVG` | Caudal punta ≥ caudal medio | 12.500 L/s | ≥ 5 | Coherente. |

### Nivel 2 — Hidráulica

| Estado | ID | Comprobación | Valor | Límite | Mensaje |
|---|---|---|---:|---|---|
| PASS | `HYD-DIAMETER-GE-REQUIRED` | Diámetro adoptado ≥ requerido | 4 m | ≥ 3.909 | El diámetro cubre la superficie requerida. |
| PASS | `HYD-CHS-AVG-ADMISSIBLE` | CHS media ≤ admisible de diseño | 1.432 m³/(m²·h) | ≤ 1.5 | Cumple la carga admisible adoptada. |
| PASS | `HYD-CHS-PEAK-ADMISSIBLE` | CHS punta ≤ admisible de diseño | 3.581 m³/(m²·h) | ≤ 4 | Cumple la carga admisible adoptada. |
| PASS | `HYD-CHS-AVG-CRITERION` | Carga hidráulica superficial a caudal medio | 1.432 m³/(m²·h) | recomendado 1.25…2.083 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery — 30–50 m³/(m²·d)). |
| PASS | `HYD-CHS-PEAK-CRITERION` | Carga hidráulica superficial a caudal punta | 3.581 m³/(m²·h) | recomendado 3.333…5 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery — 80–120 m³/(m²·d)). |
| PASS | `HYD-DEPTH-CRITERION` | Profundidad útil en pared | 3 m | recomendado 3…4.9 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery). |
| PASS | `HYD-INLET-VMAX` | Velocidad máxima en la entrada | 1.019 m/s | ≤ 1.5 | Cumple. |
| WARNING | `HYD-INLET-VMIN` | Velocidad mínima en la entrada (autolimpieza) | 0.407 m/s | recomendado 0.5…— | A caudal medio la velocidad es inferior a la mínima adoptada: riesgo de sedimentación en la conducción. |
| WARNING | `HYD-FEEDWELL-RATIO` | Diámetro del pozo de alimentación / diámetro del tanque | 0.250 — | recomendado 0.15…0.2 | Fuera de la banda recomendada el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery). |
| PASS | `HYD-FEEDWELL-DEPTH` | Profundidad del pozo de alimentación | 1 m | recomendado 1…2.5 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery). |
| NOT_EVALUATED | `HYD-FEEDWELL-VELOCITY` | Velocidad descendente en el pozo de alimentación a caudal punta | 0.0166 m/s |  | El perfil de diseño no define criterio para esta magnitud. |
| PASS | `HYD-PORT-VELOCITY` | Velocidad de salida por las ventanas | 0.300 m/s | ≤ 0.3 | Cumple. |
| PASS | `HYD-WEIR-LOADING-ADMISSIBLE` | CLV punta ≤ admisible de diseño | 86.051 m³/(m·d) | ≤ 250 | Cumple. |
| PASS | `HYD-WEIR-LOADING-CRITERION` | Carga lineal sobre vertedero a caudal punta | 86.051 m³/(m·d) | recomendado —…500 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery — Rango típico 125–500 m³/(m·d); cargas bajas no son desfavorables.). |
| PASS | `HYD-NOTCH-NOT-DROWNED` | Lámina dentro de la escotadura a caudal punta | 0.0293 m | ≤ 0.05 | Cumple. |
| PASS | `HYD-LAUNDER-FREE-FALL` | Vertido libre al canal perimetral | 0.299 m | ≥ 0.05 | El canal no remansa el vertedero. |
| PASS | `HYD-EFFLUENT-VMAX` | Velocidad en el colector de efluente | 1.019 m/s | ≤ 1.5 | Cumple. |
| PASS | `HYD-SLUDGE-MIN-DN` | DN mínimo de la conducción de lodos | 150 mm | ≥ 150 | Cumple. |
| NOT_EVALUATED | `HYD-SLUDGE-HYDRAULICS` | Hidráulica de purga de lodos |  |  | Pérdidas, carga disponible, bombeo o purga telescópica no evaluados en V1. El caudal de purga es una hipótesis de prediseño. |
| PASS | `HYD-HRT-TARGET` | TRH ≥ objetivo de diseño | 2.088 h | ≥ 1.5 | Cumple. |
| PASS | `HYD-HRT-CRITERION` | Tiempo de retención hidráulico a caudal medio | 2.088 h | recomendado 1.5…2.5 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery). |
| NOT_EVALUATED | `HYD-REMOVAL-EFFICIENCY` | Eficiencia de eliminación de SST y DBO₅ |  |  | V1 conserva la calidad del agua como dato técnico pero no calcula rendimientos (spec §4.1). |
| PASS | `HYD-FREEBOARD-OVER-PEAK` | Coronación sobre la lámina en punta | 0.471 m | > 0 | Cumple. |

### Nivel 3 — Geometría

| Estado | ID | Comprobación | Valor | Límite | Mensaje |
|---|---|---|---:|---|---|
| PASS | `HYD-DIAMETER-RANGE` | Diámetro interior | 4 m | recomendado 3…60 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery). |
| PASS | `GEO-SLOPE-START-INSIDE` | Comienzo de pendiente dentro del tanque | 2 m | ≤ 2.000 | rs ≤ R. |
| PASS | `GEO-SUMP-INSIDE-SLOPE` | Poceta dentro de la zona en pendiente | 0.400 m | < 2.000 | rp < rs. |
| PASS | `GEO-FLOOR-SLOPE-CRITERION` | Pendiente radial del fondo | 0.0833 m/m | recomendado 0.0625…0.1667 | Cumple el criterio (Metcalf & Eddy \| AECOM — Wastewater Engineering: Treatment and Resource Recovery — 1/16 a 1/6). |
| PASS | `GEO-SUMP-CLEAR-OF-COLUMN` | Poceta mayor que la columna central | 0.330 m | > 0 | Queda corona libre para el lodo. |
| PASS | `GEO-FEEDWELL-DEPTH-LT-H` | Pozo de alimentación menos profundo que el tanque | 1 m | < 3 | Cumple. |
| PASS | `GEO-PORTS-INSIDE-FEEDWELL` | Ventanas contenidas en el pozo de alimentación | 0.188 m | ≤ 0.800 | Cumple. |
| PASS | `GEO-WEIR-LENGTH-POSITIVE` | Longitud efectiva de vertedero positiva | 12.551 m | > 0 | Cumple. |
| PASS | `GEO-EFFLUENT-FITS-LAUNDER` | Colector de efluente cabe en el canal | 0.141 m | ≤ 0.4 | El diámetro exterior cabe en la anchura del canal. |
| PASS | `GEO-SLUDGE-FITS-SUMP` | Conducción de lodos cabe en la altura de la poceta | 0.166 m | < 0.6 | Cumple. |
| PASS | `GEO-BRIDGE-CLEARANCE` | Gálibo del puente sobre la lámina en punta | 0.571 m | ≥ 0.3 | Cumple. |
| PASS | `GEO-CAGE-COLUMN` | Holgura jaula giratoria – columna | 0.109 m | ≥ 0.05 | Cumple. |
| PASS | `GEO-CAGE-FEEDWELL` | Holgura jaula giratoria – pozo de alimentación | 0.144 m | ≥ 0.05 | Cumple. |
| PASS | `GEO-FEEDWELL-ARMS` | Holgura pozo de alimentación – brazos | 1.395 m | ≥ 0.3 | Cumple. |
| PASS | `GEO-SKIMMER-LENGTH` | Espacio para el barredor de flotantes | 0.995 m | > 0 | Cumple. |
| PASS | `GEO-SKIMMER-REACHES-BOX` | El barredor alcanza la caja de flotantes |  |  | Cumple. |
| PASS | `GEO-FLOOR-CONTINUITY` | Continuidad del fondo | 8.33e-9 m |  | El fondo es continuo y la geometría sigue la ley de pendiente. |
| PASS | `GEO-VOLUME-CONSISTENCY` | Volumen geométrico = volumen calculado | 38.392 m³ |  | La geometría generada encierra 38.392 m³, igual al volumen bruto calculado. |
| PASS | `GEO-DIAMETER-CONSISTENCY` | Diámetro modelado = diámetro calculado | 4 m |  | Se compara la cara interior del muro generado con el diámetro hidráulico adoptado. |
| PASS | `GEO-BLADE-FLOOR` | Holgura paletas – fondo | 0.0300 m | ≥ 0.03 | 4 paletas por brazo; holgura mínima medida a lo largo de cada paleta. |
| PASS | `GEO-BLADE-WALL` | Holgura paletas – muro | 0.0500 m | ≥ 0.05 | Distancia del punto más exterior de las paletas a la cara interior del muro. |
| PASS | `GEO-BLADE-SUMP-COVERAGE` | Las paletas barren hasta la poceta | 0.220 m | ≤ 0.400 | La paleta interior alcanza la poceta. |
| PASS | `GEO-DEFLECTOR-CAGE` | Holgura deflectores – jaula giratoria | 0.0711 m | ≥ 0.05 | Los deflectores fijos quedan dentro de la jaula. |
| PASS | `GEO-BAFFLE-ARMS` | Holgura deflector de flotantes – brazos | 1.995 m | ≥ 0.3 | Cumple. |
| PASS | `GEO-CONNECTIONS` | Componentes correctamente conectados | 0 |  | 15 conexiones coincidentes. |
| PASS | `GEO-AXIS-ALIGNMENT` | Alineación con el eje del tanque |  |  | Todos los sólidos de revolución son coaxiales. |
| NOT_EVALUATED | `GEO-SKIMMER-BEACH` | Interacción barredor – playa de flotantes |  |  | Contacto funcional previsto (labio flexible sobre la rampa). Geometría de rampa y labio a definir con el fabricante. |
| PASS | `GEO-COMPONENT-INVENTORY` | Inventario de componentes completo |  |  | 17 componentes generados. |

### Nivel 4 — Ingeniería constructiva

| Estado | ID | Comprobación | Valor | Límite | Mensaje |
|---|---|---|---:|---|---|
| NOT_EVALUATED | `GEO-WALKWAY-WIDTH` | Anchura libre de pasarela | 0.800 m |  | El perfil de diseño no define criterio para esta magnitud. |
| NOT_EVALUATED (crítica) | `STR-THICKNESS` | Espesores estructurales |  |  | Espesores preliminares NO verificados (muro 0.3 m, losa 0.35 m, canal 0.2 m, poceta 0.25 m). Requiere cálculo según EN 1992-1-1 / EN 1992-3: presión hidrostática, estado vacío con empuje del terreno, nivel freático, cargas de equipos y puente, fisuración y estanqueidad. |
| NOT_EVALUATED (crítica) | `STR-CRACKING-WATERTIGHTNESS` | Fisuración y estanqueidad (EN 1992-3) |  |  | Método no implementado en V1. |
| NOT_EVALUATED (crítica) | `STR-GEOTECHNICS` | Cimentación y geotecnia |  |  | Sin datos geotécnicos: capacidad portante, asientos y empujes no evaluados. |
| NOT_EVALUATED (crítica) | `STR-FLOTATION` | Flotación con tanque vacío |  |  | Falta el nivel freático (site.groundwaterLevelM). |
| NOT_EVALUATED | `STR-REBAR` | Cuantías de armadura |  |  | No se miden armaduras sin diseño estructural (spec §7.4). |
| NOT_EVALUATED (crítica) | `MEC-BRIDGE-STRUCTURE` | Resistencia y flecha del puente |  |  | Puente full-span de 5.60 m de luz: perfiles, cargas de mantenimiento y apoyos sin dimensionar. El tipo de apoyo no se infiere del diámetro. |
| NOT_EVALUATED (crítica) | `MEC-DRIVE-TORQUE` | Par y potencia del accionamiento |  |  | Representación paramétrica sin selección comercial. Par, potencia y limitador de par se calcularán en fase posterior. |
| NOT_EVALUATED (crítica) | `MEC-ARMS-STRUCTURE` | Resistencia de jaula, brazos y paletas |  |  | Secciones representativas; sin cálculo de esfuerzos de barrido. |
| NOT_EVALUATED (crítica) | `MEC-FABRICATION` | Equipo mecánico apto para fabricación |  |  | El equipo mecánico NO está dimensionado para fabricación. |
| PASS | `MAT-SUBMERGED-COMPATIBILITY` | Material de piezas sumergidas |  |  | Acero inoxidable austenítico X5CrNi18-10 (AISI 304): compatible con inmersión en agua residual urbana (confirmar agresividad real). |
| PASS | `MAT-CONCRETE-EXPOSURE` | Clase de exposición del hormigón |  |  | El hormigón declara exposición química (XA). Confirmar la clase con análisis del agua y del terreno. |
| PASS | `SITE-EXCAVATION` | Implantación y excavación |  |  | Excavación estimada 115.9 m³. |
| PASS | `DOC-PROFILE` | Perfil de diseño: Prediseño conceptual |  |  | Encaje inicial de dimensiones con rangos típicos de bibliografía. |
| WARNING | `DOC-SOURCES` | Verificación de fuentes |  |  | Fuentes pendientes de contrastar con su edición: METCALF-EDDY-2014, ISO-6708-1995, ISO-1438-2017, CHOW-1959. |

### Verificaciones críticas pendientes

- **Espesores estructurales** (`STR-THICKNESS`): Espesores preliminares NO verificados (muro 0.3 m, losa 0.35 m, canal 0.2 m, poceta 0.25 m). Requiere cálculo según EN 1992-1-1 / EN 1992-3: presión hidrostática, estado vacío con empuje del terreno, nivel freático, cargas de equipos y puente, fisuración y estanqueidad.
- **Fisuración y estanqueidad (EN 1992-3)** (`STR-CRACKING-WATERTIGHTNESS`): Método no implementado en V1.
- **Cimentación y geotecnia** (`STR-GEOTECHNICS`): Sin datos geotécnicos: capacidad portante, asientos y empujes no evaluados.
- **Flotación con tanque vacío** (`STR-FLOTATION`): Falta el nivel freático (site.groundwaterLevelM).
- **Resistencia y flecha del puente** (`MEC-BRIDGE-STRUCTURE`): Puente full-span de 5.60 m de luz: perfiles, cargas de mantenimiento y apoyos sin dimensionar. El tipo de apoyo no se infiere del diámetro.
- **Par y potencia del accionamiento** (`MEC-DRIVE-TORQUE`): Representación paramétrica sin selección comercial. Par, potencia y limitador de par se calcularán en fase posterior.
- **Resistencia de jaula, brazos y paletas** (`MEC-ARMS-STRUCTURE`): Secciones representativas; sin cálculo de esfuerzos de barrido.
- **Equipo mecánico apto para fabricación** (`MEC-FABRICATION`): El equipo mecánico NO está dimensionado para fabricación.

## 8. Fuentes

- **METCALF-EDDY-2014** — Metcalf & Eddy | AECOM — Wastewater Engineering: Treatment and Resource Recovery, 5.ª ed., McGraw-Hill, 2014, Cap. 5, tablas de criterios de diseño de sedimentadores primarios. Ámbito: Rangos típicos de bibliografía para prediseño; no sustituyen la normativa local. _Verificación: TO_VERIFY._
- **ISO-6708-1995** — ISO 6708 — Componentes de tuberías. Definición y selección de DN, 1995. Ámbito: Serie de diámetros nominales. El DN no es el diámetro interior: se usa como aproximación de prediseño. _Verificación: TO_VERIFY._
- **ISO-1438-2017** — ISO 1438 — Hydrometry: Open channel flow measurement using thin-plate weirs, 2017, Vertedero triangular de pared delgada (fórmula de Kindsvater-Shen). Ámbito: Ecuación de descarga de escotaduras en V. _Verificación: TO_VERIFY._
- **CHOW-1959** — V. T. Chow — Open-Channel Hydraulics, McGraw-Hill, 1959, Canal con caída libre: calado aguas arriba ≈ √3·yc para canal horizontal con aporte lateral uniforme. Ámbito: Prediseño del canal perimetral de recogida. _Verificación: TO_VERIFY._
