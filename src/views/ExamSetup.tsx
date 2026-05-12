import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiltersControl } from "../components/FiltersControl";
import { filterServices, SERVICES } from "../lib/data";
import {
  EXAM_LENGTHS,
  EXAM_MIXES,
  EXAM_TIMES,
  MIX_LABELS,
} from "../lib/exam";
import { loadExamConfig, saveExamConfig } from "../lib/progress-store";
import type { ExamConfig, ExamMix } from "../lib/types";

const DEFAULT_CONFIG: ExamConfig = {
  tiers: [1, 2],
  categories: [
    "compute",
    "storage",
    "database",
    "networking",
    "security",
    "management",
    "analytics",
    "integration",
    "containers",
  ],
  totalQuestions: 20,
  secondsPerQuestion: 90,
  mix: "mixed",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m} min ${s}s`;
}

export function ExamSetup() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ExamConfig>(() =>
    loadExamConfig(DEFAULT_CONFIG),
  );

  const services = useMemo(() => filterServices(config), [config]);
  const parents = useMemo(
    () =>
      SERVICES.filter(
        (s) =>
          (s.features?.length ?? 0) >= 2 &&
          config.tiers.includes(s.tier) &&
          config.categories.includes(s.category),
      ),
    [config.tiers, config.categories],
  );

  const enoughForFlash = services.length >= 4;
  const enoughForDrill = parents.length >= 1;
  const canStart =
    (config.mix === "drilldown" && enoughForDrill) ||
    (config.mix === "flashcards" && enoughForFlash) ||
    (config.mix === "mixed" && (enoughForFlash || enoughForDrill));

  const totalSeconds = config.totalQuestions * config.secondsPerQuestion;

  const start = () => {
    saveExamConfig(config);
    navigate("/exam/play");
  };

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            CONFIGURACIÓN · MODO 04
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>
            Examen.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Simulación contra reloj. Mezcla preguntas tipo flashcard y
            drilldown. Umbral 70%.
          </p>
        </div>
        <div>
          <Link to="/" className="btn ghost" style={{ textDecoration: "none" }}>
            ← Inicio
          </Link>
        </div>
      </div>

      <div className="setup-grid">
        <div>
          <FiltersControl
            filters={{ tiers: config.tiers, categories: config.categories }}
            onChange={(f) => setConfig({ ...config, ...f })}
          />

          <div className="setup-section">
            <h3>Cantidad de preguntas</h3>
            <div className="chip-row">
              {EXAM_LENGTHS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip ${config.totalQuestions === n ? "is-on" : ""}`}
                  onClick={() => setConfig({ ...config, totalQuestions: n })}
                  aria-pressed={config.totalQuestions === n}
                >
                  {n} preguntas
                </button>
              ))}
            </div>
          </div>

          <div className="setup-section">
            <h3>Tiempo por pregunta</h3>
            <div className="chip-row">
              {EXAM_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${config.secondsPerQuestion === t ? "is-on" : ""}`}
                  onClick={() => setConfig({ ...config, secondsPerQuestion: t })}
                  aria-pressed={config.secondsPerQuestion === t}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <div className="setup-section">
            <h3>Tipo de preguntas</h3>
            <div className="chip-row">
              {EXAM_MIXES.map((m) => {
                const disabled =
                  (m === "drilldown" && !enoughForDrill) ||
                  (m === "flashcards" && !enoughForFlash);
                return (
                  <button
                    key={m}
                    type="button"
                    className={`chip ${config.mix === m ? "is-on" : ""} ${disabled ? "is-disabled" : ""}`}
                    onClick={() => !disabled && setConfig({ ...config, mix: m as ExamMix })}
                    aria-pressed={config.mix === m}
                    disabled={disabled}
                  >
                    {MIX_LABELS[m]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="preview">
          <div className="kicker">Resumen</div>
          <h2 className="h2">Listo para entregar</h2>
          <div className="preview-stat">
            <span>Servicios</span>
            <span className="big">{services.length}</span>
          </div>
          <div className="preview-stat">
            <span>Padres con features</span>
            <span className="big">{parents.length}</span>
          </div>
          <div className="preview-stat">
            <span>Duración total</span>
            <span className="big">{formatDuration(totalSeconds)}</span>
          </div>
          <button
            type="button"
            className="btn primary start-btn"
            disabled={!canStart}
            onClick={start}
          >
            Iniciar examen →
          </button>
        </aside>
      </div>
    </div>
  );
}
