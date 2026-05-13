// Tipos espejo del frontend. Duplicados a propósito (no monorepo).
// Si cambian en src/lib/types.ts, sincronizar aquí.

export interface CardProgress {
  box: 1 | 2 | 3 | 4 | 5;
  reviews: number;
  lapses: number;
  lastReviewed: number;
}

export interface DrilldownFeatureProgress {
  attempts: number;
  correct: number;
  lastAttempt: number;
}

export interface MemoramaStats {
  played: number;
  bestMovesByPairs: Record<number, number>;
  bestTimeByPairs: Record<number, number>;
}

export interface ExamAttempt {
  timestamp: number;
  total: number;
  answered: number;
  correct: number;
  durationMs: number;
  passed: boolean;
  config: unknown;
}

export interface UserRow {
  id: number;
  full_name: string;
  nickname: string;
  password_hash: string;
  photo_path: string | null;
  is_admin: number;
  created_at: number;
  last_active_at: number;
}

export interface SessionRow {
  id: string;
  user_id: number;
  expires_at: number;
  last_active_at: number;
}

export interface InviteRow {
  code: string;
  created_by: number | null;
  used_by: number | null;
  used_at: number | null;
  created_at: number;
  expires_at: number | null;
}

export type ActivityKind =
  | "card_mastered"
  | "exam_passed"
  | "exam_failed"
  | "memo_record"
  | "drilldown_milestone";

export interface PublicUser {
  id: number;
  fullName: string;
  nickname: string;
  photoUrl: string | null;
  isAdmin: boolean;
  createdAt: number;
  lastActiveAt: number;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: UserRow;
    session?: SessionRow;
  }
}
