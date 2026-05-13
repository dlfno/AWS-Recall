import { Link } from "react-router-dom";

export function Forgot() {
  return (
    <section className="page auth-page">
      <div className="auth-card">
        <p className="eyebrow"><span className="dot" /> recuperar</p>
        <h1 className="h-display">¿Olvidaste tu contraseña?</h1>
        <p className="lede">
          Recall no usa correo electrónico, así que el reset lo hace tu admin
          en persona (o por chat).
        </p>

        <ol className="forgot-steps">
          <li>
            Pídele a tu admin (la persona que te dio el código de invitación
            cuando te registraste) que te genere un <strong>link de
            recuperación</strong>.
          </li>
          <li>
            En cuanto te lo comparta, ábrelo y elige una contraseña nueva.
            El link expira en <strong>24 horas</strong> y solo se puede usar
            una vez.
          </li>
          <li>
            Cuando cambies la contraseña, todas tus sesiones anteriores se
            cierran automáticamente.
          </li>
        </ol>

        <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
          <Link to="/login">← Volver al login</Link>
        </p>
      </div>
    </section>
  );
}
