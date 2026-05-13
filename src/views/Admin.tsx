import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { formatRelative } from "../lib/format";

interface InviteDTO {
  code: string;
  createdAt: number;
  expiresAt: number | null;
  usedAt: number | null;
  usedBy: string | null;
}

export function Admin() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<InviteDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [ttlDays, setTtlDays] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get<{ invites: InviteDTO[] }>("/api/admin/invites")
      .then((r) => setInvites(r.invites))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error"));

  useEffect(() => {
    void load();
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
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (code: string) => {
    if (!confirm(`¿Revocar el código ${code}?`)) return;
    try {
      await api.del(`/api/admin/invites/${code}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error");
    }
  };

  return (
    <section className="page">
      <header className="hero-head">
        <div>
          <p className="eyebrow"><span className="dot" /> admin</p>
          <h1 className="h-display">Códigos de invitación</h1>
          <p className="lede">Genera códigos para que tus compañeros se registren.</p>
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

      <div className="panel">
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
                    <td className="mono"><strong>{inv.code}</strong></td>
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
    </section>
  );
}
