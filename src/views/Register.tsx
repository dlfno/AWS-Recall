import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [nickname, setNickname] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({
        invite_code: code.trim().toUpperCase(),
        nickname: nickname.trim(),
        full_name: fullName.trim(),
        password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de red");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow"><span className="dot" /> registro</p>
        <h1 className="h-display">crear cuenta</h1>
        <p className="lede">Necesitas un código de invitación de tu admin.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <label className="field">
            <span>Código de invitación</span>
            <input
              type="text"
              required
              autoFocus
              autoComplete="off"
              maxLength={32}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}
            />
          </label>
          <label className="field">
            <span>Nombre completo</span>
            <input
              type="text"
              required
              autoComplete="name"
              maxLength={80}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Apodo <small className="muted">(3-24, letras/números/_/-)</small></span>
            <input
              type="text"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_-]+"
              autoComplete="username"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Contraseña <small className="muted">(min. 8 caracteres)</small></span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </section>
  );
}
