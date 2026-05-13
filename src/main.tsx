import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./lib/auth-context";
import { loadTheme } from "./lib/progress-store";
import { applyAppearance, DEFAULT_APPEARANCE } from "./lib/theme-presets";
import "./styles.css";

const root = document.documentElement;
root.setAttribute("data-theme", loadTheme());
applyAppearance(DEFAULT_APPEARANCE); // se sobreescribe tras login con la preferencia del usuario

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
