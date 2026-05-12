// Sample subset of AWS services + categories for the prototype.
// Mirrors the schema of AWS-Practice/data/services.json but trimmed.

const CATEGORIES = [
  { id: "compute",     name: "Cómputo",          short: "CMP" },
  { id: "storage",     name: "Almacenamiento",   short: "STO" },
  { id: "database",    name: "Bases de datos",   short: "DB"  },
  { id: "networking",  name: "Redes / CDN",      short: "NET" },
  { id: "security",    name: "Seguridad / IAM",  short: "SEC" },
  { id: "management",  name: "Monitoreo / Admin",short: "MGT" },
  { id: "analytics",   name: "Análisis",         short: "ANL" },
  { id: "integration", name: "Integración",      short: "INT" },
  { id: "containers",  name: "Contenedores",     short: "CTR" },
  { id: "ml",          name: "Machine Learning", short: "ML"  },
];

const SERVICES = [
  // ── COMPUTE ───────────────────────────────────────────────────────
  { id:"ec2",    name:"Amazon EC2",     acronym:"EC2",    full:"Elastic Compute Cloud",
    cat:"compute", tier:1, short:"Máquinas virtuales bajo demanda.",
    use:"Hospedar apps tradicionales, lift-and-shift, workloads con SO específico." },
  { id:"lambda", name:"AWS Lambda",     acronym:"Lambda", full:"Lambda",
    cat:"compute", tier:1, short:"Funciones serverless event-driven.",
    use:"Backends ligeros, glue code entre servicios, procesamiento de eventos.",
    features:[
      { id:"l-fn",    name:"Functions", desc:"Unidad serverless con runtimes managed (Node, Python, Java, Go)" },
      { id:"l-layer", name:"Layers",    desc:"Paquetes de dependencias compartidos entre funciones" },
      { id:"l-edge",  name:"Lambda@Edge", desc:"Ejecución en PoPs de CloudFront cerca del usuario" },
      { id:"l-snap",  name:"SnapStart", desc:"Snapshot del runtime ya inicializado para reducir cold starts" },
    ] },
  { id:"fargate",name:"AWS Fargate",    acronym:"Fargate",full:"Fargate",
    cat:"compute", tier:1, short:"Contenedores serverless (ECS / EKS).",
    use:"Correr contenedores sin gestionar EC2." },

  // ── CONTAINERS ────────────────────────────────────────────────────
  { id:"ecs", name:"Amazon ECS", acronym:"ECS", full:"Elastic Container Service",
    cat:"containers", tier:1, short:"Orquestador de contenedores propio de AWS.",
    use:"Microservicios en Docker con integración nativa AWS." },
  { id:"eks", name:"Amazon EKS", acronym:"EKS", full:"Elastic Kubernetes Service",
    cat:"containers", tier:1, short:"Kubernetes managed.",
    use:"Workloads K8s portables, multi-cloud." },

  // ── STORAGE ───────────────────────────────────────────────────────
  { id:"s3",      name:"Amazon S3",        acronym:"S3",      full:"Simple Storage Service",
    cat:"storage", tier:1, short:"Almacenamiento de objetos infinitamente escalable.",
    use:"Data lakes, backups, hosting estático, distribución de assets.",
    features:[
      { id:"s3-std",     name:"Standard",         desc:"Acceso frecuente, 11 nueves de durabilidad" },
      { id:"s3-ia",      name:"Standard-IA",      desc:"Acceso infrecuente, mismo rendimiento que Standard" },
      { id:"s3-intel",   name:"Intelligent-Tiering", desc:"Mueve objetos entre tiers según acceso" },
      { id:"s3-glacier", name:"Glacier",          desc:"Archivado a largo plazo, costo mínimo" },
    ] },
  { id:"ebs",     name:"Amazon EBS",       acronym:"EBS",     full:"Elastic Block Store",
    cat:"storage", tier:1, short:"Volúmenes de bloques para EC2.",
    use:"Discos persistentes para bases de datos y VMs." },
  { id:"efs",     name:"Amazon EFS",       acronym:"EFS",     full:"Elastic File System",
    cat:"storage", tier:1, short:"NFS managed multi-AZ.",
    use:"Compartir archivos entre múltiples instancias EC2." },
  { id:"glacier", name:"S3 Glacier",       acronym:"Glacier", full:"S3 Glacier",
    cat:"storage", tier:2, short:"Archivado a largo plazo de bajo costo.",
    use:"Cumplimiento normativo, backups que casi nunca se recuperan." },

  // ── DATABASE ──────────────────────────────────────────────────────
  { id:"rds",       name:"Amazon RDS",       acronym:"RDS",     full:"Relational Database Service",
    cat:"database", tier:1, short:"Bases de datos relacionales managed.",
    use:"Postgres, MySQL, MariaDB, Oracle, SQL Server sin gestionar el SO." },
  { id:"aurora",    name:"Amazon Aurora",    acronym:"Aurora",  full:"Aurora",
    cat:"database", tier:1, short:"MySQL/Postgres compatible, 5× más rápido.",
    use:"Apps SaaS exigentes, multi-región, serverless v2." },
  { id:"dynamodb",  name:"Amazon DynamoDB",  acronym:"DDB",     full:"DynamoDB",
    cat:"database", tier:1, short:"NoSQL key-value de baja latencia.",
    use:"Carritos, sesiones, leaderboards, IoT high-throughput.",
    features:[
      { id:"ddb-table",   name:"Tables",    desc:"Tablas key-value/document con throughput on-demand o provisioned" },
      { id:"ddb-streams", name:"Streams",   desc:"Captura de cambios en orden, integra con Lambda" },
      { id:"ddb-gsi",     name:"GSI",       desc:"Índices secundarios globales con su propio throughput" },
      { id:"ddb-dax",     name:"DAX",       desc:"Caché in-memory compatible con la API de DynamoDB" },
    ] },
  { id:"elasticache", name:"ElastiCache",    acronym:"EC",      full:"ElastiCache",
    cat:"database", tier:2, short:"Redis / Memcached managed.",
    use:"Cachés in-memory, leaderboards, sesiones." },

  // ── NETWORKING ────────────────────────────────────────────────────
  { id:"vpc",        name:"Amazon VPC",        acronym:"VPC",  full:"Virtual Private Cloud",
    cat:"networking", tier:1, short:"Red privada lógica en AWS.",
    use:"Aislar workloads, definir subnets públicas/privadas, routing." },
  { id:"cloudfront", name:"Amazon CloudFront", acronym:"CF",   full:"CloudFront",
    cat:"networking", tier:1, short:"CDN global con 600+ PoPs.",
    use:"Distribuir contenido estático y dinámico con baja latencia." },
  { id:"route53",    name:"Amazon Route 53",   acronym:"R53",  full:"Route 53",
    cat:"networking", tier:1, short:"DNS managed con routing inteligente.",
    use:"Failover, geolocalización, latencia, health checks." },
  { id:"elb",        name:"Elastic Load Balancing", acronym:"ELB", full:"Elastic Load Balancing",
    cat:"networking", tier:1, short:"Balanceadores L4/L7 managed.",
    use:"Distribuir tráfico entre instancias / contenedores." },
  { id:"apigateway", name:"API Gateway",       acronym:"APIGW",full:"API Gateway",
    cat:"networking", tier:2, short:"Front-door para APIs REST / HTTP / WebSocket.",
    use:"Exponer Lambdas como API, throttling, auth con Cognito." },

  // ── SECURITY ──────────────────────────────────────────────────────
  { id:"iam",       name:"AWS IAM",       acronym:"IAM", full:"Identity and Access Management",
    cat:"security", tier:1, short:"Identidades, roles y políticas.",
    use:"Definir quién puede hacer qué sobre qué recurso." },
  { id:"kms",       name:"AWS KMS",       acronym:"KMS", full:"Key Management Service",
    cat:"security", tier:1, short:"Llaves criptográficas managed.",
    use:"Cifrar S3, EBS, RDS; firmar y verificar." },
  { id:"secretsmanager", name:"Secrets Manager", acronym:"SM", full:"Secrets Manager",
    cat:"security", tier:2, short:"Almacén de secretos con rotación.",
    use:"Credenciales de bases de datos, API keys, tokens." },
  { id:"cognito",   name:"Amazon Cognito",acronym:"Cog", full:"Cognito",
    cat:"security", tier:2, short:"Identidad para apps móviles/web.",
    use:"User pools, identity pools, social login, MFA." },

  // ── MANAGEMENT ────────────────────────────────────────────────────
  { id:"cloudwatch",     name:"Amazon CloudWatch", acronym:"CW",  full:"CloudWatch",
    cat:"management", tier:1, short:"Métricas, logs y alarmas.",
    use:"Observabilidad de toda la stack AWS." },
  { id:"cloudtrail",     name:"AWS CloudTrail",    acronym:"CT",  full:"CloudTrail",
    cat:"management", tier:1, short:"Audit log de llamadas API.",
    use:"Compliance, forensia, detección de cambios." },
  { id:"cloudformation", name:"CloudFormation",    acronym:"CFN", full:"CloudFormation",
    cat:"management", tier:1, short:"Infraestructura como código (YAML/JSON).",
    use:"Provisioning declarativo de stacks AWS." },

  // ── INTEGRATION ───────────────────────────────────────────────────
  { id:"sns",          name:"Amazon SNS",          acronym:"SNS",  full:"Simple Notification Service",
    cat:"integration", tier:1, short:"Pub/sub managed.",
    use:"Fan-out a SQS, email, SMS, push." },
  { id:"sqs",          name:"Amazon SQS",          acronym:"SQS",  full:"Simple Queue Service",
    cat:"integration", tier:1, short:"Colas de mensajes durables.",
    use:"Desacoplar productores y consumidores, retries." },
  { id:"eventbridge",  name:"EventBridge",         acronym:"EB",   full:"EventBridge",
    cat:"integration", tier:2, short:"Bus de eventos serverless.",
    use:"Routing por reglas, schemas, SaaS partners." },
  { id:"stepfunctions",name:"Step Functions",      acronym:"SFN",  full:"Step Functions",
    cat:"integration", tier:2, short:"Orquestador de workflows.",
    use:"Sagas, ETL, máquinas de estado con manejo de errores." },

  // ── ANALYTICS ─────────────────────────────────────────────────────
  { id:"athena",   name:"Amazon Athena",   acronym:"Athena", full:"Athena",
    cat:"analytics", tier:2, short:"Queries SQL sobre S3.",
    use:"Análisis ad-hoc sin cargar datos a un warehouse." },
  { id:"redshift", name:"Amazon Redshift", acronym:"RS",     full:"Redshift",
    cat:"analytics", tier:2, short:"Data warehouse columnar a escala PB.",
    use:"BI corporativo, dashboards sobre grandes volúmenes." },
  { id:"glue",     name:"AWS Glue",        acronym:"Glue",   full:"Glue",
    cat:"analytics", tier:2, short:"ETL serverless + catálogo.",
    use:"Transformar datos para Athena/Redshift, crawlers." },
  { id:"kinesis",  name:"Amazon Kinesis",  acronym:"KDS",    full:"Kinesis Data Streams",
    cat:"analytics", tier:2, short:"Streaming de datos en tiempo real.",
    use:"Click-streams, IoT, métricas de aplicación." },

  // ── ML ────────────────────────────────────────────────────────────
  { id:"sagemaker",name:"Amazon SageMaker",acronym:"SM",  full:"SageMaker",
    cat:"ml", tier:2, short:"Plataforma end-to-end de ML.",
    use:"Notebooks, training distribuido, deploy de modelos." },
  { id:"bedrock",  name:"Amazon Bedrock",  acronym:"BR",  full:"Bedrock",
    cat:"ml", tier:2, short:"Foundation models managed (Claude, Llama, Titan).",
    use:"GenAI sin gestionar infra, RAG, agentes." },
];

