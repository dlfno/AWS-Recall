# Recall · AWS Study Cards

App web para estudiar los servicios de AWS con cuatro modos de juego,
catálogo curado de 181 servicios y progreso persistido en el navegador.

- **Flashcards** — Repetición espaciada Leitner de 5 cajas, 5 variantes
  de tarjeta (acrónimo↔nombre, servicio→descripción, caso de uso→servicio,
  ícono→nombre, servicio→relacionados).
- **Memorama** — Tableros 6/8/12/18 pares con 4 tipos de par (ícono↔nombre,
  acrónimo↔nombre completo, servicio↔caso de uso, servicio↔categoría).
  Cronómetro opcional y récords por tamaño.
- **Drilldown** — Discriminación de features dentro de un servicio padre.
  Opción múltiple con distractores hermanos (26 padres, 105 features).
- **Examen** — Simulación contra reloj que mezcla flashcards-MC y
  drilldown-MC. 10/20/40 preguntas, 60-90-120 s c/u, umbral 70%.

Más un **Dashboard de progreso** (`/stats`) con stats por modo, distribución
Leitner, ranking de servicios y features para repasar, dominio por categoría
y por servicio padre, e historial de exámenes.

Todo local-first en `localStorage`, sin backend.

## Estado del catálogo

| | |
|---|---|
| Servicios | **181** |
| Categorías | **17** (compute, storage, database, networking, security, management, analytics, integration, containers, devtools, migration, cost, ml, iot, media, frontend, euc) |
| Tier 1 — Core | 29 servicios |
| Tier 2 — Operación/Arquitectura | 35 servicios |
| Tier 3 — Especializados | 20 servicios |
| Tier 4 — Extendido | 97 servicios |
| Drilldown — padres con features | **26** (Bedrock, SageMaker, S3, CloudWatch, Kinesis, Step Functions, GuardDuty, IAM Identity Center, Lambda, DynamoDB, VPC, Glue, EventBridge, Amplify, CodeGuru, Q, Cognito, API Gateway, Route 53, IAM, KMS, CloudFront, Athena, ECS, Aurora, Redshift) |
| Drilldown — features totales | **105** |
| Íconos oficiales versionados | **181** (release 07/31/2025) |

## Stack

- **Vite + React 18 + TypeScript** con `tsc -b` estricto
- **React Router 6** (BrowserRouter)
- **Sin librerías de UI** — sistema visual propio en `src/styles.css`
  (paleta cream paper + ink navy + acento coral, tipografía DM Sans / DM Mono,
  soporte `data-theme` light/dark y `data-pair` para 3 pares tipográficos)
- Estado en memoria + persistencia en `localStorage`

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producción a dist/
npm run typecheck  # tsc -b --noEmit
```

## Estructura

```
/data
  services.json          ← 181 servicios (Tier 1-4) + features para Drilldown
  categories.json        ← 17 categorías con color oficial AWS

/src
  /lib
    types.ts             ← Service, ServiceFeature, Tier, ExamConfig, etc.
    data.ts              ← getters, filterServices
    deck-builder.ts      ← mazos de flashcards
    board-builder.ts     ← tableros de memorama
    drilldown.ts         ← generador MC para Drilldown
    exam.ts              ← generador MC mixto para Examen
    spaced-rep.ts        ← Leitner 5 cajas + muestreo ponderado
    progress-store.ts    ← wrapper de localStorage (5 namespaces)
    stats.ts             ← agregaciones para dashboard, streak, heat strip
    shuffle.ts
  /components
    AppShell.tsx         ← Topbar (brand + streak) + FooterRule
    FiltersControl.tsx   ← chips de tier + categoría con contador
    ServiceIcon.tsx      ← <img> con fallback a placeholder
  /views
    Home.tsx             ← hero + continue-bar + 4 mode tiles + dash row
    FlashcardSetup.tsx, FlashcardSession.tsx
    MemoramaSetup.tsx,   MemoramaBoard.tsx
    DrilldownSetup.tsx,  DrilldownSession.tsx
    ExamSetup.tsx,       ExamSession.tsx
    StatsDashboard.tsx
  App.tsx                ← rutas
  main.tsx               ← setea data-theme/data-pair en <html>
  styles.css             ← sistema visual completo

/public
  /icons                 ← 181 SVGs oficiales + icon-map.md + README.md
  /Asset-Package_07312025.../  ← paquete oficial extraído (fuente del instalador)

/scripts
  gen-icon-map.mjs       ← regenera public/icons/icon-map.md desde services.json
  install-icons.mjs      ← copia los SVGs del paquete oficial a public/icons/<id>.svg
