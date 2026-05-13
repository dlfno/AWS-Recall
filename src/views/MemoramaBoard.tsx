import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import { buildBoard } from "../lib/board-builder";
import {
  loadMemoramaConfig,
  loadMemoramaStats,
  recordMemoramaGame,
  saveMemoramaStats,
} from "../lib/progress-store";
import { getService } from "../lib/data";
import type { MemoramaCard, MemoramaConfig } from "../lib/types";

interface BoardState {
  cards: MemoramaCard[];
  rows: number;
  cols: number;
  pairs: number;
  selected: string[];
  matchedCount: number;
  moves: number;
  startedAt: number;
  finishedAt: number | null;
}

function initialState(config: MemoramaConfig): BoardState {
  const board = buildBoard(config);
  return {
    cards: board.cards,
    rows: board.rows,
    cols: board.cols,
    pairs: board.pairs,
    selected: [],
    matchedCount: 0,
    moves: 0,
    startedAt: Date.now(),
    finishedAt: null,
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtTime(ms: number) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function textSizeClass(value: string): string {
  const len = value.length;
  if (len <= 4) return "text-xl";
  if (len <= 12) return "text-lg";
  if (len <= 32) return "text";
  return "text-sm";
}

export function MemoramaBoard() {
  const navigate = useNavigate();
  const config = useMemo<MemoramaConfig | null>(() => {
    const c = loadMemoramaConfig({
      tiers: [],
      categories: [],
      pairType: "acronym-fullname",
      pairs: 8,
      timer: true,
    });
    if (c.tiers.length === 0 || c.categories.length === 0) return null;
    return c;
  }, []);

  const [state, setState] = useState<BoardState | null>(() =>
    config ? initialState(config) : null,
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!config) navigate("/memorama");
  }, [config, navigate]);

  useEffect(() => {
    if (!config?.timer || !state || state.finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [config?.timer, state?.finishedAt, state]);

  if (!config || !state) return null;

  const elapsedMs = (state.finishedAt ?? now) - state.startedAt;

  const recordStats = (s: BoardState) => {
    const stats = loadMemoramaStats();
    stats.played += 1;
    const bestMoves = stats.bestMovesByPairs[s.pairs];
    if (bestMoves === undefined || s.moves < bestMoves) {
      stats.bestMovesByPairs[s.pairs] = s.moves;
    }
    const finished = s.finishedAt ?? Date.now();
    const time = finished - s.startedAt;
    const bestTime = stats.bestTimeByPairs[s.pairs];
    if (bestTime === undefined || time < bestTime) {
      stats.bestTimeByPairs[s.pairs] = time;
    }
    saveMemoramaStats(stats);
    recordMemoramaGame(s.pairs, s.moves, time);
  };

  const handleClick = (card: MemoramaCard) => {
    if (state.finishedAt) return;
    if (card.flipped || card.matched) return;
    if (state.selected.length >= 2) return;

    const cards = state.cards.map((c) =>
      c.id === card.id ? { ...c, flipped: true } : c,
    );
    const selected = [...state.selected, card.id];

    if (selected.length < 2) {
      setState({ ...state, cards, selected });
      return;
    }

    const [aId, bId] = selected;
    const a = cards.find((c) => c.id === aId)!;
    const b = cards.find((c) => c.id === bId)!;
    const moves = state.moves + 1;

    if (a.pairId === b.pairId) {
      const updated = cards.map((c) =>
        c.pairId === a.pairId ? { ...c, matched: true } : c,
      );
      const matchedCount = state.matchedCount + 1;
      const finishedAt = matchedCount === state.pairs ? Date.now() : null;
      const next: BoardState = {
        ...state,
        cards: updated,
        selected: [],
        moves,
        matchedCount,
        finishedAt,
      };
      setState(next);
      if (finishedAt) recordStats(next);
    } else {
      setState({ ...state, cards, selected, moves });
      window.setTimeout(() => {
        setState((s) => {
          if (!s) return s;
          return {
            ...s,
            cards: s.cards.map((c) =>
              c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c,
            ),
            selected: [],
          };
        });
      }, 900);
    }
  };

  const reset = () => setState(initialState(config));

  return (
    <div className="page">
      <div className="session-shell">
        <div className="session-bar" style={{ marginBottom: 18 }}>
          <Link
            to="/memorama"
            className="btn ghost sm"
            style={{ textDecoration: "none" }}
          >
            ← Setup
          </Link>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {state.matchedCount} / {state.pairs} pares
            </div>
            <div className="progress-meta" style={{ marginTop: 2 }}>
              {state.moves} movimientos
            </div>
          </div>
          <div className="progress-meta">
            {config.timer ? fmtTime(elapsedMs) : "—"}
          </div>
        </div>

        <div className="memo-hud">
          <div className="cell">
            <div className="label">Tiempo</div>
            <div className="value">{config.timer ? fmtTime(elapsedMs) : "—"}</div>
          </div>
          <div className="cell">
            <div className="label">Movimientos</div>
            <div className="value">{state.moves}</div>
          </div>
          <div className="cell">
            <div className="label">Pares</div>
            <div className="value">
              {state.matchedCount}/{state.pairs}
            </div>
          </div>
          <div className="cell">
            <div className="label">Tablero</div>
            <div className="value">
              {state.rows}×{state.cols}
            </div>
          </div>
        </div>

        <div
          className="board"
          style={{ gridTemplateColumns: `repeat(${state.cols}, 1fr)` }}
        >
          {state.cards.map((card) => {
            const showFace = card.flipped || card.matched;
            return (
              <button
                key={card.id}
                type="button"
                className={`board-card ${showFace ? "flipped" : ""} ${card.matched ? "matched" : ""}`}
                onClick={() => handleClick(card)}
                aria-label={showFace ? "Carta revelada" : "Carta oculta"}
              >
                <div className="board-card-inner">
                  <div className="bc-face bc-back" />
                  <div className="bc-face bc-front">
                    {card.content.kind === "icon" ? (
                      <div className="icon-wrap">
                        <ServiceIcon
                          serviceId={card.serviceId}
                          iconPath={card.content.value}
                          size="auto"
                        />
                      </div>
                    ) : (
                      <span className={textSizeClass(card.content.value)}>
                        {card.content.value}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {state.finishedAt && (
          <div className="verdict" style={{ marginTop: 22 }}>
            <div>
              <div className="label">PARTIDA COMPLETADA</div>
              <div className="big">{fmtTime(elapsedMs)}</div>
              <div className="mono muted">
                {state.moves} movimientos · {state.pairs} pares
              </div>
            </div>
            <div className="breakdown">
              <div>
                <b>{state.pairs}</b> pares
              </div>
              <div>
                <b>{state.moves}</b> movs
              </div>
            </div>
          </div>
        )}

        {state.finishedAt && (
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
              Pares vistos
            </h3>
            <ul className="review-list" style={{ marginTop: 8 }}>
              {dedupe(state.cards.map((c) => c.serviceId)).map((sid) => {
                const s = getService(sid);
                if (!s) return null;
                return (
                  <li key={sid}>
                    <ServiceIcon serviceId={sid} size="sm" />
                    <div>
                      <div className="name">{s.name}</div>
                      <div className="desc">{s.shortDesc}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button type="button" className="btn primary" onClick={reset}>
                Otra partida →
              </button>
              <Link
                to="/memorama"
                className="btn ghost"
                style={{ textDecoration: "none" }}
              >
                Cambiar config
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
