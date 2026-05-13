import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";

interface ValidatedToken {
  nickname: string;
  fullName: string;
  expiresAt: number;
}

export function Reset() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [validation, setValidation] = useState<
    | { state: "loading" }
    | { state: "valid"; data: ValidatedToken }
    | { state: "invalid"; message: string }
  >({ state: "loading" });

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setValidation({ state: "invalid", message: "Falta el token en el link." });
      return;
    }
    api
      .get<ValidatedToken & { ok: true }>(`/api/auth/reset?token=${encodeURIComponent(token)}`)
      .then((data) => setValidation({ state: "valid", data }))
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : "Error validando el link";
        setValidation({ state: "invalid", message: msg });
      });
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPw !== confirmPw) {
      setError("Las dos contraseñas no coinciden");
      return;
    }
    if (newPw.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/auth/reset", { token, new_password: newPw });
      // El server emitió cookie nueva — hidratamos el contexto y vamos a /
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error cambiando contraseña");
      setBusy(false);
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow"><span className="dot" /> nueva contraseña</p>

        {validation.state === "loading" && (
          <>
            <h1 className="h-display">Validando link…</h1>
            <p className="muted">Un momento.</p>
          </>
        )}

        {validation.state === "invalid" && (
          <>
            <h1 className="h-display">Link inválido</h1>
            <p className="lede">{validation.message}</p>
            <p className="muted" style={{ marginTop: 16 }}>
              Pídele a tu admin uno nuevo. Los links expiran en 24 h y solo
              funcionan una vez.
            </p>
            <p style={{ marginTop: 16 }}>
              <Link to="/forgot" className="btn ghost sm" style={{ textDecoration: "none" }}>
                ← Cómo recuperar contraseña
              </Link>
            </p>
          </>
        )}

        {validation.state === "valid" && (
          <>
            <h1 className="h-display">Hola, {validation.data.fullName}</h1>
            <p className="lede">
              Elige una contraseña nueva para <span className="mono">@{validation.data.nickname}</span>.
              Al confirmarla entrarás directo.
            </p>
            <form onSubmit={submit} className="form-stack">
              <label className="field">
                <span>Nueva contraseña <small className="muted">(mín. 8)</small></span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  autoFocus
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Confirmar contraseña</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Cambiando…" : "Cambiar contraseña y entrar"}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
