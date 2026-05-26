/* giova_water — Projects section */

const projectsData = [
  {
    id: "P-001",
    cat: "SANEAMIENTO",
    title: "PTAR Montebello · Cali",
    subtitle: "60 000 PE · €6M",
    body: "Entrega end-to-end de PTAR doméstica para 60 000 PE en 34 meses. Process design detallado, P&IDs, balances de masa/energía y dirección de obra civil-electromecánica. Eliminados 16/16 vertidos ilegales a Quebrada El Chocho. PSMV 2025 aprobado por CVC en primera submission.",
    tags: ["EPA-SWMM", "P&IDs", "CVC", "Res.330/2017"],
    year: "2022–25",
    loc: "Cali, CO",
    metrics: [
      { k: "PE diseño", v: "35 000" },
      { k: "Red", v: "9 097 m" },
      { k: "Pozos", v: "368" },
    ],
    filters: ["agua"],
    color: "#1e3a5f",
    image: "assets/giovanni-field.png",
  },
  {
    id: "P-002",
    cat: "AGUA POTABLE",
    title: "37 PTAPs rurales · UAESP Cali",
    subtitle: "150 000+ hab. · 2018–2024",
    body: "Supervisión técnica de 37 plantas potabilizadoras rurales. Reemplacé revisiones Excel manuales por dashboards Python + Power BI → 60% reducción en tiempo de reporting (266 h/año). 5 PSMV maestros cubriendo 21 600 m de red EPA-SWMM, 97–100% cumplimiento hidráulico, SCADA/IoT en 10 PTAPs (AQUATECH 507-2023).",
    tags: ["EPANET", "Python", "Power BI", "SCADA"],
    year: "2018–24",
    loc: "Cali, CO",
    metrics: [
      { k: "Plantas", v: "37" },
      { k: "Hab. servidos", v: "150k+" },
      { k: "Red PSMV", v: "21.6 km" },
    ],
    filters: ["agua"],
    color: "#1c4a3a",
  },
  {
    id: "P-003",
    cat: "GEMELO DIGITAL",
    title: "Gemelo digital PTAP La Vorágine",
    subtitle: "SCADA + Three.js",
    body: "Motor hidráulico interactivo, visualización 3D con Three.js r128, perfil LGH en tiempo real, dashboard de sensores SCADA y sistema de partículas de flujo. Plataforma propia sobre IOTIO.",
    tags: ["Three.js", "Chart.js", "Motor HID"],
    year: "2024",
    loc: "Cali, CO",
    metrics: [
      { k: "Sensores", v: "42" },
      { k: "Refresh", v: "2 Hz" },
      { k: "Nodos", v: "186" },
    ],
    filters: ["digital"],
    color: "#3a2660",
    featured: true,
  },
  {
    id: "P-004",
    cat: "PLATAFORMA IOT",
    title: "IOTIO · Plataforma de telemetría",
    subtitle: "Django + React + MQTT",
    body: "Plataforma propia de monitoreo IoT para infraestructura hídrica. Ingesta MQTT, InfluxDB, dashboards en tiempo real, alertas configurables y API REST. Usada por AQUATECH y BMA.",
    tags: ["Django", "React", "InfluxDB"],
    year: "2023",
    loc: "Remoto",
    metrics: [
      { k: "Clientes", v: "6" },
      { k: "Puntos", v: "1.2M/d" },
      { k: "Uptime", v: "99.7%" },
    ],
    filters: ["digital"],
    color: "#2c2a10",
  },
  {
    id: "P-005",
    cat: "INDUSTRIAL",
    title: "3 plantas lixiviados · BMA",
    subtitle: "5 L/s combinados · 2018–2025",
    body: "Diseño y puesta en marcha de 3 plantas de lixiviados industriales (1+3+1 L/s, 432 m³/día) para rellenos sanitarios. Process design completo, SCADA, automatización. 100% cumplimiento ambiental durante 7 años, cero rechazos. Expansión Córdoba 1→3 L/s (2022–2024).",
    tags: ["Fisicoquímico", "Biológico", "SCADA", "P&IDs"],
    year: "2018–25",
    loc: "Buenaventura, CO",
    metrics: [
      { k: "Capacidad", v: "5 L/s" },
      { k: "Volumen", v: "432 m³/d" },
      { k: "Permisos", v: "3/3 OK" },
    ],
    filters: ["agua"],
    color: "#1c3628",
  },
  {
    id: "P-006",
    cat: "MODELACIÓN",
    title: "Contrato PSMV rural INALTER",
    subtitle: "COP 528M · 4 meses",
    body: "Modelación y rediseño de 4 redes rurales (Campoalegre, La Buitrera, Golondrinas, La Castilla) en 4 meses. 517 pozos catastrados, ~15 000 m de red construidos en EPA-SWMM desde cero. 97–100% cumplimiento hidráulico. 5 PSMV entregados 100% en plazo.",
    tags: ["EPA-SWMM", "Manning", "MAGNA-SIRGAS", "PSMV"],
    year: "2019",
    loc: "Cali, CO",
    metrics: [
      { k: "Pozos", v: "517" },
      { k: "Red modelada", v: "~15 km" },
      { k: "PSMV", v: "5/5" },
    ],
    filters: ["agua"],
    color: "#2a1f38",
  },
];

