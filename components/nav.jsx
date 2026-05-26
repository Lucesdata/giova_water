/* global React */
const { useState: useStateNav, useEffect: useEffectNav } = React;

function Nav({ active }) {
  const items = [
    { id: "inicio", n: "00", label: "Inicio" },
    { id: "sobre", n: "01", label: "Sobre" },
    { id: "proyectos", n: "02", label: "Proyectos" },
    { id: "gemelos", n: "03", label: "Gemelos Digitales" },
    { id: "contacto", n: "04", label: "Contacto" },
  ];
  const [lang, setLang] = useStateNav("ES");
  const [time, setTime] = useStateNav("");
  useEffectNav(() => {
    const tick = () => {
      const d = new Date();
      const z = (n) => String(n).padStart(2, "0");
      setTime(`${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      backdropFilter: "blur(10px)",
      background: "color-mix(in srgb, var(--bg) 78%, transparent)",
      borderBottom: "1px solid var(--line)",
    }}>
      {/* Top marginalia strip */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 32px", borderBottom: "1px solid var(--line)",
        fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--ink-3)",
        letterSpacing: "0.08em", textTransform: "uppercase"
      }}>
        <div style={{ display: "flex", gap: 18 }}>
          <span>41.3879°N &nbsp; 2.0456°E</span>
          <span style={{ color: "var(--ink-2)" }}>· Sant Feliu de Llobregat</span>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <StatusDot label="DISPONIBLE · ABRIL 2026" />
          <span>{time}</span>
        </div>
      </div>

      {/* Main nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 32px",
      }}>
        <Logo />
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {items.map(it => (
            <a key={it.id} href={`#${it.id}`} style={{
              padding: "8px 14px",
              fontFamily: "var(--f-mono)", fontSize: 11.5,
              letterSpacing: "0.06em", textTransform: "uppercase",
              textDecoration: "none",
              color: active === it.id ? "var(--accent)" : "var(--ink-1)",
              borderBottom: active === it.id ? "1px solid var(--accent)" : "1px solid transparent",
              display: "flex", gap: 8, alignItems: "baseline",
              transition: "color 160ms",
            }}>
              <span style={{ fontSize: 9.5, color: active === it.id ? "var(--accent)" : "var(--ink-3)" }}>
                {it.n}
              </span>
              {it.label}
            </a>
          ))}
        </div>
        <div style={{
          display: "flex", border: "1px solid var(--line-2)",
          fontFamily: "var(--f-mono)", fontSize: 11
        }}>
          {["ES", "EN", "FR"].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "6px 12px",
              background: lang === l ? "var(--accent)" : "transparent",
              color: lang === l ? "var(--bg)" : "var(--ink-1)",
              border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: "inherit",
            }}>{l}</button>
          ))}
        </div>
      </div>
    </nav>
  );
}

Object.assign(window, { Nav });
