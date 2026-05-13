import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import { Login } from "./views/Login";
import { Register } from "./views/Register";
import { Members } from "./views/Members";
import { PublicProfile } from "./views/PublicProfile";
import { Compare } from "./views/Compare";
import { Leaderboard } from "./views/Leaderboard";
import { Feed } from "./views/Feed";
import { Admin } from "./views/Admin";
import { Settings } from "./views/Settings";

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route path="/flashcards" element={<Protected><FlashcardSetup /></Protected>} />
          <Route path="/flashcards/play" element={<Protected><FlashcardSession /></Protected>} />
          <Route path="/memorama" element={<Protected><MemoramaSetup /></Protected>} />
          <Route path="/memorama/play" element={<Protected><MemoramaBoard /></Protected>} />
          <Route path="/drilldown" element={<Protected><DrilldownSetup /></Protected>} />
          <Route path="/drilldown/play/:parentId" element={<Protected><DrilldownSession /></Protected>} />
          <Route path="/exam" element={<Protected><ExamSetup /></Protected>} />
          <Route path="/exam/play" element={<Protected><ExamSession /></Protected>} />
          <Route path="/stats" element={<Protected><StatsDashboard /></Protected>} />

          <Route path="/miembros" element={<Protected><Members /></Protected>} />
          <Route path="/u/:nickname" element={<Protected><PublicProfile /></Protected>} />
          <Route path="/compare/:a/:b" element={<Protected><Compare /></Protected>} />
          <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
          <Route path="/feed" element={<Protected><Feed /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="/ajustes" element={<Protected><Settings /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
