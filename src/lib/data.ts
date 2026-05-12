import servicesData from "../../data/services.json";
import categoriesData from "../../data/categories.json";
import type { Category, Service, SessionFilters } from "./types";

export const SERVICES = servicesData as Service[];
export const CATEGORIES = categoriesData as Category[];

const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));
const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getService(id: string): Service | undefined {
  return SERVICE_BY_ID.get(id);
}

export function getCategory(id: string): Category | undefined {
  return CATEGORY_BY_ID.get(id as Category["id"]);
}

export function filterServices(filters: SessionFilters): Service[] {
  const cats = new Set(filters.categories);
  const tiers = new Set(filters.tiers);
  return SERVICES.filter((s) => cats.has(s.category) && tiers.has(s.tier));
}

export function availableTiers(): number[] {
  return Array.from(new Set(SERVICES.map((s) => s.tier))).sort();
}

export function availableCategoryIds(): string[] {
  return Array.from(new Set(SERVICES.map((s) => s.category)));
}
