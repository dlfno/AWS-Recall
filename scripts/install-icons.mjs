#!/usr/bin/env node
// Copia los SVGs del paquete oficial extraído a public/icons/<id>.svg.
// Uso:
//   node scripts/install-icons.mjs [ruta-al-paquete]
//
// Si no se da ruta, intenta autodetectarla buscando:
//   1. public/Asset-Package_*
//   2. public/icons/aws-official
//
// Variables de entorno:
//   ICON_SIZE  resolución preferida (default 64)

import { readFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const services = JSON.parse(
  readFileSync(resolve(root, "data/services.json"), "utf8"),
);

const SIZE = process.env.ICON_SIZE ?? "64";
const destDir = resolve(root, "public/icons");

// Overrides explícitos para servicios cuyo SVG no se llama como el
// heurístico esperaría (p. ej. Glacier dentro de S3, Snow Family que en
// realidad es "Snowball-Edge", WorkSpaces que es "WorkSpaces-Family").
const OVERRIDES = {
  glacier: "Arch_Amazon-Simple-Storage-Service-Glacier",
  snowfamily: "Arch_AWS-Snowball-Edge",
  workspaces: "Arch_Amazon-WorkSpaces-Family",
  appstream: "Arch_Amazon-AppStream-2",
  outposts: "Arch_AWS-Outposts-family",
  fsxwindows: "Arch_Amazon-FSx-for-WFS",
};

function autodetectPackage() {
  const candidates = [
    ...readdirSync(resolve(root, "public"))
      .filter((n) => n.startsWith("Asset-Package_"))
      .map((n) => resolve(root, "public", n)),
    resolve(root, "public/icons/aws-official"),
  ];
  return candidates.find((p) => existsSync(p) && statSync(p).isDirectory());
}

const pkgPath = process.argv[2]
  ? resolve(process.argv[2])
  : autodetectPackage();

if (!pkgPath || !existsSync(pkgPath)) {
  console.error(`✗ No encontré el paquete oficial.`);
  console.error(`  Pásalo como argumento o ubícalo en public/Asset-Package_*`);
  process.exit(1);
}

console.log(`📦 Paquete: ${pkgPath}`);
console.log(`📁 Destino: ${destDir}`);
console.log(`📐 Tamaño:  ${SIZE}px\n`);

// --- Index: recorre el paquete una sola vez y arma un índice de SVGs ---
const svgIndex = new Map(); // basename (sin extensión) -> full path
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".svg")) {
      svgIndex.set(entry.name, full);
    }
  }
}
walk(pkgPath);
console.log(`🔎 Indexados ${svgIndex.size} archivos SVG en el paquete.\n`);

// --- Candidatos por servicio ---
const dashes = (s) => s.trim().replace(/\s+/g, "-");
const stripVendor = (s) => s.replace(/^(Amazon|AWS)\s+/, "");

function candidatesFor(service) {
  const out = [];
  const name = service.name;
  const stripped = stripVendor(name);
  const full = service.fullName;

  const variants = [
    name,
    `Amazon ${stripped}`,
    `AWS ${stripped}`,
    `Amazon ${full}`,
    `AWS ${full}`,
    full,
    stripped,
  ];

  for (const v of variants) {
    const d = dashes(v);
    out.push(`Arch_${d}_${SIZE}.svg`);
  }
  return [...new Set(out)];
}

// --- Instalar ---
mkdirSync(destDir, { recursive: true });

const installed = [];
const missing = [];

for (const service of services) {
  const candidates = OVERRIDES[service.id]
    ? [`${OVERRIDES[service.id]}_${SIZE}.svg`, ...candidatesFor(service)]
    : candidatesFor(service);
  let hit = null;
  let hitName = null;
  for (const c of candidates) {
    if (svgIndex.has(c)) {
      hit = svgIndex.get(c);
      hitName = c;
      break;
    }
  }
  if (hit) {
    copyFileSync(hit, join(destDir, `${service.id}.svg`));
    installed.push({ id: service.id, source: hitName });
  } else {
    missing.push({ id: service.id, name: service.name, candidates });
  }
}

console.log(`✓ Instalados ${installed.length}/${services.length} íconos.\n`);

if (missing.length > 0) {
  console.log(`⚠ Faltan ${missing.length}:`);
  for (const m of missing) {
    console.log(`  - ${m.id} (${m.name})`);
    console.log(`      probó: ${m.candidates.slice(0, 4).join(", ")}...`);
  }
  console.log(`\nPista: busca a mano con`);
  console.log(`  find "${pkgPath}" -iname "*<token>*_${SIZE}.svg"`);
  console.log(`y copia el archivo a public/icons/<id>.svg con el id exacto.`);
  process.exit(2);
}
