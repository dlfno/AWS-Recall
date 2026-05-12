/* eslint-disable */

// Unified Setup screen — used as preview before any mode.
// Showed when navigating to /flashcards, /memorama, /drilldown, /exam (no /play).

const SETUP_BLURBS = {
  flashcards: {
    title: "Flashcards",
    idx: "01",
    pitch: "Voltea, recuerda, gradúa. Sistema Leitner de 5 cajas. Cartas en cajas bajas vuelven más seguido.",
    extras: ["acronym-to-fullname", "service-to-description", "usecase-to-service", "icon-to-name", "service-to-category"],
    extrasLabels: {
      "acronym-to-fullname": "Acrónimo → Nombre completo",
      "service-to-description": "Servicio → Descripción",
      "usecase-to-service": "Caso de uso → Servicio",
      "icon-to-name": "Icono → Nombre",
      "service-to-category": "Servicio → Categoría",
    },
  },
  memorama: {
    title: "Memorama",
    idx: "02",
    pitch: "Une pares. Más pares = más difícil, más memorable.",
  },
  drilldown: {
    title: "Drilldown",
    idx: "03",
    pitch: "Identifica features dentro de un mismo servicio. Sólo padres con 2+ features registradas.",
  },
  exam: {
    title: "Examen",
    idx: "04",
    pitch: "Simulación contra reloj. Sin volver atrás. Umbral 70%.",
  },
};

