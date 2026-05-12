import type {
  Flashcard,
  FlashcardSessionConfig,
  FlashcardVariant,
  Service,
} from "./types";
import { filterServices, getService } from "./data";
import { shuffle } from "./shuffle";

function buildCard(service: Service, variant: FlashcardVariant): Flashcard | null {
  const id = `${service.id}__${variant}`;
  switch (variant) {
    case "acronym-to-fullname":
      if (!service.acronym || service.acronym === service.fullName) return null;
      return {
        id,
        serviceId: service.id,
        variant,
        front: { kind: "text", value: service.acronym, hint: "Acrónimo" },
        back: { kind: "text", value: service.fullName, hint: service.name },
      };
    case "service-to-description":
      return {
        id,
        serviceId: service.id,
        variant,
        front: { kind: "text", value: service.name, hint: "Servicio" },
        back: { kind: "text", value: service.shortDesc, hint: service.longDesc },
      };
    case "usecase-to-service":
      return {
        id,
        serviceId: service.id,
        variant,
        front: { kind: "text", value: service.useCase, hint: "Caso de uso" },
        back: { kind: "text", value: service.name, hint: service.shortDesc },
      };
    case "icon-to-name":
      return {
        id,
        serviceId: service.id,
        variant,
        front: { kind: "icon", value: service.icon, hint: service.acronym },
        back: { kind: "text", value: service.name, hint: service.shortDesc },
      };
    case "service-to-related": {
      const related = service.related
        .map((rid) => getService(rid)?.name)
        .filter((n): n is string => Boolean(n));
      if (related.length === 0) return null;
      return {
        id,
        serviceId: service.id,
        variant,
        front: { kind: "text", value: service.name, hint: "Servicios relacionados" },
        back: { kind: "text", value: related.join(", ") },
      };
    }
  }
}

export function buildDeck(config: FlashcardSessionConfig): Flashcard[] {
  const services = filterServices(config);
  const cards: Flashcard[] = [];
  for (const service of services) {
    for (const variant of config.variants) {
      const c = buildCard(service, variant);
      if (c) cards.push(c);
    }
  }
  return shuffle(cards);
}

export const ALL_VARIANTS: FlashcardVariant[] = [
  "acronym-to-fullname",
  "service-to-description",
  "usecase-to-service",
  "icon-to-name",
  "service-to-related",
];

export const VARIANT_LABELS: Record<FlashcardVariant, string> = {
  "acronym-to-fullname": "Acrónimo → Nombre completo",
  "service-to-description": "Servicio → Descripción",
  "usecase-to-service": "Caso de uso → Servicio",
  "icon-to-name": "Ícono → Nombre",
  "service-to-related": "Servicio → Relacionados",
};
