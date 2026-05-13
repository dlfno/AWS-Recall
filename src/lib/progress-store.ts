import type { CardProgress } from "./spaced-rep";
import { initialProgress } from "./spaced-rep";
import type {
  ExamAttempt,
  ExamConfig,
  FlashcardSessionConfig,
  MemoramaConfig,
  SessionFilters,
} from "./types";
import { api } from "./api";
import { enqueueAppendPost, enqueueCoalescedPatch, enqueueCoalescedPut } from "./write-queue";
import { applyAppearance, DEFAULT_APPEARANCE, type Appearance } from "./theme-presets";

// ───────── caches en memoria (hidratadas tras login en bootstrapStore) ─────────

export type FlashcardProgressMap = Record<string, CardProgress>;

export interface DrilldownFeatureProgress {
  attempts: number;
  correct: number;
  lastAttempt: number;
}
export type DrilldownProgressMap = Record<string, DrilldownFeatureProgress>;

export interface MemoramaStats {
  played: number;
  bestMovesByPairs: Record<number, number>;
  bestTimeByPairs: Record<number, number>;
}

const cache: {
  flashcards: FlashcardProgressMap;
  drilldown: DrilldownProgressMap;
  memorama: MemoramaStats;
  examAttempts: ExamAttempt[];
  flashcardConfig: FlashcardSessionConfig | null;
  memoramaConfig: MemoramaConfig | null;
  examConfig: ExamConfig | null;
  appearance: Appearance;
} = {
  flashcards: {},
  drilldown: {},
  memorama: { played: 0, bestMovesByPairs: {}, bestTimeByPairs: {} },
  examAttempts: [],
  flashcardConfig: null,
  memoramaConfig: null,
  examConfig: null,
  appearance: DEFAULT_APPEARANCE,
};

let bootstrapped = false;
export function isBootstrapped(): boolean {
  return bootstrapped;
}

export async function bootstrapStore(): Promise<void> {
  const [fl, dd, mem, exam, fc, mc, ec, ap] = await Promise.all([
    api.get<FlashcardProgressMap>("/api/progress/flashcards"),
    api.get<DrilldownProgressMap>("/api/progress/drilldown"),
    api.get<MemoramaStats>("/api/memorama/stats"),
    api.get<ExamAttempt[]>("/api/exam/attempts"),
    api.get<{ value: FlashcardSessionConfig | null }>("/api/config/flashcard"),
    api.get<{ value: MemoramaConfig | null }>("/api/config/memorama"),
    api.get<{ value: ExamConfig | null }>("/api/config/exam"),
    api.get<{ value: Appearance | null }>("/api/config/appearance"),
  ]);
  cache.flashcards = fl ?? {};
  cache.drilldown = dd ?? {};
  cache.memorama = mem ?? { played: 0, bestMovesByPairs: {}, bestTimeByPairs: {} };
  cache.examAttempts = exam ?? [];
  cache.flashcardConfig = fc.value;
  cache.memoramaConfig = mc.value;
  cache.examConfig = ec.value;
  cache.appearance = ap.value ?? DEFAULT_APPEARANCE;
  applyAppearance(cache.appearance);
  bootstrapped = true;
}

export function resetStore(): void {
  cache.flashcards = {};
  cache.drilldown = {};
  cache.memorama = { played: 0, bestMovesByPairs: {}, bestTimeByPairs: {} };
  cache.examAttempts = [];
  cache.flashcardConfig = null;
  cache.memoramaConfig = null;
  cache.examConfig = null;
  cache.appearance = DEFAULT_APPEARANCE;
  applyAppearance(DEFAULT_APPEARANCE);
  bootstrapped = false;
}

export function loadAppearance(): Appearance {
  return cache.appearance;
}

export function saveAppearance(a: Appearance): void {
  cache.appearance = a;
  applyAppearance(a);
  enqueueCoalescedPut("/api/config/appearance", () => cache.appearance);
}

// ───────── flashcard progress ─────────

export function loadFlashcardProgress(): FlashcardProgressMap {
  return cache.flashcards;
}

export function saveFlashcardProgress(p: FlashcardProgressMap): void {
  cache.flashcards = p;
  enqueueCoalescedPatch("/api/progress/flashcards", () => cache.flashcards);
}

