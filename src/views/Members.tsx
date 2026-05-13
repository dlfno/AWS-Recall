import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { socialApi, type UserListEntry } from "../lib/social-api";
import { Avatar } from "../components/PhotoUpload";
import { formatRelative } from "../lib/format";
import { ApiError } from "../lib/api";

export function Members() {
  const [users, setUsers] = useState<UserListEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socialApi
      .listUsers()
      .then((r) => setUsers(r.users))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error"));
  }, []);

  return (
    <section className="page">
      <header className="hero-head">
        <div>
          <p className="eyebrow"><span className="dot" /> clase</p>
          <h1 className="h-display">Miembros</h1>
          <p className="lede">Quién ha estudiado, cuándo, y qué tan en racha está.</p>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {!users && !error && <p className="muted">cargando…</p>}

      {users && users.length === 0 && (
        <p className="muted">No hay otros miembros todavía.</p>
      )}

      {users && users.length > 0 && (
        <div className="members-grid">
          {users.map((u) => (
            <Link to={`/u/${u.nickname}`} key={u.id} className="member-card">
              <Avatar user={u} size={64} />
              <div className="member-meta">
                <strong>{u.fullName}</strong>
                <span className="muted mono">@{u.nickname}</span>
                <div className="member-stats">
                  {u.streak > 0 && <span className="streak">{u.streak} días</span>}
                  <span className="muted">{formatRelative(u.lastActiveAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