// ── Fake progress, just for the prototype ──────────────────────────
// Box 1 = recién aprendiendo, 5 = dominado. lapses = veces fallado.
const PROGRESS = {
  ec2:        { box:5, reviews:18, lapses:1, last: now(-2*3600e3) },
  lambda:     { box:4, reviews:22, lapses:3, last: now(-6*3600e3) },
  s3:         { box:5, reviews:25, lapses:0, last: now(-1*3600e3) },
  rds:        { box:3, reviews:9,  lapses:4, last: now(-30*3600e3) },
  dynamodb:   { box:2, reviews:7,  lapses:5, last: now(-50*3600e3) },
  vpc:        { box:3, reviews:11, lapses:3, last: now(-22*3600e3) },
  cloudfront: { box:4, reviews:14, lapses:2, last: now(-12*3600e3) },
  route53:    { box:3, reviews:8,  lapses:2, last: now(-40*3600e3) },
  iam:        { box:5, reviews:20, lapses:1, last: now(-3*3600e3) },
  kms:        { box:2, reviews:6,  lapses:4, last: now(-60*3600e3) },
  cloudwatch: { box:4, reviews:12, lapses:2, last: now(-18*3600e3) },
  sns:        { box:3, reviews:7,  lapses:2, last: now(-26*3600e3) },
  sqs:        { box:4, reviews:10, lapses:1, last: now(-15*3600e3) },
  eventbridge:{ box:1, reviews:4,  lapses:6, last: now(-80*3600e3) },
  ecs:        { box:3, reviews:9,  lapses:3, last: now(-28*3600e3) },
  eks:        { box:2, reviews:6,  lapses:4, last: now(-55*3600e3) },
  fargate:    { box:3, reviews:8,  lapses:2, last: now(-32*3600e3) },
  apigateway: { box:2, reviews:5,  lapses:5, last: now(-70*3600e3) },
  aurora:     { box:3, reviews:7,  lapses:3, last: now(-35*3600e3) },
  redshift:   { box:1, reviews:3,  lapses:7, last: now(-90*3600e3) },
  glacier:    { box:2, reviews:4,  lapses:3, last: now(-65*3600e3) },
  ebs:        { box:4, reviews:11, lapses:2, last: now(-20*3600e3) },
  elb:        { box:4, reviews:13, lapses:2, last: now(-16*3600e3) },
  cloudformation:{ box:2, reviews:5, lapses:4, last: now(-58*3600e3) },
  cloudtrail: { box:3, reviews:7,  lapses:2, last: now(-38*3600e3) },
  sagemaker:  { box:1, reviews:2,  lapses:5, last: now(-100*3600e3) },
  bedrock:    { box:2, reviews:4,  lapses:3, last: now(-72*3600e3) },
  stepfunctions:{ box:2, reviews:5, lapses:4, last: now(-62*3600e3) },
  secretsmanager:{ box:3, reviews:6,lapses:2, last: now(-42*3600e3) },
  efs:        { box:3, reviews:7,  lapses:2, last: now(-44*3600e3) },
  elasticache:{ box:2, reviews:4,  lapses:3, last: now(-68*3600e3) },
  cognito:    { box:1, reviews:3,  lapses:6, last: now(-95*3600e3) },
  athena:     { box:2, reviews:4,  lapses:3, last: now(-66*3600e3) },
  glue:       { box:1, reviews:2,  lapses:5, last: now(-110*3600e3) },
  kinesis:    { box:2, reviews:5,  lapses:4, last: now(-78*3600e3) },
};

function now(offset = 0) { return Date.now() + offset; }

// Sessions per day, last 28 days, for the heatmap / streak.
const SESSION_HISTORY = (() => {
  const out = [];
  const seed = [2,4,0,5,3,1,0,6,3,2,4,5,0,3,2,1,4,3,0,2,5,4,3,0,6,2,4,3];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    out.push({ date: d, count: seed[27 - i] });
  }
  return out;
})();

const STREAK = 11;

Object.assign(window, { CATEGORIES, SERVICES, PROGRESS, SESSION_HISTORY, STREAK });
