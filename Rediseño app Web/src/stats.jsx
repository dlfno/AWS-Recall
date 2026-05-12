/* eslint-disable */

function StatsView({ navigate }) {
  // Aggregate from PROGRESS
  const all = Object.entries(PROGRESS);
  const totalSeen = all.length;
  const mastered = all.filter(([, p]) => p.box === 5).length;
  const learning = all.filter(([, p]) => p.box <= 2).length;
  const reviews = all.reduce((a, [, p]) => a + p.reviews, 0);
  const avgBox = all.reduce((a, [, p]) => a + p.box, 0) / all.length;

  // Box distribution
  const boxes = [1, 2, 3, 4, 5].map(b => ({
    box: b,
    count: all.filter(([, p]) => p.box === b).length,
  }));
  const maxBox = Math.max(...boxes.map(b => b.count), 1);

  // By category mastery
  const byCategory = CATEGORIES.map(c => {
    const services = SERVICES.filter(s => s.cat === c.id);
    const seen = services.filter(s => PROGRESS[s.id]);
    const totalBox = seen.reduce((a, s) => a + (PROGRESS[s.id]?.box || 0), 0);
    return {
      cat: c,
      total: services.length,
      seen: seen.length,
      mastery: seen.length ? totalBox / (seen.length * 5) : 0,
    };
  }).filter(c => c.total > 0).sort((a, b) => b.mastery - a.mastery);

  // Top to review
  const toReview = all
    .filter(([, p]) => p.box <= 2 || p.lapses >= 3)
    .sort((a, b) => a[1].box - b[1].box || b[1].lapses - a[1].lapses)
    .slice(0, 8);

  // Mock exam history
  const examHistory = [
    { d: "12 MAY · 14:32", n: 20, mix: "MIXTO",      time: "21:14", score: 0.80, passed: true  },
    { d: "10 MAY · 19:08", n: 20, mix: "FLASHCARDS", time: "18:42", score: 0.75, passed: true  },
    { d: "08 MAY · 21:11", n: 40, mix: "MIXTO",      time: "44:02", score: 0.625,passed: false },
    { d: "05 MAY · 12:50", n: 20, mix: "DRILLDOWN",  time: "16:20", score: 0.55, passed: false },
    { d: "01 MAY · 09:14", n: 20, mix: "MIXTO",      time: "23:01", score: 0.70, passed: true  },
  ];

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow"><span className="dot" />PROGRESO · MEMORIA + DESEMPEÑO</div>
          <h1 className="h-display" style={{ marginTop: 12 }}>Lo que sabes.</h1>
        </div>
        <div>
          <button className="btn ghost" onClick={() => navigate("/")}>← Inicio</button>
        </div>
      </div>

      {/* Top stats */}
      <div className="stats-grid">
        <div className="stat is-accent">
          <span className="label">DOMINADOS · CAJA 5</span>
          <span className="value num">{mastered}</span>
          <span className="delta up">+2 esta semana</span>
        </div>
        <div className="stat">
          <span className="label">EN APRENDIZAJE</span>
          <span className="value num">{learning}</span>
          <span className="delta">cajas 1—2</span>
        </div>
        <div className="stat">
          <span className="label">CAJA PROMEDIO</span>
          <span className="value num">{avgBox.toFixed(2)}</span>
          <span className="delta up">+0.14</span>
        </div>
        <div className="stat">
          <span className="label">REVISIONES TOTALES</span>
          <span className="value num">{reviews}</span>
          <span className="delta">desde abril</span>
        </div>
      </div>

      <div className="dash-row" style={{ marginTop: 0 }}>
        {/* Leitner */}
        <div className="frame snap">
          <div className="frame-head">
            <div>
              <div className="kicker">SISTEMA LEITNER · DISTRIBUCIÓN</div>
              <h2 className="h2" style={{ marginTop: 4 }}>Cajas 1—5</h2>
            </div>
            <div className="mono muted" style={{ fontSize: 11 }}>1 = recién, 5 = dominado</div>
          </div>
          <div className="leitner">
            {boxes.map(b => (
              <div key={b.box} className="leitner-row">
                <span className="leitner-label">CAJA {b.box}</span>
                <div className="leitner-bar" data-box={b.box}>
                  <div className="fill" style={{ width: `${(b.count / maxBox) * 100}%` }} />
                </div>
                <span className="leitner-count">{b.count}</span>
              </div>
            ))}
          </div>
          <div className="how-strip" style={{ marginTop: 22, paddingTop: 16, borderTop: "var(--border) solid var(--rule)" }}>
            <div className="kicker">CÓMO LEER ESTO</div>
            <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Cada vez que aciertas una flashcard sube una caja. Cada vez que fallas vuelve a la caja 1.
              Las cartas en cajas bajas tienen mayor peso al construir cada ronda.
            </p>
          </div>
        </div>

        {/* To review */}
        <div className="frame snap">
          <div className="frame-head">
            <div>
              <div className="kicker">PARA REPASAR · TOP 8</div>
              <h2 className="h2" style={{ marginTop: 4 }}>Tus puntos débiles</h2>
            </div>
            <button className="btn ghost sm" onClick={() => navigate("/flashcards/play")}>Empezar →</button>
          </div>
          <ul className="review-list">
            {toReview.map(([id, p]) => {
              const s = svcById(id);
              if (!s) return null;
              return (
                <li key={id}>
                  <ServiceIcon id={id} size="sm" />
                  <div>
                    <div className="name">{s.name}</div>
                    <div className="desc">{s.short}</div>
                  </div>
                  <span className="box-pill" data-box={p.box}>BOX {p.box}</span>
                  <span className="lapses">×{p.lapses}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Category mastery */}
      <div className="frame snap" style={{ marginTop: 24 }}>
        <div className="frame-head">
          <div>
            <div className="kicker">DOMINIO POR CATEGORÍA</div>
            <h2 className="h2" style={{ marginTop: 4 }}>Dónde estás fuerte, dónde flojo</h2>
          </div>
          <div className="mono muted" style={{ fontSize: 11 }}>basado en caja promedio</div>
        </div>
        <div className="cat-bars">
          {byCategory.map(c => (
            <div key={c.cat.id} className="cat-bar">
              <span className="name">{c.cat.short} · {c.cat.name}</span>
              <div className="track">
                <div className="fill" style={{ width: `${c.mastery * 100}%` }} />
              </div>
              <span className="pct">{Math.round(c.mastery * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exam history */}
      <div className="frame snap" style={{ marginTop: 24 }}>
        <div className="frame-head">
          <div>
            <div className="kicker">HISTORIAL · EXAMEN</div>
            <h2 className="h2" style={{ marginTop: 4 }}>Últimos 5 intentos</h2>
          </div>
          <div className="mono muted" style={{ fontSize: 11 }}>
            APROBADO {examHistory.filter(e => e.passed).length}/{examHistory.length}
          </div>
        </div>
        <table className="history-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Preguntas</th>
              <th>Mix</th>
              <th>Duración</th>
              <th>Score</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {examHistory.map((e, i) => (
              <tr key={i}>
                <td>{e.d}</td>
                <td>{e.n}</td>
                <td>{e.mix}</td>
                <td>{e.time}</td>
                <td className="score-cell">{Math.round(e.score * 100)}%</td>
                <td><span className={e.passed ? "pass" : "fail"}>{e.passed ? "✓ APROBADO" : "✗ NO"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Memorama records */}
      <div className="frame snap" style={{ marginTop: 24 }}>
        <div className="frame-head">
          <div>
            <div className="kicker">RÉCORDS · MEMORAMA</div>
            <h2 className="h2" style={{ marginTop: 4 }}>Por tamaño de tablero</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, borderTop: "var(--border) solid var(--rule)", borderLeft: "var(--border) solid var(--rule)" }}>
          {[
            { pairs: 6,  time: "00:48", moves: 18 },
            { pairs: 8,  time: "01:24", moves: 24 },
            { pairs: 10, time: "02:01", moves: 32 },
            { pairs: 12, time: "—",     moves: null },
            { pairs: 15, time: "—",     moves: null },
          ].map(r => (
            <div key={r.pairs} style={{ padding: 16, borderRight: "var(--border) solid var(--rule)", borderBottom: "var(--border) solid var(--rule)", opacity: r.moves ? 1 : 0.4 }}>
              <div className="kicker">{r.pairs} PARES</div>
              <div className="mono" style={{ marginTop: 10, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>Mejor tiempo</div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{r.time}</div>
              <div className="mono" style={{ marginTop: 8, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>Movimientos</div>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{r.moves ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
        <button className="btn ghost" onClick={() => alert("(prototipo) borrar progreso de flashcards")}>Reiniciar flashcards</button>
        <button className="btn ghost" onClick={() => alert("(prototipo) borrar historial de exámenes")}>Reiniciar examen</button>
        <button className="btn ghost" onClick={() => alert("(prototipo) borrar récords de memorama")}>Reiniciar memorama</button>
      </div>
    </div>
  );
}

Object.assign(window, { StatsView });
