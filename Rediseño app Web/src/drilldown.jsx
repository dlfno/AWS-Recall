/* eslint-disable */

function DrilldownView({ navigate, parentId = "lambda" }) {
  const parent = svcById(parentId) || svcById("lambda");
  const features = parent.features || [];
  const cat = catById(parent.cat);

  // Pick a question: prompt is a feature description; options are feature names from the parent.
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});

  // The "correct" feature is at qIdx; options shuffled deterministically.
  const f = features[qIdx];
  if (!f) {
    return (
      <div className="page">
        <p className="lede">No hay features.</p>
      </div>
    );
  }

  const options = useMemo(() => {
    // deterministic permutation per qIdx
    const order = [1, 0, 3, 2];
    return order.map(i => features[i]).filter(Boolean);
  }, [qIdx, features]);

  const answered = selected !== null;

  const choose = (optId) => {
    if (answered) return;
    setSelected(optId);
    setAnswers({ ...answers, [f.id]: optId });
  };

  const next = () => {
    if (qIdx + 1 < features.length) {
      setQIdx(qIdx + 1);
      setSelected(null);
    } else {
      setQIdx(features.length); // done
    }
  };

  if (qIdx >= features.length) {
    const correct = features.filter(ff => answers[ff.id] === ff.id).length;
    return (
      <div className="page">
        <div className="dd-shell">
          <div className="verdict">
            <div>
              <div className="label">DRILLDOWN COMPLETADO · {parent.name.toUpperCase()}</div>
              <div className="big">{correct}/{features.length}</div>
              <div className="mono muted">
                {correct === features.length ? "perfecto." : `${features.length - correct} para repasar.`}
              </div>
            </div>
            <ServiceIcon id={parent.id} size="xl" />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button className="btn primary" onClick={() => { setQIdx(0); setSelected(null); setAnswers({}); }}>Otra ronda →</button>
            <button className="btn ghost" onClick={() => navigate("/drilldown")}>Cambiar de servicio</button>
            <button className="btn ghost" onClick={() => navigate("/")}>Inicio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dd-shell">
        <div className="session-bar" style={{ borderBottom: "none", marginBottom: 16 }}>
          <button className="btn ghost sm" onClick={() => navigate("/drilldown")}>← Setup</button>
          <div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(qIdx / features.length) * 100}%` }} />
            </div>
          </div>
          <div className="progress-meta">{qIdx + 1} / {features.length}</div>
        </div>

        <div className="dd-parent">
          <div className="ico-frame"><img src={`icons/${parent.id}.svg`} alt="" /></div>
          <div>
            <h2>{parent.name}</h2>
            <p className="sub">{parent.short}</p>
          </div>
          <span className="cat-tag">
            <span className="cat-dot" style={{ background: "var(--ink)" }} />
            {cat?.short} · {cat?.name}
          </span>
        </div>

        <div className="dd-prompt">
          <div className="kicker">¿qué feature de {parent.acronym} describe esto?</div>
          <p className="quote">{f.desc}</p>
        </div>

        <div className="dd-options">
          {options.map((opt, i) => {
            const letter = ["A","B","C","D"][i];
            const showCorrect = answered && opt.id === f.id;
            const showWrong = answered && selected === opt.id && opt.id !== f.id;
            const isDim = answered && opt.id !== f.id && selected !== opt.id;
            return (
              <button
                key={opt.id}
                className={`dd-option ${showCorrect ? "is-correct" : ""} ${showWrong ? "is-wrong" : ""} ${isDim ? "is-dim" : ""}`}
                disabled={answered}
                onClick={() => choose(opt.id)}
              >
                <span className="letter">{letter}</span>
                <span>
                  <div className="opt-name">{opt.name}</div>
                  {answered && <div className="opt-desc">{opt.desc}</div>}
                </span>
                <span className="mark">
                  {showCorrect ? "✓" : showWrong ? "✗" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
            <button className="btn primary" onClick={next}>
              {qIdx + 1 === features.length ? "Ver resultado →" : "Siguiente →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DrilldownView });
