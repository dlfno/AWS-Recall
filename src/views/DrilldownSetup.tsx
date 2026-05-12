import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ServiceIcon } from "../components/ServiceIcon";
import { parentsWithFeatures } from "../lib/drilldown";
import { getCategory } from "../lib/data";

export function DrilldownSetup() {
  const navigate = useNavigate();
  const parents = useMemo(() => parentsWithFeatures(), []);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof parents>();
    for (const p of parents) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return Array.from(map.entries()).map(([catId, items]) => ({
      category: getCategory(catId)!,
      items,
    }));
  }, [parents]);

  const start = (parentId: string) => {
    navigate(`/drilldown/play/${parentId}`);
  };

  return (
    <div className="page">
      <div className="hero-head">
        <div>
          <div className="eyebrow">
            <span className="dot" />
            CONFIGURACIÓN · MODO 03
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>
            Drilldown.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Identifica features dentro de un mismo servicio. Solo padres con
            2+ features registradas; los distractores son features hermanas.
          </p>
        </div>
        <div>
          <Link to="/" className="btn ghost" style={{ textDecoration: "none" }}>
            ← Inicio
          </Link>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="muted">Aún no hay servicios con features registradas.</p>
      ) : (
        grouped.map(({ category, items }) => (
          <div key={category.id} className="setup-section">
            <h3 style={{ color: category.color }}>{category.name}</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {items.map((parent) => (
                <button
                  key={parent.id}
                  type="button"
                  className="frame"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    gap: 14,
                    alignItems: "center",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    color: "var(--ink)",
                    padding: "16px",
                  }}
                  onClick={() => start(parent.id)}
                >
                  <ServiceIcon serviceId={parent.id} size="md" />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {parent.name}
                    </div>
                    <small className="muted">
                      {parent.features!.length} features
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
