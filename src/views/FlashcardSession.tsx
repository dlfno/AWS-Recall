import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import { buildDeck, VARIANT_LABELS } from "../lib/deck-builder";
import {
  getOrInit,
  loadFlashcardConfig,
  loadFlashcardProgress,
  saveFlashcardProgress,
} from "../lib/progress-store";
import {
  demote,
  pickWeighted,
  promote,
  weightForBox,
} from "../lib/spaced-rep";
import { getCategory, getService } from "../lib/data";
import type { Flashcard, FlashcardSessionConfig } from "../lib/types";

const SESSION_SIZE = 20;

interface SessionState {
  cards: Flashcard[];
  index: number;
  flipped: boolean;
  knownCount: number;
  reviewCount: number;
}

function buildSession(config: FlashcardSessionConfig): Flashcard[] {
  const deck = buildDeck(config);
  if (deck.length === 0) return [];
  const progress = loadFlashcardProgress();
  return pickWeighted(
    deck,
    (c) => weightForBox(getOrInit(progress, c.id).box),
    Math.min(SESSION_SIZE, deck.length),
  );
}

function CardFace({
  card,
  side,
}: {
  card: Flashcard;
  side: "front" | "back";
}) {
  const service = getService(card.serviceId);
  const cat = service ? getCategory(service.category) : undefined;
  const front = card.front;
  const back = card.back;
  const variantLabel = VARIANT_LABELS[card.variant];

  return (
    <div
      className={`flash-face ${side === "back" ? "flash-back" : ""}`}
      data-variant="minimal"
    >
      <div className="flash-meta">
        <span className="var-tag">
          {side === "front" ? variantLabel : "respuesta"}
        </span>
        {cat && (
          <span className="cat-tag">
            <span className="cat-dot" style={{ background: cat.color }} />
            <span>{cat.name}</span>
          </span>
        )}
      </div>

      <div className="flash-body">
        {side === "front" ? (
          front.kind === "icon" ? (
            <>
              <div className="icon-frame">
                <ServiceIcon
                  serviceId={card.serviceId}
                  iconPath={front.value}
                  size="auto"
                />
              </div>
              <p
                className="prompt"
                style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}
              >
                ¿qué servicio es?
              </p>
            </>
          ) : (
            <p className="prompt">{front.value}</p>
          )
        ) : (
          <>
            <p className="answer">{back.value}</p>
            {back.hint && <p className="desc">{back.hint}</p>}
          </>
        )}
      </div>

      <div className="flash-foot">
        <span className="hint-pill">
          <kbd>tap</kbd> o <kbd>space</kbd> para voltear
        </span>
      </div>
    </div>
  );
}

export function FlashcardSession() {
  const navigate = useNavigate();
  const config = useMemo<FlashcardSessionConfig | null>(() => {
    const c = loadFlashcardConfig({
      tiers: [],
      categories: [],
      variants: [],
    });
    if (
      c.tiers.length === 0 ||
      c.categories.length === 0 ||
      c.variants.length === 0
    ) {
      return null;
    }
    return c;
  }, []);

  const [state, setState] = useState<SessionState>(() => ({
    cards: config ? buildSession(config) : [],
    index: 0,
    flipped: false,
    knownCount: 0,
    reviewCount: 0,
  }));

  useEffect(() => {
    if (!config) navigate("/flashcards");
  }, [config, navigate]);

  const flip = () => setState((s) => ({ ...s, flipped: !s.flipped }));

  const grade = (correct: boolean) => {
    const card = state.cards[state.index];
    if (!card) return;
    const progress = loadFlashcardProgress();
    const current = getOrInit(progress, card.id);
    progress[card.id] = correct ? promote(current) : demote(current);
    saveFlashcardProgress(progress);
    setState((s) => ({
      ...s,
      index: s.index + 1,
      flipped: false,
      knownCount: s.knownCount + (correct ? 1 : 0),
      reviewCount: s.reviewCount + (correct ? 0 : 1),
    }));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.index >= state.cards.length) return;
      if (e.code === "Space") {
        e.preventDefault();
        flip();
      }
      if (state.flipped) {
        if (e.key === "1" || e.key === "j") grade(false);
        if (e.key === "2" || e.key === "k") grade(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.flipped, state.index]);

  if (!config) return null;

  if (state.cards.length === 0) {
    return (
      <div className="page">
        <div className="session-shell">
          <p className="lede">No hay tarjetas disponibles con tu configuración.</p>
          <Link
            to="/flashcards"
            className="btn primary"
            style={{ textDecoration: "none", marginTop: 12, display: "inline-flex" }}
          >
            Volver a configurar →
          </Link>
        </div>
      </div>
    );
  }

  const done = state.index >= state.cards.length;
  const total = state.cards.length;

  if (done) {
    return (
      <div className="page">
        <div className="session-shell">
          <div className="verdict">
            <div>
              <div className="label">SESIÓN COMPLETADA</div>
              <div className="big">
                {state.knownCount}/{total}
              </div>
              <div className="mono muted">
                {state.reviewCount} cartas necesitan repaso
              </div>
            </div>
            <div className="breakdown">
              <div>
                <b>{state.knownCount}</b> sé
              </div>
              <div>
                <b>{state.reviewCount}</b> repasar
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                setState({
                  cards: buildSession(config),
                  index: 0,
                  flipped: false,
                  knownCount: 0,
                  reviewCount: 0,
                })
              }
            >
              Otra ronda →
            </button>
            <Link
              to="/flashcards"
              className="btn ghost"
              style={{ textDecoration: "none" }}
            >
              Cambiar config
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const card = state.cards[state.index];
  const progressPct = (state.index / total) * 100;

  return (
    <div className="page">
      <div className="session-shell">
        <div className="session-bar">
          <Link
            to="/flashcards"
            className="btn ghost sm"
            style={{ textDecoration: "none" }}
          >
            ← Setup
          </Link>
          <div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div
              className="progress-meta"
              style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}
            >
              <span>
                sé {state.knownCount} · repasar {state.reviewCount}
              </span>
              <span>{Math.round(progressPct)}% completado</span>
            </div>
          </div>
          <div className="progress-meta">
            {state.index + 1} / {total}
          </div>
        </div>

        <div className="flashcard-stage" onClick={flip}>
          <div
            key={card.id}
            className={`flashcard-inner ${state.flipped ? "flipped" : ""}`}
          >
            <CardFace card={card} side="front" />
            <CardFace card={card} side="back" />
          </div>
        </div>

        <div className="flash-actions">
          {!state.flipped ? (
            <button
              type="button"
              className="btn primary"
              style={{ gridColumn: "1 / -1", padding: 18 }}
              onClick={flip}
            >
              Mostrar respuesta <span className="flash-shortcut">SPACE</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn bad"
                onClick={() => grade(false)}
              >
                ✗ Repasar <span className="flash-shortcut">J / 1</span>
              </button>
              <button
                type="button"
                className="btn good"
                onClick={() => grade(true)}
              >
                ✓ Ya me la sé <span className="flash-shortcut">K / 2</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
