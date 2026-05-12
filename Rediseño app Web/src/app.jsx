/* eslint-disable */

// Defaults are baked in — visual decisions are settled, no more in-page tweaks.
const CONFIG = {
  theme: "light",
  accent: "#6BB6FF",
  pair: "jakarta",
  flashVariant: "minimal",
};

function App() {
  const [route, navigate] = useHashRoute();

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", CONFIG.theme);
    r.setAttribute("data-pair",  CONFIG.pair);
    r.style.setProperty("--accent", CONFIG.accent);
    r.style.setProperty("--accent-ink", "#FBF7F0");
  }, []);

  let view;
  if (route === "/" || route === "") view = <HomeView navigate={navigate} />;
  else if (route === "/flashcards") view = <SetupView navigate={navigate} mode="flashcards" />;
  else if (route === "/flashcards/play") view = <FlashcardView navigate={navigate} variant={CONFIG.flashVariant} />;
  else if (route === "/memorama") view = <SetupView navigate={navigate} mode="memorama" />;
  else if (route === "/memorama/play") view = <MemoramaView navigate={navigate} />;
  else if (route === "/drilldown") view = <SetupView navigate={navigate} mode="drilldown" />;
  else if (route.startsWith("/drilldown/play")) {
    const m = route.match(/p=([^&]+)/);
    view = <DrilldownView navigate={navigate} parentId={m ? m[1] : "lambda"} />;
  }
  else if (route === "/exam") view = <SetupView navigate={navigate} mode="exam" />;
  else if (route === "/exam/play") view = <ExamView navigate={navigate} />;
  else if (route === "/stats") view = <StatsView navigate={navigate} />;
  else view = <HomeView navigate={navigate} />;

  return (
    <div className="shell">
      <Topbar route={route} navigate={navigate} />
      {view}
      <FooterRule />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
