import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { socialApi, type ProfileDTO } from "../lib/social-api";
import { Avatar, PhotoUpload } from "../components/PhotoUpload";
import { formatPercent, formatRelative, formatTimeMs } from "../lib/format";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";

export function PublicProfile() {
  const { nickname = "" } = useParams<{ nickname: string }>();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(null);
    setError(null);
    socialApi
      .getProfile(nickname)
      .then(setProfile)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error"));
  }, [nickname]);

  const isMe = me?.nickname.toLowerCase() === nickname.toLowerCase();

  const maxHeat = useMemo(
    () => (profile ? Math.max(1, ...profile.heatmap28.map((d) => d.count)) : 1),
    [profile],
  );

  return (
    <section className="page">
      {error && <p className="form-error">{error}</p>}
      {!profile && !error && <p className="muted">cargando…</p>}

      {profile && (
        <>
          <header className="profile-head">
            {isMe ? (
              <PhotoUpload />
            ) : (
              <Avatar user={profile.user} size={88} />
            )}
            <div>
              <p className="eyebrow"><span className="dot" /> perfil</p>
              <h1 className="h-display">{profile.user.fullName}</h1>
              <p className="lede mono">@{profile.user.nickname}</p>
              <p className="muted">
                Última actividad: {formatRelative(profile.user.lastActiveAt)} ·
                {profile.streak > 0 ? ` ${profile.streak} días de racha` : " sin racha activa"} ·
                Miembro desde {new Date(profile.user.createdAt).toLocaleDateString()}
              </p>
              {!isMe && me && (
                <p style={{ marginTop: 12 }}>
                  <Link to={`/compare/${me.nickname}/${profile.user.nickname}`} className="btn ghost sm" style={{ textDecoration: "none" }}>
                    Compararnos
                  </Link>
                </p>
              )}
            </div>
          </header>

          <div className="profile-grid">
            <div className="panel">
              <p className="kicker">Flashcards</p>
              <h2 className="h2">{profile.stats.flashcards.mastered} <span className="muted">dominadas</span></h2>
              <ul className="stat-list">
                <li><span>Vistas</span><strong>{profile.stats.flashcards.cardsSeen}</strong></li>
                <li><span>Reviews</span><strong>{profile.stats.flashcards.totalReviews}</strong></li>
                <li><span>Lapsos</span><strong>{profile.stats.flashcards.totalLapses}</strong></li>
                <li><span>Aciertos</span><strong>{formatPercent(profile.stats.flashcards.accuracy)}</strong></li>
              </ul>
            </div>

            <div className="panel">
              <p className="kicker">Drilldown</p>
              <h2 className="h2">{formatPercent(profile.stats.drilldown.accuracy)} <span className="muted">aciertos</span></h2>
              <ul className="stat-list">
                <li><span>Intentos</span><strong>{profile.stats.drilldown.attempts}</strong></li>
                <li><span>Correctos</span><strong>{profile.stats.drilldown.correct}</strong></li>
                <li><span>Features dominados</span><strong>{profile.stats.drilldown.featuresMastered}</strong></li>
              </ul>
            </div>

            <div className="panel">
              <p className="kicker">Memorama</p>
              <h2 className="h2">{profile.stats.memorama.played} <span className="muted">partidas</span></h2>
              <ul className="stat-list">
                {[6, 8, 12, 18].map((p) => (
                  <li key={p}>
                    <span>{p} pares</span>
                    <strong>
                      {profile.stats.memorama.bestMovesByPairs[String(p)] ?? "—"} mov /
                      {" "}
                      {formatTimeMs(profile.stats.memorama.bestTimeByPairs[String(p)])}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <p className="kicker">Exámenes</p>
              <h2 className="h2">{profile.stats.exams.passed} <span className="muted">aprobados</span></h2>
              <ul className="stat-list">
                <li><span>Total</span><strong>{profile.stats.exams.taken}</strong></li>
                <li><span>Mejor</span><strong>{formatPercent(profile.stats.exams.bestRate)}</strong></li>
                <li><span>Último</span><strong>{formatRelative(profile.stats.exams.lastTimestamp)}</strong></li>
              </ul>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 24 }}>
            <p className="kicker">Actividad · últimos 28 días</p>
            <div className="heatmap">
              {profile.heatmap28.map((d) => (
                <div
                  key={d.day}
                  className="heat-cell"
                  title={`${d.day}: ${d.count} eventos`}
                  style={{
                    backgroundColor:
                      d.count === 0
                        ? "var(--rule)"
                        : `color-mix(in oklab, var(--accent) ${Math.min(95, 25 + (d.count / maxHeat) * 70)}%, transparent)`,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
