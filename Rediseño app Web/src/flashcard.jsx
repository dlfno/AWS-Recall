/* eslint-disable */

// Pre-built deck for the prototype — 8 sample cards.
const SAMPLE_DECK = [
  { variant: "usecase-to-service", id: "lambda",
    prompt: "Backend de una API REST con tráfico picudo, sin gestionar servidores ni escalado.",
    answer: "AWS Lambda", full: "Lambda · funciones serverless event-driven" },
  { variant: "acronym-to-fullname", id: "vpc",
    prompt: "VPC", answer: "Virtual Private Cloud",
    full: "Red privada lógica donde aíslas tus workloads." },
  { variant: "icon-to-name", id: "dynamodb",
    prompt: null, // shows icon
    answer: "DynamoDB", full: "NoSQL key-value de baja latencia." },
  { variant: "service-to-description", id: "cloudfront",
    prompt: "Amazon CloudFront", answer: "CDN global con 600+ PoPs",
    full: "Distribuye contenido estático y dinámico con baja latencia." },
  { variant: "usecase-to-service", id: "athena",
    prompt: "Correr SQL ad-hoc sobre logs en S3 sin cargar nada a un warehouse.",
    answer: "Amazon Athena", full: "Athena · queries SQL serverless sobre S3" },
  { variant: "acronym-to-fullname", id: "kms",
    prompt: "KMS", answer: "Key Management Service",
    full: "Llaves criptográficas managed para cifrar S3, EBS, RDS." },
  { variant: "service-to-description", id: "stepfunctions",
    prompt: "AWS Step Functions", answer: "Orquestador de workflows",
    full: "Máquinas de estado para sagas, ETL, manejo de errores." },
  { variant: "usecase-to-service", id: "eventbridge",
    prompt: "Bus de eventos serverless con reglas para hacer fan-out a Lambdas, SQS o SaaS partners.",
    answer: "EventBridge", full: "Routing por reglas, schemas, partners." },
];

const VARIANT_LABEL = {
  "usecase-to-service":   "caso de uso → servicio",
  "acronym-to-fullname":  "acrónimo → nombre completo",
  "service-to-description":"servicio → descripción",
  "icon-to-name":         "icono → nombre",
  "service-to-category":  "servicio → categoría",
};

function FlashcardFace({ card, side, variant }) {
  const s = svcById(card.id);
  const cat = catById(s?.cat);
  return (
    <div className={`flash-face ${side === "back" ? "flash-back" : ""}`} data-variant={variant}>
      <div className="flash-meta">
        <span className="var-tag">{side === "front" ? VARIANT_LABEL[card.variant] : "respuesta"}</span>
        <span className="cat-tag" style={{ "--cat": "var(--ink)" }}>
          <span className="cat-dot" />
          <span>{cat?.short}</span>
        </span>
      </div>

      <div className="flash-body">
        {side === "front" ? (
          card.variant === "icon-to-name" ? (
            <>
              <div className="icon-frame">
                <img src={`icons/${card.id}.svg`} alt="" />
              </div>
              <p className="prompt" style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>
                ¿qué servicio es?
              </p>
            </>
          ) : (
            <p className="prompt">{card.prompt}</p>
          )
        ) : (
          <>
            <p className="answer">{card.answer}</p>
            <p className="desc">{card.full}</p>
          </>
        )}
      </div>

      <div className="flash-foot">
        <span className="hint-pill">
          <kbd>tap</kbd> o <kbd>space</kbd> para voltear
        </span>
      </div>
    </div>
  );
}

function FlashcardView({ navigate, variant = "default" }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [review, setReview] = useState(0);

  const total = SAMPLE_DECK.length;
  const card = SAMPLE_DECK[idx];

  const flip = () => setFlipped(f => !f);
  const grade = (correct) => {
    if (correct) setKnown(k => k + 1); else setReview(r => r + 1);
    if (idx + 1 < total) {
      setIdx(i => i + 1);
      setFlipped(false);
    } else {
      setIdx(i => i + 1);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") { e.preventDefault(); flip(); }
      if (flipped) {
        if (e.key === "1" || e.key === "j") grade(false);
        if (e.key === "2" || e.key === "k") grade(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, idx]);

  if (idx >= total) {
    return (
      <div className="page">
        <div className="session-shell">
          <div className="verdict">
            <div>
              <div className="label">SESIÓN COMPLETADA</div>
              <div className="big">{known}/{total}</div>
              <div className="mono muted">{review} cartas necesitan repaso</div>
            </div>
            <div className="breakdown">
              <div><b>{known}</b> sé</div>
              <div><b>{review}</b> repasar</div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button className="btn primary" onClick={() => { setIdx(0); setKnown(0); setReview(0); setFlipped(false); }}>
              Otra ronda →
            </button>
            <button className="btn ghost" onClick={() => navigate("/flashcards")}>Cambiar config</button>
            <button className="btn ghost" onClick={() => navigate("/")}>Inicio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="session-shell">
        <div className="session-bar">
          <button className="btn ghost sm" onClick={() => navigate("/flashcards")}>← Setup</button>
          <div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${((idx) / total) * 100}%` }} />
            </div>
            <div className="progress-meta" style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
              <span>sé {known} · repasar {review}</span>
              <span>caja promedio 3.2</span>
            </div>
          </div>
          <div className="progress-meta">{idx + 1} / {total}</div>
        </div>

        <div className="flashcard-stage" onClick={flip}>
          <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
            <FlashcardFace card={card} side="front" variant={variant} />
            <FlashcardFace card={card} side="back"  variant={variant} />
          </div>
        </div>

        <div className="flash-actions">
          {!flipped ? (
            <button className="btn primary" style={{ gridColumn: "1 / -1", padding: 18 }} onClick={flip}>
              Mostrar respuesta <span className="flash-shortcut">SPACE</span>
            </button>
          ) : (
            <>
              <button className="btn bad" onClick={() => grade(false)}>
                ✗ Repasar <span className="flash-shortcut">J / 1</span>
              </button>
              <button className="btn good" onClick={() => grade(true)}>
                ✓ Ya me la sé <span className="flash-shortcut">K / 2</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FlashcardView });
