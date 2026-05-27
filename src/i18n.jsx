import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LangContext = createContext(null);

const SUPPORTED = ['es', 'en', 'fr'];
const DEFAULT = 'es';
const STORAGE_KEY = 'giova_water:lang';

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT;
    const saved = window.localStorage?.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(nav)) return nav;
    return DEFAULT;
  });

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLangState(next);
    try { window.localStorage?.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, vars) => {
    const tryLang = (l) => {
      const parts = key.split('.');
      let cur = dict[l];
      for (const p of parts) {
        if (cur == null) return undefined;
        cur = cur[p];
      }
      return cur;
    };
    let val = tryLang(lang);
    if (val === undefined) val = tryLang(DEFAULT);
    if (val === undefined) return key;
    if (vars && typeof val === 'string') {
      val = val.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
    }
    return val;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, supported: SUPPORTED }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used inside LangProvider');
  return ctx.t;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return [ctx.lang, ctx.setLang, ctx.supported];
}

// ============================================================================
// Dictionary — single source of truth for all UI strings
// ============================================================================

const dict = {
  es: {
    nav: {
      banner: { available: 'DISPONIBLE · ABRIL 2026', location: 'Sant Feliu de Llobregat' },
      items: {
        inicio: 'Inicio', sobre: 'Sobre', proyectos: 'Proyectos',
        gemelos: 'Gemelos Digitales', contacto: 'Contacto',
      },
    },
    hero: {
      kicker: '§ 00 · PORTFOLIO',
      subtitle: 'PROCESS ENGINEER · WATER & WASTEWATER · SCADA / IoT · BARCELONA — CALI',
      rev: 'REV 2026.04',
      role: 'Ingeniero de Procesos.',
      intro: '11 años entregando agua potable, saneamiento e infraestructura industrial en Colombia y España. 42 plantas diseñadas, €6M+ en obra pública liderada, 212 000+ personas servidas. Residente UE disponible de forma inmediata.',
      ctaProjects: '→ Ver proyectos',
      ctaContact: 'Contactar / Consultoría',
      statsPlants: 'Plantas diseñadas',
      statsPeople: 'Hab. servidos',
      statsWork: 'Obra pública PTAR Cali',
      statsLangs: 'ES · FR · EN',
      fig: 'FIG.01 — PTAP REFERENCIA · Q=42 L/s',
      streaming: 'STREAMING SCADA',
      fieldCaption: 'FIELD · SISTEMA MP/PER1 · OBRA PÚBLICA',
      liveSite: '● LIVE SITE',
      coords: 'COORD: UTM 31T / 421085E / 4582109N',
      scale: 'ESC 1:500',
      typo: {
        kicker: '§ 00 · HERO / TYPO',
        line1: 'Agua potable.',
        line2: 'Aguas residuales.',
        line3a: 'Gemelos digitales',
        line3b: ' en tiempo real.',
        bio: 'Ingeniero de procesos. 11 años. Formación UPEC Paris XII, beca del gobierno colombiano. Entre Sant Feliu de Llobregat y Cali.',
        specialties: 'ESPECIALIDADES',
        ctaExplore: 'Explorar portfolio →',
      },
      terminal: {
        kicker: '§ 00 · HERO / TERMINAL',
        line1: '11 años.',
        line2: '42 plantas.',
        line3a: '150 000 habitantes',
        line3b: 'con acceso al agua.',
        bio: 'Ingeniería de procesos tradicional · código y datos modernos. Diseño plantas que después modelo, monitoreo y optimizo con mis propias plataformas.',
      },
      schematicLabels: {
        captacion: 'CAPTACIÓN', coagFloc: 'COAG/FLOC', sedimentacion: 'SEDIMENTACIÓN',
        lamelar: 'S-401 · LAMELAR', filtracion: 'FILTRACIÓN',
        desinfeccion: 'DESINFECCIÓN', reserva: 'RESERVA',
        sensors: { caudal: 'CAUDAL', presion: 'PRESIÓN', turb: 'TURB.', ph: 'pH' },
        liveBadge: 'LIVE · DEMO PTAP · LGH ON',
      },
    },
    about: {
      kicker: 'IDENTITY', title: 'about.md',
      h2a: 'Ingeniero.', h2b: 'también', h2c: 'developer.',
      lastUpdated: 'LAST UPDATED · 2026.04.18',
      idcard: {
        id: 'ID · GGD-2026-001', verified: 'VERIFIED',
        subject: 'SUBJECT · GGD', capture: 'CAPTURE · 2024',
        role: 'ING. PROCESOS · AGUA · AR/INDUSTRIAL',
        exp: 'EXP', years: 'AÑOS', proj: 'PROJ', plants: 'PLANTAS',
        pe: 'PE', people: 'HAB.', work: 'OBRA',
        issued: 'ISSUED 2015-03 · VALID', active: '● ACTIVE',
      },
      bio1Lead: 'I',
      bio1: 'ngeniero de Procesos (Ing. Químico UPEC Paris-Est Créteil) con {years} entregando infraestructura hídrica end-to-end — desde feasibility y outline design hasta process design detallado, P&IDs, balances de masa/energía y puesta en marcha. 42 plantas entregadas, 212 000+ habitantes servidos o protegidos.',
      bio1Years: '11 años',
      bio2: 'Lideré una {ptar} eliminando 16/16 vertidos ilegales a la Quebrada El Chocho; rediseñé 45 000+ m de alcantarillado en EPA-SWMM alcanzando 97–100% de cumplimiento hidráulico; supervisé {uaesp} y aseguré 13 permisos ambientales con CVC sin rechazos.',
      bio2Ptar: 'PTAR de €6M para 60 000 PE en Cali',
      bio2Uaesp: '37 PTAPs rurales de UAESP',
      bio3: 'Combino procesos tradicionales con plataformas propias: {iotio} (IoT + Django + React), SCADA/IoT en 10 PTAPs (consorcio AQUATECH, contrato 507-2023) y gemelos digitales con Three.js para monitoreo en tiempo real. Residente UE (NIE Z3214507D), licencia CPQCOL PQ-6061. Nativo francés y español, inglés profesional.',
      bio3Iotio: 'IOTIO',
      skillsLabel: '— COMPETENCIAS TÉCNICAS',
      skills: {
        epanet: 'EPANET / EPA-SWMM', python: 'Python / Pandas / NumPy',
        gis: 'ArcGIS / Power BI', three: 'Three.js / WebGL',
        ar: 'Ingeniería procesos AR', scada: 'SCADA / IoT / Django',
        obra: 'Gestión de obra pública', hidraulico: 'Diseño hidráulico',
      },
      timeline: {
        label: '— TRAYECTORIA',
        summary: '11 AÑOS · 3 PAÍSES · €6M+ OBRA',
        end: '— FIN TRAYECTORIA · ▼ CONTINÚA EN § 02',
        rows: [
          { year: '2022 — 2025', location: 'CALI, CO',
            role: 'Project Lead — PTAR & Red Alcantarillado',
            org: 'Alcaldía Santiago de Cali / INALDEX S.A.S.',
            body: 'Entrega de PTAR de €6M para 60 000 PE (Montebello) en 34 meses: process design detallado, P&IDs, balances, dirección de obra civil/electromecánica. Eliminados 16/16 vertidos ilegales a Quebrada El Chocho. PSMV 2025 aprobado por CVC en primera submission.' },
          { year: '2018 — 2025', location: 'BUENAVENTURA, CO',
            role: 'Technical Director — Plantas de Lixiviados',
            org: 'Buenaventura Medio Ambiente (BMA)',
            body: 'Diseño y puesta en marcha de 3 plantas de lixiviados industriales (1+3+1 L/s, 432 m³/día) para rellenos sanitarios. 100% cumplimiento ambiental durante 7 años operativos, cero rechazos de permiso. Expansión Córdoba 1→3 L/s (2022–2024).' },
          { year: '2018 — 2024', location: 'CALI, CO',
            role: 'Water & Sanitation Specialist — 37 PTAPs rurales',
            org: 'UAESP — Alcaldía Santiago de Cali',
            body: 'Supervisión técnica de 37 PTAPs rurales sirviendo 150 000+ habitantes. Dashboards Python + Power BI → 60% reducción en tiempo de reporting regulatorio (266 h/año ahorradas). 5 PSMV maestros (21 600 m de red), 5 sistemas EPANET y SCADA/IoT en 10 PTAPs (contrato AQUATECH 507-2023).' },
          { year: '2019', location: 'CALI, CO',
            role: 'Consultor Modelación Hidráulica',
            org: 'INALTER S.A.S. — Contrato COP 528M',
            body: 'Modelación y rediseño de 4 redes rurales en 4 meses: 517 pozos catastrados, ~15 000 m de red construidos en EPA-SWMM desde cero. 97–100% cumplimiento de capacidad hidráulica. 5 PSMV entregados 100% en plazo, cero cláusulas de penalidad.' },
          { year: '2009 — 2015', location: 'PARIS, FR',
            role: 'M.Eng. Ingeniería Química',
            org: 'Université Paris-Est Créteil (UPEC) · Beca Gobierno CO',
            body: 'Formación en ingeniería química y procesos con enfoque en tratamiento de aguas. C1 francés nativo, C1 inglés. Licencia profesional CPQCOL PQ-6061.' },
        ],
      },
    },
    projects: {
      kicker: 'SELECTED WORK', title: 'projects.index',
      h2a: 'Proyectos reales', h2b: 'ejecutados',
      filters: { all: 'TODOS', agua: 'AGUA & SANEAMIENTO', digital: 'DIGITAL & IOT' },
      count: 'COUNT', sort: 'SORT: YEAR DESC · VIEW: GRID',
      open: 'Abrir →', end: '— END OF INDEX',
      entries: 'ENTRIES',
      cta: '¿Necesitas algo así? Hablemos →',
      modal: {
        close: 'Cerrar', specs: 'ESPECIFICACIONES', techStack: 'STACK TÉCNICO',
        overview: 'RESUMEN', location: 'UBICACIÓN', period: 'PERIODO',
        category: 'CATEGORÍA', share: 'COMPARTIR PROYECTO',
      },
      data: {
        'P-001': {
          cat: 'SANEAMIENTO', title: 'PTAR Montebello · Cali', subtitle: '60 000 PE · €6M',
          body: 'Entrega end-to-end de PTAR doméstica para 60 000 PE en 34 meses. Process design detallado, P&IDs, balances de masa/energía y dirección de obra civil-electromecánica. Eliminados 16/16 vertidos ilegales a Quebrada El Chocho. PSMV 2025 aprobado por CVC en primera submission.',
          metrics: { 'PE diseño': '35 000', Red: '9 097 m', Pozos: '368' },
        },
        'P-002': {
          cat: 'AGUA POTABLE', title: '37 PTAPs rurales · UAESP Cali', subtitle: '150 000+ hab. · 2018–2024',
          body: 'Supervisión técnica de 37 plantas potabilizadoras rurales. Reemplacé revisiones Excel manuales por dashboards Python + Power BI → 60% reducción en tiempo de reporting (266 h/año). 5 PSMV maestros cubriendo 21 600 m de red EPA-SWMM, 97–100% cumplimiento hidráulico, SCADA/IoT en 10 PTAPs (AQUATECH 507-2023).',
          metrics: { Plantas: '37', 'Hab. servidos': '150k+', 'Red PSMV': '21.6 km' },
        },
        'P-003': {
          cat: 'GEMELO DIGITAL', title: 'Gemelo digital PTAP La Vorágine', subtitle: 'SCADA + Three.js',
          body: 'Motor hidráulico interactivo, visualización 3D con Three.js r128, perfil LGH en tiempo real, dashboard de sensores SCADA y sistema de partículas de flujo. Plataforma propia sobre IOTIO.',
          metrics: { Sensores: '42', Refresh: '2 Hz', Nodos: '186' },
        },
        'P-004': {
          cat: 'PLATAFORMA IOT', title: 'IOTIO · Plataforma de telemetría', subtitle: 'Django + React + MQTT',
          body: 'Plataforma propia de monitoreo IoT para infraestructura hídrica. Ingesta MQTT, InfluxDB, dashboards en tiempo real, alertas configurables y API REST. Usada por AQUATECH y BMA.',
          metrics: { Clientes: '6', Puntos: '1.2M/d', Uptime: '99.7%' },
        },
        'P-005': {
          cat: 'INDUSTRIAL', title: '3 plantas lixiviados · BMA', subtitle: '5 L/s combinados · 2018–2025',
          body: 'Diseño y puesta en marcha de 3 plantas de lixiviados industriales (1+3+1 L/s, 432 m³/día) para rellenos sanitarios. Process design completo, SCADA, automatización. 100% cumplimiento ambiental durante 7 años, cero rechazos. Expansión Córdoba 1→3 L/s (2022–2024).',
          metrics: { Capacidad: '5 L/s', Volumen: '432 m³/d', Permisos: '3/3 OK' },
        },
        'P-006': {
          cat: 'MODELACIÓN', title: 'Contrato PSMV rural INALTER', subtitle: 'COP 528M · 4 meses',
          body: 'Modelación y rediseño de 4 redes rurales (Campoalegre, La Buitrera, Golondrinas, La Castilla) en 4 meses. 517 pozos catastrados, ~15 000 m de red construidos en EPA-SWMM desde cero. 97–100% cumplimiento hidráulico. 5 PSMV entregados 100% en plazo.',
          metrics: { Pozos: '517', 'Red modelada': '~15 km', PSMV: '5/5' },
        },
      },
    },
    twins: {
      kicker: 'LIVE SYSTEM', title: 'digital_twins.live',
      h2a: 'Gemelos Digitales', h2b: 'en vivo',
      stream: 'STREAM · 2 Hz · LATENCY 18ms',
      intro: 'Réplicas virtuales de infraestructura real, sincronizadas en tiempo real para toma de decisiones. Esta es una instancia demo del gemelo {ptap}.',
      introPtap: 'PTAP La Vorágine',
      dashboard: {
        title: 'PTAP LA VORÁGINE · DT-03', sensors: '/ 42 SENSORS',
        online: 'ONLINE', uptime: 'UPTIME 99.7%',
        lghLabel: 'LGH · LINEA DE GRADIENTE HIDRÁULICO · FIG.03', scale: 'SCALE V:20 H:500',
        stack: 'STACK TECNOLÓGICO', data: '— DATOS / IoT', sim: '— SIMULACIÓN', viz: '— VISUALIZACIÓN',
        openTwin: '⚡ Abrir gemelo',
        gauges: { caudal: 'CAUDAL Q', presion: 'PRESIÓN P', turbidez: 'TURBIDEZ', ph: 'pH' },
        sparks: { q: 'Q · 24H', p: 'P · 24H', turb: 'TURB · 24H', ph: 'pH · 24H' },
        logInfo: '[INFO]', logTail: 'LOG TAIL ⇲',
      },
      features: [
        { k: '01', t: 'Monitoreo tiempo real', d: 'Integración IoT, SCADA y telemetría para replicar el estado actual de la red en el modelo digital.' },
        { k: '02', t: 'Predicción de escenarios', d: 'Demanda futura, eventos extremos (sequías, inundaciones) y fallos de infraestructura para planificación proactiva.' },
        { k: '03', t: 'Dashboards para tomadores', d: 'Visualización clara para stakeholders no técnicos. Decisiones basadas en datos, no en intuición.' },
      ],
      featurePrefix: 'FEATURE',
    },
    contact: {
      kicker: 'GET IN TOUCH', title: 'contact.form',
      h2a: 'Hablemos de', h2b: 'tu proyecto',
      card: {
        header: 'CONTACT · PREFERRED CHANNELS',
        email: '— EMAIL', tel: '— TEL / WHATSAPP', location: '— UBICACIÓN', hours: '— HORARIO RESPUESTA',
        locationValue: 'Sant Feliu de Llobregat\nBarcelona, ES\n· Disponible remoto',
        hoursValue: 'L–V · 09:00–19:00 CET\nRespuesta media: < 24 h',
        availableLong: 'DISPONIBLE PARA NUEVOS PROYECTOS',
        geo: 'GEO · WGS84',
      },
      form: {
        msgId: 'NEW INQUIRY', draft: '● DRAFT',
        sentTitle: '✓ MENSAJE RECIBIDO',
        sentBody: 'Te responderé en menos de 24 horas.',
        sentStatus: 'STATUS: QUEUED · ETA: < 24h · ID: {id}',
        name: '01 · NOMBRE *', namePh: 'Juan García',
        email: '02 · EMAIL *', emailPh: 'juan@empresa.com',
        org: '03 · ORGANIZACIÓN / EMPRESA', orgPh: 'Empresa o institución',
        type: '04 · TIPO DE PROYECTO',
        msg: '05 · MENSAJE', msgPh: 'Cuéntame sobre tu proyecto, necesidades y plazos estimados...',
        encrypted: 'TLS 1.3 · ENCRYPTED · NO SPAM',
        submit: '→ Enviar mensaje',
        types: [
          { v: '', l: '— selecciona categoría —' },
          { v: 'agua', l: 'Agua potable / PTAP' },
          { v: 'saneamiento', l: 'Aguas residuales / PTAR' },
          { v: 'industrial', l: 'Proceso industrial' },
          { v: 'gemelo', l: 'Gemelo digital / IoT' },
          { v: 'consultoria', l: 'Consultoría / auditoría' },
          { v: 'otro', l: 'Otro' },
        ],
      },
    },
    footer: {
      about: 'Portfolio profesional de Giovanni X. Guevara Duque — Process Engineer especializado en agua potable, saneamiento e infraestructura industrial.',
      sections: 'SECCIONES', direct: 'DIRECTO', meta: 'META',
      eof: '— END OF DOCUMENT · EOF —',
      copy: '© 2026 GIOVA_WATER · GGD',
      buildLabel: 'Build 2026.04.18', tech: 'React 18 · Vite · CSS Grid',
      langs: 'Languages: ES · EN · FR',
    },
    common: {
      scroll: 'SCROLL', tweaks: 'TWEAKS · v1',
      heroVariant: 'HERO VARIANT', palette: 'PALETTE', gridBackdrop: 'GRID BACKDROP',
      gridLabel: 'Mostrar grid de fondo',
      copied: '✓ COPIADO', copy: '⎘ Copiar',
      closeAria: 'Cerrar', tweaksAria: 'Abrir panel de ajustes',
    },
  },

  en: {
    nav: {
      banner: { available: 'AVAILABLE · APRIL 2026', location: 'Sant Feliu de Llobregat' },
      items: {
        inicio: 'Home', sobre: 'About', proyectos: 'Projects',
        gemelos: 'Digital Twins', contacto: 'Contact',
      },
    },
    hero: {
      kicker: '§ 00 · PORTFOLIO',
      subtitle: 'PROCESS ENGINEER · WATER & WASTEWATER · SCADA / IoT · BARCELONA — CALI',
      rev: 'REV 2026.04',
      role: 'Process Engineer.',
      intro: '11 years delivering drinking water, sanitation and industrial infrastructure across Colombia and Spain. 42 plants designed, €6M+ in public works led, 212,000+ people served. EU resident, available immediately.',
      ctaProjects: '→ View projects',
      ctaContact: 'Contact / Consulting',
      statsPlants: 'Plants designed',
      statsPeople: 'People served',
      statsWork: 'Public works PTAR Cali',
      statsLangs: 'ES · FR · EN',
      fig: 'FIG.01 — REFERENCE WTP · Q=42 L/s',
      streaming: 'STREAMING SCADA',
      fieldCaption: 'FIELD · MP/PER1 SYSTEM · PUBLIC WORKS',
      liveSite: '● LIVE SITE',
      coords: 'COORD: UTM 31T / 421085E / 4582109N',
      scale: 'SCALE 1:500',
      typo: {
        kicker: '§ 00 · HERO / TYPO',
        line1: 'Drinking water.',
        line2: 'Wastewater.',
        line3a: 'Digital twins',
        line3b: ' in real time.',
        bio: 'Process engineer. 11 years. UPEC Paris XII training, Colombian government scholarship. Between Sant Feliu de Llobregat and Cali.',
        specialties: 'SPECIALTIES',
        ctaExplore: 'Explore portfolio →',
      },
      terminal: {
        kicker: '§ 00 · HERO / TERMINAL',
        line1: '11 years.',
        line2: '42 plants.',
        line3a: '150,000 people',
        line3b: 'with access to water.',
        bio: 'Traditional process engineering · modern code and data. I design plants, then model, monitor and optimize them with my own platforms.',
      },
      schematicLabels: {
        captacion: 'INTAKE', coagFloc: 'COAG/FLOC', sedimentacion: 'SEDIMENTATION',
        lamelar: 'S-401 · LAMELLA', filtracion: 'FILTRATION',
        desinfeccion: 'DISINFECTION', reserva: 'RESERVOIR',
        sensors: { caudal: 'FLOW', presion: 'PRESSURE', turb: 'TURB.', ph: 'pH' },
        liveBadge: 'LIVE · DEMO WTP · HGL ON',
      },
    },
    about: {
      kicker: 'IDENTITY', title: 'about.md',
      h2a: 'Engineer.', h2b: 'also', h2c: 'developer.',
      lastUpdated: 'LAST UPDATED · 2026.04.18',
      idcard: {
        id: 'ID · GGD-2026-001', verified: 'VERIFIED',
        subject: 'SUBJECT · GGD', capture: 'CAPTURE · 2024',
        role: 'PROC. ENG. · WATER · WASTEWATER/INDUSTRIAL',
        exp: 'EXP', years: 'YEARS', proj: 'PROJ', plants: 'PLANTS',
        pe: 'PE', people: 'PEOPLE', work: 'WORKS',
        issued: 'ISSUED 2015-03 · VALID', active: '● ACTIVE',
      },
      bio1Lead: 'P',
      bio1: 'rocess Engineer (Chem. Eng. UPEC Paris-Est Créteil) with {years} delivering end-to-end water infrastructure — from feasibility and outline design through detailed process design, P&IDs, mass/energy balances and commissioning. 42 plants delivered, 212,000+ people served or protected.',
      bio1Years: '11 years',
      bio2: 'Led a {ptar} eliminating 16/16 illegal discharges into Quebrada El Chocho; redesigned 45,000+ m of sewer network in EPA-SWMM reaching 97–100% hydraulic compliance; supervised {uaesp} and secured 13 environmental permits with CVC, zero rejections.',
      bio2Ptar: '€6M WWTP for 60,000 PE in Cali',
      bio2Uaesp: '37 rural WTPs of UAESP',
      bio3: 'I combine traditional process engineering with my own platforms: {iotio} (IoT + Django + React), SCADA/IoT in 10 WTPs (AQUATECH consortium, contract 507-2023) and Three.js digital twins for real-time monitoring. EU resident (NIE Z3214507D), CPQCOL PQ-6061 license. Native French and Spanish, professional English.',
      bio3Iotio: 'IOTIO',
      skillsLabel: '— TECHNICAL SKILLS',
      skills: {
        epanet: 'EPANET / EPA-SWMM', python: 'Python / Pandas / NumPy',
        gis: 'ArcGIS / Power BI', three: 'Three.js / WebGL',
        ar: 'Wastewater process engineering', scada: 'SCADA / IoT / Django',
        obra: 'Public works management', hidraulico: 'Hydraulic design',
      },
      timeline: {
        label: '— CAREER',
        summary: '11 YEARS · 3 COUNTRIES · €6M+ WORKS',
        end: '— END OF CAREER · ▼ CONTINUES IN § 02',
        rows: [
          { year: '2022 — 2025', location: 'CALI, CO',
            role: 'Project Lead — WWTP & Sewer Network',
            org: 'Cali City Hall / INALDEX S.A.S.',
            body: 'Delivery of €6M WWTP for 60,000 PE (Montebello) in 34 months: detailed process design, P&IDs, balances, supervision of civil/electromechanical works. Eliminated 16/16 illegal discharges to Quebrada El Chocho. PSMV 2025 approved by CVC on first submission.' },
          { year: '2018 — 2025', location: 'BUENAVENTURA, CO',
            role: 'Technical Director — Leachate Plants',
            org: 'Buenaventura Medio Ambiente (BMA)',
            body: 'Design and commissioning of 3 industrial leachate plants (1+3+1 L/s, 432 m³/day) for sanitary landfills. 100% environmental compliance over 7 operational years, zero permit rejections. Córdoba expansion 1→3 L/s (2022–2024).' },
          { year: '2018 — 2024', location: 'CALI, CO',
            role: 'Water & Sanitation Specialist — 37 rural WTPs',
            org: 'UAESP — Cali City Hall',
            body: 'Technical supervision of 37 rural water treatment plants serving 150,000+ inhabitants. Python + Power BI dashboards → 60% reduction in regulatory reporting time (266 h/year saved). 5 master PSMVs (21,600 m of network), 5 EPANET systems and SCADA/IoT on 10 WTPs (AQUATECH contract 507-2023).' },
          { year: '2019', location: 'CALI, CO',
            role: 'Hydraulic Modeling Consultant',
            org: 'INALTER S.A.S. — COP 528M Contract',
            body: 'Modeling and redesign of 4 rural networks in 4 months: 517 manholes surveyed, ~15,000 m of network built in EPA-SWMM from scratch. 97–100% hydraulic capacity compliance. 5 PSMVs delivered 100% on time, zero penalty clauses.' },
          { year: '2009 — 2015', location: 'PARIS, FR',
            role: 'M.Eng. Chemical Engineering',
            org: 'Université Paris-Est Créteil (UPEC) · CO Govt. Scholarship',
            body: 'Chemical and process engineering training focused on water treatment. C1 French native, C1 English. Professional license CPQCOL PQ-6061.' },
        ],
      },
    },
    projects: {
      kicker: 'SELECTED WORK', title: 'projects.index',
      h2a: 'Real projects', h2b: 'shipped',
      filters: { all: 'ALL', agua: 'WATER & SANITATION', digital: 'DIGITAL & IOT' },
      count: 'COUNT', sort: 'SORT: YEAR DESC · VIEW: GRID',
      open: 'Open →', end: '— END OF INDEX',
      entries: 'ENTRIES',
      cta: 'Need something like this? Let\'s talk →',
      modal: {
        close: 'Close', specs: 'SPECIFICATIONS', techStack: 'TECH STACK',
        overview: 'OVERVIEW', location: 'LOCATION', period: 'PERIOD',
        category: 'CATEGORY', share: 'SHARE PROJECT',
      },
      data: {
        'P-001': {
          cat: 'SANITATION', title: 'Montebello WWTP · Cali', subtitle: '60,000 PE · €6M',
          body: 'End-to-end delivery of domestic WWTP for 60,000 PE in 34 months. Detailed process design, P&IDs, mass/energy balances and supervision of civil-electromechanical works. Eliminated 16/16 illegal discharges to Quebrada El Chocho. PSMV 2025 approved by CVC on first submission.',
          metrics: { 'Design PE': '35,000', Network: '9,097 m', Manholes: '368' },
        },
        'P-002': {
          cat: 'DRINKING WATER', title: '37 rural WTPs · UAESP Cali', subtitle: '150,000+ people · 2018–2024',
          body: 'Technical supervision of 37 rural water treatment plants. Replaced manual Excel reviews with Python + Power BI dashboards → 60% reduction in reporting time (266 h/year). 5 master PSMVs covering 21,600 m of EPA-SWMM network, 97–100% hydraulic compliance, SCADA/IoT on 10 WTPs (AQUATECH 507-2023).',
          metrics: { Plants: '37', 'People served': '150k+', 'PSMV network': '21.6 km' },
        },
        'P-003': {
          cat: 'DIGITAL TWIN', title: 'WTP La Vorágine digital twin', subtitle: 'SCADA + Three.js',
          body: 'Interactive hydraulic engine, 3D visualization with Three.js r128, real-time HGL profile, SCADA sensor dashboard and flow particle system. In-house platform on IOTIO.',
          metrics: { Sensors: '42', Refresh: '2 Hz', Nodes: '186' },
        },
        'P-004': {
          cat: 'IOT PLATFORM', title: 'IOTIO · telemetry platform', subtitle: 'Django + React + MQTT',
          body: 'In-house IoT monitoring platform for water infrastructure. MQTT ingestion, InfluxDB, real-time dashboards, configurable alerts and REST API. Used by AQUATECH and BMA.',
          metrics: { Clients: '6', Points: '1.2M/d', Uptime: '99.7%' },
        },
        'P-005': {
          cat: 'INDUSTRIAL', title: '3 leachate plants · BMA', subtitle: '5 L/s combined · 2018–2025',
          body: 'Design and commissioning of 3 industrial leachate plants (1+3+1 L/s, 432 m³/day) for sanitary landfills. Full process design, SCADA, automation. 100% environmental compliance over 7 years, zero rejections. Córdoba expansion 1→3 L/s (2022–2024).',
          metrics: { Capacity: '5 L/s', Volume: '432 m³/d', Permits: '3/3 OK' },
        },
        'P-006': {
          cat: 'MODELING', title: 'INALTER rural PSMV contract', subtitle: 'COP 528M · 4 months',
          body: 'Modeling and redesign of 4 rural networks (Campoalegre, La Buitrera, Golondrinas, La Castilla) in 4 months. 517 manholes surveyed, ~15,000 m of network built in EPA-SWMM from scratch. 97–100% hydraulic compliance. 5 PSMVs delivered 100% on time.',
          metrics: { Manholes: '517', 'Modeled network': '~15 km', PSMV: '5/5' },
        },
      },
    },
    twins: {
      kicker: 'LIVE SYSTEM', title: 'digital_twins.live',
      h2a: 'Digital Twins', h2b: 'live',
      stream: 'STREAM · 2 Hz · LATENCY 18ms',
      intro: 'Virtual replicas of real infrastructure, synchronized in real time for decision making. This is a demo instance of the {ptap} twin.',
      introPtap: 'WTP La Vorágine',
      dashboard: {
        title: 'WTP LA VORÁGINE · DT-03', sensors: '/ 42 SENSORS',
        online: 'ONLINE', uptime: 'UPTIME 99.7%',
        lghLabel: 'HGL · HYDRAULIC GRADE LINE · FIG.03', scale: 'SCALE V:20 H:500',
        stack: 'TECH STACK', data: '— DATA / IoT', sim: '— SIMULATION', viz: '— VISUALIZATION',
        openTwin: '⚡ Open twin',
        gauges: { caudal: 'FLOW Q', presion: 'PRESSURE P', turbidez: 'TURBIDITY', ph: 'pH' },
        sparks: { q: 'Q · 24H', p: 'P · 24H', turb: 'TURB · 24H', ph: 'pH · 24H' },
        logInfo: '[INFO]', logTail: 'LOG TAIL ⇲',
      },
      features: [
        { k: '01', t: 'Real-time monitoring', d: 'IoT, SCADA and telemetry integration to replicate the current network state in the digital model.' },
        { k: '02', t: 'Scenario prediction', d: 'Future demand, extreme events (droughts, floods) and infrastructure failures for proactive planning.' },
        { k: '03', t: 'Dashboards for stakeholders', d: 'Clear visualization for non-technical stakeholders. Decisions based on data, not intuition.' },
      ],
      featurePrefix: 'FEATURE',
    },
    contact: {
      kicker: 'GET IN TOUCH', title: 'contact.form',
      h2a: 'Let\'s talk about', h2b: 'your project',
      card: {
        header: 'CONTACT · PREFERRED CHANNELS',
        email: '— EMAIL', tel: '— PHONE / WHATSAPP', location: '— LOCATION', hours: '— RESPONSE TIME',
        locationValue: 'Sant Feliu de Llobregat\nBarcelona, ES\n· Remote available',
        hoursValue: 'M–F · 09:00–19:00 CET\nAvg. response: < 24 h',
        availableLong: 'AVAILABLE FOR NEW PROJECTS',
        geo: 'GEO · WGS84',
      },
      form: {
        msgId: 'NEW INQUIRY', draft: '● DRAFT',
        sentTitle: '✓ MESSAGE RECEIVED',
        sentBody: 'I will reply within 24 hours.',
        sentStatus: 'STATUS: QUEUED · ETA: < 24h · ID: {id}',
        name: '01 · NAME *', namePh: 'Jane Smith',
        email: '02 · EMAIL *', emailPh: 'jane@company.com',
        org: '03 · ORGANIZATION / COMPANY', orgPh: 'Company or institution',
        type: '04 · PROJECT TYPE',
        msg: '05 · MESSAGE', msgPh: 'Tell me about your project, needs and estimated timeline...',
        encrypted: 'TLS 1.3 · ENCRYPTED · NO SPAM',
        submit: '→ Send message',
        types: [
          { v: '', l: '— select category —' },
          { v: 'agua', l: 'Drinking water / WTP' },
          { v: 'saneamiento', l: 'Wastewater / WWTP' },
          { v: 'industrial', l: 'Industrial process' },
          { v: 'gemelo', l: 'Digital twin / IoT' },
          { v: 'consultoria', l: 'Consulting / audit' },
          { v: 'otro', l: 'Other' },
        ],
      },
    },
    footer: {
      about: 'Professional portfolio of Giovanni X. Guevara Duque — Process Engineer specialized in drinking water, sanitation and industrial infrastructure.',
      sections: 'SECTIONS', direct: 'DIRECT', meta: 'META',
      eof: '— END OF DOCUMENT · EOF —',
      copy: '© 2026 GIOVA_WATER · GGD',
      buildLabel: 'Build 2026.04.18', tech: 'React 18 · Vite · CSS Grid',
      langs: 'Languages: ES · EN · FR',
    },
    common: {
      scroll: 'SCROLL', tweaks: 'TWEAKS · v1',
      heroVariant: 'HERO VARIANT', palette: 'PALETTE', gridBackdrop: 'GRID BACKDROP',
      gridLabel: 'Show background grid',
      copied: '✓ COPIED', copy: '⎘ Copy',
      closeAria: 'Close', tweaksAria: 'Open settings panel',
    },
  },

  fr: {
    nav: {
      banner: { available: 'DISPONIBLE · AVRIL 2026', location: 'Sant Feliu de Llobregat' },
      items: {
        inicio: 'Accueil', sobre: 'À propos', proyectos: 'Projets',
        gemelos: 'Jumeaux Numériques', contacto: 'Contact',
      },
    },
    hero: {
      kicker: '§ 00 · PORTFOLIO',
      subtitle: 'INGÉNIEUR PROCÉDÉS · EAU & ASSAINISSEMENT · SCADA / IoT · BARCELONE — CALI',
      rev: 'RÉV 2026.04',
      role: 'Ingénieur Procédés.',
      intro: '11 ans à livrer eau potable, assainissement et infrastructures industrielles en Colombie et en Espagne. 42 usines conçues, 6 M€+ de travaux publics dirigés, 212 000+ personnes desservies. Résident UE, disponible immédiatement.',
      ctaProjects: '→ Voir les projets',
      ctaContact: 'Contact / Conseil',
      statsPlants: 'Usines conçues',
      statsPeople: 'Hab. desservis',
      statsWork: 'Travaux publics STEP Cali',
      statsLangs: 'ES · FR · EN',
      fig: 'FIG.01 — UDEP RÉFÉRENCE · Q=42 L/s',
      streaming: 'STREAMING SCADA',
      fieldCaption: 'TERRAIN · SYSTÈME MP/PER1 · TRAVAUX PUBLICS',
      liveSite: '● SITE EN ACTIF',
      coords: 'COORD : UTM 31T / 421085E / 4582109N',
      scale: 'ÉCH 1:500',
      typo: {
        kicker: '§ 00 · HERO / TYPO',
        line1: 'Eau potable.',
        line2: 'Eaux usées.',
        line3a: 'Jumeaux numériques',
        line3b: ' en temps réel.',
        bio: 'Ingénieur procédés. 11 ans. Formation UPEC Paris XII, bourse du gouvernement colombien. Entre Sant Feliu de Llobregat et Cali.',
        specialties: 'SPÉCIALITÉS',
        ctaExplore: 'Explorer le portfolio →',
      },
      terminal: {
        kicker: '§ 00 · HERO / TERMINAL',
        line1: '11 ans.',
        line2: '42 usines.',
        line3a: '150 000 habitants',
        line3b: 'avec accès à l\'eau.',
        bio: 'Génie des procédés traditionnel · code et données modernes. Je conçois des usines, puis je les modélise, surveille et optimise avec mes propres plateformes.',
      },
      schematicLabels: {
        captacion: 'CAPTAGE', coagFloc: 'COAG/FLOC', sedimentacion: 'DÉCANTATION',
        lamelar: 'S-401 · LAMELLAIRE', filtracion: 'FILTRATION',
        desinfeccion: 'DÉSINFECTION', reserva: 'RÉSERVE',
        sensors: { caudal: 'DÉBIT', presion: 'PRESSION', turb: 'TURB.', ph: 'pH' },
        liveBadge: 'LIVE · DEMO UDEP · LGH ON',
      },
    },
    about: {
      kicker: 'IDENTITY', title: 'about.md',
      h2a: 'Ingénieur.', h2b: 'aussi', h2c: 'développeur.',
      lastUpdated: 'MAJ · 2026.04.18',
      idcard: {
        id: 'ID · GGD-2026-001', verified: 'VÉRIFIÉ',
        subject: 'SUJET · GGD', capture: 'CAPTURE · 2024',
        role: 'ING. PROCÉDÉS · EAU · EU/INDUSTRIEL',
        exp: 'EXP', years: 'ANS', proj: 'PROJ', plants: 'USINES',
        pe: 'EH', people: 'HAB.', work: 'TRAVAUX',
        issued: 'ÉMIS 2015-03 · VALIDE', active: '● ACTIF',
      },
      bio1Lead: 'I',
      bio1: 'ngénieur Procédés (Ing. Chimique UPEC Paris-Est Créteil) avec {years} de livraison d\'infrastructures hydriques end-to-end — de la faisabilité au design détaillé, P&ID, bilans matière/énergie et mise en service. 42 usines livrées, 212 000+ personnes desservies ou protégées.',
      bio1Years: '11 ans',
      bio2: 'J\'ai dirigé une {ptar} éliminant 16/16 rejets illégaux dans la Quebrada El Chocho ; redessiné 45 000+ m de réseau d\'assainissement sous EPA-SWMM avec 97–100 % de conformité hydraulique ; supervisé {uaesp} et obtenu 13 permis environnementaux avec la CVC sans rejet.',
      bio2Ptar: 'STEP de 6 M€ pour 60 000 EH à Cali',
      bio2Uaesp: '37 UDEP rurales de l\'UAESP',
      bio3: 'Je combine procédés traditionnels et plateformes propres : {iotio} (IoT + Django + React), SCADA/IoT dans 10 UDEP (consortium AQUATECH, contrat 507-2023) et jumeaux numériques Three.js pour la supervision en temps réel. Résident UE (NIE Z3214507D), licence CPQCOL PQ-6061. Français et espagnol natifs, anglais professionnel.',
      bio3Iotio: 'IOTIO',
      skillsLabel: '— COMPÉTENCES TECHNIQUES',
      skills: {
        epanet: 'EPANET / EPA-SWMM', python: 'Python / Pandas / NumPy',
        gis: 'ArcGIS / Power BI', three: 'Three.js / WebGL',
        ar: 'Génie procédés eaux usées', scada: 'SCADA / IoT / Django',
        obra: 'Gestion travaux publics', hidraulico: 'Conception hydraulique',
      },
      timeline: {
        label: '— PARCOURS',
        summary: '11 ANS · 3 PAYS · 6 M€+ DE TRAVAUX',
        end: '— FIN DU PARCOURS · ▼ SUITE EN § 02',
        rows: [
          { year: '2022 — 2025', location: 'CALI, CO',
            role: 'Project Lead — STEP & Réseau d\'assainissement',
            org: 'Mairie de Cali / INALDEX S.A.S.',
            body: 'Livraison d\'une STEP de 6 M€ pour 60 000 EH (Montebello) en 34 mois : design procédés détaillé, P&ID, bilans, direction des travaux civils/électromécaniques. 16/16 rejets illégaux éliminés vers la Quebrada El Chocho. PSMV 2025 approuvé par la CVC dès la première soumission.' },
          { year: '2018 — 2025', location: 'BUENAVENTURA, CO',
            role: 'Directeur Technique — Usines de lixiviats',
            org: 'Buenaventura Medio Ambiente (BMA)',
            body: 'Conception et mise en service de 3 usines de lixiviats industriels (1+3+1 L/s, 432 m³/jour) pour décharges contrôlées. 100 % conformité environnementale sur 7 ans d\'exploitation, zéro rejet de permis. Extension Córdoba 1→3 L/s (2022–2024).' },
          { year: '2018 — 2024', location: 'CALI, CO',
            role: 'Spécialiste Eau & Assainissement — 37 UDEP rurales',
            org: 'UAESP — Mairie de Cali',
            body: 'Supervision technique de 37 UDEP rurales desservant 150 000+ habitants. Dashboards Python + Power BI → 60 % de réduction du temps de reporting réglementaire (266 h/an économisées). 5 PSMV maîtres (21 600 m de réseau), 5 systèmes EPANET et SCADA/IoT sur 10 UDEP (contrat AQUATECH 507-2023).' },
          { year: '2019', location: 'CALI, CO',
            role: 'Consultant Modélisation Hydraulique',
            org: 'INALTER S.A.S. — Contrat COP 528M',
            body: 'Modélisation et refonte de 4 réseaux ruraux en 4 mois : 517 regards relevés, ~15 000 m de réseau construits sous EPA-SWMM. 97–100 % de conformité hydraulique. 5 PSMV livrés 100 % dans les délais, zéro pénalité.' },
          { year: '2009 — 2015', location: 'PARIS, FR',
            role: 'M.Eng. Génie Chimique',
            org: 'Université Paris-Est Créteil (UPEC) · Bourse Gouv. CO',
            body: 'Formation en génie chimique et procédés axée sur le traitement des eaux. C1 français natif, C1 anglais. Licence professionnelle CPQCOL PQ-6061.' },
        ],
      },
    },
    projects: {
      kicker: 'TRAVAUX SÉLECTIONNÉS', title: 'projects.index',
      h2a: 'Projets réels', h2b: 'livrés',
      filters: { all: 'TOUS', agua: 'EAU & ASSAINISSEMENT', digital: 'NUMÉRIQUE & IOT' },
      count: 'COUNT', sort: 'TRI : ANNÉE DESC · VUE : GRILLE',
      open: 'Ouvrir →', end: '— FIN DE L\'INDEX',
      entries: 'ENTRÉES',
      cta: 'Besoin d\'un projet similaire ? Parlons-en →',
      modal: {
        close: 'Fermer', specs: 'SPÉCIFICATIONS', techStack: 'STACK TECHNIQUE',
        overview: 'RÉSUMÉ', location: 'LIEU', period: 'PÉRIODE',
        category: 'CATÉGORIE', share: 'PARTAGER LE PROJET',
      },
      data: {
        'P-001': {
          cat: 'ASSAINISSEMENT', title: 'STEP Montebello · Cali', subtitle: '60 000 EH · 6 M€',
          body: 'Livraison end-to-end d\'une STEP domestique pour 60 000 EH en 34 mois. Design procédés détaillé, P&ID, bilans matière/énergie et direction des travaux civils-électromécaniques. 16/16 rejets illégaux éliminés vers la Quebrada El Chocho. PSMV 2025 approuvé par la CVC dès la première soumission.',
          metrics: { 'EH design': '35 000', Réseau: '9 097 m', Regards: '368' },
        },
        'P-002': {
          cat: 'EAU POTABLE', title: '37 UDEP rurales · UAESP Cali', subtitle: '150 000+ hab. · 2018–2024',
          body: 'Supervision technique de 37 usines de potabilisation rurales. Remplacement des révisions Excel manuelles par des dashboards Python + Power BI → 60 % de réduction du temps de reporting (266 h/an). 5 PSMV maîtres couvrant 21 600 m de réseau EPA-SWMM, 97–100 % de conformité hydraulique, SCADA/IoT sur 10 UDEP (AQUATECH 507-2023).',
          metrics: { Usines: '37', 'Hab. desservis': '150k+', 'Réseau PSMV': '21,6 km' },
        },
        'P-003': {
          cat: 'JUMEAU NUMÉRIQUE', title: 'Jumeau numérique UDEP La Vorágine', subtitle: 'SCADA + Three.js',
          body: 'Moteur hydraulique interactif, visualisation 3D Three.js r128, profil LGH en temps réel, dashboard de capteurs SCADA et système de particules de flux. Plateforme propre sur IOTIO.',
          metrics: { Capteurs: '42', Refresh: '2 Hz', Nœuds: '186' },
        },
        'P-004': {
          cat: 'PLATEFORME IOT', title: 'IOTIO · Plateforme de télémétrie', subtitle: 'Django + React + MQTT',
          body: 'Plateforme propre de supervision IoT pour infrastructures hydriques. Ingestion MQTT, InfluxDB, dashboards en temps réel, alertes configurables et API REST. Utilisée par AQUATECH et BMA.',
          metrics: { Clients: '6', Points: '1,2M/j', Uptime: '99,7%' },
        },
        'P-005': {
          cat: 'INDUSTRIEL', title: '3 usines de lixiviats · BMA', subtitle: '5 L/s combinés · 2018–2025',
          body: 'Conception et mise en service de 3 usines de lixiviats industriels (1+3+1 L/s, 432 m³/jour) pour décharges contrôlées. Design procédés complet, SCADA, automatisation. 100 % conformité environnementale sur 7 ans, zéro rejet. Extension Córdoba 1→3 L/s (2022–2024).',
          metrics: { Capacité: '5 L/s', Volume: '432 m³/j', Permis: '3/3 OK' },
        },
        'P-006': {
          cat: 'MODÉLISATION', title: 'Contrat PSMV rural INALTER', subtitle: 'COP 528M · 4 mois',
          body: 'Modélisation et refonte de 4 réseaux ruraux (Campoalegre, La Buitrera, Golondrinas, La Castilla) en 4 mois. 517 regards relevés, ~15 000 m de réseau construits sous EPA-SWMM. 97–100 % de conformité hydraulique. 5 PSMV livrés 100 % dans les délais.',
          metrics: { Regards: '517', 'Réseau modélisé': '~15 km', PSMV: '5/5' },
        },
      },
    },
    twins: {
      kicker: 'SYSTÈME LIVE', title: 'digital_twins.live',
      h2a: 'Jumeaux Numériques', h2b: 'en direct',
      stream: 'STREAM · 2 Hz · LATENCE 18ms',
      intro: 'Répliques virtuelles d\'infrastructures réelles, synchronisées en temps réel pour la prise de décision. Voici une instance démo du jumeau {ptap}.',
      introPtap: 'UDEP La Vorágine',
      dashboard: {
        title: 'UDEP LA VORÁGINE · DT-03', sensors: '/ 42 CAPTEURS',
        online: 'EN LIGNE', uptime: 'UPTIME 99,7%',
        lghLabel: 'LGH · LIGNE DE GRADIENT HYDRAULIQUE · FIG.03', scale: 'ÉCH V:20 H:500',
        stack: 'STACK TECHNIQUE', data: '— DONNÉES / IoT', sim: '— SIMULATION', viz: '— VISUALISATION',
        openTwin: '⚡ Ouvrir le jumeau',
        gauges: { caudal: 'DÉBIT Q', presion: 'PRESSION P', turbidez: 'TURBIDITÉ', ph: 'pH' },
        sparks: { q: 'Q · 24H', p: 'P · 24H', turb: 'TURB · 24H', ph: 'pH · 24H' },
        logInfo: '[INFO]', logTail: 'LOG TAIL ⇲',
      },
      features: [
        { k: '01', t: 'Supervision temps réel', d: 'Intégration IoT, SCADA et télémétrie pour répliquer l\'état actuel du réseau dans le modèle numérique.' },
        { k: '02', t: 'Prédiction de scénarios', d: 'Demande future, événements extrêmes (sécheresses, inondations) et défaillances d\'infrastructure pour une planification proactive.' },
        { k: '03', t: 'Dashboards décideurs', d: 'Visualisation claire pour les parties prenantes non techniques. Décisions basées sur les données, pas l\'intuition.' },
      ],
      featurePrefix: 'FEATURE',
    },
    contact: {
      kicker: 'CONTACT', title: 'contact.form',
      h2a: 'Parlons de', h2b: 'votre projet',
      card: {
        header: 'CONTACT · CANAUX PRIVILÉGIÉS',
        email: '— EMAIL', tel: '— TÉL / WHATSAPP', location: '— LIEU', hours: '— DÉLAI DE RÉPONSE',
        locationValue: 'Sant Feliu de Llobregat\nBarcelone, ES\n· Distanciel disponible',
        hoursValue: 'L–V · 09h00–19h00 CET\nRéponse moy. : < 24 h',
        availableLong: 'DISPONIBLE POUR DE NOUVEAUX PROJETS',
        geo: 'GEO · WGS84',
      },
      form: {
        msgId: 'NOUVELLE DEMANDE', draft: '● BROUILLON',
        sentTitle: '✓ MESSAGE REÇU',
        sentBody: 'Je vous réponds sous 24 heures.',
        sentStatus: 'STATUT : EN ATTENTE · ETA : < 24h · ID : {id}',
        name: '01 · NOM *', namePh: 'Jean Dupont',
        email: '02 · EMAIL *', emailPh: 'jean@entreprise.com',
        org: '03 · ORGANISATION / ENTREPRISE', orgPh: 'Entreprise ou institution',
        type: '04 · TYPE DE PROJET',
        msg: '05 · MESSAGE', msgPh: 'Parlez-moi de votre projet, besoins et délais estimés...',
        encrypted: 'TLS 1.3 · CHIFFRÉ · ZÉRO SPAM',
        submit: '→ Envoyer le message',
        types: [
          { v: '', l: '— sélectionner une catégorie —' },
          { v: 'agua', l: 'Eau potable / UDEP' },
          { v: 'saneamiento', l: 'Eaux usées / STEP' },
          { v: 'industrial', l: 'Procédé industriel' },
          { v: 'gemelo', l: 'Jumeau numérique / IoT' },
          { v: 'consultoria', l: 'Conseil / audit' },
          { v: 'otro', l: 'Autre' },
        ],
      },
    },
    footer: {
      about: 'Portfolio professionnel de Giovanni X. Guevara Duque — Ingénieur Procédés spécialisé en eau potable, assainissement et infrastructures industrielles.',
      sections: 'SECTIONS', direct: 'DIRECT', meta: 'META',
      eof: '— END OF DOCUMENT · EOF —',
      copy: '© 2026 GIOVA_WATER · GGD',
      buildLabel: 'Build 2026.04.18', tech: 'React 18 · Vite · CSS Grid',
      langs: 'Langues : ES · EN · FR',
    },
    common: {
      scroll: 'SCROLL', tweaks: 'RÉGLAGES · v1',
      heroVariant: 'VARIANTE HERO', palette: 'PALETTE', gridBackdrop: 'FOND QUADRILLÉ',
      gridLabel: 'Afficher la grille de fond',
      copied: '✓ COPIÉ', copy: '⎘ Copier',
      closeAria: 'Fermer', tweaksAria: 'Ouvrir le panneau de réglages',
    },
  },
};
