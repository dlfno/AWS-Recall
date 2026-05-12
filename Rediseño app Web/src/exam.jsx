/* eslint-disable */

const EXAM_QUESTIONS = [
  {
    kind: "usecase-to-service",
    prompt: "Necesitas un data warehouse columnar a escala de petabytes para BI corporativo. ¿Qué servicio eliges?",
    options: ["Amazon Athena", "Amazon Redshift", "Amazon RDS Aurora", "Amazon DynamoDB"],
    correct: 1,
    explain: "Redshift es columnar y diseñado para grandes volúmenes analíticos. Athena es ad-hoc sobre S3, no un warehouse.",
    icon: "redshift", cat: "analytics",
  },
  {
    kind: "drilldown",
    parentId: "lambda",
    prompt: "Snapshot del runtime ya inicializado para reducir cold starts en Java, Python y .NET.",
    options: ["Lambda Functions", "Lambda Layers", "Lambda@Edge", "Lambda SnapStart"],
    correct: 3,
    explain: "SnapStart precalcula un snapshot del runtime y lo restaura. Reduce p99 de cold starts drásticamente.",
    icon: "lambda", cat: "compute",
  },
  {
    kind: "icon",
    prompt: "Identifica el servicio:",
    options: ["Amazon S3", "Amazon EBS", "Amazon EFS", "Storage Gateway"],
    correct: 0,
    explain: "S3 es el almacenamiento de objetos.",
    icon: "s3", cat: "storage",
  },
  {
    kind: "acronym",
    prompt: "¿Qué significa el acrónimo KMS?",
    options: ["Kubernetes Management Service", "Key Management Service", "Kinesis Mesh Service", "Knowledge Management System"],
    correct: 1,
    explain: "Key Management Service. Manejo de llaves criptográficas, integra con S3, EBS, RDS, Lambda...",
    icon: "kms", cat: "security",
  },
];

