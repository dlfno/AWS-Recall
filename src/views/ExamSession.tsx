import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import { buildExam, PASS_THRESHOLD } from "../lib/exam";
import {
  addExamAttempt,
  loadExamConfig,
} from "../lib/progress-store";
import type { ExamConfig, ExamQuestion } from "../lib/types";

interface SessionState {
  questions: ExamQuestion[];
  index: number;
  answers: Record<string, string>;
  startedAt: number;
  finishedAt: number | null;
}

const LETTERS = ["A", "B", "C", "D", "E"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtTime(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

export function ExamSession() {
  const navigate = useNavigate();
  const config = useMemo<ExamConfig | null>(() => {
    const c = loadExamConfig({
      tiers: [],
      categories: [],
      totalQuestions: 20,
      secondsPerQuestion: 90,
      mix: "mixed",
    });
    if (c.tiers.length === 0 || c.categories.length === 0) return null;
    return c;
  }, []);

  const build = useMemo(() => (config ? buildExam(config) : null), [config]);

  const [state, setState] = useState<SessionState>(() => ({
    questions: build?.questions ?? [],
    index: 0,
    answers: {},
    startedAt: Date.now(),
    finishedAt: null,
  }));

  const [now, setNow] = useState(Date.now());
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!config) navigate("/exam");
  }, [config, navigate]);

  useEffect(() => {
    if (state.finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [state.finishedAt]);

  const totalMs = (build?.totalSeconds ?? 0) * 1000;
  const elapsed = (state.finishedAt ?? now) - state.startedAt;
  const remaining = totalMs - elapsed;

  useEffect(() => {
    if (state.finishedAt) return;
    if (remaining <= 0) {
      setState((s) => (s.finishedAt ? s : { ...s, finishedAt: Date.now() }));
    }
  }, [remaining, state.finishedAt]);

  useEffect(() => {
    if (!state.finishedAt || recordedRef.current || !config) return;
    recordedRef.current = true;
    const total = state.questions.length;
    const correct = state.questions.filter(
      (q) => state.answers[q.id] === q.correctOptionId,
    ).length;
    const answered = state.questions.filter((q) => state.answers[q.id]).length;
    addExamAttempt({
      timestamp: state.finishedAt,
      total,
      answered,
      correct,
      durationMs: state.finishedAt - state.startedAt,
      passed: total > 0 && correct / total >= PASS_THRESHOLD,
      config,
    });
  }, [
    state.finishedAt,
    state.questions,
    state.answers,
    state.startedAt,
    config,
  ]);

  if (!config || !build) return null;

  if (state.questions.length === 0) {
    return (
      <div className="page">
        <div className="session-shell">
          <p className="lede">
            No se pudieron generar preguntas con esta configuración.
          </p>
          <Link
            to="/exam"
            className="btn primary"
            style={{ textDecoration: "none", marginTop: 12, display: "inline-flex" }}
          >
            Volver a configurar →
          </Link>
        </div>
      </div>
    );
  }

  const done = state.finishedAt !== null;

  if (done) {
    const total = state.questions.length;
    const correctCount = state.questions.filter(
      (q) => state.answers[q.id] === q.correctOptionId,
    ).length;
    const unanswered = state.questions.filter((q) => !state.answers[q.id]);
    const score = correctCount / total;
    const passed = score >= PASS_THRESHOLD;
    const usedMs = state.finishedAt! - state.startedAt;

    return (
      <div className="page">
        <div className="session-shell">
          <div className={`verdict ${passed ? "passed" : "failed"}`}>
            <div>
              <div className="label">
                {passed ? "EXAMEN APROBADO" : "EXAMEN NO APROBADO"}
              </div>
              <div className="big">{Math.round(score * 100)}%</div>
              <div className="mono">
                {correctCount}/{total} correctas · {fmtTime(usedMs)} · umbral{" "}
                {Math.round(PASS_THRESHOLD * 100)}%
              </div>
            </div>
            <div className="breakdown">
              <div>
                <b>{correctCount}</b> correctas
              </div>
              <div>
                <b>{total - correctCount - unanswered.length}</b> erradas
              </div>
              <div>
                <b>{unanswered.length}</b> sin responder
              </div>
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
            Revisión
          </h3>
          <ul className="review-list" style={{ marginTop: 8 }}>
            {state.questions.map((q, i) => {
              const picked = state.answers[q.id];
              const correct = q.correctOptionId === picked;
              const userOpt = q.options.find((o) => o.id === picked);
              const correctOpt = q.options.find(
                (o) => o.id === q.correctOptionId,
              )!;
              return (
                <li
                  key={q.id}
                  style={{
                    gridTemplateColumns: "40px 1fr auto",
                    alignItems: "start",
                  }}
                >
                  <span
                    className="box-pill"
                    data-box={correct ? 5 : 1}
                    style={{ textAlign: "center" }}
                  >
                    #{i + 1}
                  </span>
                  <div>
                    <div className="name" style={{ fontStyle: "italic" }}>
                      "{q.prompt}"
                    </div>
                    <div className="desc" style={{ marginTop: 4 }}>
                      {!picked ? (
                        <span style={{ color: "var(--ink-3)" }}>
                          Sin responder. Correcta: <b>{correctOpt.label}</b>
                        </span>
                      ) : correct ? (
                        <span style={{ color: "var(--good)" }}>
                          ✓ Tu respuesta: {userOpt?.label}
                        </span>
                      ) : (
                        <>
                          <span style={{ color: "var(--bad)" }}>
                            ✗ Tu respuesta: {userOpt?.label}
                          </span>
                          <br />
                          <span style={{ color: "var(--good)" }}>
                            Correcta: {correctOpt.label}
                          </span>
                        </>
                      )}
                    </div>
                    <small className="muted" style={{ marginTop: 4, display: "block" }}>
                      {q.explanation}
                    </small>
                  </div>
                  {q.iconServiceId && (
                    <ServiceIcon serviceId={q.iconServiceId} size="sm" />
                  )}
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate("/exam/play", { replace: true })}
            >
              Otro intento →
            </button>
            <Link
              to="/exam"
              className="btn ghost"
              style={{ textDecoration: "none" }}
            >
              Cambiar configuración
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const q = state.questions[state.index];
  const picked = state.answers[q.id];
  const lastQuestion = state.index === state.questions.length - 1;

  const choose = (optionId: string) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [q.id]: optionId } }));
  };

  const goTo = (idx: number) => {
    setState((s) => ({ ...s, index: Math.max(0, Math.min(idx, s.questions.length - 1)) }));
  };

  const next = () => goTo(state.index + 1);
  const prev = () => goTo(state.index - 1);

  const finish = () => {
    if (!window.confirm("¿Terminar examen ahora?")) return;
    setState((s) => ({ ...s, finishedAt: Date.now() }));
  };

  const timerCls =
    remaining < 15_000 ? "danger" : remaining < 60_000 ? "warn" : "";

  const answeredCount = state.questions.filter((qq) => state.answers[qq.id]).length;

  return (
    <div className="page">
      <div className="session-shell">
        <div className="exam-bar">
          <Link
            to="/exam"
            className="btn ghost sm"
            style={{ textDecoration: "none" }}
          >
            ← Setup
          </Link>
          <div className="qprog">
            <div className="qcount">
              <b>{state.index + 1}</b> de {state.questions.length} · {answeredCount} resp.
            </div>
            <div className="qdots">
              {state.questions.map((qq, i) => (
                <button
                  key={qq.id}
                  type="button"
                  className={`qdot ${state.answers[qq.id] ? "answered" : ""} ${
                    i === state.index ? "current" : ""
                  }`}
                  onClick={() => goTo(i)}
                  aria-label={`Pregunta ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <span className={`timer ${timerCls}`}>{fmtTime(remaining)}</span>
          <button type="button" className="btn dark sm" onClick={finish}>
            Terminar
          </button>
        </div>

        <div className="dd-prompt">
          <div className="kicker">
            {q.iconServiceId
              ? "Identifica el servicio por su ícono"
              : q.kind === "drilldown"
                ? `Drilldown · ${q.parentName ?? ""}`
                : q.variant === "usecase-to-service"
                  ? "Caso de uso → servicio"
                  : q.variant === "service-to-description"
                    ? "Servicio → descripción"
                    : "Acrónimo → nombre completo"}
          </div>
          {q.iconServiceId ? (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: 18,
                  background: "var(--paper)",
                  borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <ServiceIcon serviceId={q.iconServiceId} size="lg" />
              </div>
            </div>
          ) : (
            <p className="quote">{q.prompt}</p>
          )}
        </div>

        <div className="dd-options" style={{ marginTop: 18 }}>
          {q.options.map((opt, i) => {
            const isPicked = picked === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`dd-option ${isPicked ? "is-correct" : ""}`}
                onClick={() => choose(opt.id)}
              >
                <span className="letter">{LETTERS[i] ?? "?"}</span>
                <span>
                  <span className="opt-name">{opt.label}</span>
                </span>
                <span className="mark">{isPicked ? "•" : ""}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn ghost"
            onClick={prev}
            disabled={state.index === 0}
          >
            ← Anterior
          </button>
          {lastQuestion ? (
            <button type="button" className="btn primary" onClick={finish}>
              Entregar →
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={next}>
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
