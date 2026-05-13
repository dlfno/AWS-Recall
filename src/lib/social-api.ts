import { api } from "./api";

export interface PublicUserDTO {
  id: number;
  fullName: string;
  nickname: string;
  photoUrl: string | null;
  isAdmin: boolean;
  createdAt: number;
  lastActiveAt: number;
}

export interface UserListEntry extends PublicUserDTO {
  streak: number;
}

export interface UserStatsDTO {
  flashcards: {
    cardsSeen: number;
    mastered: number;
    totalReviews: number;
    totalLapses: number;
    accuracy: number;
  };
  drilldown: {
    attempts: number;
    correct: number;
    accuracy: number;
    featuresMastered: number;
  };
  memorama: {
    played: number;
    bestMovesByPairs: Record<string, number>;
    bestTimeByPairs: Record<string, number>;
  };
  exams: {
    taken: number;
    passed: number;
    bestRate: number;
    lastTimestamp: number;
  };
}

export interface ProfileDTO {
  user: PublicUserDTO;
  stats: UserStatsDTO;
  streak: number;
  heatmap28: { day: string; count: number }[];
}

export interface CompareDTO {
  a: { user: PublicUserDTO; streak: number; stats: UserStatsDTO };
  b: { user: PublicUserDTO; streak: number; stats: UserStatsDTO };
}

export type LeaderboardMode = "flashcards" | "memorama" | "drilldown" | "exams";

export interface LeaderboardEntryDTO {
  user: PublicUserDTO;
  metric: number;
  secondary: number;
}

export type ActivityKind =
  | "card_mastered"
  | "exam_passed"
  | "exam_failed"
  | "memo_record"
  | "drilldown_milestone";

export interface FeedEvent {
  id: number;
  kind: ActivityKind;
  occurredAt: number;
  payload: unknown;
  user: {
    id: number;
    nickname: string;
    fullName: string;
    photoUrl: string | null;
  };
}

export const socialApi = {
  listUsers: () => api.get<{ users: UserListEntry[] }>("/api/users"),
  getProfile: (nickname: string) =>
    api.get<ProfileDTO>(`/api/users/${encodeURIComponent(nickname)}`),
  compare: (a: string, b: string) =>
    api.get<CompareDTO>(
      `/api/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
    ),
  leaderboard: (mode: LeaderboardMode) =>
    api.get<{ mode: LeaderboardMode; entries: LeaderboardEntryDTO[] }>(
      `/api/leaderboard?mode=${mode}`,
    ),
  feed: (limit = 50) =>
    api.get<{ events: FeedEvent[] }>(`/api/feed?limit=${limit}`),
};
