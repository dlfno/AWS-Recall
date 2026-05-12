import { filterServices, SERVICES } from "./data";
import { shuffle } from "./shuffle";
import type {
  ExamConfig,
  ExamFlashVariant,
  ExamOption,
  ExamQuestion,
  Service,
  ServiceFeature,
} from "./types";

const FLASH_VARIANTS: ExamFlashVariant[] = [
  "usecase-to-service",
  "service-to-description",
  "acronym-to-fullname",
  "icon-to-name",
];

export const PASS_THRESHOLD = 0.7;

const MIX_RATIOS: Record<ExamConfig["mix"], number> = {
  flashcards: 1,
  mixed: 0.7,
  drilldown: 0,
};

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function distractorServices(target: Service, pool: Service[], count: number): Service[] {
  const sameCat = pool.filter((s) => s.id !== target.id && s.category === target.category);
  const others = pool.filter((s) => s.id !== target.id && s.category !== target.category);
  const picked: Service[] = shuffle(sameCat).slice(0, count);
  if (picked.length < count) {
    for (const s of shuffle(others)) {
      if (picked.length >= count) break;
      picked.push(s);
    }
  }
  return picked;
}

function uniqueOptions(opts: ExamOption[]): ExamOption[] {
  const seen = new Set<string>();
  return opts.filter((o) => {
    const key = o.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildUseCaseQ(target: Service, pool: Service[], seq: number): ExamQuestion | null {
  const distractors = distractorServices(target, pool, 3);
  if (distractors.length < 3) return null;
  const options = uniqueOptions(
    shuffle<ExamOption>([
      { id: target.id, label: target.name, correct: true },
      ...distractors.map((d) => ({ id: d.id, label: d.name, correct: false })),
    ]),
  );
  if (options.length < 3 || !options.some((o) => o.correct)) return null;
  return {
    id: `flash-uc-${target.id}-${seq}`,
    kind: "flashcard",
    variant: "usecase-to-service",
    prompt: target.useCase,
    options,
    correctOptionId: target.id,
    serviceId: target.id,
    explanation: `${target.name} — ${target.shortDesc}`,
  };
}

function buildDescriptionQ(target: Service, pool: Service[], seq: number): ExamQuestion | null {
  const distractors = distractorServices(target, pool, 3);
  if (distractors.length < 3) return null;
  const options = uniqueOptions(
    shuffle<ExamOption>([
      { id: target.id, label: target.shortDesc, correct: true },
      ...distractors.map((d) => ({ id: d.id, label: d.shortDesc, correct: false })),
    ]),
  );
  if (options.length < 3 || !options.some((o) => o.correct)) return null;
  return {
    id: `flash-desc-${target.id}-${seq}`,
    kind: "flashcard",
    variant: "service-to-description",
    prompt: `¿Qué describe mejor a ${target.name}?`,
    options,
    correctOptionId: target.id,
    serviceId: target.id,
    explanation: `${target.name} — ${target.shortDesc}`,
  };
}

function buildAcronymQ(target: Service, pool: Service[], seq: number): ExamQuestion | null {
  if (target.acronym === target.fullName) return null;
  const candidates = pool.filter((s) => s.id !== target.id && s.acronym !== s.fullName);
  const distractors = distractorServices(target, candidates, 3);
  if (distractors.length < 3) return null;
  const options = uniqueOptions(
    shuffle<ExamOption>([
      { id: target.id, label: target.fullName, correct: true },
      ...distractors.map((d) => ({ id: d.id, label: d.fullName, correct: false })),
    ]),
  );
  if (options.length < 3 || !options.some((o) => o.correct)) return null;
  return {
    id: `flash-acr-${target.id}-${seq}`,
    kind: "flashcard",
    variant: "acronym-to-fullname",
    prompt: `¿Cuál es el nombre completo de ${target.acronym}?`,
    options,
    correctOptionId: target.id,
    serviceId: target.id,
    explanation: `${target.acronym} = ${target.fullName} (${target.name})`,
  };
}

function buildIconQ(target: Service, pool: Service[], seq: number): ExamQuestion | null {
  const distractors = distractorServices(target, pool, 3);
  if (distractors.length < 3) return null;
  const options = uniqueOptions(
    shuffle<ExamOption>([
      { id: target.id, label: target.name, correct: true },
      ...distractors.map((d) => ({ id: d.id, label: d.name, correct: false })),
    ]),
  );
  if (options.length < 3 || !options.some((o) => o.correct)) return null;
  return {
    id: `flash-icon-${target.id}-${seq}`,
    kind: "flashcard",
    variant: "icon-to-name",
    prompt: "Identifica el servicio por su ícono",
    iconServiceId: target.id,
    options,
    correctOptionId: target.id,
    serviceId: target.id,
    explanation: `${target.name} — ${target.shortDesc}`,
  };
}

function buildDrilldownQ(parents: Service[], seq: number): ExamQuestion | null {
  if (parents.length === 0) return null;
  const parent = pickOne(parents);
  const features = parent.features ?? [];
  if (features.length < 2) return null;
  const target = pickOne(features);
  const distractors: ServiceFeature[] = shuffle(
    features.filter((f) => f.id !== target.id),
  ).slice(0, 3);
  if (distractors.length < 3) {
    const externalPool = parents
      .filter((p) => p.id !== parent.id)
      .flatMap((p) => p.features ?? []);
    for (const f of shuffle(externalPool)) {
      if (distractors.length >= 3) break;
      if (!distractors.some((d) => d.id === f.id)) distractors.push(f);
    }
  }
  if (distractors.length < 3) return null;
  const options = uniqueOptions(
    shuffle<ExamOption>([
      { id: target.id, label: target.name, correct: true },
      ...distractors.map((d) => ({ id: d.id, label: d.name, correct: false })),
    ]),
  );
  if (options.length < 3 || !options.some((o) => o.correct)) return null;
  return {
    id: `drill-${parent.id}-${target.id}-${seq}`,
    kind: "drilldown",
    prompt: `${parent.name}: "${target.shortDesc}"`,
    options,
    correctOptionId: target.id,
    serviceId: parent.id,
    parentName: parent.name,
    featureName: target.name,
    explanation: `${parent.name} · ${target.name} — ${target.shortDesc}`,
  };
}

function buildFlashcardQ(
  services: Service[],
  variant: ExamFlashVariant,
  seq: number,
): ExamQuestion | null {
  const target = pickOne(services);
  switch (variant) {
    case "usecase-to-service":
      return buildUseCaseQ(target, services, seq);
    case "service-to-description":
      return buildDescriptionQ(target, services, seq);
    case "acronym-to-fullname":
      return buildAcronymQ(target, services, seq);
    case "icon-to-name":
      return buildIconQ(target, services, seq);
  }
}

export interface ExamBuildResult {
  questions: ExamQuestion[];
  totalSeconds: number;
}

export function buildExam(config: ExamConfig): ExamBuildResult {
  const services = filterServices(config);
  const parents = SERVICES.filter(
    (s) =>
      (s.features?.length ?? 0) >= 2 &&
      config.tiers.includes(s.tier) &&
      config.categories.includes(s.category),
  );

  let flashCount = Math.round(config.totalQuestions * MIX_RATIOS[config.mix]);
  let drillCount = config.totalQuestions - flashCount;

  if (drillCount > 0 && parents.length === 0) {
    flashCount = config.totalQuestions;
    drillCount = 0;
  }
  if (flashCount > 0 && services.length < 4) {
    flashCount = 0;
    drillCount = parents.length > 0 ? config.totalQuestions : 0;
  }

  const seen = new Set<string>();
  const questions: ExamQuestion[] = [];
  let seq = 0;
  const maxTries = config.totalQuestions * 10;
  let tries = 0;

  while (questions.length < flashCount && tries < maxTries) {
    tries += 1;
    const variant = pickOne(FLASH_VARIANTS);
    const q = buildFlashcardQ(services, variant, seq++);
    if (!q) continue;
    const key = `${q.kind}:${q.variant}:${q.serviceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(q);
  }

  while (questions.length < flashCount + drillCount && tries < maxTries) {
    tries += 1;
    const q = buildDrilldownQ(parents, seq++);
    if (!q) continue;
    const key = `${q.kind}:${q.serviceId}:${q.featureName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(q);
  }

  return {
    questions: shuffle(questions),
    totalSeconds: config.totalQuestions * config.secondsPerQuestion,
  };
}

export const EXAM_LENGTHS: Array<10 | 20 | 40> = [10, 20, 40];
export const EXAM_TIMES: Array<60 | 90 | 120> = [60, 90, 120];
export const EXAM_MIXES: Array<"flashcards" | "mixed" | "drilldown"> = [
  "flashcards",
  "mixed",
  "drilldown",
];
export const MIX_LABELS: Record<"flashcards" | "mixed" | "drilldown", string> = {
  flashcards: "Solo flashcards",
  mixed: "Mixto (70/30)",
  drilldown: "Solo drilldown",
};
