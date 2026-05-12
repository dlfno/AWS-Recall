import { ALL_VARIANTS } from "./deck-builder";
import { CATEGORIES, SERVICES, getCategory } from "./data";
import { LEITNER_BOXES, type Box, type CardProgress } from "./spaced-rep";
import {
  loadDrilldownProgress,
  loadExamAttempts,
  loadFlashcardProgress,
  loadMemoramaStats,
  type DrilldownProgressMap,
  type FlashcardProgressMap,
  type MemoramaStats,
} from "./progress-store";
import type { Category, CategoryId, Service, ServiceFeature } from "./types";

export interface OverallFlashcardStats {
  cardsSeen: number;
  totalReviews: number;
  totalLapses: number;
  mastered: number;
  learning: number;
  averageBox: number;
  boxDistribution: Record<Box, number>;
  lastReviewed: number;
}

export interface ServiceStats {
  service: Service;
  cardsSeen: number;
  totalReviews: number;
  totalLapses: number;
  averageBox: number;
}

export interface CategoryStats {
  category: Category;
  serviceCount: number;
  servicesSeen: number;
  averageBox: number;
  totalReviews: number;
}

function cardKey(serviceId: string, variant: string): string {
  return `${serviceId}__${variant}`;
}

export function computeOverall(
  progress: FlashcardProgressMap = loadFlashcardProgress(),
): OverallFlashcardStats {
  const entries = Object.values(progress);
  const dist: Record<Box, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;
  let totalLapses = 0;
  let boxSum = 0;
  let lastReviewed = 0;
  for (const e of entries) {
    dist[e.box] += 1;
    totalReviews += e.reviews;
    totalLapses += e.lapses;
    boxSum += e.box;
    if (e.lastReviewed > lastReviewed) lastReviewed = e.lastReviewed;
  }
  return {
    cardsSeen: entries.length,
    totalReviews,
    totalLapses,
    mastered: dist[5],
    learning: dist[1] + dist[2],
    averageBox: entries.length ? boxSum / entries.length : 0,
    boxDistribution: dist,
    lastReviewed,
  };
}

export function computeByService(
  progress: FlashcardProgressMap = loadFlashcardProgress(),
): ServiceStats[] {
  return SERVICES.map((service) => {
    const cards: CardProgress[] = [];
    for (const variant of ALL_VARIANTS) {
      const p = progress[cardKey(service.id, variant)];
      if (p) cards.push(p);
    }
    const reviews = cards.reduce((a, c) => a + c.reviews, 0);
    const lapses = cards.reduce((a, c) => a + c.lapses, 0);
    const boxSum = cards.reduce((a, c) => a + c.box, 0);
    return {
      service,
      cardsSeen: cards.length,
      totalReviews: reviews,
      totalLapses: lapses,
      averageBox: cards.length ? boxSum / cards.length : 0,
    };
  });
}

export function computeByCategory(
  byService: ServiceStats[] = computeByService(),
): CategoryStats[] {
  const grouped = new Map<CategoryId, ServiceStats[]>();
  for (const s of byService) {
    const list = grouped.get(s.service.category) ?? [];
    list.push(s);
    grouped.set(s.service.category, list);
  }
  return CATEGORIES.map((category) => {
    const list = grouped.get(category.id) ?? [];
    const seen = list.filter((s) => s.cardsSeen > 0);
    const boxSum = seen.reduce((a, s) => a + s.averageBox, 0);
    return {
      category,
      serviceCount: list.length,
      servicesSeen: seen.length,
      averageBox: seen.length ? boxSum / seen.length : 0,
      totalReviews: list.reduce((a, s) => a + s.totalReviews, 0),
    };
  }).filter((c) => c.serviceCount > 0);
}

/**
 * Servicios que conviene repasar: vistos al menos una vez, ordenados por
 * caja promedio ascendente y lapses descendente.
 */
