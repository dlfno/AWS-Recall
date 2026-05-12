import type { CardProgress } from "./spaced-rep";
import { initialProgress } from "./spaced-rep";
import type {
  ExamAttempt,
  ExamConfig,
  FlashcardSessionConfig,
  MemoramaConfig,
  SessionFilters,
} from "./types";

const NAMESPACE = "aws-study-cards:v1";
const KEY_FLASH = `${NAMESPACE}:flashcard-progress`;
const KEY_FILTERS = `${NAMESPACE}:filters`;
const KEY_FLASH_CFG = `${NAMESPACE}:flashcard-config`;
const KEY_MEMO_CFG = `${NAMESPACE}:memorama-config`;
const KEY_MEMO_STATS = `${NAMESPACE}:memorama-stats`;
const KEY_DRILL = `${NAMESPACE}:drilldown-progress`;
const KEY_EXAM_CFG = `${NAMESPACE}:exam-config`;
const KEY_EXAM_ATTEMPTS = `${NAMESPACE}:exam-attempts`;
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
    // ignore quota or serialization errors
  }
}

export type FlashcardProgressMap = Record<string, CardProgress>;

export function loadFlashcardProgress(): FlashcardProgressMap {
  return readJson<FlashcardProgressMap>(KEY_FLASH, {});
}

export function saveFlashcardProgress(p: FlashcardProgressMap): void {
  writeJson(KEY_FLASH, p);
}

export function getOrInit(map: FlashcardProgressMap, cardId: string): CardProgress {
  return map[cardId] ?? initialProgress();
}

export function loadFilters(fallback: SessionFilters): SessionFilters {
  return readJson<SessionFilters>(KEY_FILTERS, fallback);
}

export function saveFilters(f: SessionFilters): void {
  writeJson(KEY_FILTERS, f);
}

export function loadFlashcardConfig(
  fallback: FlashcardSessionConfig,
): FlashcardSessionConfig {
  return readJson<FlashcardSessionConfig>(KEY_FLASH_CFG, fallback);
}

export function saveFlashcardConfig(c: FlashcardSessionConfig): void {
  writeJson(KEY_FLASH_CFG, c);
}

export function loadMemoramaConfig(fallback: MemoramaConfig): MemoramaConfig {
  return readJson<MemoramaConfig>(KEY_MEMO_CFG, fallback);
}

export function saveMemoramaConfig(c: MemoramaConfig): void {
  writeJson(KEY_MEMO_CFG, c);
}

export interface MemoramaStats {
  played: number;
  bestMovesByPairs: Record<number, number>;
  bestTimeByPairs: Record<number, number>;
}

export function loadMemoramaStats(): MemoramaStats {
  return readJson<MemoramaStats>(KEY_MEMO_STATS, {
    played: 0,
    bestMovesByPairs: {},
    bestTimeByPairs: {},
  });
}

export function saveMemoramaStats(s: MemoramaStats): void {
  writeJson(KEY_MEMO_STATS, s);
}

export function clearFlashcardProgress(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY_FLASH);
}

export function clearMemoramaStats(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY_MEMO_STATS);
}

export interface DrilldownFeatureProgress {
  attempts: number;
  correct: number;
  lastAttempt: number;
}

export type DrilldownProgressMap = Record<string, DrilldownFeatureProgress>;

export function loadDrilldownProgress(): DrilldownProgressMap {
  return readJson<DrilldownProgressMap>(KEY_DRILL, {});
}

export function saveDrilldownProgress(p: DrilldownProgressMap): void {
  writeJson(KEY_DRILL, p);
}

export function recordDrilldownAnswer(
  featureId: string,
  correct: boolean,
): void {
  const map = loadDrilldownProgress();
  const curr = map[featureId] ?? { attempts: 0, correct: 0, lastAttempt: 0 };
  map[featureId] = {
    attempts: curr.attempts + 1,
    correct: curr.correct + (correct ? 1 : 0),
    lastAttempt: Date.now(),
  };
  saveDrilldownProgress(map);
}

export function clearDrilldownProgress(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY_DRILL);
}

const MAX_EXAM_ATTEMPTS = 50;

export function loadExamConfig(fallback: ExamConfig): ExamConfig {
  return readJson<ExamConfig>(KEY_EXAM_CFG, fallback);
}

export function saveExamConfig(c: ExamConfig): void {
  writeJson(KEY_EXAM_CFG, c);
}

export function loadExamAttempts(): ExamAttempt[] {
  return readJson<ExamAttempt[]>(KEY_EXAM_ATTEMPTS, []);
}

export function addExamAttempt(a: ExamAttempt): void {
  const list = loadExamAttempts();
  list.unshift(a);
  writeJson(KEY_EXAM_ATTEMPTS, list.slice(0, MAX_EXAM_ATTEMPTS));
}

export function clearExamAttempts(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY_EXAM_ATTEMPTS);
}

export type Theme = "light" | "dark";

export function loadTheme(): Theme {
  return readJson<Theme>(KEY_THEME, "light");
}

export function saveTheme(t: Theme): void {
  writeJson(KEY_THEME, t);
}