function SetupView({ navigate, mode = "flashcards" }) {
  const blurb = SETUP_BLURBS[mode];
  const [filters, setFilters] = useState({
    tiers: [1, 2],
    categories: ["compute", "storage", "database", "networking", "security", "management", "containers", "integration", "analytics", "ml"],
  });
  const [variants, setVariants] = useState(["acronym-to-fullname", "service-to-description", "usecase-to-service"]);
  const [pairType, setPairType] = useState("acronym-fullname");
  const [boardSize, setBoardSize] = useState(8);
  const [timer, setTimer] = useState(true);
  const [examQs, setExamQs] = useState(20);
  const [secsPerQ, setSecsPerQ] = useState(90);
  const [examMix, setExamMix] = useState("mixed");

  const services = useMemo(
    () => SERVICES.filter(s => filters.tiers.includes(s.tier) && filters.categories.includes(s.cat)),
    [filters],
  );

  const parents = useMemo(
    () => SERVICES.filter(s => s.features?.length >= 2 && filters.tiers.includes(s.tier) && filters.categories.includes(s.cat)),
    [filters],
  );

  const toggle = (arr, val, setter) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            CONFIGURACIÓN · MODO {blurb.idx}
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>{blurb.title}.</h1>
          <p className="lede" style={{ marginTop: 14 }}>{blurb.pitch}</p>
        </div>
        <div>
          <button className="btn ghost" onClick={() => navigate("/")}>← Inicio</button>
        </div>
      </div>

      <div className="setup-grid">
        <div>
          <FiltersControl filters={filters} onChange={setFilters} />

          {mode === "flashcards" && (
            <div className="setup-section">
              <h3>Tipos de tarjeta · <span className="muted" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11 }}>cómo formulamos la pregunta</span></h3>
              <div className="chip-row">
                {blurb.extras.map(v => (
                  <button
                    key={v}
                    className={`chip ${variants.includes(v) ? "is-on" : ""}`}
                    onClick={() => toggle(variants, v, setVariants)}
                    aria-pressed={variants.includes(v)}
                  >
                    {blurb.extrasLabels[v]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "memorama" && (
            <>
              <div className="setup-section">
                <h3>Tipo de par</h3>
                <div className="chip-row">
                  {[
                    ["acronym-fullname", "Acrónimo · Full name"],
                    ["icon-name", "Icono · Nombre"],
                    ["service-usecase", "Servicio · Caso de uso"],
                    ["service-category", "Servicio · Categoría"],
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      className={`chip ${pairType === k ? "is-on" : ""}`}
                      onClick={() => setPairType(k)}
                      aria-pressed={pairType === k}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setup-section">
                <h3>Tamaño del tablero</h3>
                <div className="chip-row">
                  {[6, 8, 10, 12, 15].map(n => (
                    <button
                      key={n}
                      className={`chip ${boardSize === n ? "is-on" : ""}`}
                      onClick={() => setBoardSize(n)}
                      aria-pressed={boardSize === n}
                    >
                      {n} pares
                    </button>
                  ))}
                </div>
              </div>
              <div className="setup-section">
                <h3>Opciones</h3>
                <div className="chip-row">
                  <button className={`chip ${timer ? "is-on" : ""}`} onClick={() => setTimer(!timer)} aria-pressed={timer}>
                    Cronómetro
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === "drilldown" && (
            <div className="setup-section">
              <h3>Elige un servicio padre</h3>
              <div className="chip-row">
                {parents.map(p => (
                  <button
                    key={p.id}
                    className="chip"
                    onClick={() => navigate(`/drilldown/play?p=${p.id}`)}
                  >
                    {p.name} <span className="count">{p.features.length}</span>
                  </button>
                ))}
              </div>
              {parents.length === 0 && (
                <p className="muted">Ningún servicio con features registradas en estos filtros.</p>
              )}
            </div>
          )}

          {mode === "exam" && (
            <>
              <div className="setup-section">
                <h3>Cantidad de preguntas</h3>
                <div className="chip-row">
                  {[20, 40, 65].map(n => (
                    <button key={n} className={`chip ${examQs === n ? "is-on" : ""}`} onClick={() => setExamQs(n)} aria-pressed={examQs === n}>
                      {n} preguntas
                    </button>
                  ))}
                </div>
              </div>
              <div className="setup-section">
                <h3>Tiempo por pregunta</h3>
                <div className="chip-row">
                  {[60, 90, 120].map(s => (
                    <button key={s} className={`chip ${secsPerQ === s ? "is-on" : ""}`} onClick={() => setSecsPerQ(s)} aria-pressed={secsPerQ === s}>
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
              <div className="setup-section">
                <h3>Tipo de preguntas</h3>
                <div className="chip-row">
                  {[
                    ["mixed", "Mixto (flashcards + drilldown)"],
                    ["flashcards", "Sólo flashcards"],
                    ["drilldown", "Sólo drilldown"],
                  ].map(([k, label]) => (
                    <button key={k} className={`chip ${examMix === k ? "is-on" : ""}`} onClick={() => setExamMix(k)} aria-pressed={examMix === k}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="preview">
          <div className="kicker">PREVIEW DE TU SESIÓN</div>
          <h2 className="h2">{blurb.title}</h2>

          <div className="preview-stat">
            <span>Servicios incluidos</span>
            <span className="big">{services.length}</span>
          </div>

          {mode === "flashcards" && (
            <>
              <div className="preview-stat">
                <span>Tipos de tarjeta</span>
                <span className="big">{variants.length}</span>
              </div>
              <div className="preview-stat">
                <span>Tarjetas posibles</span>
                <span className="big">{services.length * variants.length}</span>
              </div>
              <div className="preview-stat">
                <span>Tarjetas por ronda</span>
                <span className="big">20</span>
              </div>
            </>
          )}

          {mode === "memorama" && (
            <>
              <div className="preview-stat">
                <span>Pares</span>
                <span className="big">{boardSize}</span>
              </div>
              <div className="preview-stat">
                <span>Cartas en el tablero</span>
                <span className="big">{boardSize * 2}</span>
              </div>
            </>
          )}

          {mode === "drilldown" && (
            <div className="preview-stat">
              <span>Servicios padre disponibles</span>
              <span className="big">{parents.length}</span>
            </div>
          )}

          {mode === "exam" && (
            <>
              <div className="preview-stat">
                <span>Preguntas</span>
                <span className="big">{examQs}</span>
              </div>
              <div className="preview-stat">
                <span>Tiempo total</span>
                <span className="big">{Math.round(examQs * secsPerQ / 60)} min</span>
              </div>
              <div className="preview-stat">
                <span>Umbral aprobación</span>
                <span className="big">70%</span>
              </div>
            </>
          )}

          {mode !== "drilldown" && (
            <button
              className="btn primary start-btn lg"
              disabled={services.length === 0 || (mode === "flashcards" && variants.length === 0)}
              onClick={() => navigate(`/${mode}/play`)}
            >
              Iniciar {mode === "exam" ? "examen" : mode === "memorama" ? "partida" : "sesión"} →
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { SetupView });