export function topToReview(
  byService: ServiceStats[] = computeByService(),
  limit = 10,
): ServiceStats[] {
  return byService
    .filter((s) => s.cardsSeen > 0)
    .sort(
      (a, b) =>
        a.averageBox - b.averageBox ||
        b.totalLapses - a.totalLapses ||
        b.cardsSeen - a.cardsSeen,
    )
    .slice(0, limit);
}

export interface MemoramaBoardRecord {
  pairs: number;
  bestMoves?: number;
  bestTimeMs?: number;
}

export function computeMemoramaRecords(
  stats: MemoramaStats = loadMemoramaStats(),
): MemoramaBoardRecord[] {
  const sizes = [6, 8, 12, 18];
  return sizes.map((pairs) => ({
    pairs,
    bestMoves: stats.bestMovesByPairs[pairs],
    bestTimeMs: stats.bestTimeByPairs[pairs],
  }));
}

export interface OverallDrilldownStats {
  attempts: number;
  correct: number;
  accuracy: number;
  featuresSeen: number;
  featuresMastered: number;
  totalFeatures: number;
  lastAttempt: number;
}

export interface FeatureStatsRow {
  feature: ServiceFeature;
  parent: Service;
  attempts: number;
  correct: number;
  accuracy: number;
  lastAttempt: number;
}

export interface ParentDrilldownRollup {
  parent: Service;
  totalFeatures: number;
  featuresSeen: number;
  featuresMastered: number;
  attempts: number;
  correct: number;
  accuracy: number;
}

function allFeaturesFlat(): Array<{ feature: ServiceFeature; parent: Service }> {
  const out: Array<{ feature: ServiceFeature; parent: Service }> = [];
  for (const s of SERVICES) {
    for (const f of s.features ?? []) {
      out.push({ feature: f, parent: s });
    }
  }
  return out;
}

const MASTERY_MIN_ATTEMPTS = 2;
const MASTERY_THRESHOLD = 0.8;

function isMastered(attempts: number, correct: number): boolean {
  if (attempts < MASTERY_MIN_ATTEMPTS) return false;
  return correct / attempts >= MASTERY_THRESHOLD;
}

export function computeDrilldownOverall(
  progress: DrilldownProgressMap = loadDrilldownProgress(),
): OverallDrilldownStats {
  const flat = allFeaturesFlat();
  let attempts = 0;
  let correct = 0;
  let featuresSeen = 0;
  let featuresMastered = 0;
  let lastAttempt = 0;
  for (const { feature } of flat) {
    const p = progress[feature.id];
    if (!p) continue;
    featuresSeen += 1;
    attempts += p.attempts;
    correct += p.correct;
    if (p.lastAttempt > lastAttempt) lastAttempt = p.lastAttempt;
    if (isMastered(p.attempts, p.correct)) featuresMastered += 1;
  }
  return {
    attempts,
    correct,
    accuracy: attempts ? correct / attempts : 0,
    featuresSeen,
    featuresMastered,
    totalFeatures: flat.length,
    lastAttempt,
  };
}

export function computeDrilldownByFeature(
  progress: DrilldownProgressMap = loadDrilldownProgress(),
): FeatureStatsRow[] {
  return allFeaturesFlat().map(({ feature, parent }) => {
    const p = progress[feature.id];
    return {
      feature,
      parent,
      attempts: p?.attempts ?? 0,
      correct: p?.correct ?? 0,
      accuracy: p && p.attempts ? p.correct / p.attempts : 0,
      lastAttempt: p?.lastAttempt ?? 0,
    };
  });
}

