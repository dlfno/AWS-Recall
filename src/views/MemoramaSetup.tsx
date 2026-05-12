import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiltersControl } from "../components/FiltersControl";
import {
  ALL_PAIR_TYPES,
  BOARD_SIZES,
  PAIR_TYPE_LABELS,
  maxPairsAvailable,
} from "../lib/board-builder";
import {
  loadMemoramaConfig,
  saveMemoramaConfig,
} from "../lib/progress-store";
import type { MemoramaConfig, MemoramaPairType } from "../lib/types";

const DEFAULT_CONFIG: MemoramaConfig = {
  tiers: [1],
  categories: ["compute", "storage", "database", "networking", "security"],
  pairType: "acronym-fullname",
  pairs: 8,
  timer: true,
};

export function MemoramaSetup() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<MemoramaConfig>(() =>
    loadMemoramaConfig(DEFAULT_CONFIG),
  );

  const available = useMemo(
    () =>
      maxPairsAvailable({
        categories: config.categories,
        tiers: config.tiers,
        pairType: config.pairType,
      }),
    [config.categories, config.tiers, config.pairType],
  );

  const canStart = available >= config.pairs;

  const start = () => {
    saveMemoramaConfig(config);
    navigate("/memorama/play");
  };

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            CONFIGURACIÓN · MODO 02
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>
            Memorama.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Tablero de pares. Más pares = más difícil, más memorable. Cronómetro
            opcional y récords por tamaño.
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
            <h3>Tipo de par</h3>
            <div className="chip-row">
              {ALL_PAIR_TYPES.map((p: MemoramaPairType) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${config.pairType === p ? "is-on" : ""}`}
                  onClick={() => setConfig({ ...config, pairType: p })}
                  aria-pressed={config.pairType === p}
                >
                  {PAIR_TYPE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-section">
            <h3>Tamaño del tablero</h3>
            <div className="chip-row">
              {BOARD_SIZES.map((size) => {
                const disabled = available < size;
                return (
                  <button
                    key={size}
                    type="button"
                    className={`chip ${config.pairs === size ? "is-on" : ""} ${disabled ? "is-disabled" : ""}`}
                    onClick={() => !disabled && setConfig({ ...config, pairs: size })}
                    aria-pressed={config.pairs === size}
                    disabled={disabled}
                  >
                    {size} pares
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setup-section">
            <h3>Opciones</h3>
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${config.timer ? "is-on" : ""}`}
                onClick={() => setConfig({ ...config, timer: !config.timer })}
                aria-pressed={config.timer}
              >
                Cronómetro
              </button>
            </div>
          </div>
        </div>

        <aside className="preview">
          <div className="kicker">Resumen</div>
          <h2 className="h2">Listo para jugar</h2>
          <div className="preview-stat">
            <span>Pares disponibles</span>
            <span className="big">{available}</span>
          </div>
          <div className="preview-stat">
            <span>Tablero</span>
            <span className="big">{config.pairs}</span>
          </div>
          <div className="preview-stat">
            <span>Cronómetro</span>
            <span className="big">{config.timer ? "Sí" : "No"}</span>
          </div>
          <button
            type="button"
            className="btn primary start-btn"
            disabled={!canStart}
            onClick={start}
          >
            Iniciar partida →
          </button>
        </aside>
      </div>
    </div>
  );
}