function ExamView({ navigate }) {
  const total = EXAM_QUESTIONS.length;
  const TOTAL_SECONDS = 90 * total; // 90s per Q

  const [startedAt] = useState(() => Date.now() - 142_000);
  const [now, setNow] = useState(Date.now());
  const [qIdx, setQIdx] = useState(1); // showing 2nd question
  const [answers, setAnswers] = useState({ 0: 1, 2: 0 }); // 1st correct, 3rd correct
  const [flags, setFlags] = useState(new Set());
  const [done, setDone] = useState(false);
  const [finishedAt, setFinishedAt] = useState(null);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [done]);

  const elapsed = (finishedAt ?? now) - startedAt;
  const remaining = Math.max(0, TOTAL_SECONDS * 1000 - elapsed);

  const q = EXAM_QUESTIONS[qIdx];
  const picked = answers[qIdx];

  const choose = (i) => setAnswers({ ...answers, [qIdx]: i });
  const flag = () => {
    const n = new Set(flags);
    if (n.has(qIdx)) n.delete(qIdx); else n.add(qIdx);
    setFlags(n);
  };

  const finish = () => {
    setFinishedAt(Date.now());
    setDone(true);
  };

  if (done) {
    const correct = Object.entries(answers).filter(([i, a]) => EXAM_QUESTIONS[i].correct === a).length;
    const score = correct / total;
    const passed = score >= 0.7;
    return (
      <div className="page">
        <div className={`verdict ${passed ? "passed" : "failed"}`}>
          <div>
            <div className="label">EXAMEN · {passed ? "APROBADO" : "NO APROBADO"}</div>
            <div className="big">{Math.round(score * 100)}%</div>
            <div className="mono">{correct} de {total} correctas · umbral 70%</div>
          </div>
          <div className="breakdown">
            <div>TIEMPO USADO</div>
            <div><b>{fmtTime(finishedAt - startedAt)}</b></div>
            <div style={{ marginTop: 10 }}>{flags.size} marcadas</div>
          </div>
        </div>
        <div style={{ marginTop: 22 }}>
          <div className="frame snap">
            <div className="frame-head"><h2 className="h2">Revisión</h2></div>
            {EXAM_QUESTIONS.map((qq, i) => {
              const ok = answers[i] === qq.correct;
              return (
                <div key={i} style={{ padding: "14px 0", borderBottom: "var(--border) solid var(--rule-soft)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>Q{i + 1}</span>
                    <span className={ok ? "" : "mono"} style={{ color: ok ? "var(--good)" : "var(--bad)", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em" }}>
                      {ok ? "✓ CORRECTA" : "✗ INCORRECTA"}
                    </span>
                    <span className="muted" style={{ fontSize: 13 }}>{qq.prompt}</span>
                  </div>
                  {!ok && (
                    <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                      Tu respuesta: {answers[i] != null ? qq.options[answers[i]] : "(sin responder)"} · Correcta: <b style={{ color: "var(--good)" }}>{qq.options[qq.correct]}</b>
                    </div>
                  )}
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{qq.explain}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button className="btn primary" onClick={() => navigate("/exam")}>Otro intento →</button>
          <button className="btn ghost" onClick={() => navigate("/")}>Inicio</button>
        </div>
      </div>
    );
  }

  const timerCls =
    remaining < 60_000 * total / 4 ? "danger"
    : remaining < 60_000 * total / 2 ? "warn"
    : "";

  return (
    <div className="page">
      <div className="exam-bar">
        <button className="btn ghost sm" onClick={() => navigate("/exam")}>← Salir</button>
        <div className="qprog">
          <div className="qcount"><b>Q{qIdx + 1}</b> / {total} · {Object.keys(answers).length} respondidas · {flags.size} marcadas</div>
          <div className="qdots">
            {EXAM_QUESTIONS.map((_, i) => (
              <span
                key={i}
                className={`qdot ${answers[i] != null ? "answered" : ""} ${i === qIdx ? "current" : ""} ${flags.has(i) ? "flagged" : ""}`}
                onClick={() => setQIdx(i)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>
        </div>
        <div className={`timer ${timerCls}`}>{fmtTime(remaining)}</div>
        <button className="btn ghost sm" onClick={flag}>{flags.has(qIdx) ? "● Marcada" : "○ Marcar"}</button>
      </div>

      <div className="dd-parent" style={{ background: "var(--paper-2)" }}>
        <div className="ico-frame"><img src={`icons/${q.icon}.svg`} alt="" /></div>
        <div>
          <h2>Pregunta {qIdx + 1}</h2>
          <p className="sub">
            {q.kind === "drilldown" ? "Drilldown · identifica la feature"
              : q.kind === "icon" ? "Icono → Nombre"
              : q.kind === "acronym" ? "Acrónimo → Nombre completo"
              : "Caso de uso → Servicio"}
          </p>
        </div>
        <span className="cat-tag">
          <span className="cat-dot" style={{ background: "var(--ink)" }} />
          {catById(q.cat)?.short}
        </span>
      </div>

      <div className="dd-prompt">
        {q.kind === "icon" ? (
          <>
            <div className="kicker">IDENTIFICA EL SERVICIO</div>
            <div style={{ display: "grid", placeItems: "center", padding: "20px 0" }}>
              <div style={{ width: 140, height: 140, border: "var(--border-heavy) solid var(--paper)", padding: 12, background: "var(--paper)" }}>
                <img src={`icons/${q.icon}.svg`} alt="" style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="kicker">{q.kind.replace(/-/g, " ").toUpperCase()}</div>
            <p className="quote">{q.prompt}</p>
          </>
        )}
      </div>

      <div className="dd-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`dd-option ${picked === i ? "is-correct" : ""}`}
            style={picked === i ? { background: "var(--ink)", color: "var(--paper)" } : undefined}
            onClick={() => choose(i)}
          >
            <span className="letter" style={picked === i ? { background: "var(--paper)", color: "var(--ink)" } : undefined}>
              {["A","B","C","D"][i]}
            </span>
            <span><div className="opt-name">{opt}</div></span>
            <span className="mark">{picked === i ? "●" : ""}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 10 }}>
        <button className="btn ghost" onClick={() => setQIdx(Math.max(0, qIdx - 1))} disabled={qIdx === 0}>
          ← Anterior
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bad" onClick={finish}>Terminar examen</button>
          {qIdx + 1 < total ? (
            <button className="btn primary" onClick={() => setQIdx(qIdx + 1)}>Siguiente →</button>
          ) : (
            <button className="btn primary" onClick={finish}>Entregar →</button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ExamView });
