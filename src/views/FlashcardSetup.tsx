import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiltersControl } from "../components/FiltersControl";
import { filterServices } from "../lib/data";
import { ALL_VARIANTS, VARIANT_LABELS } from "../lib/deck-builder";
import {
  loadFlashcardConfig,
  saveFlashcardConfig,
} from "../lib/progress-store";
import type { FlashcardSessionConfig, FlashcardVariant } from "../lib/types";

const DEFAULT_CONFIG: FlashcardSessionConfig = {
  tiers: [1],
  categories: ["compute", "storage", "database", "networking", "security"],
  variants: [
    "acronym-to-fullname",
    "service-to-description",
    "usecase-to-service",
  ],
};

export function FlashcardSetup() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<FlashcardSessionConfig>(() =>
    loadFlashcardConfig(DEFAULT_CONFIG),
  );

  const services = useMemo(() => filterServices(config), [config]);
  const canStart = services.length > 0 && config.variants.length > 0;
  const totalCards = services.length * config.variants.length;

  const toggleVariant = (v: FlashcardVariant) => {
    setConfig((prev) => ({
      ...prev,
      variants: prev.variants.includes(v)
        ? prev.variants.filter((x) => x !== v)
        : [...prev.variants, v],
    }));
  };

  const start = () => {
    saveFlashcardConfig(config);
    navigate("/flashcards/play");
  };

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            CONFIGURACIÓN · MODO 01
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>
            Flashcards.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Voltea, recuerda, gradúa. Sistema Leitner de 5 cajas; las cartas en
            cajas bajas vuelven más seguido.
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
            <h3>
              Tipos de tarjeta{" "}
              <span
                className="muted"
                style={{ textTransform: "none", letterSpacing: 0, fontSize: 11 }}
              >
                · cómo formulamos la pregunta
              </span>
            </h3>
            <div className="chip-row">
              {ALL_VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`chip ${config.variants.includes(v) ? "is-on" : ""}`}
                  onClick={() => toggleVariant(v)}
                  aria-pressed={config.variants.includes(v)}
                >
                  {VARIANT_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="preview">
          <div className="kicker">Resumen</div>
          <h2 className="h2">Listo para empezar</h2>
          <div className="preview-stat">
            <span>Servicios</span>
            <span className="big">{services.length}</span>
          </div>
          <div className="preview-stat">
            <span>Variantes</span>
            <span className="big">{config.variants.length}</span>
          </div>
          <div className="preview-stat">
            <span>Tarjetas posibles</span>
            <span className="big">{totalCards}</span>
          </div>
          <button
            type="button"
            className="btn primary start-btn"
            disabled={!canStart}
            onClick={start}
          >
            Iniciar sesión →
          </button>
        </aside>
      </div>
    </div>
  );
}
