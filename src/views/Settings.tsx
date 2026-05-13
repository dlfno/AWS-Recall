import { useState } from "react";
import {
  ACCENTS,
  FONT_PAIRS,
  type AccentId,
  type Appearance,
  type FontPairId,
} from "../lib/theme-presets";
import { loadAppearance, saveAppearance } from "../lib/progress-store";

export function Settings() {
  const [appearance, setAppearance] = useState<Appearance>(() => loadAppearance());

  const update = (patch: Partial<Appearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    saveAppearance(next);
  };

  return (
    <section className="page">
      <header className="hero-head">
        <div>
          <p className="eyebrow"><span className="dot" /> personaliza</p>
          <h1 className="h-display">Apariencia</h1>
          <p className="lede">Tu acento y tu tipografía. Se aplican al instante y se guardan en tu cuenta.</p>
        </div>
      </header>

      <div className="panel" style={{ marginBottom: 24 }}>
        <p className="kicker">Color del acento</p>
        <div className="accent-grid">
          {ACCENTS.map((a) => (
            <button
              type="button"
              key={a.id}
              className={`accent-swatch ${a.id === appearance.accent ? "is-selected" : ""}`}
              onClick={() => update({ accent: a.id as AccentId })}
              aria-label={a.name}
              aria-pressed={a.id === appearance.accent}
            >
              <span
                className="accent-dot"
                style={{
                  background: `linear-gradient(135deg, ${a.accent}, ${a.accent2})`,
                }}
              />
              <span className="accent-name">{a.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="kicker">Tipografía</p>
        <div className="font-grid">
          {FONT_PAIRS.map((f) => (
            <button
              type="button"
              key={f.id}
              className={`font-card ${f.id === appearance.fontPair ? "is-selected" : ""}`}
              onClick={() => update({ fontPair: f.id as FontPairId })}
              aria-pressed={f.id === appearance.fontPair}
            >
              <div
                className="font-sample"
                style={{ fontFamily: `"${f.display}", system-ui, sans-serif` }}
              >
                <span className="font-sample-display">Aa</span>
                <span className="font-sample-tag">
                  {f.name}
                  {f.hint && <small className="font-sample-hint">{f.hint}</small>}
                </span>
              </div>
              <p
                className="font-mono-line"
                style={{ fontFamily: `"${f.mono}", ui-monospace, monospace` }}
              >
                aws-recall · 181 servicios
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
