/* eslint-disable */

// Static wrapper for the design canvas — bypasses the hash router and renders
// a single screen at a forced theme/accent/font pair/flash variant combo.
function StaticShell({ route = "/", theme = "light", pair = "dm",
                      accent = "#FF8B6B", accentInk = "#FBF7F0",
                      flashVariant = "default" }) {
  const navigate = () => {};
  let view;
  if (route === "/") view = <HomeView navigate={navigate} />;
  else if (route === "/flashcards") view = <SetupView navigate={navigate} mode="flashcards" />;
  else if (route === "/flashcards/play") view = <FlashcardView navigate={navigate} variant={flashVariant} />;
  else if (route === "/memorama") view = <SetupView navigate={navigate} mode="memorama" />;
  else if (route === "/memorama/play") view = <MemoramaView navigate={navigate} />;
  else if (route === "/drilldown") view = <SetupView navigate={navigate} mode="drilldown" />;
  else if (route === "/drilldown/play") view = <DrilldownView navigate={navigate} parentId="lambda" />;
  else if (route === "/exam") view = <SetupView navigate={navigate} mode="exam" />;
  else if (route === "/exam/play") view = <ExamView navigate={navigate} />;
  else if (route === "/stats") view = <StatsView navigate={navigate} />;
  else view = <HomeView navigate={navigate} />;

  return (
    <div
      className="static-shell"
      data-theme={theme}
      data-pair={pair}
      style={{
        "--accent": accent,
        "--accent-ink": accentInk,
        width: "100%", height: "100%",
        overflow: "hidden",
        background: "var(--paper)",
        position: "relative",
        isolation: "isolate",
      }}
    >
      <Topbar route={route} navigate={navigate} />
      {view}
      <FooterRule />
    </div>
  );
}

function ArtboardCaption({ children }) {
  return (
    <div style={{
      position: "absolute", bottom: 8, left: 12,
      fontFamily: "ui-sans-serif, system-ui",
      fontSize: 11, color: "rgba(60,50,40,0.6)",
      letterSpacing: "0.02em",
    }}>{children}</div>
  );
}

const ART_W = 1280;
const ART_H = 900;
const ART_MD_W = 1024;
const ART_MD_H = 740;

function Canvas() {
  return (
    <DesignCanvas>
      <DCSection
        id="screens"
        title="Pantallas principales"
        subtitle="Los 8 estados que el usuario va a tocar — home, setups, sesiones y progreso."
      >
        <DCArtboard id="home" label="Home · dashboard" width={ART_W} height={ART_H}>
          <StaticShell route="/" />
        </DCArtboard>

        <DCArtboard id="setup-flash" label="Setup · flashcards" width={ART_W} height={ART_H}>
          <StaticShell route="/flashcards" />
        </DCArtboard>

        <DCArtboard id="flash" label="Flashcard · sesión (frente)" width={ART_W} height={ART_H}>
          <StaticShell route="/flashcards/play" />
        </DCArtboard>

        <DCArtboard id="memorama" label="Memorama · partida" width={ART_W} height={ART_H}>
          <StaticShell route="/memorama/play" />
        </DCArtboard>

        <DCArtboard id="drilldown" label="Drilldown · pregunta" width={ART_W} height={ART_H}>
          <StaticShell route="/drilldown/play" />
        </DCArtboard>

        <DCArtboard id="exam" label="Examen · contra reloj" width={ART_W} height={ART_H}>
          <StaticShell route="/exam/play" />
        </DCArtboard>

        <DCArtboard id="stats" label="Progreso · stats dashboard" width={ART_W} height={ART_H + 200}>
          <StaticShell route="/stats" />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="flash-variants"
        title="Variantes de flashcard"
        subtitle="Tres estilos de tarjeta. Toggle desde Tweaks → Flashcards → Estilo."
      >
        <DCArtboard id="flash-suave" label="A · Suave (default)" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/flashcards/play" flashVariant="default" />
        </DCArtboard>
        <DCArtboard id="flash-minimal" label="B · Mínima" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/flashcards/play" flashVariant="minimal" />
        </DCArtboard>
        <DCArtboard id="flash-index" label="C · Ficha de cuaderno" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/flashcards/play" flashVariant="index" />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="dark"
        title="Tema oscuro"
        subtitle="Mismo layout, paleta noche. Toggle desde Tweaks → Aspecto → Tema."
      >
        <DCArtboard id="dark-home" label="Home" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" theme="dark" />
        </DCArtboard>
        <DCArtboard id="dark-flash" label="Flashcard" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/flashcards/play" theme="dark" />
        </DCArtboard>
        <DCArtboard id="dark-stats" label="Progreso" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/stats" theme="dark" />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="accents"
        title="Paletas de acento"
        subtitle="Cuatro swatches curados. Toggle desde Tweaks → Aspecto → Acento."
      >
        <DCArtboard id="acc-coral" label="Coral · default" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" accent="#FF8B6B" />
        </DCArtboard>
        <DCArtboard id="acc-sky" label="Sky" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" accent="#6BB6FF" />
        </DCArtboard>
        <DCArtboard id="acc-lavender" label="Lavender" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" accent="#B095F0" />
        </DCArtboard>
        <DCArtboard id="acc-saffron" label="Azafrán" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" accent="#FFC85C" accentInk="#5D3F00" />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="typography"
        title="Pareados tipográficos"
        subtitle="Tres familias. Toggle desde Tweaks → Aspecto → Tipografía."
      >
        <DCArtboard id="type-dm" label="DM Sans + DM Mono (default)" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" pair="dm" />
        </DCArtboard>
        <DCArtboard id="type-jakarta" label="Plus Jakarta + JetBrains" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" pair="jakarta" />
        </DCArtboard>
        <DCArtboard id="type-quicksand" label="Quicksand + Space Mono" width={ART_MD_W} height={ART_MD_H}>
          <StaticShell route="/" pair="quicksand" />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Canvas />);
