import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeStreak } from "../lib/stats";
import { loadTheme, saveTheme, type Theme } from "../lib/progress-store";
import { useAuth } from "../lib/auth-context";
import { Avatar } from "./PhotoUpload";

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status, user, logout } = useAuth();
  const onHome = location.pathname === "/";
  const streak = useMemo(
    () => (status === "authed" ? computeStreak() : 0),
    // recompute on route change para que la racha refleje la actividad recién registrada
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname, status, user?.id],
  );

  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <Link to="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="brand-mark">R</div>
        <div>
          <span className="brand-name">recall</span>
          <span className="brand-tag">aws</span>
        </div>
      </Link>
      <div className="topbar-spacer" />
      <div className="meta">
        {status === "authed" && (
          <nav className="top-nav">
            <Link to="/miembros" className="top-link">Miembros</Link>
            <Link to="/leaderboard" className="top-link">Leaderboard</Link>
            <Link to="/feed" className="top-link">Feed</Link>
          </nav>
        )}
        {!onHome && status === "authed" && (
          <Link to="/" className="btn ghost sm" style={{ textDecoration: "none" }}>
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
        {status === "authed" && streak > 0 && <span className="streak">{streak} días</span>}
        {status === "authed" && user && (
          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="avatar-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menú de usuario"
            >
              <Avatar user={user} size={36} />
            </button>
            {menuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-head">
                  <strong>{user.fullName}</strong>
                  <span className="muted mono">@{user.nickname}</span>
                </div>
                <Link to={`/u/${user.nickname}`} onClick={() => setMenuOpen(false)}>Mi perfil</Link>
                <Link to="/stats" onClick={() => setMenuOpen(false)}>Mis stats</Link>
                <Link to="/ajustes" onClick={() => setMenuOpen(false)}>Apariencia</Link>
                {user.isAdmin && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
                )}
                <button type="button" onClick={handleLogout} className="dropdown-action">
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
        {status === "anon" && (
          <>
            <Link to="/login" className="btn ghost sm" style={{ textDecoration: "none" }}>Entrar</Link>
            <Link to="/register" className="btn primary sm" style={{ textDecoration: "none" }}>Crear cuenta</Link>
          </>
        )}
      </div>
    </header>
  );
}

export function FooterRule() {
  return (
    <div className="footer-rule">
      <span>recall · estudio compartido de AWS · 181 servicios curados</span>
      <span>sistema leitner · multi-usuario</span>
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
