import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(nickname.trim(), password);
      const redirect = params.get("redirect") ?? "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de red");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow"><span className="dot" /> entrar</p>
        <h1 className="h-display">recall</h1>
        <p className="lede">Estudio compartido de AWS con tus compañeros.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <label className="field">
            <span>Apodo</span>
            <input
              type="text"
              autoComplete="username"
              required
              autoFocus
              minLength={3}
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          ¿No tienes cuenta? <Link to="/register">Crear con código</Link>
        </p>
      </div>
    </section>
  );
}
