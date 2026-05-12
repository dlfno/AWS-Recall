import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Home } from "./views/Home";
import { FlashcardSetup } from "./views/FlashcardSetup";
import { FlashcardSession } from "./views/FlashcardSession";
import { MemoramaSetup } from "./views/MemoramaSetup";
import { MemoramaBoard } from "./views/MemoramaBoard";
import { DrilldownSetup } from "./views/DrilldownSetup";
import { DrilldownSession } from "./views/DrilldownSession";
import { ExamSetup } from "./views/ExamSetup";
import { ExamSession } from "./views/ExamSession";
import { StatsDashboard } from "./views/StatsDashboard";

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flashcards" element={<FlashcardSetup />} />
          <Route path="/flashcards/play" element={<FlashcardSession />} />
          <Route path="/memorama" element={<MemoramaSetup />} />
          <Route path="/memorama/play" element={<MemoramaBoard />} />
          <Route path="/drilldown" element={<DrilldownSetup />} />
          <Route path="/drilldown/play/:parentId" element={<DrilldownSession />} />
          <Route path="/exam" element={<ExamSetup />} />
          <Route path="/exam/play" element={<ExamSession />} />
          <Route path="/stats" element={<StatsDashboard />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