export function computeDrilldownByParent(
  rows: FeatureStatsRow[] = computeDrilldownByFeature(),
): ParentDrilldownRollup[] {
  const grouped = new Map<string, FeatureStatsRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.parent.id) ?? [];
    list.push(row);
    grouped.set(row.parent.id, list);
  }
  const out: ParentDrilldownRollup[] = [];
  for (const [, list] of grouped) {
    const parent = list[0].parent;
    const seen = list.filter((r) => r.attempts > 0);
    const attempts = list.reduce((a, r) => a + r.attempts, 0);
    const correct = list.reduce((a, r) => a + r.correct, 0);
    const mastered = list.filter((r) => isMastered(r.attempts, r.correct)).length;
    out.push({
      parent,
      totalFeatures: list.length,
      featuresSeen: seen.length,
      featuresMastered: mastered,
      attempts,
      correct,
      accuracy: attempts ? correct / attempts : 0,
    });
  }
  return out.sort((a, b) => b.attempts - a.attempts);
}

/**
 * Features que conviene repasar: vistas al menos una vez, ordenadas por
 * accuracy ascendente y luego por intentos descendente.
 */
export function topFeaturesToReview(
  rows: FeatureStatsRow[] = computeDrilldownByFeature(),
  limit = 8,
): FeatureStatsRow[] {
  return rows
    .filter((r) => r.attempts > 0)
    .sort(
      (a, b) =>
        a.accuracy - b.accuracy ||
        b.attempts - a.attempts ||
        b.lastAttempt - a.lastAttempt,
    )
    .slice(0, limit);
}

// ── Activity-derived helpers (streak, heat strip, last activity) ────

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfDayEpoch(daysAgo: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

function collectActivityTimestamps(): number[] {
  const out: number[] = [];
  for (const p of Object.values(loadFlashcardProgress())) {
    if (p.lastReviewed > 0) out.push(p.lastReviewed);
  }
  for (const p of Object.values(loadDrilldownProgress())) {
    if (p.lastAttempt > 0) out.push(p.lastAttempt);
  }
  for (const a of loadExamAttempts()) {
    if (a.timestamp > 0) out.push(a.timestamp);
  }
  return out;
}

export interface HeatCell {
  date: Date;
  count: number;
}

export function computeHeatStrip(days = 28): HeatCell[] {
  const buckets = new Map<string, number>();
  for (const ts of collectActivityTimestamps()) {
    const key = dayKey(ts);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const cells: HeatCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    cells.push({ date: d, count: buckets.get(dayKey(d.getTime())) ?? 0 });
  }
  return cells;
}

export function computeStreak(): number {
  const ts = collectActivityTimestamps();
  if (ts.length === 0) return 0;
  const days = new Set(ts.map(dayKey));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(dayKey(d.getTime()))) {
      streak += 1;
    } else if (i === 0) {
      // Today empty → check from yesterday
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export interface LastActivity {
  timestamp: number;
  mode: "flashcards" | "drilldown" | "exam";
  serviceId?: string;
  parentName?: string;
}

export function computeLastActivity(): LastActivity | null {
  let best: LastActivity | null = null;
  for (const [key, p] of Object.entries(loadFlashcardProgress())) {
    if (p.lastReviewed > 0 && (!best || p.lastReviewed > best.timestamp)) {
      const [serviceId] = key.split("__");
      best = { timestamp: p.lastReviewed, mode: "flashcards", serviceId };
    }
  }
  for (const [featureId, p] of Object.entries(loadDrilldownProgress())) {
    if (p.lastAttempt > 0 && (!best || p.lastAttempt > best.timestamp)) {
      const parent = SERVICES.find((s) =>
        (s.features ?? []).some((f) => f.id === featureId),
      );
      best = {
        timestamp: p.lastAttempt,
        mode: "drilldown",
        serviceId: parent?.id,
        parentName: parent?.name,
      };
    }
  }
  for (const a of loadExamAttempts()) {
    if (!best || a.timestamp > best.timestamp) {
      best = { timestamp: a.timestamp, mode: "exam" };
    }
  }
  return best;
}

export const BOX_VALUES = LEITNER_BOXES;
export { getCategory };
// silence unused start-of-day helper (kept for future date-range helpers)
void startOfDayEpoch;
