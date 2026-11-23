# extensions/

Reservado para extensiones futuras (spec §9.1, §16): `simulation/`, `diagnostics/`, `optimization/`.
No se implementan en V1 (spec §15: no simulación dinámica ni IA de diagnóstico todavía).

Contrato: una extensión consume `ClarifierVariant` / `ClarifierDesign` de `@eo/equipment-library`
(valores trazados, decisiones, ensamblaje, componentes con puntos de conexión y grados de libertad)
y **no** reconstruye la geometría ni modifica variantes: produce sus propios resultados.
