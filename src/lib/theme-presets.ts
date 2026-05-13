export type AccentId = "coral" | "blue" | "mint" | "lila" | "rosa" | "amber";
export type FontPairId = "dm" | "jakarta" | "quicksand" | "dyslexic";

export interface AccentPreset {
  id: AccentId;
  name: string;
  accent: string;
  accent2: string;
  accentInk: string;
}

export interface FontPairPreset {
  id: FontPairId;
  name: string;
  display: string;
  mono: string;
  hint?: string;
}

export const ACCENTS: AccentPreset[] = [
  { id: "coral",  name: "Coral", accent: "#FF8B6B", accent2: "#FFB39B", accentInk: "#FBF7F0" },
  { id: "blue",   name: "Azul",  accent: "#6BB6FF", accent2: "#9ACDFF", accentInk: "#FBF7F0" },
  { id: "mint",   name: "Mint",  accent: "#4FCF94", accent2: "#8FE3BA", accentInk: "#0E2A1F" },
  { id: "lila",   name: "Líla",  accent: "#B58CFF", accent2: "#D4BCFF", accentInk: "#1B1437" },
  { id: "rosa",   name: "Rosa",  accent: "#FF6B9D", accent2: "#FFA0BD", accentInk: "#3A0E25" },
  { id: "amber",  name: "Ámbar", accent: "#F5A623", accent2: "#FFD089", accentInk: "#2D2A3A" },
];

export const FONT_PAIRS: FontPairPreset[] = [
  { id: "dm",        name: "DM Sans",       display: "DM Sans",          mono: "DM Mono" },
  { id: "jakarta",   name: "Plus Jakarta",  display: "Plus Jakarta Sans", mono: "JetBrains Mono" },
  { id: "quicksand", name: "Quicksand",     display: "Quicksand",         mono: "Space Mono" },
  { id: "dyslexic",  name: "OpenDyslexic",  display: "OpenDyslexic",      mono: "OpenDyslexic", hint: "Amigable para dislexia" },
];

export interface Appearance {
  accent: AccentId;
  fontPair: FontPairId;
}

export const DEFAULT_APPEARANCE: Appearance = {
  accent: "blue",       // matches el hardcoded original en main.tsx
  fontPair: "jakarta",
};

export function findAccent(id: AccentId | string): AccentPreset {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[1];
}

export function findFontPair(id: FontPairId | string): FontPairPreset {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[1];
}

export function applyAppearance(a: Appearance): void {
  const accent = findAccent(a.accent);
  const root = document.documentElement;
  root.setAttribute("data-pair", a.fontPair);
  root.style.setProperty("--accent", accent.accent);
  root.style.setProperty("--accent-2", accent.accent2);
  root.style.setProperty("--accent-ink", accent.accentInk);
}
