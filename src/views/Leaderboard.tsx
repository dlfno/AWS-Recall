import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  socialApi,
  type LeaderboardEntryDTO,
  type LeaderboardMode,
} from "../lib/social-api";
import { Avatar } from "../components/PhotoUpload";
import { formatPercent, formatTimeMs } from "../lib/format";
import { ApiError } from "../lib/api";

const MODES: { id: LeaderboardMode; label: string; metricLabel: string; secondaryLabel: string; formatMetric: (n: number) => string; formatSecondary: (n: number) => string }[] = [
  { id: "flashcards", label: "Flashcards", metricLabel: "Dominadas", secondaryLabel: "Vistas", formatMetric: (n) => String(n), formatSecondary: (n) => String(n) },
  { id: "drilldown", label: "Drilldown", metricLabel: "Accuracy", secondaryLabel: "Intentos", formatMetric: (n) => formatPercent(n, 1), formatSecondary: (n) => String(n) },
  { id: "memorama", label: "Memorama", metricLabel: "Partidas", secondaryLabel: "Mejor tiempo", formatMetric: (n) => String(n), formatSecondary: (n) => (n > 0 ? formatTimeMs(n) : "—") },
  { id: "exams", label: "Exámenes", metricLabel: "Aprobados", secondaryLabel: "Total", formatMetric: (n) => String(n), formatSecondary: (n) => String(n) },
];

export function Leaderboard() {
  const [mode, setMode] = useState<LeaderboardMode>("flashcards");
  const [entries, setEntries] = useState<LeaderboardEntryDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEntries(null);
    setError(null);
    socialApi
      .leaderboard(mode)
      .then((r) => setEntries(r.entries))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error"));
  }, [mode]);

  const meta = MODES.find((m) => m.id === mode)!;

  return (
    <section className="page">
      <header className="hero-head">
        <div>
          <p className="eyebrow"><span className="dot" /> ranking</p>
          <h1 className="h-display">Leaderboard</h1>
          <p className="lede">Quién va al frente de la clase, por modo.</p>
        </div>
      </header>

      <div className="tabs">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip ${m.id === mode ? "is-active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {!entries && !error && <p className="muted">cargando…</p>}

      {entries && entries.length === 0 && (
        <p className="muted">Aún no hay datos suficientes en este modo.</p>
      )}

      {entries && entries.length > 0 && (
        <ol className="leaderboard-list">
          {entries.map((e, i) => (
            <li key={e.user.id} className="leaderboard-row">
              <span className="lb-rank num">{i + 1}</span>
              <Link to={`/u/${e.user.nickname}`} className="lb-user">
                <Avatar user={e.user} size={40} />
                <div>
                  <strong>{e.user.fullName}</strong>
                  <span className="muted mono">@{e.user.nickname}</span>
                </div>
              </Link>
              <div className="lb-metric">
                <span className="kicker">{meta.metricLabel}</span>
                <strong className="num">{meta.formatMetric(e.metric)}</strong>
              </div>
              <div className="lb-secondary">
                <span className="kicker">{meta.secondaryLabel}</span>
                <span className="num">{meta.formatSecondary(e.secondary)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
