import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import {
  computeByCategory,
  computeByService,
  computeDrilldownByFeature,
  computeDrilldownByParent,
  computeDrilldownOverall,
  computeMemoramaRecords,
  computeOverall,
  getCategory,
  topFeaturesToReview,
  topToReview,
  BOX_VALUES,
} from "../lib/stats";
import {
  clearDrilldownProgress,
  clearExamAttempts,
  clearFlashcardProgress,
  clearMemoramaStats,
  loadExamAttempts,
} from "../lib/progress-store";
import { MIX_LABELS } from "../lib/exam";

function formatRelative(ts: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

function formatTime(ms?: number): string {
  if (ms == null) return "—";
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function StatsDashboard() {
  const [version, setVersion] = useState(0);

  const overall = useMemo(() => computeOverall(), [version]);
  const byService = useMemo(() => computeByService(), [version]);
  const byCategory = useMemo(() => computeByCategory(byService), [byService]);
  const review = useMemo(() => topToReview(byService, 10), [byService]);
  const memorama = useMemo(() => computeMemoramaRecords(), [version]);

  const drilldownOverall = useMemo(() => computeDrilldownOverall(), [version]);
  const drilldownByFeature = useMemo(
    () => computeDrilldownByFeature(),
    [version],
  );
  const drilldownByParent = useMemo(
    () => computeDrilldownByParent(drilldownByFeature),
    [drilldownByFeature],
  );
  const drilldownReview = useMemo(
    () => topFeaturesToReview(drilldownByFeature, 8),
    [drilldownByFeature],
  );

  const examAttempts = useMemo(() => loadExamAttempts(), [version]);

  const hasFlashcardData = overall.cardsSeen > 0;
  const hasMemoramaData = memorama.some(
    (r) => r.bestMoves != null || r.bestTimeMs != null,
  );
  const hasDrilldownData = drilldownOverall.attempts > 0;
  const hasExamData = examAttempts.length > 0;

  const reset = (
    label: string,
    fn: () => void | Promise<void>,
  ) => async () => {
    if (!window.confirm(`¿Borrar ${label}?`)) return;
    await fn();
    setVersion((v) => v + 1);
  };

  const maxBoxCount = Math.max(
    1,
    ...BOX_VALUES.map((b) => overall.boxDistribution[b]),
  );

  const examPassRate = examAttempts.length
    ? examAttempts.filter((a) => a.passed).length / examAttempts.length
    : 0;
  const examBest = examAttempts.length
    ? Math.max(...examAttempts.map((a) => a.correct / a.total))
    : 0;
  const examLastScore = examAttempts.length
    ? examAttempts[0].correct / examAttempts[0].total
    : 0;

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            DASHBOARD · PROGRESO
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>
            Tu progreso.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Todo tu avance en un lugar. Visita el{" "}
            <Link to="/miembros">perfil de un compañero</Link> para comparar tus
            stats con los suyos.
          </p>
        </div>
        <div>
          <Link to="/" className="btn ghost" style={{ textDecoration: "none" }}>
            ← Inicio
          </Link>
        </div>
      </div>

      {/* ── Flashcards ─────────────────────────────────────────────── */}
      <div className="frame snap" style={{ marginTop: 24 }}>
        <div className="frame-head">
          <div>
            <div className="kicker" style={{ color: "var(--accent)" }}>
              Modo 01
            </div>
            <h2 className="h2" style={{ marginTop: 4 }}>
              Flashcards
            </h2>
          </div>
          {hasFlashcardData && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={reset("el progreso de flashcards", clearFlashcardProgress)}
            >
              Reiniciar
            </button>
          )}
        </div>

        {!hasFlashcardData ? (
          <p className="muted">
            Aún no has graduado ninguna tarjeta.{" "}
            <Link to="/flashcards">Empieza una sesión →</Link>
          </p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat">
                <span className="label">Tarjetas vistas</span>
                <span className="value">{overall.cardsSeen}</span>
              </div>
              <div className="stat is-accent">
                <span className="label">Dominadas</span>
                <span className="value">{overall.mastered}</span>
                <span className="delta">caja 5</span>
              </div>
              <div className="stat">
                <span className="label">En aprendizaje</span>
                <span className="value">{overall.learning}</span>
                <span className="delta">cajas 1-2</span>
              </div>
              <div className="stat">
                <span className="label">Caja promedio</span>
                <span className="value">{overall.averageBox.toFixed(2)}</span>
              </div>
            </div>

            <h3
              style={{
                marginTop: 22,
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Distribución Leitner
            </h3>
            <div className="leitner" style={{ marginTop: 10 }}>
              {BOX_VALUES.map((b) => {
                const count = overall.boxDistribution[b];
                const pct = (count / maxBoxCount) * 100;
                return (
                  <div className="leitner-row" key={b}>
                    <span className="leitner-label">Caja {b}</span>
                    <div className="leitner-bar" data-box={b}>
                      <div className="fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="leitner-count">{count}</span>
                  </div>
                );
              })}
            </div>

            {review.length > 0 && (
              <>
                <h3
                  style={{
                    marginTop: 22,
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Servicios para repasar
                </h3>
                <ul className="review-list" style={{ marginTop: 8 }}>
                  {review.map((s) => (
                    <li key={s.service.id}>
                      <ServiceIcon serviceId={s.service.id} size="sm" />
                      <div>
                        <div className="name">{s.service.name}</div>
                        <div className="desc">{s.service.shortDesc}</div>
                      </div>
                      <span
                        className="box-pill"
                        data-box={Math.round(s.averageBox)}
                      >
                        Box {s.averageBox.toFixed(1)}
                      </span>
                      <span className="lapses">×{s.totalLapses}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {byCategory.some((c) => c.servicesSeen > 0) && (
              <>
                <h3
                  style={{
                    marginTop: 22,
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Dominio por categoría
                </h3>
                <div className="cat-bars" style={{ marginTop: 8 }}>
                  {byCategory
                    .filter((c) => c.servicesSeen > 0)
                    .sort((a, b) => b.averageBox - a.averageBox)
                    .map((c) => {
                      const pct = (c.averageBox / 5) * 100;
                      return (
                        <div className="cat-bar" key={c.category.id}>
                          <span className="name" style={{ color: c.category.color }}>
                            {c.category.name}
                          </span>
                          <div className="track">
                            <div
                              className="fill"
                              style={{
                                width: `${pct}%`,
                                background: c.category.color,
                              }}
                            />
                          </div>
                          <span className="pct">
                            {c.servicesSeen}/{c.serviceCount}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
              Última sesión {formatRelative(overall.lastReviewed)} ·{" "}
              {overall.totalReviews} revisiones · {overall.totalLapses} lapses
            </p>
          </>
        )}
      </div>

      {/* ── Memorama ────────────────────────────────────────────────── */}
      <div className="frame snap" style={{ marginTop: 18 }}>
        <div className="frame-head">
          <div>
            <div className="kicker" style={{ color: "var(--accent)" }}>
              Modo 02
            </div>
            <h2 className="h2" style={{ marginTop: 4 }}>
              Memorama
            </h2>
          </div>
          {hasMemoramaData && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={reset("los récords de memorama", clearMemoramaStats)}
            >
              Reiniciar
            </button>
          )}
        </div>

        {!hasMemoramaData ? (
          <p className="muted">
            Aún no completas un memorama.{" "}
            <Link to="/memorama">Juega una partida →</Link>
          </p>
        ) : (
          <div className="stats-grid">
            {memorama.map((r) => {
              const played = r.bestMoves != null || r.bestTimeMs != null;
              return (
                <div
                  key={r.pairs}
                  className="stat"
                  style={played ? undefined : { opacity: 0.55 }}
                >
                  <span className="label">{r.pairs} pares</span>
                  <span className="value">
                    {formatTime(r.bestTimeMs)}
                  </span>
                  <span className="delta">
                    {r.bestMoves != null ? `${r.bestMoves} movs` : "sin récord"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Drilldown ───────────────────────────────────────────────── */}
      <div className="frame snap" style={{ marginTop: 18 }}>
        <div className="frame-head">
          <div>
            <div className="kicker" style={{ color: "var(--accent)" }}>
              Modo 03
            </div>
            <h2 className="h2" style={{ marginTop: 4 }}>
              Drilldown
            </h2>
          </div>
          {hasDrilldownData && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={reset("el progreso de Drilldown", clearDrilldownProgress)}
            >
              Reiniciar
            </button>
          )}
        </div>

        {!hasDrilldownData ? (
          <p className="muted">
            Aún no respondes preguntas de Drilldown.{" "}
            <Link to="/drilldown">Empieza una sesión →</Link>
          </p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat">
                <span className="label">Preguntas vistas</span>
                <span className="value">{drilldownOverall.attempts}</span>
              </div>
              <div className="stat is-accent">
                <span className="label">Acierto global</span>
                <span className="value">
                  {Math.round(drilldownOverall.accuracy * 100)}%
                </span>
              </div>
              <div className="stat">
                <span className="label">Dominadas</span>
                <span className="value">
                  {drilldownOverall.featuresMastered}
                </span>
                <span className="delta">de {drilldownOverall.totalFeatures}</span>
              </div>
              <div className="stat">
                <span className="label">Cobertura</span>
                <span className="value">
                  {drilldownOverall.featuresSeen}
                </span>
                <span className="delta">features vistas</span>
              </div>
            </div>

            {drilldownReview.length > 0 && (
              <>
                <h3
                  style={{
                    marginTop: 22,
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Features para repasar
                </h3>
                <ul className="review-list" style={{ marginTop: 8 }}>
                  {drilldownReview.map((r) => (
                    <li key={r.feature.id}>
                      <ServiceIcon serviceId={r.parent.id} size="sm" />
                      <div>
                        <div className="name">
                          {r.parent.name} · {r.feature.name}
                        </div>
                        <div className="desc">{r.feature.shortDesc}</div>
                      </div>
                      <span
                        className="box-pill"
                        data-box={r.accuracy >= 0.8 ? 5 : r.accuracy >= 0.5 ? 3 : 1}
                      >
                        {Math.round(r.accuracy * 100)}%
                      </span>
                      <span className="lapses">×{r.attempts}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {drilldownByParent.some((p) => p.attempts > 0) && (
              <>
                <h3
                  style={{
                    marginTop: 22,
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Dominio por servicio padre
                </h3>
                <div className="cat-bars" style={{ marginTop: 8 }}>
                  {drilldownByParent
                    .filter((p) => p.attempts > 0)
                    .sort((a, b) => b.accuracy - a.accuracy)
                    .map((p) => {
                      const pct = Math.round(p.accuracy * 100);
                      const color =
                        getCategory(p.parent.category)?.color ?? "var(--accent)";
                      return (
                        <div className="cat-bar" key={p.parent.id}>
                          <span className="name" style={{ color }}>
                            {p.parent.name}
                          </span>
                          <div className="track">
                            <div
                              className="fill"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <span className="pct">
                            {p.featuresMastered}/{p.totalFeatures}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Examen ──────────────────────────────────────────────────── */}
      <div className="frame snap" style={{ marginTop: 18 }}>
        <div className="frame-head">
          <div>
            <div className="kicker" style={{ color: "var(--accent)" }}>
              Modo 04
            </div>
            <h2 className="h2" style={{ marginTop: 4 }}>
              Examen
            </h2>
          </div>
          {hasExamData && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={reset("el historial de exámenes", clearExamAttempts)}
            >
              Reiniciar
            </button>
          )}
        </div>

        {!hasExamData ? (
          <p className="muted">
            Aún no has hecho un examen. <Link to="/exam">Empieza uno →</Link>
          </p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat">
                <span className="label">Intentos</span>
                <span className="value">{examAttempts.length}</span>
              </div>
              <div className="stat is-accent">
                <span className="label">Aprobación</span>
                <span className="value">{Math.round(examPassRate * 100)}%</span>
              </div>
              <div className="stat">
                <span className="label">Mejor score</span>
                <span className="value">{Math.round(examBest * 100)}%</span>
              </div>
              <div className="stat">
                <span className="label">Último</span>
                <span className="value">{Math.round(examLastScore * 100)}%</span>
              </div>
            </div>

            <h3
              style={{
                marginTop: 22,
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Historial
            </h3>
            <table className="history-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Score</th>
                  <th>Verdict</th>
                  <th>Tiempo</th>
                  <th>Configuración</th>
                </tr>
              </thead>
              <tbody>
                {examAttempts.slice(0, 10).map((a) => {
                  const score = a.correct / a.total;
                  const min = Math.floor(a.durationMs / 60000);
                  const sec = Math.floor((a.durationMs % 60000) / 1000);
                  return (
                    <tr key={a.timestamp}>
                      <td>{formatDate(a.timestamp)}</td>
                      <td className="score-cell">
                        {Math.round(score * 100)}%
                      </td>
                      <td className={a.passed ? "pass" : "fail"}>
                        {a.passed ? "PASA" : "FALLA"}
                      </td>
                      <td>
                        {min}:{String(sec).padStart(2, "0")}
                      </td>
                      <td className="muted">
                        {a.total} pregs · {MIX_LABELS[a.config.mix]} · T
                        {a.config.tiers.join(",")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
