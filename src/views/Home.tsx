import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import {
  computeHeatStrip,
  computeLastActivity,
  computeOverall,
  computeStreak,
  topToReview,
} from "../lib/stats";
import { SERVICES } from "../lib/data";

interface ModeDef {
  id: "flashcards" | "memorama" | "drilldown" | "exam";
  idx: string;
  title: string;
  pitch: string;
  how: string[];
  glyph: string;
  route: string;
  featured?: boolean;
}

const MODES: ModeDef[] = [
  {
    id: "flashcards",
    idx: "01",
    title: "Flashcards",
    pitch:
      "Voltea, recuerda, gradúa. Cada acierto sube la carta una caja Leitner; cada error la baja a la 1.",
    how: [
      "Filtra tiers + categorías",
      "Ronda de 20 cartas pesadas por caja",
      "Voltea → respondes Repaso / Sé",
    ],
    glyph: "🎴",
    route: "/flashcards",
  },
  {
    id: "memorama",
    idx: "02",
    title: "Memorama",
    pitch:
      "Tablero de pares. Une icono con nombre, acrónimo con full name, servicio con caso de uso o con su categoría.",
    how: [
      "Elige tipo de par y tamaño (6—18)",
      "Cronómetro opcional",
      "Récords por tamaño",
    ],
    glyph: "🧩",
    route: "/memorama",
  },
  {
    id: "drilldown",
    idx: "03",
    title: "Drilldown",
    pitch:
      "Profundiza en un servicio. Te describimos una feature y eliges cuál es entre las hermanas del mismo padre.",
    how: [
      "Elige un padre (Lambda, S3, DynamoDB…)",
      "Pregunta describe la feature",
      "Distractores son features del mismo padre",
    ],
    glyph: "🎯",
    route: "/drilldown",
  },
  {
    id: "exam",
    idx: "04",
    title: "Examen",
    pitch:
      "Contra reloj. Mezcla preguntas tipo flashcard y drilldown. Umbral 70%, historial persistido.",
    how: [
      "10 / 20 / 40 preguntas, 60–120 s c/u",
      "Mix flashcards + drilldown",
      "Score, tiempo y revisión al final",
    ],
    glyph: "⏱️",
    route: "/exam",
    featured: true,
  },
];

const MODE_GLYPH_HINTS: Record<ModeDef["id"], string> = {
  flashcards: "/flashcards/play",
  memorama: "/memorama/play",
  drilldown: "/drilldown",
  exam: "/exam/play",
};

const MODE_LABEL: Record<string, string> = {
  flashcards: "Flashcards",
  drilldown: "Drilldown",
  exam: "Examen",
};

