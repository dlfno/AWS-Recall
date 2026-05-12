#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const services = JSON.parse(
  readFileSync(resolve(root, "data/services.json"), "utf8"),
);
const categories = JSON.parse(
  readFileSync(resolve(root, "data/categories.json"), "utf8"),
);

const groups = new Map();
for (const s of services) {
  if (!groups.has(s.category)) groups.set(s.category, []);
  groups.get(s.category).push(s);
}

const lines = [
  "# Mapeo de service IDs → íconos oficiales",
  "",
  "Cada entrada indica el archivo que la app espera en `public/icons/` y el",
  "servicio AWS correspondiente. Búscalo dentro del paquete oficial extraído en",
  "`public/icons/aws-official/` (resolución recomendada: 64×64).",
  "",
  "Este archivo se regenera desde `data/services.json` ejecutando:",
  "",
  "```bash",
  "node scripts/gen-icon-map.mjs > public/icons/icon-map.md",
  "```",
  "",
  "---",
  "",
];

for (const cat of categories) {
  const items = groups.get(cat.id);
  if (!items?.length) continue;
  lines.push(`### ${cat.name} (${cat.id})`, "");
  for (const s of items) {
    lines.push(`- \`${s.id}.svg\` → ${s.name} (${s.acronym})`);
  }
  lines.push("");
}

process.stdout.write(lines.join("\n"));
