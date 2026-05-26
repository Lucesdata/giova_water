/* giova_water — Contact + Footer */

function Contact() {
  const [form, setForm] = React.useState({
    name: "", email: "", org: "", type: "", msg: ""
  });
  const [sent, setSent] = React.useState(false);
  const types = [
    { v: "", l: "— selecciona categoría —" },
    { v: "agua", l: "Agua potable / PTAP" },
    { v: "saneamiento", l: "Aguas residuales / PTAR" },
    { v: "industrial", l: "Proceso industrial" },
    { v: "gemelo", l: "Gemelo digital / IoT" },
    { v: "consultoria", l: "Consultoría / auditoría" },
    { v: "otro", l: "Otro" },
  ];
  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contacto" className="section">
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 32, marginBottom: 48 }}>
        <SectionIndex n="04" kicker="GET IN TOUCH" title="contact.form" />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h2 style={{
            margin: 0, fontFamily: "var(--f-mono)",
            fontSize: "clamp(34px, 4.2vw, 56px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05,
          }}>
            Hablemos de <span style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", color: "var(--accent)" }}>tu proyecto</span>
          </h2>
          <StatusDot label="DISPONIBLE · ABRIL 2026" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 48 }}>
        {/* Left — contact meta */}
        <div>
          <div style={{ border: "1px solid var(--line-hi)", background: "var(--bg-1)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>CONTACT · PREFERRED CHANNELS</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>v1</span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>— EMAIL</div>
                <Copyable value="lucesproject@gmail.com">
                  <span className="mono" style={{ fontSize: 13, color: "var(--ink)" }}>lucesproject@gmail.com</span>
                </Copyable>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>— TEL / WHATSAPP</div>
                <Copyable value="+34 673 506 760">
                  <span className="mono" style={{ fontSize: 13, color: "var(--ink)" }}>+34 673 506 760</span>
                </Copyable>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>— UBICACIÓN</div>
                <div className="mono" style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
                  Sant Feliu de Llobregat<br/>
                  Barcelona, ES<br/>
                  <span style={{ color: "var(--ink-2)" }}>· Disponible remoto</span>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>— HORARIO RESPUESTA</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-1)", lineHeight: 1.5 }}>
                  L–V · 09:00–19:00 CET<br/>
                  Respuesta media: &lt; 24 h
                </div>
              </div>
              <div style={{ paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                <StatusDot label="DISPONIBLE PARA NUEVOS PROYECTOS" />
              </div>
            </div>
          </div>

          {/* Mini map / coords */}
          <div style={{ border: "1px solid var(--line)", marginTop: 16, padding: 14, background: "var(--bg-1)" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 8 }}>GEO · WGS84</div>
            <svg viewBox="0 0 240 100" width="100%" height="90" style={{ display: "block" }}>
              <defs>
                <pattern id="geodot" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.5" fill="var(--line-2)"/>
                </pattern>
              </defs>
              <rect width="240" height="100" fill="url(#geodot)"/>
              <path d="M 0 50 Q 60 40 120 55 T 240 50" stroke="var(--line-hi)" strokeWidth="0.6" fill="none"/>
              <circle cx="165" cy="52" r="4" fill="var(--accent)"/>
              <circle cx="165" cy="52" r="10" stroke="var(--accent-line)" fill="none">
                <animate attributeName="r" values="5;15;5" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
              </circle>
              <text x="155" y="42" fontFamily="JetBrains Mono" fontSize="8" fill="var(--ink-1)">BCN</text>
              <circle cx="56" cy="68" r="2.5" fill="var(--accent-2)" opacity="0.8"/>
              <text x="38" y="80" fontFamily="JetBrains Mono" fontSize="8" fill="var(--ink-2)">CALI</text>
              <line x1="56" y1="68" x2="165" y2="52" stroke="var(--accent-line)" strokeDasharray="2 2" strokeWidth="0.6"/>
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--f-mono)", fontSize: 9.5, color: "var(--ink-3)", marginTop: 6 }}>
              <span>41.3879°N · 2.0456°E</span>
              <span>3.4516°N · 76.5320°W</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ border: "1px solid var(--line-hi)", background: "var(--bg-1)" }}>
          <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-2)" }}>
              MSG-{new Date().getFullYear()}-{String(Math.floor(Math.random()*9999)).padStart(4,"0")} · NEW INQUIRY
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--accent)" }}>● DRAFT</span>
          </div>
          <div style={{ padding: 24 }}>
            {sent ? (
              <div style={{ padding: "60px 20px", textAlign: "center", fontFamily: "var(--f-mono)" }}>
                <div style={{ color: "var(--accent)", fontSize: 14, marginBottom: 10 }}>✓ MENSAJE RECIBIDO</div>
                <div style={{ color: "var(--ink-1)", fontSize: 13 }}>Te responderé en menos de 24 horas.</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 20 }}>
                  STATUS: QUEUED · ETA: &lt; 24h · ID: {Date.now().toString(36).toUpperCase()}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="label" style={{ display: "block", marginBottom: 6 }}>01 · NOMBRE *</label>
                    <input required value={form.name} onChange={onChange("name")} placeholder="Juan García"/>
                  </div>
                  <div>
                    <label className="label" style={{ display: "block", marginBottom: 6 }}>02 · EMAIL *</label>
                    <input required type="email" value={form.email} onChange={onChange("email")} placeholder="juan@empresa.com"/>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label" style={{ display: "block", marginBottom: 6 }}>03 · ORGANIZACIÓN / EMPRESA</label>
                  <input value={form.org} onChange={onChange("org")} placeholder="Empresa o institución"/>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label" style={{ display: "block", marginBottom: 6 }}>04 · TIPO DE PROYECTO</label>
                  <select value={form.type} onChange={onChange("type")}>
                    {types.map(t => <option key={t.v} value={t.v} style={{ background: "var(--bg-1)", color: "var(--ink)" }}>{t.l}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label className="label" style={{ display: "block", marginBottom: 6 }}>
                    05 · MENSAJE
                    <span style={{ float: "right", color: "var(--ink-3)" }}>{form.msg.length}/1000</span>
                  </label>
                  <textarea rows={5} value={form.msg} onChange={onChange("msg")} maxLength={1000}
                    placeholder="Cuéntame sobre tu proyecto, necesidades y plazos estimados..."/>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                    TLS 1.3 · ENCRYPTED · NO SPAM
                  </span>
                  <button type="submit" className="btn primary">→ Enviar mensaje</button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 0 24px", marginTop: 40 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32, marginBottom: 40 }}>
        <div>
          <Logo />
          <p style={{ margin: "16px 0 0", color: "var(--ink-2)", fontSize: 12.5, lineHeight: 1.6, maxWidth: 340 }}>
            Portfolio profesional de Giovanni X. Guevara Duque —
            Process Engineer especializado en agua potable, saneamiento e infraestructura industrial.
          </p>
        </div>
        <div>
          <div className="label-accent" style={{ marginBottom: 12 }}>SECCIONES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--f-mono)", fontSize: 12 }}>
            <a href="#inicio" style={{ color: "var(--ink-1)", textDecoration: "none" }}>→ Inicio</a>
            <a href="#sobre" style={{ color: "var(--ink-1)", textDecoration: "none" }}>→ Sobre</a>
            <a href="#proyectos" style={{ color: "var(--ink-1)", textDecoration: "none" }}>→ Proyectos</a>
            <a href="#gemelos" style={{ color: "var(--ink-1)", textDecoration: "none" }}>→ Gemelos</a>
            <a href="#contacto" style={{ color: "var(--ink-1)", textDecoration: "none" }}>→ Contacto</a>
          </div>
        </div>
        <div>
          <div className="label-accent" style={{ marginBottom: 12 }}>DIRECTO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-1)" }}>
            <span>lucesproject@gmail.com</span>
            <span>+34 673 506 760</span>
            <span>LinkedIn / GitHub</span>
          </div>
        </div>
        <div>
          <div className="label-accent" style={{ marginBottom: 12 }}>META</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-1)" }}>
            <span>Build 2026.04.18</span>
            <span>React 18 · CSS Grid</span>
            <span>Languages: ES · EN · FR</span>
          </div>
        </div>
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "1px solid var(--line)", paddingTop: 14,
        fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--ink-3)"
      }}>
        <span>© 2026 GIOVA_WATER · GGD</span>
        <span>— END OF DOCUMENT · EOF —</span>
        <span>41.3879°N · 2.0456°E</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Contact, Footer });
