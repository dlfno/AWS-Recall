/* eslint-disable */

// Memorama — pre-shuffled 8 pairs for the prototype.
function buildBoard(pairs = 8) {
  const pool = ["s3", "ec2", "lambda", "vpc", "dynamodb", "iam", "cloudfront", "kms",
                "sns", "sqs", "route53", "rds", "ecs", "athena", "redshift"];
  const chosen = pool.slice(0, pairs);
  let cards = [];
  chosen.forEach((id, i) => {
    cards.push({ cardId: `${id}-icon`, pairId: id, side: "icon" });
    cards.push({ cardId: `${id}-name`, pairId: id, side: "name" });
  });
  // deterministic shuffle for prototype look
  const order = [3,7,0,12,9,1,5,15,8,2,14,4,11,6,13,10];
  return order.slice(0, cards.length).map(i => cards[i]).filter(Boolean);
}

function MemoramaView({ navigate }) {
  const [board, setBoard] = useState(() => buildBoard(8));
  const [flipped, setFlipped] = useState(new Set(["s3-icon", "s3-name", "vpc-icon"])); // demo state
  const [matched, setMatched] = useState(new Set(["s3"]));
  const [selected, setSelected] = useState(["vpc-icon"]);
  const [moves, setMoves] = useState(7);
  const [now, setNow] = useState(Date.now());
  const [startedAt] = useState(() => Date.now() - 92_000);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - startedAt;
  const mm = pad2(Math.floor(elapsed / 60000));
  const ss = pad2(Math.floor((elapsed % 60000) / 1000));

  const pairs = board.length / 2;
  const matchedCount = matched.size;
  const cols = pairs <= 6 ? 4 : pairs <= 8 ? 4 : pairs <= 12 ? 6 : 6;

  const handleClick = (card) => {
    if (matched.has(card.pairId)) return;
    if (flipped.has(card.cardId)) return;
    if (selected.length >= 2) return;
    const nextFlipped = new Set(flipped); nextFlipped.add(card.cardId);
    const nextSel = [...selected, card.cardId];
    setFlipped(nextFlipped);
    setSelected(nextSel);

    if (nextSel.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = nextSel.map(id => board.find(c => c.cardId === id));
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          setMatched(m => { const n = new Set(m); n.add(a.pairId); return n; });
          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped(f => { const n = new Set(f); n.delete(a.cardId); n.delete(b.cardId); return n; });
          setSelected([]);
        }, 900);
      }
    }
  };

  return (
    <div className="page">
      <div className="session-bar" style={{ borderBottom: "none", marginBottom: 16 }}>
        <button className="btn ghost sm" onClick={() => navigate("/memorama")}>← Setup</button>
        <div className="progress-meta" style={{ textAlign: "center" }}>memorama · acrónimo · nombre</div>
        <div className="progress-meta">{matchedCount} / {pairs} pares</div>
      </div>

      <div className="memo-hud">
        <div className="cell">
          <div className="label">Movimientos</div>
          <div className="value num">{moves}</div>
        </div>
        <div className="cell">
          <div className="label">Pares</div>
          <div className="value num">{matchedCount} / {pairs}</div>
        </div>
        <div className="cell">
          <div className="label">Tiempo</div>
          <div className="value num">{mm}:{ss}</div>
        </div>
        <div className="cell">
          <div className="label">Récord ·  pares</div>
          <div className="value num">01:24</div>
        </div>
      </div>

      <div className="board" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {board.map((c, i) => {
          const isFlipped = flipped.has(c.cardId) || matched.has(c.pairId);
          const isMatched = matched.has(c.pairId);
          const s = svcById(c.pairId);
          return (
            <button
              key={c.cardId}
              className={`board-card ${isFlipped ? "flipped" : ""} ${isMatched ? "matched" : ""}`}
              onClick={() => handleClick(c)}
            >
              <div className="board-card-inner">
                <div className="bc-face bc-back" data-mark="F" />
                <div className="bc-face bc-front">
                  {c.side === "icon" ? (
                    <div className="icon-wrap"><img src={`icons/${c.pairId}.svg`} alt="" /></div>
                  ) : (
                    <>
                      <span className="sub">{catById(s.cat)?.short}</span>
                      <span className="text-lg">{s.acronym}</span>
                      <span className="sub" style={{ marginTop: 2 }}>{s.short.slice(0, 32)}…</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { MemoramaView });
