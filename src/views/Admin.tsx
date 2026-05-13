import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { formatRelative } from "../lib/format";
import { Avatar } from "../components/PhotoUpload";
import type { PublicUserDTO } from "../lib/social-api";

interface InviteDTO {
  code: string;
  createdAt: number;
  expiresAt: number | null;
  usedAt: number | null;
  usedBy: string | null;
}

interface ResetInfo {
  url: string;
  expiresAt: number;
}

export function Admin() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<InviteDTO[]>([]);
  const [users, setUsers] = useState<PublicUserDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [ttlDays, setTtlDays] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [resetByNick, setResetByNick] = useState<Record<string, ResetInfo>>({});
  const [resetBusy, setResetBusy] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [{ invites: inv }, { users: us }] = await Promise.all([
        api.get<{ invites: InviteDTO[] }>("/api/admin/invites"),
        api.get<{ users: PublicUserDTO[] }>("/api/admin/users"),
      ]);
      setInvites(inv);
      setUsers(us);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error");
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  if (!user?.isAdmin) {
    return (
      <section className="page">
        <p className="form-error">Esta página es solo para administradores.</p>
      </section>
    );
  }

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { count };
      if (typeof ttlDays === "number" && ttlDays > 0) body.ttl_days = ttlDays;
      await api.post("/api/admin/invites", body);
      await loadAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setError("No pude copiar al portapapeles");
    }
  };

  const revoke = async (code: string) => {
    if (!confirm(`¿Revocar el código ${code}?`)) return;
    try {
      await api.del(`/api/admin/invites/${code}`);
      await loadAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error");
    }
  };

  const generateResetLink = async (nickname: string) => {
    if (!confirm(`¿Generar link de recuperación para @${nickname}?\nCualquier link anterior queda anulado.`)) {
      return;
    }
    setResetBusy(nickname);
    setError(null);
    try {
      const r = await api.post<{ token: string; expiresAt: number }>(
        `/api/admin/users/${encodeURIComponent(nickname)}/reset-password`,
      );
      const url = `${window.location.origin}/reset?token=${r.token}`;
      setResetByNick((prev) => ({ ...prev, [nickname]: { url, expiresAt: r.expiresAt } }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error");
    } finally {
      setResetBusy(null);
    }
  };

  const closeResetRow = (nickname: string) => {
    setResetByNick((prev) => {
      const next = { ...prev };
      delete next[nickname];
      return next;
    });
  };

  return (
    <section className="page">
      <header className="hero-head">
        <div>
          <p className="eyebrow"><span className="dot" /> admin</p>
          <h1 className="h-display">Administración</h1>
          <p className="lede">Códigos de invitación y miembros de la clase.</p>
        </div>
      </header>

      <div className="panel" style={{ marginBottom: 24 }}>
        <p className="kicker">Generar códigos</p>
        <div className="invite-form">
          <label className="field" style={{ maxWidth: 120 }}>
            <span>Cuántos</span>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
            />
          </label>
          <label className="field" style={{ maxWidth: 180 }}>
            <span>Expiran en (días, opcional)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={ttlDays}
              onChange={(e) => setTtlDays(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="(sin expiración)"
            />
          </label>
          <button type="button" className="btn primary" onClick={generate} disabled={busy}>
            {busy ? "Generando…" : "Generar"}
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="panel" style={{ marginBottom: 24 }}>
        <p className="kicker">Códigos existentes</p>
        {invites.length === 0 ? (
          <p className="muted">Aún no hay códigos.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Estado</th>
                <th>Usado por</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const expired = inv.expiresAt != null && inv.expiresAt < Date.now();
                const status = inv.usedAt
                  ? "usado"
                  : expired
                    ? "expirado"
                    : "disponible";
                return (
                  <tr key={inv.code}>
                    <td className="mono">
                      <strong>{inv.code}</strong>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => copyText(`inv:${inv.code}`, inv.code)}
                        aria-label={`Copiar código ${inv.code}`}
                        title="Copiar al portapapeles"
                      >
                        {copied === `inv:${inv.code}` ? "✓" : "📋"}
                      </button>
                    </td>
                    <td><span className={`invite-status invite-${status}`}>{status}</span></td>
                    <td>{inv.usedBy ? <span className="mono">@{inv.usedBy}</span> : "—"}</td>
                    <td className="muted">{formatRelative(inv.createdAt)}</td>
                    <td>
                      {!inv.usedAt && (
                        <button type="button" className="btn ghost sm" onClick={() => revoke(inv.code)}>
                          Revocar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <p className="kicker">Miembros</p>
        <p className="muted" style={{ marginTop: 4, marginBottom: 14, fontSize: 13 }}>
          Genera un link de recuperación si un compañero olvidó su contraseña.
          El link dura 24 h y solo se usa una vez.
        </p>
        {users.length === 0 ? (
          <p className="muted">Aún no hay miembros.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Última actividad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const reset = resetByNick[u.nickname];
                const isMe = u.id === user.id;
                return (
                  <>
                    <tr key={u.nickname}>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <Avatar user={u} size={28} />
                          <span className="mono">@{u.nickname}</span>
                          {u.isAdmin && <span className="invite-status invite-disponible">admin</span>}
                        </span>
                      </td>
                      <td>{u.fullName}</td>
                      <td className="muted">{formatRelative(u.lastActiveAt)}</td>
                      <td>
                        {!isMe && (
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => generateResetLink(u.nickname)}
                            disabled={resetBusy === u.nickname}
                          >
                            {resetBusy === u.nickname ? "Generando…" : "Resetear contraseña"}
                          </button>
                        )}
                        {isMe && <span className="muted" style={{ fontSize: 12 }}>tú</span>}
                      </td>
                    </tr>
                    {reset && (
                      <tr key={`${u.nickname}-reset`} className="reset-link-row">
                        <td colSpan={4}>
                          <div className="reset-link-box">
                            <div>
                              <p className="kicker" style={{ marginBottom: 4 }}>
                                Link de recuperación para @{u.nickname}
                              </p>
                              <code className="reset-url">{reset.url}</code>
                              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                                Expira {formatRelative(reset.expiresAt)}. Compártelo
                                solo con esta persona — por WhatsApp, Slack o en clase.
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <button
                                type="button"
                                className="btn primary sm"
                                onClick={() => copyText(`reset:${u.nickname}`, reset.url)}
                              >
                                {copied === `reset:${u.nickname}` ? "Copiado ✓" : "Copiar link"}
                              </button>
                              <button
                                type="button"
                                className="btn ghost sm"
                                onClick={() => closeResetRow(u.nickname)}
                                aria-label="Cerrar"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