function ProjectCard({ p, onOpen }) {
  const [hover, setHover] = React.useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen && onOpen(p)}
      style={{
        border: "1px solid var(--line)",
        background: "var(--bg-1)",
        display: "flex", flexDirection: "column",
        position: "relative", cursor: "pointer",
        transition: "border-color 200ms, transform 200ms",
        borderColor: hover ? "var(--accent-line)" : "var(--line)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Header strip */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderBottom: "1px solid var(--line)",
        fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.1em",
      }}>
        <span style={{ color: "var(--ink-3)" }}>{p.id}</span>
        <span style={{ color: "var(--accent)" }}>{p.cat}</span>
      </div>

      {/* Preview canvas */}
      <div style={{
        aspectRatio: "16/10",
        position: "relative",
        background: `linear-gradient(135deg, ${p.color}55 0%, ${p.color}22 100%), var(--bg-2)`,
        borderBottom: "1px solid var(--line)",
        overflow: "hidden",
      }}>
        {p.image ? (
          <>
            <img src={p.image} alt={p.title} style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", filter: "saturate(0.85) contrast(1.05)",
              transform: hover ? "scale(1.03)" : "scale(1)", transition: "transform 500ms var(--ease)",
            }}/>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(6,9,12,0.55) 100%)" }}/>
          </>
        ) : (<>
        {/* Grid overlay */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
          <defs>
            <pattern id={`grid-${p.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line-2)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${p.id})`}/>
        </svg>
        {/* Placeholder schematic — simple, not fake-realistic */}
        <div style={{
          position: "absolute", inset: 16,
          border: "1px dashed var(--line-hi)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 10,
        }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.15em" }}>
            [ PROJECT FIGURE · 640×400 ]
          </span>
          <span className="mono" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>{p.loc} · {p.year}</span>
        </div>
        </>)}
        {/* Corner ticks */}
        {[[8,8],[null,8],[8,null],[null,null]].map(([l,t],i) => (
          <div key={i} style={{
            position: "absolute",
            left: l !== null ? l : "auto", right: l === null ? 8 : "auto",
            top: t !== null ? t : "auto", bottom: t === null ? 8 : "auto",
            width: 8, height: 8,
            borderColor: "var(--accent)", borderStyle: "solid",
            borderWidth: `${t !== null ? 1 : 0}px ${l === null ? 1 : 0}px ${t === null ? 1 : 0}px ${l !== null ? 1 : 0}px`,
            transition: "opacity 200ms",
            opacity: hover ? 1 : 0.5,
          }}/>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          margin: "0 0 4px",
          fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em",
          fontFamily: "var(--f-sans)",
        }}>{p.title}</h3>
        <div className="mono" style={{ fontSize: 11, color: "var(--accent)", marginBottom: 12 }}>
          {p.subtitle}
        </div>
        <p style={{ margin: "0 0 16px", color: "var(--ink-1)", fontSize: 13, lineHeight: 1.55, flex: 1 }}>
          {p.body}
        </p>

        {/* Metrics row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
          padding: "10px 0", marginBottom: 14,
        }}>
          {p.metrics.map((m, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? "1px solid var(--line)" : "none", paddingLeft: i > 0 ? 10 : 0 }}>
              <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-3)", letterSpacing: "0.08em" }}>{m.k.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 14, color: "var(--ink)" }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {p.tags.map(t => <Tag key={t}>{t}</Tag>)}
          </div>
          <span className="mono" style={{ fontSize: 11, color: hover ? "var(--accent)" : "var(--ink-2)", transition: "color 160ms" }}>
            Abrir →
          </span>
        </div>
      </div>
    </article>
  );
}

function Projects({ onOpen }) {
  const [filter, setFilter] = React.useState("all");
  const filters = [
    { id: "all", label: "TODOS", count: projectsData.length },
    { id: "agua", label: "AGUA & SANEAMIENTO", count: projectsData.filter(p => p.filters.includes("agua")).length },
    { id: "digital", label: "DIGITAL & IOT", count: projectsData.filter(p => p.filters.includes("digital")).length },
  ];
  const visible = filter === "all" ? projectsData : projectsData.filter(p => p.filters.includes(filter));

  return (
    <section id="proyectos" className="section">
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 32, marginBottom: 48 }}>
        <SectionIndex n="02" kicker="SELECTED WORK" title="projects.index" />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h2 style={{
            margin: 0, fontFamily: "var(--f-mono)",
            fontSize: "clamp(34px, 4.2vw, 56px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05,
          }}>
            Proyectos reales <span style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", color: "var(--ink-1)" }}>ejecutados</span>
          </h2>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>COUNT · {visible.length}/{projectsData.length}</span>
        </div>
      </div>

      {/* Filter row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
        padding: "12px 0", marginBottom: 32,
      }}>
        <div style={{ display: "flex", gap: 0 }}>
          {filters.map((f, i) => (
            <button key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                background: "transparent",
                border: "none",
                borderLeft: i > 0 ? "1px solid var(--line)" : "none",
                padding: "4px 18px",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                color: filter === f.id ? "var(--accent)" : "var(--ink-2)",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
              {filter === f.id && <span style={{ width: 4, height: 4, background: "var(--accent)", borderRadius: "50%" }}/>}
              {f.label}
              <span style={{ fontSize: 9, color: "var(--ink-3)" }}>[{f.count}]</span>
            </button>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
          SORT: YEAR DESC · VIEW: GRID
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {visible.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpen} />)}
      </div>

      <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>— END OF INDEX · {visible.length} ENTRIES</span>
        <a href="#contacto" className="mono" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>
          ¿Necesitas algo así? Hablemos →
        </a>
      </div>
    </section>
  );
}

Object.assign(window, { Projects, projectsData });