export function getOrInit(map: FlashcardProgressMap, cardId: string): CardProgress {
  return map[cardId] ?? initialProgress();
}

// ───────── drilldown ─────────

export function loadDrilldownProgress(): DrilldownProgressMap {
  return cache.drilldown;
}

export function recordDrilldownAnswer(featureId: string, correct: boolean): void {
  const curr = cache.drilldown[featureId] ?? { attempts: 0, correct: 0, lastAttempt: 0 };
  cache.drilldown[featureId] = {
    attempts: curr.attempts + 1,
    correct: curr.correct + (correct ? 1 : 0),
    lastAttempt: Date.now(),
  };
  enqueueAppendPost("/api/progress/drilldown/answer", { featureId, correct });
}

// ───────── memorama ─────────

export function loadMemoramaStats(): MemoramaStats {
  return cache.memorama;
}

export function saveMemoramaStats(s: MemoramaStats): void {
  // Solo se llama desde MemoramaBoard al terminar un juego — la lógica de "qué mejoró" la hace el server.
  // Aquí solo actualizamos el cache.
  cache.memorama = s;
}

/**
 * Recordings del juego: se invoca también desde MemoramaBoard tras terminar.
 * `saveMemoramaStats` solo actualiza el cache; este envía el evento al servidor para que recalcule records y log activity.
 */
export function recordMemoramaGame(pairs: number, moves: number, timeMs: number | null): void {
  enqueueAppendPost("/api/memorama/game", { pairs, moves, timeMs });
}

// ───────── exam ─────────

export function loadExamAttempts(): ExamAttempt[] {
  return cache.examAttempts;
}

export function addExamAttempt(a: ExamAttempt): void {
  cache.examAttempts.unshift(a);
  cache.examAttempts = cache.examAttempts.slice(0, 50);
  enqueueAppendPost("/api/exam/attempts", a);
}

// ───────── configs por usuario ─────────

export function loadFlashcardConfig(fallback: FlashcardSessionConfig): FlashcardSessionConfig {
  return cache.flashcardConfig ?? fallback;
}

export function saveFlashcardConfig(c: FlashcardSessionConfig): void {
  cache.flashcardConfig = c;
  enqueueCoalescedPut("/api/config/flashcard", () => cache.flashcardConfig);
}

export function loadMemoramaConfig(fallback: MemoramaConfig): MemoramaConfig {
  return cache.memoramaConfig ?? fallback;
}

export function saveMemoramaConfig(c: MemoramaConfig): void {
  cache.memoramaConfig = c;
  enqueueCoalescedPut("/api/config/memorama", () => cache.memoramaConfig);
}

export function loadExamConfig(fallback: ExamConfig): ExamConfig {
  return cache.examConfig ?? fallback;
}

export function saveExamConfig(c: ExamConfig): void {
  cache.examConfig = c;
  enqueueCoalescedPut("/api/config/exam", () => cache.examConfig);
}

// ───────── filtros y tema: locales al dispositivo ─────────

const NAMESPACE = "aws-study-cards:v2";
const KEY_FILTERS = `${NAMESPACE}:filters`;
const KEY_THEME = `${NAMESPACE}:theme`;

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadFilters(fallback: SessionFilters): SessionFilters {
  return readJson<SessionFilters>(KEY_FILTERS, fallback);
}

export function saveFilters(f: SessionFilters): void {
  writeJson(KEY_FILTERS, f);
}

export type Theme = "light" | "dark";

export function loadTheme(): Theme {
  return readJson<Theme>(KEY_THEME, "light");
}

export function saveTheme(t: Theme): void {
  writeJson(KEY_THEME, t);
}

// ───────── reset granular (desde /stats) ─────────

export async function clearFlashcardProgress(): Promise<void> {
  cache.flashcards = {};
  await api.del("/api/progress/flashcards");
}

export async function clearDrilldownProgress(): Promise<void> {
  cache.drilldown = {};
  await api.del("/api/progress/drilldown");
}

export async function clearMemoramaStats(): Promise<void> {
  cache.memorama = { played: 0, bestMovesByPairs: {}, bestTimeByPairs: {} };
  await api.del("/api/memorama/stats");
}

export async function clearExamAttempts(): Promise<void> {
  cache.examAttempts = [];
  await api.del("/api/exam/attempts");
}
