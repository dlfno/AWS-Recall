import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { socialApi, type CompareDTO, type UserStatsDTO } from "../lib/social-api";
import { Avatar } from "../components/PhotoUpload";
import { formatPercent, formatTimeMs } from "../lib/format";
import { ApiError } from "../lib/api";

const ROWS: { label: string; pick: (s: UserStatsDTO) => string; higher: "more" | "less" | "none"; key: (s: UserStatsDTO) => number }[] = [
  { label: "Cartas dominadas", pick: (s) => String(s.flashcards.mastered), higher: "more", key: (s) => s.flashcards.mastered },
  { label: "Cartas vistas", pick: (s) => String(s.flashcards.cardsSeen), higher: "more", key: (s) => s.flashcards.cardsSeen },
  { label: "Reviews totales", pick: (s) => String(s.flashcards.totalReviews), higher: "more", key: (s) => s.flashcards.totalReviews },
  { label: "Aciertos flashcards", pick: (s) => formatPercent(s.flashcards.accuracy), higher: "more", key: (s) => s.flashcards.accuracy },
  { label: "Aciertos drilldown", pick: (s) => formatPercent(s.drilldown.accuracy), higher: "more", key: (s) => s.drilldown.accuracy },
  { label: "Features dominados", pick: (s) => String(s.drilldown.featuresMastered), higher: "more", key: (s) => s.drilldown.featuresMastered },
  { label: "Partidas memorama", pick: (s) => String(s.memorama.played), higher: "more", key: (s) => s.memorama.played },
  { label: "Mejor 6 pares", pick: (s) => formatTimeMs(s.memorama.bestTimeByPairs["6"]), higher: "less", key: (s) => s.memorama.bestTimeByPairs["6"] ?? Infinity },
  { label: "Mejor 18 pares", pick: (s) => formatTimeMs(s.memorama.bestTimeByPairs["18"]), higher: "less", key: (s) => s.memorama.bestTimeByPairs["18"] ?? Infinity },
  { label: "Exámenes aprobados", pick: (s) => String(s.exams.passed), higher: "more", key: (s) => s.exams.passed },
  { label: "Mejor examen", pick: (s) => formatPercent(s.exams.bestRate), higher: "more", key: (s) => s.exams.bestRate },
];

function winnerSide(a: number, b: number, higher: "more" | "less" | "none"): "a" | "b" | null {
  if (higher === "none" || a === b) return null;
  if (higher === "more") return a > b ? "a" : "b";
  return a < b ? "a" : "b";
}

export function Compare() {
  const { a = "", b = "" } = useParams<{ a: string; b: string }>();
  const [data, setData] = useState<CompareDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    socialApi
      .compare(a, b)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error"));
  }, [a, b]);

  return (
    <section className="page">
      <header className="hero-head">
        <div>
          <p className="eyebrow"><span className="dot" /> comparación</p>
          <h1 className="h-display">Cara a cara</h1>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {!data && !error && <p className="muted">cargando…</p>}

      {data && (
        <div className="compare-table">
          <div className="compare-head">
            <div className="compare-user">
              <Avatar user={data.a.user} size={64} />
              <div>
                <strong>{data.a.user.fullName}</strong>
                <span className="muted mono">@{data.a.user.nickname}</span>
                {data.a.streak > 0 && <span className="streak">{data.a.streak} días</span>}
              </div>
            </div>
            <div className="compare-vs">vs</div>
            <div className="compare-user compare-user-right">
              <div>
                <strong>{data.b.user.fullName}</strong>
                <span className="muted mono">@{data.b.user.nickname}</span>
                {data.b.streak > 0 && <span className="streak">{data.b.streak} días</span>}
              </div>
              <Avatar user={data.b.user} size={64} />
            </div>
          </div>

          <div className="compare-rows">
            {ROWS.map((row) => {
              const av = row.key(data.a.stats);
              const bv = row.key(data.b.stats);
              const win = winnerSide(av, bv, row.higher);
              return (
                <div className="compare-row" key={row.label}>
                  <div className={`compare-cell ${win === "a" ? "wins" : ""}`}>
                    {row.pick(data.a.stats)}
                  </div>
                  <div className="compare-label">{row.label}</div>
                  <div className={`compare-cell ${win === "b" ? "wins" : ""}`}>
                    {row.pick(data.b.stats)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