```

## Modos de juego — detalles

### Flashcards
- Filtros tier + categoría, selector de variantes (5 tipos).
- Sesiones de 20 cartas; las cajas bajas pesan más al muestrear.
- Aciertas → promueve a la siguiente caja (máx. 5). Fallas → vuelve a la caja 1.
- Atajos: `Space` voltea, `J/1` para "Repasar", `K/2` para "Sé".
- Persistencia: caja, reviews, lapses, lastReviewed por carta.

### Memorama
- Filtros + tipo de par + tamaño. El botón Iniciar se deshabilita si no
  hay pares suficientes para el tamaño elegido.
- Cronómetro y movimientos en HUD; récords por tamaño en `localStorage`.
- Al terminar: lista de servicios vistos en la partida.

### Drilldown
- Setup lista padres con ≥2 features agrupados por categoría.
- Sesión: header del padre (ícono + descripción), prompt con la
  descripción de la feature en cita, 4 opciones A/B/C/D con feedback
  inmediato (verde/rojo + animación `matchPop`/`shake`).
- Distractores: features hermanas; fallback a otros padres si <3.
- Persistencia: intentos/aciertos por feature.

### Examen
- 10/20/40 preguntas, 60/90/120 s c/u, mix `flashcards | mixed (70/30) | drilldown`.
- 4 variantes de pregunta tipo flashcard (caso de uso → servicio,
  servicio → descripción, acrónimo → nombre completo, ícono → servicio)
  más drilldown-MC.
- Distractores prefieren misma categoría que el target.
- Sesión: timer regresivo prominente (warn <60 s, danger <15 s pulsante),
  q-dots navegables, terminar/entregar/auto-cierre al expirar.
- Resultado pass/fail (umbral 70%), revisión por pregunta con explicación.
- Historial persistido (hasta 50 intentos).

### Stats Dashboard
- Hero con eyebrow + h-display.
- Por modo: stat-cards (incluye una en `is-accent`), distribución Leitner
  con barras de color por caja, top servicios/features para repasar,
  dominio por categoría/padre con barra de color, historial de exámenes
  con pass/fail.
- Reset granular con `confirm()` por sección.

## Íconos oficiales de AWS

Los 181 SVGs (resolución 64×64, release 07/31/2025) están versionados en
`public/icons/<id>.svg`. El paquete oficial completo extraído vive en
`public/Asset-Package_07312025.../`, que sirve de fuente al instalador.

Para regenerar todos los íconos —por ejemplo si AWS publica un release
nuevo o agregas servicios al JSON— corre:

```bash
node scripts/install-icons.mjs
```

El script indexa el paquete, prueba varios patrones de nombre por
servicio (`Arch_<Name>_64.svg`, con/sin prefijo Amazon/AWS, fullName,
acrónimo) y aplica 6 OVERRIDES para los nombres irregulares: Glacier,
Snow Family, WorkSpaces, AppStream, Outposts y FSx for Windows. Cobertura
actual: 181/181.

Detalles, mapeo de IDs → nombres oficiales y notas de licencia en
[`public/icons/README.md`](./public/icons/README.md) y
[`public/icons/icon-map.md`](./public/icons/icon-map.md). Si algún archivo
falta, `ServiceIcon` cae a un placeholder con acrónimo y color de categoría.

> Los íconos y nombres de servicios son trademarks de Amazon.com, Inc.
> Su uso aquí es nominativo, conforme a las
> [trademark guidelines](https://aws.amazon.com/trademark-guidelines/)
> de AWS. Ver [`NOTICE`](./NOTICE).

## Sistema visual

La app aplica el rediseño "Recall" subido en `Rediseño app Web/`:

- **Paleta**: cream paper (`#FBF7F0`) + ink navy (`#2D2A3A`) + acento
  coral (`#FF8B6B`). Semánticos para good/bad/warn/info. Blobs pasteles
  como atmósfera de fondo.
- **Geometría**: pills (`--r-pill`) y cards redondeadas (`--r-md/lg/xl`).
  Shadows multicapa, transiciones bouncy.
- **Tipografía**: DM Sans (display + body) y DM Mono. Soporta toggle a
  Plus Jakarta Sans + JetBrains Mono o Quicksand + Space Mono cambiando
  `data-pair` en `<html>`.
- **Tema**: `data-theme="light"` por default; `data-theme="dark"` definido
  pero sin toggle de UI por ahora.
- **Shell**: Topbar sticky con brand "R · recall · aws", pill 🔥 con la
  racha (días consecutivos con actividad) y "← Inicio" contextual.
  FooterRule al pie.

Los archivos originales del rediseño (canvas HTML, JSX prototipo,
screenshots, tweaks-panel) viven en `Rediseño app Web/` como referencia.

## Agregar servicios o features

Edita `data/services.json`. Cada servicio sigue el esquema definido en
`src/lib/types.ts` (`Service` para entradas top-level, `ServiceFeature`
para items en `features?: []`). Los tiers o categorías nuevos no requieren
cambios de código, solo aparecen en los selectores.

Tras editar:

```bash
node scripts/install-icons.mjs                          # íconos nuevos
node scripts/gen-icon-map.mjs > public/icons/icon-map.md  # mapa reproducible
```

## Persistencia (localStorage)

Todos los namespaces bajo `aws-study-cards:v1:*`:

| Key | Contenido |
|---|---|
| `flashcard-progress` | `{[cardId]: {box, reviews, lapses, lastReviewed}}` |
| `flashcard-config` | última configuración del setup |
| `memorama-config` | última configuración del setup |
| `memorama-stats` | `{played, bestMovesByPairs, bestTimeByPairs}` |
| `drilldown-progress` | `{[featureId]: {attempts, correct, lastAttempt}}` |
| `exam-config` | última configuración del setup |
| `exam-attempts` | array (cap 50) de `ExamAttempt` |
| `filters` | últimos filtros tier/categoría compartidos |

Reset granular por modo desde `/stats`.

## Licencia y atribución

Ver el archivo [`NOTICE`](./NOTICE). Este proyecto no está afiliado ni
patrocinado por Amazon Web Services; los nombres de servicios e íconos
son trademarks de Amazon.com, Inc.
