# Mapeo de service IDs → íconos oficiales

Cada entrada indica el archivo que la app espera en `public/icons/` y el
servicio AWS correspondiente. Búscalo dentro del paquete oficial extraído en
`public/icons/aws-official/` (resolución recomendada: 64×64).

Este archivo se regenera desde `data/services.json` ejecutando:

```bash
node scripts/gen-icon-map.mjs > public/icons/icon-map.md
```

---

### Cómputo (compute)

- `ec2.svg` → Amazon EC2 (EC2)
- `lambda.svg` → AWS Lambda (Lambda)
- `beanstalk.svg` → AWS Elastic Beanstalk (EB)
- `lightsail.svg` → Amazon Lightsail (Lightsail)
- `batch.svg` → AWS Batch (Batch)

### Almacenamiento (storage)

- `s3.svg` → Amazon S3 (S3)
- `ebs.svg` → Amazon EBS (EBS)
- `efs.svg` → Amazon EFS (EFS)
- `glacier.svg` → Amazon S3 Glacier (Glacier)
- `storagegateway.svg` → AWS Storage Gateway (SGW)
- `backup.svg` → AWS Backup (Backup)

### Bases de datos (database)

- `rds.svg` → Amazon RDS (RDS)
- `aurora.svg` → Amazon Aurora (Aurora)
- `dynamodb.svg` → Amazon DynamoDB (DDB)
- `elasticache.svg` → Amazon ElastiCache (EC)
- `redshift.svg` → Amazon Redshift (Redshift)

### Redes y entrega de contenido (networking)

- `vpc.svg` → Amazon VPC (VPC)
- `route53.svg` → Amazon Route 53 (R53)
- `cloudfront.svg` → Amazon CloudFront (CF)
- `apigateway.svg` → Amazon API Gateway (APIGW)
- `elb.svg` → Elastic Load Balancing (ELB)
- `directconnect.svg` → AWS Direct Connect (DX)

### Seguridad, identidad y cumplimiento (security)

- `iam.svg` → AWS IAM (IAM)
- `cognito.svg` → Amazon Cognito (Cognito)
- `kms.svg` → AWS KMS (KMS)
- `secretsmanager.svg` → AWS Secrets Manager (SM)
- `waf.svg` → AWS WAF (WAF)
- `shield.svg` → AWS Shield (Shield)
- `acm.svg` → AWS Certificate Manager (ACM)

### Monitoreo y administración (management)

- `cloudwatch.svg` → Amazon CloudWatch (CW)
- `cloudtrail.svg` → AWS CloudTrail (CT)
- `config.svg` → AWS Config (Config)
- `cloudformation.svg` → AWS CloudFormation (CFN)
- `ssm.svg` → AWS Systems Manager (SSM)
- `organizations.svg` → AWS Organizations (Orgs)
- `trustedadvisor.svg` → AWS Trusted Advisor (TA)

### Análisis (analytics)

- `athena.svg` → Amazon Athena (Athena)
- `glue.svg` → AWS Glue (Glue)
- `emr.svg` → Amazon EMR (EMR)
- `kinesis.svg` → Amazon Kinesis (Kinesis)
- `quicksight.svg` → Amazon QuickSight (QS)
- `opensearch.svg` → Amazon OpenSearch Service (OS)
- `lakeformation.svg` → AWS Lake Formation (LF)

### Integración de aplicaciones (integration)

- `sqs.svg` → Amazon SQS (SQS)
- `sns.svg` → Amazon SNS (SNS)
- `eventbridge.svg` → Amazon EventBridge (EB)
- `stepfunctions.svg` → AWS Step Functions (SFN)

### Contenedores (containers)

- `ecs.svg` → Amazon ECS (ECS)
- `eks.svg` → Amazon EKS (EKS)
- `ecr.svg` → Amazon ECR (ECR)
- `fargate.svg` → AWS Fargate (Fargate)
- `apprunner.svg` → AWS App Runner (AR)

### Herramientas de desarrollador (devtools)

- `codecommit.svg` → AWS CodeCommit (CC)
- `codebuild.svg` → AWS CodeBuild (CB)
- `codedeploy.svg` → AWS CodeDeploy (CD)
- `codepipeline.svg` → AWS CodePipeline (CP)
- `xray.svg` → AWS X-Ray (X-Ray)

### Migración y transferencia (migration)

- `dms.svg` → AWS DMS (DMS)
- `datasync.svg` → AWS DataSync (DataSync)
- `snowfamily.svg` → AWS Snow Family (Snow)
- `migrationhub.svg` → AWS Migration Hub (MH)

### Gestión de costos (cost)

- `costexplorer.svg` → AWS Cost Explorer (CE)
- `budgets.svg` → AWS Budgets (Budgets)
- `savingsplans.svg` → AWS Savings Plans (SP)

### Machine Learning (ml)

- `sagemaker.svg` → Amazon SageMaker (SM)
- `bedrock.svg` → Amazon Bedrock (Bedrock)
- `comprehend.svg` → Amazon Comprehend (Comprehend)
- `rekognition.svg` → Amazon Rekognition (Rek)
- `textract.svg` → Amazon Textract (Textract)
- `polly.svg` → Amazon Polly (Polly)
- `lex.svg` → Amazon Lex (Lex)

### IoT (iot)

- `iotcore.svg` → AWS IoT Core (IoT Core)
- `greengrass.svg` → AWS IoT Greengrass (GG)
- `iotanalytics.svg` → AWS IoT Analytics (IoT-A)

### Multimedia (media)

- `mediaconvert.svg` → AWS Elemental MediaConvert (MC)
- `medialive.svg` → AWS Elemental MediaLive (ML-Live)
- `mediapackage.svg` → AWS Elemental MediaPackage (MP)
- `transcoder.svg` → Amazon Elastic Transcoder (ET)

### Front-end y móvil (frontend)

- `amplify.svg` → AWS Amplify (Amplify)
- `appsync.svg` → AWS AppSync (AppSync)
- `pinpoint.svg` → Amazon Pinpoint (Pinpoint)
- `devicefarm.svg` → AWS Device Farm (DF)

### End User Computing (euc)

- `workspaces.svg` → Amazon WorkSpaces (WS)
- `appstream.svg` → Amazon AppStream 2.0 (AS2)
