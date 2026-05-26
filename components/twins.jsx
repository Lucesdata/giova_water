/* giova_water — Digital Twins dashboard section */

function DashGauge({ label, value, unit, min, max, warn, alert, inView }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const status = value >= alert ? "ALERT" : value >= warn ? "WARN" : "OK";
  const color = status === "ALERT" ? "var(--alert)" : status === "WARN" ? "var(--warn)" : "var(--accent)";
  return (
    <div style={{ padding: 16, borderRight: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="label">{label}</span>
        <span className="mono" style={{ fontSize: 9.5, color, letterSpacing: "0.1em" }}>● {status}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          {value.toFixed(unit === "pH" || unit === "bar" ? 2 : 1)}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{unit}</span>
      </div>
      <div style={{ height: 2, background: "var(--line)", position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: inView ? `${pct}%` : "0%",
          background: color,
          transition: "width 800ms var(--ease)",
        }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--ink-3)" }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function SparkTile({ label, series, unit, value, delta, color = "var(--accent)" }) {
  return (
    <div style={{ padding: 16, borderRight: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="label">{label}</span>
        <span className="mono" style={{ fontSize: 10, color: delta >= 0 ? "var(--accent)" : "var(--alert)" }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 22, color: "var(--ink)" }}>{value}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{unit}</span>
      </div>
      <Sparkline data={series} color={color} width={180} height={28} />
    </div>
  );
}

function LGHCanvas() {
  // Animated Line of Hydraulic Gradient — canvas that shows elevation profile
  const ref = React.useRef();
  React.useEffect(() => {
    let raf, t = 0;
    const draw = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo((w/10)*i, 0); ctx.lineTo((w/10)*i, h);
        ctx.stroke();
      }
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h/5)*i); ctx.lineTo(w, (h/5)*i);
        ctx.stroke();
      }

      // terrain (static profile)
      const terrain = (x) => h * 0.75 - Math.sin(x * 0.012) * 18 - Math.sin(x * 0.003) * 40;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        ctx.lineTo(x, terrain(x));
      }
      ctx.lineTo(w, h); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = terrain(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Pipe
      const pipe = (x) => h * 0.82 - Math.sin(x * 0.012) * 18 - Math.sin(x * 0.003) * 40;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = pipe(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // LGH line — animated
      const lgh = (x) => {
        const base = h * 0.25 - x * 0.02;
        return base - Math.sin(t * 0.02 + x * 0.008) * 4;
      };
      ctx.strokeStyle = "rgba(78, 232, 209, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = lgh(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Energy line (above LGH, solid lighter)
      ctx.strokeStyle = "rgba(127, 179, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = lgh(x) - 10 - Math.sin(x * 0.015) * 2;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Flow particles along pipe
      for (let i = 0; i < 12; i++) {
        const x = ((t * 1.2 + i * 60) % (w + 40)) - 20;
        if (x < 0 || x > w) continue;
        const y = pipe(x);
        ctx.fillStyle = "rgba(78, 232, 209, 0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nodes / sensors
      const nodes = [0.15, 0.35, 0.55, 0.75, 0.92];
      nodes.forEach((p, i) => {
        const x = w * p;
        const yp = pipe(x);
        const yl = lgh(x);
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, yp); ctx.lineTo(x, yl);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "var(--accent)";
        ctx.beginPath();
        ctx.arc(x, yl, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(78,232,209,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, yl, 6 + (Math.sin(t*0.08 + i) * 2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(170,180,192,0.8)";
        ctx.font = "9px JetBrains Mono, monospace";
        ctx.fillText(`N${i+1}`, x - 7, yl - 10);
      });

      // Axes labels
      ctx.fillStyle = "rgba(107,119,133,0.7)";
      ctx.font = "9px JetBrains Mono, monospace";
      ctx.fillText("COTA [m]", 8, 14);
      ctx.fillText("DISTANCIA [m]", w - 86, h - 6);
      ctx.fillStyle = "rgba(78,232,209,0.9)";
      ctx.fillText("— — LGH", w - 120, 14);
      ctx.fillStyle = "rgba(127,179,255,0.9)";
      ctx.fillText("E. TOTAL", w - 50, 14);

      t += 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }}/>
  );
}

function DigitalTwins() {
  const t = useTick(200);
  const [ref, inView] = useInView({ threshold: 0.15 });

  // Live values
  const caudal = 42.3 + jitter(0, 1.2, t);
  const presion = 3.24 + jitter(0, 0.05, t + 3);
  const turbidez = 0.82 + jitter(0, 0.12, t + 7);
  const ph = 7.21 + jitter(0, 0.05, t + 11);

  // Sparkline series (keep last 30)
  const [series, setSeries] = React.useState({
    q: Array(30).fill(0).map((_, i) => 40 + Math.sin(i/3) * 3 + Math.random()*2),
    p: Array(30).fill(0).map((_, i) => 3.2 + Math.sin(i/4) * 0.15 + Math.random()*0.05),
    tu: Array(30).fill(0).map((_, i) => 0.8 + Math.sin(i/5) * 0.2 + Math.random()*0.05),
    ph: Array(30).fill(0).map((_, i) => 7.2 + Math.sin(i/6) * 0.08 + Math.random()*0.03),
  });
  React.useEffect(() => {
    setSeries(s => ({
      q: [...s.q.slice(1), caudal],
      p: [...s.p.slice(1), presion],
      tu: [...s.tu.slice(1), turbidez],
      ph: [...s.ph.slice(1), ph],
    }));
    // eslint-disable-next-line
  }, [t]);

  return (
    <section id="gemelos" className="section" ref={ref}>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 32, marginBottom: 48 }}>
        <SectionIndex n="03" kicker="LIVE SYSTEM" title="digital_twins.live" />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h2 style={{
            margin: 0, fontFamily: "var(--f-mono)",
            fontSize: "clamp(34px, 4.2vw, 56px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05,
          }}>
            Gemelos Digitales <span style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", color: "var(--ink-1)" }}>en vivo</span>
          </h2>
          <StatusDot label="STREAM · 2 Hz · LATENCY 18ms" />
        </div>
      </div>

      <p style={{ maxWidth: 720, color: "var(--ink-1)", fontSize: 15, lineHeight: 1.6, margin: "0 0 40px" }}>
        Réplicas virtuales de infraestructura real, sincronizadas en tiempo real para toma de decisiones.
        Esta es una instancia demo del gemelo <strong style={{ color: "var(--ink)", fontWeight: 500 }}>PTAP La Vorágine</strong>.
      </p>

      {/* Main dashboard */}
      <div style={{ border: "1px solid var(--line-hi)", background: "var(--bg-1)" }}>
        {/* Header bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 18px", borderBottom: "1px solid var(--line-hi)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink)" }}>PTAP LA VORÁGINE · DT-03</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>/ 42 SENSORS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--ink-2)" }}>
            <StatusDot label="ONLINE" />
            <span>UPTIME 99.7%</span>
            <span>TS {new Date().toISOString().split("T")[1].split(".")[0]}</span>
          </div>
        </div>

        {/* Gauges row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--line)" }}>
          <DashGauge label="CAUDAL Q" value={caudal} unit="L/s" min={0} max={60} warn={50} alert={55} inView={inView} />
          <DashGauge label="PRESIÓN P" value={presion} unit="bar" min={0} max={5} warn={4} alert={4.5} inView={inView} />
          <DashGauge label="TURBIDEZ" value={turbidez} unit="NTU" min={0} max={2} warn={1.2} alert={1.5} inView={inView} />
          <DashGauge label="pH" value={ph} unit="pH" min={6} max={8.5} warn={8} alert={8.3} inView={inView} />
        </div>

        {/* LGH canvas block */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", borderBottom: "1px solid var(--line)" }}>
          <div style={{ padding: 16, borderRight: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span className="label">LGH · LINEA DE GRADIENTE HIDRÁULICO · FIG.03</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>SCALE V:20 H:500</span>
            </div>
            <div style={{ height: 280, border: "1px solid var(--line)", background: "var(--bg-2)" }}>
              <LGHCanvas />
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div className="label" style={{ marginBottom: 12 }}>STACK TECNOLÓGICO</div>
            <div style={{ marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 6 }}>— DATOS / IoT</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["MQTT","InfluxDB","SCADA","Modbus"].map(x => <Tag key={x}>{x}</Tag>)}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 6 }}>— SIMULACIÓN</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["EPANET-Python","WaterGEMS","HEC-RAS"].map(x => <Tag key={x}>{x}</Tag>)}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 6 }}>— VISUALIZACIÓN</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["Three.js r128","Chart.js","React","D3"].map(x => <Tag key={x}>{x}</Tag>)}
              </div>
            </div>
            <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
              ⚡ Abrir gemelo
            </button>
          </div>
        </div>

        {/* Sparks row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          <SparkTile label="Q · 24H" series={series.q} value={caudal.toFixed(1)} unit="L/s" delta={2.1} />
          <SparkTile label="P · 24H" series={series.p} value={presion.toFixed(2)} unit="bar" delta={-0.4} />
          <SparkTile label="TURB · 24H" series={series.tu} value={turbidez.toFixed(2)} unit="NTU" delta={1.8} color="var(--warn)" />
          <SparkTile label="pH · 24H" series={series.ph} value={ph.toFixed(2)} unit="—" delta={0.1} color="var(--accent-2)" />
        </div>

        {/* Footer log */}
        <div style={{
          borderTop: "1px solid var(--line)",
          padding: "10px 18px",
          fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--ink-2)",
          display: "flex", justifyContent: "space-between"
        }}>
          <span>
            <span style={{ color: "var(--accent)" }}>[INFO]</span> tick #{t} · ingesta OK · lag 18ms · cola: 0
          </span>
          <span style={{ color: "var(--ink-3)" }}>LOG TAIL ⇲</span>
        </div>
      </div>

      {/* Capabilities */}
      <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid var(--line)" }}>
        {[
          { k: "01", t: "Monitoreo tiempo real", d: "Integración IoT, SCADA y telemetría para replicar el estado actual de la red en el modelo digital." },
          { k: "02", t: "Predicción de escenarios", d: "Demanda futura, eventos extremos (sequías, inundaciones) y fallos de infraestructura para planificación proactiva." },
          { k: "03", t: "Dashboards para tomadores", d: "Visualización clara para stakeholders no técnicos. Decisiones basadas en datos, no en intuición." },
        ].map((c, i) => (
          <div key={i} style={{ padding: 24, borderLeft: i > 0 ? "1px solid var(--line)" : "none" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 14 }}>FEATURE · {c.k}</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500 }}>{c.t}</h3>
            <p style={{ margin: 0, color: "var(--ink-1)", fontSize: 13, lineHeight: 1.6 }}>{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { DigitalTwins });
