/* giova_water — About section (Sobre mí) */

function StatTile({ num, label, sub }) {
  return (
    <div style={{ borderLeft: "1px solid var(--line-hi)", paddingLeft: 16 }}>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 34, letterSpacing: "-0.03em", color: "var(--ink)" }}>{num}</div>
      <div className="label-accent" style={{ marginTop: 4 }}>{label}</div>
      {sub && <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SkillBar({ name, level, code }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{code}</span>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink)" }}>{name}</span>
        </div>
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--accent)" }}>
          <AnimatedNumber value={level} trigger={inView} format={v => `${v.toFixed(0)}%`} />
        </span>
      </div>
      <div style={{ height: 3, background: "var(--line)", position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: inView ? `${level}%` : 0,
          background: "var(--accent)",
          transition: "width 1.2s cubic-bezier(.2,.7,.2,1)",
        }}/>
        <div style={{
          position: "absolute", left: 0, top: -1, bottom: -1, pointerEvents: "none",
          width: "100%",
          backgroundImage: "repeating-linear-gradient(to right, transparent 0, transparent 9%, var(--bg) 9%, var(--bg) 10%)"
        }}/>
      </div>
    </div>
  );
}

function TimelineRow({ year, role, org, body, location, tags }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  return (
    <div ref={ref} style={{
      display: "grid", gridTemplateColumns: "140px 1fr",
      gap: 32, padding: "28px 0",
      borderTop: "1px solid var(--line)",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(12px)",
      transition: "all 700ms var(--ease)",
    }}>
      <div>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--accent)", letterSpacing: "0.04em" }}>{year}</div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6 }}>{location}</div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}>{role}</h3>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>/ {org}</span>
        </div>
        <p style={{ margin: "0 0 14px", color: "var(--ink-1)", fontSize: 13.5, lineHeight: 1.65, maxWidth: 680 }}>{body}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tags.map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="sobre" className="section">
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 32, marginBottom: 48 }}>
        <SectionIndex n="01" kicker="IDENTITY" title="about.md" />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h2 style={{
            margin: 0, fontFamily: "var(--f-mono)",
            fontSize: "clamp(34px, 4.2vw, 56px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05,
          }}>
            Ingeniero. <span style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", color: "var(--ink-1)" }}>también</span> developer.
          </h2>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>LAST UPDATED · 2026.04.18</span>
        </div>
      </div>

      {/* Card + bio grid */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 48 }}>
        {/* ID CARD */}
        <div>
          <div style={{ border: "1px solid var(--line-hi)", background: "var(--bg-1)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.1em" }}>ID · GGD-2026-001</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>VERIFIED</span>
            </div>
            {/* Real photo */}
            <div style={{ aspectRatio: "3/4", position: "relative", borderBottom: "1px solid var(--line)", overflow: "hidden", background: "var(--bg-2)" }}>
              <img src="assets/giovanni-portrait.png" alt="Giovanni X. Guevara Duque"
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  objectPosition: "center 22%",
                  filter: "saturate(0.85) contrast(1.05)",
                }}/>
              {/* Grid overlay */}
              <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.35 }}>
                <defs>
                  <pattern id="id-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--ink)" strokeWidth="0.4" opacity="0.25"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#id-grid)"/>
              </svg>
              {/* Scanline gradient top/bottom */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }}/>
              {/* crosshair corners */}
              {[[8,8],[null,8],[8,null],[null,null]].map(([l,t],i) => (
                <div key={i} style={{
                  position: "absolute", width: 12, height: 12,
                  left: l !== null ? l : undefined, right: l === null ? 8 : undefined,
                  top: t !== null ? t : undefined, bottom: t === null ? 8 : undefined,
                  borderColor: "var(--accent)", borderStyle: "solid",
                  borderWidth: `${t !== null ? 1.5 : 0}px ${l === null ? 1.5 : 0}px ${t === null ? 1.5 : 0}px ${l !== null ? 1.5 : 0}px`,
                  mixBlendMode: "screen",
                }}/>
              ))}
              {/* Bottom overlay bar */}
              <div style={{
                position: "absolute", left: 10, right: 10, bottom: 10,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontFamily: "var(--f-mono)", fontSize: 9.5, letterSpacing: "0.1em",
                color: "#fff", mixBlendMode: "difference", opacity: 0.8,
              }}>
                <span>SUBJECT · GGD</span>
                <span>CAPTURE · 2024</span>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 15, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
                Giovanni X. Guevara Duque
              </div>
              <div className="label-accent" style={{ marginBottom: 16 }}>ING. PROCESOS · AGUA · AR/INDUSTRIAL</div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "14px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>EXP</div>
                  <div className="mono" style={{ fontSize: 16, color: "var(--ink)" }}>11 <span style={{ fontSize: 10, color: "var(--ink-2)" }}>AÑOS</span></div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>PROJ</div>
                  <div className="mono" style={{ fontSize: 16, color: "var(--ink)" }}>42<span style={{ fontSize: 10, color: "var(--ink-2)" }}> PLANTAS</span></div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>PE</div>
                  <div className="mono" style={{ fontSize: 16, color: "var(--ink)" }}>212k<span style={{ fontSize: 10, color: "var(--ink-2)" }}> HAB.</span></div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>€</div>
                  <div className="mono" style={{ fontSize: 16, color: "var(--ink)" }}>6M<span style={{ fontSize: 10, color: "var(--ink-2)" }}> OBRA</span></div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-1)" }}>
                  📍 Sant Feliu de Llobregat, Barcelona
                </div>
                <Copyable value="+34 673 506 760">
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-1)" }}>☎ +34 673 506 760</span>
                </Copyable>
                <Copyable value="lucesproject@gmail.com">
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-1)" }}>✉ lucesproject@gmail.com</span>
                </Copyable>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                {["EPA-SWMM","EPANET","Python","Power BI","ArcGIS","SCADA/IoT","Django","React","Three.js"].map(t => <Tag key={t}>{t}</Tag>)}
              </div>
            </div>
            <div style={{ padding: "8px 14px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>ISSUED 2015-03 · VALID</span>
              <span className="mono" style={{ fontSize: 9.5, color: "var(--accent)" }}>● ACTIVE</span>
            </div>
          </div>
        </div>

        {/* BIO */}
        <div>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--ink)", margin: "0 0 20px", maxWidth: 680 }}>
            <span style={{ fontFamily: "var(--f-serif)", fontSize: 48, float: "left", lineHeight: 0.8, marginRight: 10, marginTop: 6, color: "var(--accent)" }}>I</span>
            ngeniero de Procesos (Ing. Químico UPEC Paris-Est Créteil) con <strong style={{ color: "var(--ink)", fontWeight: 500 }}>11 años</strong> entregando infraestructura hídrica end-to-end — desde feasibility y outline design hasta process design detallado, P&IDs, balances de masa/energía y puesta en marcha. 42 plantas entregadas, 212 000+ habitantes servidos o protegidos.
          </p>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-1)", margin: "0 0 18px", maxWidth: 680 }}>
            Lideré una <strong style={{ color: "var(--ink)", fontWeight: 500 }}>PTAR de €6M para 60 000 PE en Cali</strong> eliminando 16/16 vertidos ilegales a la Quebrada El Chocho; rediseñé 45 000+ m de alcantarillado en EPA-SWMM alcanzando 97–100% de cumplimiento hidráulico; supervisé <strong style={{ color: "var(--ink)", fontWeight: 500 }}>37 PTAPs rurales de UAESP</strong> y aseguré 13 permisos ambientales con CVC sin rechazos.
          </p>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-1)", margin: "0 0 40px", maxWidth: 680 }}>
            Combino procesos tradicionales con plataformas propias: <strong style={{ color: "var(--ink)", fontWeight: 500 }}>IOTIO</strong> (IoT + Django + React), SCADA/IoT en 10 PTAPs (consorcio AQUATECH, contrato 507-2023) y gemelos digitales con Three.js para monitoreo en tiempo real. Residente UE (NIE Z3214507D), licencia CPQCOL PQ-6061. Nativo francés y español, inglés profesional.
          </p>

          {/* Skills block */}
          <div className="label-accent" style={{ marginBottom: 20 }}>— COMPETENCIAS TÉCNICAS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
            <div>
              <SkillBar code="SK.01" name="EPANET / EPA-SWMM" level={92} />
              <SkillBar code="SK.02" name="Python / Pandas / NumPy" level={82} />
              <SkillBar code="SK.03" name="ArcGIS / Power BI" level={80} />
              <SkillBar code="SK.04" name="Three.js / WebGL" level={76} />
            </div>
            <div>
              <SkillBar code="SK.05" name="Ingeniería procesos AR" level={90} />
              <SkillBar code="SK.06" name="SCADA / IoT / Django" level={85} />
              <SkillBar code="SK.07" name="Gestión de obra pública" level={85} />
              <SkillBar code="SK.08" name="Diseño hidráulico" level={94} />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginTop: 80 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 24 }}>
          <div className="label-accent">— TRAYECTORIA</div>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }}/>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>11 AÑOS · 3 PAÍSES · €6M+ OBRA</span>
        </div>
        <TimelineRow
          year="2022 — 2025"
          location="CALI, CO"
          role="Project Lead — PTAR & Red Alcantarillado"
          org="Alcaldía Santiago de Cali / INALDEX S.A.S."
          body="Entrega de PTAR de €6M para 60 000 PE (Montebello) en 34 meses: process design detallado, P&IDs, balances, dirección de obra civil/electromecánica. Eliminados 16/16 vertidos ilegales a Quebrada El Chocho. PSMV 2025 aprobado por CVC en primera submission."
          tags={["PTAR 60k PE","€6M","EPA-SWMM","P&IDs","CVC"]}
        />
        <TimelineRow
          year="2018 — 2025"
          location="BUENAVENTURA, CO"
          role="Technical Director — Plantas de Lixiviados"
          org="Buenaventura Medio Ambiente (BMA)"
          body="Diseño y puesta en marcha de 3 plantas de lixiviados industriales (1+3+1 L/s, 432 m³/día) para rellenos sanitarios. 100% cumplimiento ambiental durante 7 años operativos, cero rechazos de permiso. Expansión Córdoba 1→3 L/s (2022–2024)."
          tags={["UASB","Fisicoquímico","SCADA","Industrial"]}
        />
        <TimelineRow
          year="2018 — 2024"
          location="CALI, CO"
          role="Water & Sanitation Specialist — 37 PTAPs rurales"
          org="UAESP — Alcaldía Santiago de Cali"
          body="Supervisión técnica de 37 PTAPs rurales sirviendo 150 000+ habitantes. Dashboards Python + Power BI → 60% reducción en tiempo de reporting regulatorio (266 h/año ahorradas). 5 PSMV maestros (21 600 m de red), 5 sistemas EPANET y SCADA/IoT en 10 PTAPs (contrato AQUATECH 507-2023)."
          tags={["37 PTAPs","EPANET","Python","Power BI","SCADA"]}
        />
        <TimelineRow
          year="2019"
          location="CALI, CO"
          role="Consultor Modelación Hidráulica"
          org="INALTER S.A.S. — Contrato COP 528M"
          body="Modelación y rediseño de 4 redes rurales en 4 meses: 517 pozos catastrados, ~15 000 m de red construidos en EPA-SWMM desde cero. 97–100% cumplimiento de capacidad hidráulica. 5 PSMV entregados 100% en plazo, cero cláusulas de penalidad."
          tags={["EPA-SWMM","PSMV","Manning","Res.330/2017"]}
        />
        <TimelineRow
          year="2009 — 2015"
          location="PARIS, FR"
          role="M.Eng. Ingeniería Química"
          org="Université Paris-Est Créteil (UPEC) · Beca Gobierno CO"
          body="Formación en ingeniería química y procesos con enfoque en tratamiento de aguas. C1 francés nativo, C1 inglés. Licencia profesional CPQCOL PQ-6061."
          tags={["UPEC","Beca","Procesos","CPQCOL"]}
        />
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, textAlign: "right" }}>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>— FIN TRAYECTORIA · ▼ CONTINÚA EN § 02</span>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { About });
