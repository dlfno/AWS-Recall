import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { socialApi, type ActivityKind, type FeedEvent } from "../lib/social-api";
import { Avatar } from "../components/PhotoUpload";
import { formatPercent, formatRelative, formatTimeMs } from "../lib/format";
import { ApiError } from "../lib/api";

function describe(ev: FeedEvent): string {
  const k = ev.kind as ActivityKind;
  const p = (ev.payload ?? {}) as Record<string, unknown>;
  switch (k) {
    case "card_mastered":
      return `dominó una carta (${p.cardId ?? "?"})`;
    case "exam_passed":
      return `aprobó un examen ${p.correct}/${p.total} en ${formatTimeMs(Number(p.durationMs) || 0)}`;
    case "exam_failed":
      return `terminó un examen ${p.correct}/${p.total} (${formatPercent(Number(p.correct) / Number(p.total))})`;
    case "memo_record":
      return `nuevo récord en memorama de ${p.pairs} pares: ${p.moves} mov · ${formatTimeMs(Number(p.timeMs) || 0)}`;
    case "drilldown_milestone":
      return "alcanzó un hito en drilldown";
    default:
      return "actividad";
  }
}

const KIND_ICON: Record<ActivityKind, string> = {
  card_mastered: "✨",
  exam_passed: "🏆",
  exam_failed: "📝",
  memo_record: "⚡",
  drilldown_milestone: "🎯",
};

export function Feed() {
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socialApi
      .feed(50)
      .then((r) => setEvents(r.events))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error"));
  }, []);

  return (
    <section className="page">
      <header className="hero-head">
        <div>
          <p className="eyebrow"><span className="dot" /> recientes</p>
          <h1 className="h-display">Feed de la clase</h1>
          <p className="lede">Lo que tus compañeros están logrando.</p>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {!events && !error && <p className="muted">cargando…</p>}

      {events && events.length === 0 && (
        <p className="muted">Sin actividad reciente todavía.</p>
      )}

      {events && events.length > 0 && (
        <ul className="feed-list">
          {events.map((ev) => (
            <li key={ev.id} className="feed-item">
              <Link to={`/u/${ev.user.nickname}`} aria-label={ev.user.nickname}>
                <Avatar user={ev.user} size={44} />
              </Link>
              <div className="feed-body">
                <p>
                  <Link to={`/u/${ev.user.nickname}`} className="feed-user">
                    {ev.user.fullName}
                  </Link>{" "}
                  <span className="muted mono">@{ev.user.nickname}</span>{" "}
                  {describe(ev)}
                </p>
                <span className="muted">{formatRelative(ev.occurredAt)}</span>
              </div>
              <span className="feed-icon" aria-hidden="true">{KIND_ICON[ev.kind] ?? "•"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
