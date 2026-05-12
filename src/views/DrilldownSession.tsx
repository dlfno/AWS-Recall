import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import { getCategory, getService } from "../lib/data";
import { buildQuestions, type DrilldownQuestion } from "../lib/drilldown";
import { recordDrilldownAnswer } from "../lib/progress-store";

interface SessionState {
  questions: DrilldownQuestion[];
  index: number;
  selected: string | null;
  answers: Record<string, string>;
}

function initialState(questions: DrilldownQuestion[]): SessionState {
  return { questions, index: 0, selected: null, answers: {} };
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function DrilldownSession() {
  const { parentId = "" } = useParams();
  const navigate = useNavigate();
  const parent = useMemo(() => getService(parentId), [parentId]);
  const cat = useMemo(
    () => (parent ? getCategory(parent.category) : undefined),
    [parent],
  );

  const [state, setState] = useState<SessionState>(() =>
    initialState(parent ? buildQuestions(parent) : []),
  );

  if (!parent) {
    return (
      <div className="page">
        <div className="session-shell">
          <p className="lede">Servicio no encontrado.</p>
          <Link
            to="/drilldown"
            className="btn primary"
            style={{ textDecoration: "none", marginTop: 12, display: "inline-flex" }}
          >
            Volver →
          </Link>
        </div>
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className="page">
        <div className="session-shell">
          <p className="lede">{parent.name} no tiene features registradas.</p>
          <Link
            to="/drilldown"
            className="btn primary"
            style={{ textDecoration: "none", marginTop: 12, display: "inline-flex" }}
          >
            Volver →
          </Link>
        </div>
      </div>
    );
  }

  const done = state.index >= state.questions.length;

  if (done) {
    const correctCount = state.questions.filter(
      (q) => state.answers[q.id] === q.correctOptionId,
    ).length;
    const total = state.questions.length;
    return (
      <div className="page">
        <div className="dd-shell">
          <div className="verdict">
            <div>
              <div className="label">
                DRILLDOWN · {parent.name.toUpperCase()}
              </div>
              <div className="big">
                {correctCount}/{total}
              </div>
              <div className="mono muted">
                {correctCount === total
                  ? "perfecto."
                  : `${total - correctCount} para repasar.`}
              </div>
            </div>
            <ServiceIcon serviceId={parent.id} size="xl" />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => setState(initialState(buildQuestions(parent)))}
            >
              Otra ronda →
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate("/drilldown")}
            >
              Cambiar de servicio
            </button>
            <Link to="/" className="btn ghost" style={{ textDecoration: "none" }}>
              Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const q = state.questions[state.index];
  const answered = state.selected !== null;

  const choose = (optionId: string) => {
    if (answered) return;
    recordDrilldownAnswer(q.featureId, optionId === q.correctOptionId);
    setState((s) => ({
      ...s,
      selected: optionId,
      answers: { ...s.answers, [q.id]: optionId },
    }));
  };

  const next = () => {
    setState((s) => ({ ...s, index: s.index + 1, selected: null }));
  };

  return (
    <div className="page">
      <div className="dd-shell">
        <div className="session-bar" style={{ marginBottom: 16 }}>
          <Link
            to="/drilldown"
            className="btn ghost sm"
            style={{ textDecoration: "none" }}
          >
            ← Setup
          </Link>
          <div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(state.index / state.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="progress-meta">
            {state.index + 1} / {state.questions.length}
          </div>
        </div>

        <div className="dd-parent">
          <div className="ico-frame">
            <ServiceIcon serviceId={parent.id} size="auto" />
          </div>
          <div>
            <h2>{parent.name}</h2>
            <p className="sub">{parent.shortDesc}</p>
          </div>
          {cat && (
            <span className="cat-tag">
              <span className="cat-dot" style={{ background: cat.color }} />
              {cat.name}
            </span>
          )}
        </div>

        <div className="dd-prompt">
          <div className="kicker">
            ¿qué feature de {parent.acronym} describe esto?
          </div>
          <p className="quote">{q.prompt}</p>
        </div>

        <div className="dd-options">
          {q.options.map((opt, i) => {
            const isPicked = state.selected === opt.id;
            const showCorrect = answered && opt.id === q.correctOptionId;
            const showWrong = answered && isPicked && !opt.correct;
            const showDim =
              answered && !showCorrect && !showWrong;
            return (
              <button
                key={opt.id}
                type="button"
                className={`dd-option ${showCorrect ? "is-correct" : ""} ${
                  showWrong ? "is-wrong" : ""
                } ${showDim ? "is-dim" : ""}`}
                disabled={answered}
                onClick={() => choose(opt.id)}
              >
                <span className="letter">{LETTERS[i] ?? "?"}</span>
                <span>
                  <span className="opt-name">{opt.label}</span>
                </span>
                <span className="mark">
                  {showCorrect ? "✓" : showWrong ? "✗" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <button type="button" className="btn primary" onClick={next}>
              {state.index + 1 === state.questions.length
                ? "Ver resultado →"
                : "Siguiente →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
