import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <SplashLoader />;
  if (status === "anon") {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <>{children}</>;
}

export function SplashLoader() {
  return (
    <div className="splash">
      <div className="splash-mark">R</div>
      <p className="muted">cargando…</p>
    </div>
  );
}
