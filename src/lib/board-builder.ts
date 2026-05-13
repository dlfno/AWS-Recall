import type {
  MemoramaCard,
  MemoramaConfig,
  MemoramaPairType,
  Service,
} from "./types";
import { CATEGORIES, filterServices, getCategory } from "./data";
import { pickRandom, shuffle } from "./shuffle";

interface Sides {
  left: { kind: "text" | "icon"; value: string };
  right: { kind: "text" | "icon"; value: string };
}

function sidesFor(service: Service, pairType: MemoramaPairType): Sides | null {
  switch (pairType) {
    case "icon-name":
      return {
        left: { kind: "icon", value: service.icon },
        right: { kind: "text", value: service.name },
      };
    case "acronym-fullname":
      if (!service.acronym || service.acronym === service.fullName) return null;
      return {
        left: { kind: "text", value: service.acronym },
        right: { kind: "text", value: service.fullName },
      };
    case "service-category": {
      const cat = getCategory(service.category);
      if (!cat) return null;
      return {
        left: { kind: "text", value: service.name },
        right: { kind: "text", value: cat.name },
      };
    }
    case "service-usecase":
      return {
        left: { kind: "text", value: service.name },
        right: { kind: "text", value: service.useCase },
      };
  }
}

function servicesWithValidSides(
  candidates: Service[],
  pairType: MemoramaPairType,
): Service[] {
  return candidates.filter((s) => sidesFor(s, pairType) !== null);
}

function chooseServices(
  candidates: Service[],
  pairType: MemoramaPairType,
  n: number,
): Service[] {
  const valid = servicesWithValidSides(candidates, pairType);
  if (pairType === "service-category") {
    const byCategory = new Map<string, Service[]>();
    for (const s of valid) {
      const list = byCategory.get(s.category) ?? [];
      list.push(s);
      byCategory.set(s.category, list);
    }
    const oneEach: Service[] = [];
    for (const cat of CATEGORIES) {
      const list = byCategory.get(cat.id);
      if (list && list.length > 0) {
        oneEach.push(list[Math.floor(Math.random() * list.length)]);
      }
    }
    return pickRandom(oneEach, n);
  }
  return pickRandom(valid, n);
}

export interface BoardBuildResult {
  cards: MemoramaCard[];
  pairs: number;
  rows: number;
  cols: number;
}

const LAYOUTS: Record<number, { rows: number; cols: number }> = {
  6: { rows: 3, cols: 4 },
  8: { rows: 4, cols: 4 },
  12: { rows: 4, cols: 6 },
  18: { rows: 6, cols: 6 },
};

export function maxPairsAvailable(
  config: Pick<MemoramaConfig, "categories" | "tiers" | "pairType">,
): number {
  const valid = servicesWithValidSides(filterServices(config), config.pairType);
  if (config.pairType !== "service-category") return valid.length;
  const cats = new Set(valid.map((s) => s.category));
  return cats.size;
}

export function buildBoard(config: MemoramaConfig): BoardBuildResult {
  const services = filterServices(config);
  const chosen = chooseServices(services, config.pairType, config.pairs);
  const cards: MemoramaCard[] = [];
  for (const service of chosen) {
    const sides = sidesFor(service, config.pairType);
    if (!sides) continue;
    const pairId = `${service.id}__${config.pairType}`;
    cards.push({
      id: `${pairId}__L`,
      pairId,
      serviceId: service.id,
      side: "left",
      content: sides.left,
      flipped: false,
      matched: false,
    });
    cards.push({
      id: `${pairId}__R`,
      pairId,
      serviceId: service.id,
      side: "right",
      content: sides.right,
      flipped: false,
      matched: false,
    });
  }
  const layout = LAYOUTS[config.pairs];
  return {
    cards: shuffle(cards),
    pairs: cards.length / 2,
    rows: layout.rows,
    cols: layout.cols,
  };
}

export const ALL_PAIR_TYPES: MemoramaPairType[] = [
  "icon-name",
  "acronym-fullname",
  "service-category",
  "service-usecase",
];

export const PAIR_TYPE_LABELS: Record<MemoramaPairType, string> = {
  "icon-name": "Ícono ↔ Nombre",
  "acronym-fullname": "Acrónimo ↔ Nombre completo",
  "service-category": "Servicio ↔ Categoría",
  "service-usecase": "Servicio ↔ Caso de uso",
};

export const BOARD_SIZES: Array<6 | 8 | 12 | 18> = [6, 8, 12, 18];
