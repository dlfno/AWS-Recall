import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { computeStreak } from "../lib/stats";
import { loadTheme, saveTheme, type Theme } from "../lib/progress-store";

export function Topbar() {
  const location = useLocation();
  const onHome = location.pathname === "/";
  const streak = useMemo(() => computeStreak(), [location.pathname]);

  const [theme, setTheme] = useState<Theme>(() => loadTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <header className="topbar">
      <Link
        to="/"
        className="brand"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="brand-mark">R</div>
        <div>
          <span className="brand-name">recall</span>
          <span className="brand-tag">aws</span>
        </div>
      </Link>
      <div className="topbar-spacer" />
      <div className="meta">
        {!onHome && (
          <Link
            to="/"
            className="btn ghost sm"
            style={{ textDecoration: "none" }}
          >
            ← Inicio
          </Link>
        )}
        <button
          type="button"
          className="chip"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          title={theme === "light" ? "Cambiar a oscuro" : "Cambiar a claro"}
          style={{ cursor: "pointer" }}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        {streak > 0 && <span className="streak">{streak} días</span>}
      </div>
    </header>
  );
}

export function FooterRule() {
  return (
    <div className="footer-rule">
      <span>recall · estudio de AWS · 181 servicios curados</span>
      <span>sistema leitner · local-first · sin backend</span>
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="shell">
      <Topbar />
      <main>{children}</main>
      <FooterRule />
    </div>
  );
}
