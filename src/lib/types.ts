export type CategoryId =
  | "compute"
  | "storage"
  | "database"
  | "networking"
  | "security"
  | "management"
  | "analytics"
  | "integration"
  | "containers"
  | "devtools"
  | "migration"
  | "cost"
  | "ml"
  | "iot"
  | "media"
  | "frontend"
  | "euc";

export type Tier = 1 | 2 | 3 | 4;

export interface ServiceFeature {
  id: string;
  name: string;
  shortDesc: string;
  useCase?: string;
  icon?: string;
}

export interface Service {
  id: string;
  name: string;
  acronym: string;
  fullName: string;
  category: CategoryId;
  tier: Tier;
  icon: string;
  shortDesc: string;
  longDesc: string;
  useCase: string;
  tags: string[];
  related: string[];
  difficulty: 1 | 2 | 3;
  features?: ServiceFeature[];
}

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  description: string;
}

export type FlashcardVariant =
  | "acronym-to-fullname"
  | "service-to-description"
  | "usecase-to-service"
  | "icon-to-name"
  | "service-to-related";

export interface Flashcard {
  id: string;
  serviceId: string;
  variant: FlashcardVariant;
  front: { kind: "text" | "icon"; value: string; hint?: string };
  back: { kind: "text"; value: string; hint?: string };
}

export type MemoramaPairType =
  | "icon-name"
  | "acronym-fullname"
  | "service-category"
  | "service-usecase";

export interface MemoramaCard {
  id: string;
  pairId: string;
  serviceId: string;
  side: "left" | "right";
  content: { kind: "text" | "icon"; value: string };
  flipped: boolean;
  matched: boolean;
}

export interface SessionFilters {
  categories: CategoryId[];
  tiers: Tier[];
}

export interface FlashcardSessionConfig extends SessionFilters {
  variants: FlashcardVariant[];
}

export interface MemoramaConfig extends SessionFilters {
  pairType: MemoramaPairType;
  pairs: 6 | 8 | 12 | 18;
  timer: boolean;
}

export type ExamLength = 10 | 20 | 40;
export type ExamSecondsPerQ = 60 | 90 | 120;
export type ExamMix = "flashcards" | "mixed" | "drilldown";

export interface ExamConfig extends SessionFilters {
  totalQuestions: ExamLength;
  secondsPerQuestion: ExamSecondsPerQ;
  mix: ExamMix;
}

export interface ExamOption {
  id: string;
  label: string;
  correct: boolean;
}

export type ExamQuestionKind = "flashcard" | "drilldown";
export type ExamFlashVariant =
  | "usecase-to-service"
  | "service-to-description"
  | "acronym-to-fullname"
  | "icon-to-name";

export interface ExamQuestion {
  id: string;
  kind: ExamQuestionKind;
  variant?: ExamFlashVariant;
  prompt: string;
  iconServiceId?: string;
  options: ExamOption[];
  correctOptionId: string;
  explanation: string;
  serviceId?: string;
  parentName?: string;
  featureName?: string;
}

export interface ExamAttempt {
  timestamp: number;
  total: number;
  answered: number;
  correct: number;
  durationMs: number;
  passed: boolean;
  config: ExamConfig;
}
