import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadTheme } from "./lib/progress-store";
import "./styles.css";

const root = document.documentElement;
root.setAttribute("data-theme", loadTheme());
root.setAttribute("data-pair", "jakarta");
root.style.setProperty("--accent", "#6BB6FF");
root.style.setProperty("--accent-ink", "#FBF7F0");

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
