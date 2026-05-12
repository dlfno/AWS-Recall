export const LEITNER_BOXES = [1, 2, 3, 4, 5] as const;
export type Box = (typeof LEITNER_BOXES)[number];

export interface CardProgress {
  box: Box;
  reviews: number;
  lapses: number;
  lastReviewed: number;
}

export function initialProgress(): CardProgress {
  return { box: 1, reviews: 0, lapses: 0, lastReviewed: 0 };
}

export function promote(p: CardProgress): CardProgress {
  return {
    box: Math.min(5, p.box + 1) as Box,
    reviews: p.reviews + 1,
    lapses: p.lapses,
    lastReviewed: Date.now(),
  };
}

export function demote(p: CardProgress): CardProgress {
  return {
    box: 1,
    reviews: p.reviews + 1,
    lapses: p.lapses + 1,
    lastReviewed: Date.now(),
  };
}

/**
 * Probabilidad relativa de aparecer en la próxima sesión: cajas bajas pesan más.
 * Pesos: box 1 → 5, box 2 → 4, ... box 5 → 1.
 */
export function weightForBox(box: Box): number {
  return 6 - box;
}

export function pickWeighted<T>(
  items: T[],
  weight: (t: T) => number,
  count: number,
): T[] {
  if (items.length <= count) return items.slice();
  const pool = items.slice();
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const total = pool.reduce((acc, it) => acc + weight(it), 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= weight(pool[i]);
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
