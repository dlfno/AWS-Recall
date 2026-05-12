/* eslint-disable */

const MODES = [
{
  id: "flashcards",
  idx: "01",
  title: "Flashcards",
  pitch: "Voltea, recuerda, gradúa. Cada acierto sube la carta una caja Leitner; cada error la baja a la 1.",
  how: [
  "Filtra tiers + categorías",
  "Ronda de 20 cartas pesadas por caja",
  "Voltea → respondes Repaso / Sé"],

  glyph: "🎴",
  route: "/flashcards"
},
{
  id: "memorama",
  idx: "02",
  title: "Memorama",
  pitch: "Tablero de pares. Une icono con nombre, acrónimo con full name, servicio con caso de uso o con su categoría.",
  how: [
  "Elige tipo de par y tamaño (6—15)",
  "Cronómetro opcional",
  "Récords por tamaño"],

  glyph: "🧩",
  route: "/memorama"
},
{
  id: "drilldown",
  idx: "03",
  title: "Drilldown",
  pitch: "Profundiza en un servicio. Te describimos una feature y eliges cuál es entre las hermanas del mismo padre.",
  how: [
  "Elige un padre (Lambda, S3, DynamoDB...)",
  "Pregunta describe la feature",
  "Distractores son features del mismo padre"],

  glyph: "🎯",
  route: "/drilldown"
},
{
  id: "exam",
  idx: "04",
  title: "Examen",
  pitch: "Contra reloj. Mezcla preguntas tipo flashcard y drilldown. Umbral 70%, sin volver atrás en la versión cronometrada.",
  how: [
  "20 / 40 / 65 preguntas, 60—120s c/u",
  "Marca para revisar, navega libre",
  "Historial con score y duración"],

  glyph: "⏱️",
  route: "/exam",
  featured: true
}];


function HowItWorks() {
  return (
    <div className="how-strip">
      <div className="eyebrow"><span className="dot" />¿Cómo funciona Recall?</div>
      <div className="how-grid">
        <div className="how-cell">
          <span className="step-num"></span>
          <h4>Catálogo curado</h4>
          <p>84 servicios AWS organizados en 17 categorías y dos tiers: <b>Core</b> (los que aparecen en todos los exámenes) y <b>Operación</b> (los que aparecen en arquitecturas reales).</p>
        </div>
        <div className="how-cell">
          <span className="step-num"></span>
          <h4>Cuatro modos, una memoria</h4>
          <p>Flashcards entrenan recall puro. Memorama entrena reconocimiento. Drilldown entrena discriminación fina. Examen pone todo junto contra reloj.</p>
        </div>
        <div className="how-cell">
          <span className="step-num"></span>
          <h4>Sistema Leitner</h4>
          <p>Cada tarjeta vive en una caja del 1 al 5. Aciertas → sube. Fallas → vuelve a la 1. Las cartas en cajas bajas aparecen más seguido.</p>
        </div>
        <div className="how-cell">
          <span className="step-num"></span>
          <h4>Local-first</h4>
          <p>Todo tu progreso vive en <code>localStorage</code>. Sin cuentas, sin backend, sin telemetría. Tu navegador es tu cuaderno.</p>
        </div>
      </div>
    </div>);

}

function HeatStrip() {
  const max = Math.max(...SESSION_HISTORY.map((d) => d.count), 1);
  return (
    <div className="frame snap">
      <div className="frame-head">
        <div>
          <div className="kicker" style={{ color: "var(--accent)" }}>Últimos 28 días</div>
          <h2 className="h2" style={{ marginTop: 4 }}>Tu racha de estudio</h2>
        </div>
        <div className="muted" style={{ fontSize: 13 }}>{STREAK} días seguidos 🔥</div>
      </div>
      <div className="heat-grid">
        {SESSION_HISTORY.map((d, i) => {
          const lvl = d.count === 0 ? 0 : clamp(Math.ceil(d.count / max * 4), 1, 4);
          return (
            <div key={i} className="heat-cell" data-lvl={lvl} title={`${d.date.toDateString()} · ${d.count} sesiones`} />);

        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12, color: "var(--ink-3)" }}>
        <span>Hace 4 semanas</span>
        <span>Hoy</span>
      </div>
    </div>);

}

function ReviewSoon() {
  const items = Object.entries(PROGRESS).
  map(([id, p]) => ({ id, ...p })).
  filter((p) => p.box <= 2 || p.lapses >= 3).
  sort((a, b) => a.box - b.box || b.lapses - a.lapses).
  slice(0, 6);

  return (
    <div className="frame snap">
      <div className="frame-head">
        <div>
          <div className="kicker" style={{ color: "var(--accent)" }}>Prioridad</div>
          <h2 className="h2" style={{ marginTop: 4 }}>Repasa esto hoy</h2>
        </div>
        <button className="btn ghost sm" onClick={() => window.location.hash = "/flashcards"}>Empezar →</button>
      </div>
      <ul className="review-list">
        {items.map((p) => {
          const s = svcById(p.id);
          if (!s) return null;
          return (
            <li key={p.id}>
              <ServiceIcon id={p.id} size="sm" />
              <div>
                <div className="name">{s.name}</div>
                <div className="desc">{s.short}</div>
              </div>
              <span className="box-pill" data-box={p.box}>Box {p.box}</span>
              <span className="lapses">×{p.lapses}</span>
            </li>);

        })}
      </ul>
    </div>);

}

function HomeView({ navigate }) {
  const totalServices = SERVICES.length;
  const mastered = Object.values(PROGRESS).filter((p) => p.box === 5).length;
  const learning = Object.values(PROGRESS).filter((p) => p.box <= 2).length;
  const reviews = Object.values(PROGRESS).reduce((a, b) => a + b.reviews, 0);

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <h1 className="h-display">
            Hoy estudias <span className="accent-blob">AWS</span>.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>Cuatro modos para probar tus conocimientos.</p>
        </div>
        <div className="hero-meta">
          <strong>{mastered}</strong> / {totalServices} dominados<br />
          <strong>{learning}</strong> en aprendizaje<br />
          <strong>{reviews}</strong> revisiones totales
        </div>
      </div>

      <div className="continue-bar">
        <div>
          <div className="kicker">Continúa donde quedaste</div>
          <div className="h2" style={{ marginTop: 4 }}>Flashcards · Bases de datos · 8 / 20</div>
        </div>
        <div style={{ opacity: 0.55, fontSize: 13 }}>
          Última sesión hace 2h
        </div>
        <button className="btn" onClick={() => navigate("/flashcards/play")}>
          Reanudar →
        </button>
      </div>

      <div className="mode-grid">
        {MODES.map((m) =>
        <button
          key={m.id}
          data-mode={m.id}
          className={`mode-tile ${m.featured ? "is-featured" : ""}`}
          onClick={() => navigate(m.route)}>
          
            <span className="mode-idx">Modo {m.idx}</span>
            <span className="mode-glyph">{m.glyph}</span>
            <h2 className="mode-title">{m.title}</h2>
            <p className="mode-pitch">{m.pitch}</p>
            <div className="mode-how">
              <strong>flujo</strong>
              <div style={{ marginTop: 6 }}>
                {m.how.map((step, i) =>
              <div key={i} style={{ display: "flex", gap: 8 }}>
                    <span style={{ opacity: 0.5 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </div>
              )}
              </div>
            </div>
            <span className="mode-cta">→</span>
          </button>
        )}
      </div>

      <div className="dash-row">
        <HeatStrip />
        <ReviewSoon />
      </div>

      <HowItWorks />
    </div>);

}

Object.assign(window, { HomeView });