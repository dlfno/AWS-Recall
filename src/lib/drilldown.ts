import { SERVICES } from "./data";
import { shuffle } from "./shuffle";
import type { Service, ServiceFeature } from "./types";

export interface DrilldownOption {
  id: string;
  label: string;
  description: string;
  correct: boolean;
}

export interface DrilldownQuestion {
  id: string;
  parentId: string;
  parentName: string;
  featureId: string;
  featureName: string;
  prompt: string;
  options: DrilldownOption[];
  correctOptionId: string;
}

const TARGET_OPTIONS = 4;

type FeatureWithParent = ServiceFeature & { parentId: string };

export function parentsWithFeatures(): Service[] {
  return SERVICES.filter((s) => (s.features?.length ?? 0) >= 2);
}

function globalFeaturePool(): FeatureWithParent[] {
  const out: FeatureWithParent[] = [];
  for (const s of SERVICES) {
    for (const f of s.features ?? []) {
      out.push({ ...f, parentId: s.id });
    }
  }
  return out;
}

export function buildQuestions(parent: Service): DrilldownQuestion[] {
  const features = parent.features ?? [];
  if (features.length === 0) return [];

  const externalPool = globalFeaturePool().filter((f) => f.parentId !== parent.id);

  const questions = features.map<DrilldownQuestion>((f) => {
    const siblings = features.filter((s) => s.id !== f.id);
    const distractors: ServiceFeature[] = shuffle(siblings).slice(0, TARGET_OPTIONS - 1);

    if (distractors.length < TARGET_OPTIONS - 1) {
      for (const ext of shuffle(externalPool)) {
        if (distractors.length >= TARGET_OPTIONS - 1) break;
        if (!distractors.some((d) => d.id === ext.id)) distractors.push(ext);
      }
    }

    const options: DrilldownOption[] = shuffle([
      { id: f.id, label: f.name, description: f.shortDesc, correct: true },
      ...distractors.map((d) => ({
        id: d.id,
        label: d.name,
        description: d.shortDesc,
        correct: false,
      })),
    ]);

    return {
      id: `${parent.id}__${f.id}`,
      parentId: parent.id,
      parentName: parent.name,
      featureId: f.id,
      featureName: f.name,
      prompt: f.shortDesc,
      options,
      correctOptionId: f.id,
    };
  });

  return shuffle(questions);
}
