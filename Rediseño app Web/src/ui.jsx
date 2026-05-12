/* eslint-disable */
/* Shared UI primitives + small helpers. Loaded before screens. */

const { useState, useEffect, useMemo, useRef } = React;

// ── Service helpers ────────────────────────────────────────────────
function svcById(id) { return SERVICES.find(s => s.id === id); }
function catById(id) { return CATEGORIES.find(c => c.id === id); }
function progressFor(id) { return PROGRESS[id] || { box: 1, reviews: 0, lapses: 0, last: 0 }; }

function ServiceIcon({ id, size = "md", className = "", showName = false }) {
  const s = svcById(id);
  if (!s) return null;
  return (
    <span className={`svc-icon ${size} ${className}`}>
      <img src={`icons/${id}.svg`} alt={s.name} onError={(e) => { e.target.style.display = 'none'; }} />
    </span>
  );
}

function CatTag({ catId }) {
  const c = catById(catId);
  if (!c) return null;
  return (
    <span className="cat-tag" title={c.name}>
      <span className="cat-dot" style={{ background: "var(--ink)" }} />
      <span>{c.short}</span>
      <span style={{ opacity: 0.6 }}>· {c.name}</span>
    </span>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────
const NAV = [
  { id: "home",       label: "Inicio",     route: "/" },
  { id: "flashcards", label: "Flashcards", route: "/flashcards/play" },
  { id: "memorama",   label: "Memorama",   route: "/memorama/play" },
  { id: "drilldown",  label: "Drilldown",  route: "/drilldown/play" },
  { id: "exam",       label: "Examen",     route: "/exam/play" },
  { id: "stats",      label: "Progreso",   route: "/stats" },
];

function Topbar({ route, navigate }) {
  const showHome = route !== "/" && route !== "";
  return (
    <header className="topbar">
      <div className="brand" onClick={() => navigate("/")}>
        <div className="brand-mark">R</div>
        <div>
          <span className="brand-name">recall</span>
          <span className="brand-tag">aws</span>
        </div>
      </div>
      <div className="topbar-spacer" />
      <div className="meta">
        {showHome && (
          <button className="btn ghost sm" onClick={() => navigate("/")}>← Inicio</button>
        )}
        <span className="streak">{STREAK} días</span>
      </div>
    </header>
  );
}

function FooterRule() {
  return (
    <div className="footer-rule">
      <span>recall · estudio de aws · 84 servicios curados</span>
      <span>sistema leitner · local-first · sin backend</span>
    </div>
  );
}

// ── Tiny router ────────────────────────────────────────────────────
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (r) => { window.location.hash = r; };
  return [route, navigate];
}

// ── Filters control (shared by all Setup screens) ──────────────────
function FiltersControl({ filters, onChange }) {
  const availableTiers = [1, 2];
  const availableCats  = CATEGORIES;

  const toggleTier = (t) => {
    const next = filters.tiers.includes(t)
      ? filters.tiers.filter(x => x !== t)
      : [...filters.tiers, t];
    onChange({ ...filters, tiers: next });
  };
  const toggleCat = (c) => {
    const next = filters.categories.includes(c)
      ? filters.categories.filter(x => x !== c)
      : [...filters.categories, c];
    onChange({ ...filters, categories: next });
  };
  const allCats   = () => onChange({ ...filters, categories: availableCats.map(c => c.id) });
  const clearCats = () => onChange({ ...filters, categories: [] });

  return (
    <>
      <div className="setup-section">
        <h3>Tier <span className="muted" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11 }}>· profundidad del catálogo</span></h3>
        <div className="chip-row">
          {availableTiers.map(t => (
            <button
              key={t}
              className={`chip ${filters.tiers.includes(t) ? "is-on" : ""}`}
              onClick={() => toggleTier(t)}
              aria-pressed={filters.tiers.includes(t)}
            >
              T{t} · {t === 1 ? "Core" : "Operación"}
            </button>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <h3>
          Categorías
          <span className="secondary">
            <button className="btn ghost sm" onClick={allCats}>Todas</button>
            <button className="btn ghost sm" onClick={clearCats}>Ninguna</button>
          </span>
        </h3>
        <div className="chip-row">
          {availableCats.map(c => {
            const on = filters.categories.includes(c.id);
            const count = SERVICES.filter(s => s.cat === c.id && filters.tiers.includes(s.tier)).length;
            return (
              <button
                key={c.id}
                className={`chip ${on ? "is-on" : ""} ${count === 0 ? "is-disabled" : ""}`}
                onClick={() => toggleCat(c.id)}
                aria-pressed={on}
              >
                {c.name}
                <span className="count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function pad2(n) { return String(n).padStart(2, "0"); }
function fmtTime(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

// Expose globals so other babel scripts can use them
Object.assign(window, {
  svcById, catById, progressFor,
  ServiceIcon, CatTag, FiltersControl,
  Topbar, FooterRule, useHashRoute,
  NAV, clamp, pad2, fmtTime,
});