function relativeTime(ts: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "hace instantes";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} d`;
}

function HeatStrip() {
  const cells = useMemo(() => computeHeatStrip(28), []);
  const max = Math.max(...cells.map((c) => c.count), 1);
  const streak = useMemo(() => computeStreak(), []);
  return (
    <div className="frame snap">
      <div className="frame-head">
        <div>
          <div className="kicker" style={{ color: "var(--accent)" }}>
            Últimos 28 días
          </div>
          <h2 className="h2" style={{ marginTop: 4 }}>
            Tu racha de estudio
          </h2>
        </div>
        <div className="muted" style={{ fontSize: 13 }}>
          {streak} {streak === 1 ? "día" : "días"} seguidos 🔥
        </div>
      </div>
      <div className="heat-grid">
        {cells.map((c, i) => {
          const lvl =
            c.count === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((c.count / max) * 4)));
          return (
            <div
              key={i}
              className="heat-cell"
              data-lvl={lvl}
              title={`${c.date.toDateString()} · ${c.count} actividad${c.count === 1 ? "" : "es"}`}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          fontSize: 12,
          color: "var(--ink-3)",
        }}
      >
        <span>Hace 4 semanas</span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

function ReviewSoon() {
  const items = useMemo(() => topToReview(undefined, 6), []);
  if (items.length === 0) {
    return (
      <div className="frame snap">
        <div className="frame-head">
          <div>
            <div className="kicker" style={{ color: "var(--accent)" }}>
              Prioridad
            </div>
            <h2 className="h2" style={{ marginTop: 4 }}>
              Repasa esto hoy
            </h2>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Empieza una sesión de flashcards para que aparezcan tarjetas aquí.
        </p>
      </div>
    );
  }
  return (
    <div className="frame snap">
      <div className="frame-head">
        <div>
          <div className="kicker" style={{ color: "var(--accent)" }}>
            Prioridad
          </div>
          <h2 className="h2" style={{ marginTop: 4 }}>
            Repasa esto hoy
          </h2>
        </div>
        <Link to="/flashcards" className="btn ghost sm" style={{ textDecoration: "none" }}>
          Empezar →
        </Link>
      </div>
      <ul className="review-list">
        {items.map((p) => {
          const box = Math.round(p.averageBox);
          return (
            <li key={p.service.id}>
              <ServiceIcon serviceId={p.service.id} size="sm" />
              <div>
                <div className="name">{p.service.name}</div>
                <div className="desc">{p.service.shortDesc}</div>
              </div>
              <span className="box-pill" data-box={box}>
                Box {box}
              </span>
              <span className="lapses">×{p.totalLapses}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="how-strip">
      <div className="eyebrow">
        <span className="dot" />¿Cómo funciona Recall?
      </div>
      <div className="how-grid">
        <div className="how-cell">
          <span className="step-num">01</span>
          <h4>Catálogo curado</h4>
          <p>
            181 servicios AWS organizados en 17 categorías y cuatro tiers:
            Core, Operación, Especializados y Extendido.
          </p>
        </div>
        <div className="how-cell">
          <span className="step-num">02</span>
          <h4>Cuatro modos, una memoria</h4>
          <p>
            Flashcards entrenan recall puro. Memorama entrena reconocimiento.
            Drilldown entrena discriminación fina. Examen pone todo junto
            contra reloj.
          </p>
        </div>
        <div className="how-cell">
          <span className="step-num">03</span>
          <h4>Sistema Leitner</h4>
          <p>
            Cada tarjeta vive en una caja del 1 al 5. Aciertas → sube. Fallas
            → vuelve a la 1. Cajas bajas aparecen más seguido.
          </p>
        </div>
        <div className="how-cell">
          <span className="step-num">04</span>
          <h4>Local-first</h4>
          <p>
            Todo tu progreso vive en <code>localStorage</code>. Sin cuentas,
            sin backend, sin telemetría. Tu navegador es tu cuaderno.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const overall = useMemo(() => computeOverall(), []);
  const lastActivity = useMemo(() => computeLastActivity(), []);
  const totalServices = SERVICES.length;

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            DASHBOARD · BUENOS DÍAS
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>
            Hoy estudias <span className="accent-blob">AWS</span>.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Cuatro modos para probar tus conocimientos. Sin azúcar, sin trucos.
          </p>
        </div>
        <div className="hero-meta">
          <strong>{overall.mastered}</strong> / {totalServices} dominados
          <br />
          <strong>{overall.learning}</strong> en aprendizaje
          <br />
          <strong>{overall.totalReviews}</strong> revisiones totales
        </div>
      </div>

      {lastActivity ? (
        <div className="continue-bar">
          <div>
            <div className="kicker">Continúa donde quedaste</div>
            <div className="h2" style={{ marginTop: 4 }}>
              {MODE_LABEL[lastActivity.mode]}
              {lastActivity.parentName ? ` · ${lastActivity.parentName}` : ""}
            </div>
          </div>
          <div style={{ opacity: 0.55, fontSize: 13 }}>
            Última sesión {relativeTime(lastActivity.timestamp)}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => navigate(MODE_GLYPH_HINTS[lastActivity.mode] ?? "/")}
          >
            Reanudar →
          </button>
        </div>
      ) : (
        <div className="continue-bar">
          <div>
            <div className="kicker">Primera sesión</div>
            <div className="h2" style={{ marginTop: 4 }}>
              Elige un modo para arrancar
            </div>
          </div>
          <div style={{ opacity: 0.55, fontSize: 13 }}>
            Todo se guarda en tu navegador · sin cuentas
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/flashcards")}
          >
            Empezar →
          </button>
        </div>
      )}

      <div className="mode-grid">
        {MODES.map((m) => (
          <button
            key={m.id}
            data-mode={m.id}
            className={`mode-tile ${m.featured ? "is-featured" : ""}`}
            onClick={() => navigate(m.route)}
          >
            <span className="mode-idx">Modo {m.idx}</span>
            <span className="mode-glyph">{m.glyph}</span>
            <h2 className="mode-title">{m.title}</h2>
            <p className="mode-pitch">{m.pitch}</p>
            <div className="mode-how">
              <strong>flujo</strong>
              <div style={{ marginTop: 6 }}>
                {m.how.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <span style={{ opacity: 0.5 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="mode-cta">→</span>
          </button>
        ))}
      </div>

      <div className="dash-row" style={{ marginTop: 32 }}>
        <HeatStrip />
        <ReviewSoon />
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link to="/stats" className="btn ghost" style={{ textDecoration: "none" }}>
          Ver mi progreso completo →
        </Link>
      </div>

      <HowItWorks />
    </div>
  );
}
