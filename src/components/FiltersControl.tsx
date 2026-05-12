import { useMemo } from "react";
import { CATEGORIES, SERVICES } from "../lib/data";
import type { CategoryId, SessionFilters, Tier } from "../lib/types";

interface Props {
  filters: SessionFilters;
  onChange: (next: SessionFilters) => void;
}

const TIER_SHORT: Record<Tier, string> = {
  1: "Core",
  2: "Operación",
  3: "Especializados",
  4: "Extendido",
};

export function FiltersControl({ filters, onChange }: Props) {
  const availableTiers = useMemo(
    () => Array.from(new Set(SERVICES.map((s) => s.tier))).sort() as Tier[],
    [],
  );

  const availableCats = useMemo(() => {
    const present = new Set(SERVICES.map((s) => s.category));
    return CATEGORIES.filter((c) => present.has(c.id));
  }, []);

  const countByCategory = useMemo(() => {
    const map = new Map<CategoryId, number>();
    for (const s of SERVICES) {
      if (filters.tiers.includes(s.tier)) {
        map.set(s.category, (map.get(s.category) ?? 0) + 1);
      }
    }
    return map;
  }, [filters.tiers]);

  const toggleTier = (t: Tier) => {
    const next = filters.tiers.includes(t)
      ? filters.tiers.filter((x) => x !== t)
      : [...filters.tiers, t];
    onChange({ ...filters, tiers: next });
  };

  const toggleCategory = (c: CategoryId) => {
    const next = filters.categories.includes(c)
      ? filters.categories.filter((x) => x !== c)
      : [...filters.categories, c];
    onChange({ ...filters, categories: next });
  };

  const selectAllCategories = () => {
    onChange({ ...filters, categories: availableCats.map((c) => c.id) });
  };

  const clearCategories = () => {
    onChange({ ...filters, categories: [] });
  };

  return (
    <>
      <div className="setup-section">
        <h3>
          Tier{" "}
          <span
            className="muted"
            style={{ textTransform: "none", letterSpacing: 0, fontSize: 11 }}
          >
            · profundidad del catálogo
          </span>
        </h3>
        <div className="chip-row">
          {availableTiers.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${filters.tiers.includes(t) ? "is-on" : ""}`}
              onClick={() => toggleTier(t)}
              aria-pressed={filters.tiers.includes(t)}
            >
              T{t} · {TIER_SHORT[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <h3>
          Categorías
          <span className="secondary">
            <button
              type="button"
              className="btn ghost sm"
              onClick={selectAllCategories}
            >
              Todas
            </button>
            <button
              type="button"
              className="btn ghost sm"
              onClick={clearCategories}
            >
              Ninguna
            </button>
          </span>
        </h3>
        <div className="chip-row">
          {availableCats.map((c) => {
            const count = countByCategory.get(c.id) ?? 0;
            const disabled = count === 0;
            const active = filters.categories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`chip ${active ? "is-on" : ""} ${disabled ? "is-disabled" : ""}`}
                onClick={() => !disabled && toggleCategory(c.id)}
                aria-pressed={active}
                disabled={disabled}
              >
                {c.name}
                <span className="count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
