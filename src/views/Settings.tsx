import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ACCENTS,
  FONT_PAIRS,
  type AccentId,
  type Appearance,
  type FontPairId,
} from "../lib/theme-presets";
import { loadAppearance, saveAppearance } from "../lib/progress-store";
import { api, ApiError } from "../lib/api";
import { useAuth, type CurrentUser } from "../lib/auth-context";

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
          <h1 className="h-display">Ajustes</h1>
          <p className="lede">
            Apariencia, perfil y seguridad. Los cambios de apariencia se aplican
            al instante; los de cuenta se guardan al confirmar.
          </p>
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

      <div className="panel" style={{ marginBottom: 24 }}>
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

      <ProfilePanel />
      <PasswordPanel />
    </section>
  );
}

function ProfilePanel() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;
  const dirty = fullName.trim() !== user.fullName && fullName.trim().length >= 2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const { user: updated } = await api.patch<{ user: CurrentUser }>(
        "/api/me/profile",
        { full_name: fullName.trim() },
      );
      setUser(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error guardando");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <p className="kicker">Perfil</p>
      <p className="muted" style={{ marginTop: 4, marginBottom: 14, fontSize: 13 }}>
        Tu apodo <span className="mono">@{user.nickname}</span> no se puede cambiar.
      </p>
      <form onSubmit={submit} className="form-stack" style={{ maxWidth: 460 }}>
        <label className="field">
          <span>Nombre completo</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn primary" disabled={busy || !dirty}>
          {busy ? "Guardando…" : saved ? "Guardado ✓" : "Guardar"}
        </button>
      </form>
    </div>
  );
}

function PasswordPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPw !== confirmPw) {
      setError("La nueva contraseña no coincide en los dos campos");
      return;
    }
    if (newPw.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setBusy(true);
    try {
      await api.put("/api/me/password", { old: oldPw, new: newPw });
      // El server destruyó todas las sesiones. Limpiamos estado local y al login.
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error cambiando contraseña");
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <p className="kicker">Cambiar contraseña</p>
      <p className="muted" style={{ marginTop: 4, marginBottom: 14, fontSize: 13 }}>
        Vas a tener que entrar de nuevo con la contraseña nueva.
      </p>
      <form onSubmit={submit} className="form-stack" style={{ maxWidth: 460 }}>
        <label className="field">
          <span>Contraseña actual</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Nueva contraseña <small className="muted">(mín. 8)</small></span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Confirmar nueva contraseña</span>
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
          {busy ? "Cambiando…" : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
