import { defineBackend } from '@aws-amplify/backend';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';

const backend = defineBackend({ auth });

// Disable self-registration — all accounts are created by the admin via Cognito Console
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};

// ── DynamoDB table ────────────────────────────────────────────────────────────
const assessmentsStack = backend.createStack('AssessmentsStack');

const table = new dynamodb.Table(assessmentsStack, 'EngAssessments', {
  tableName: 'EngAssessments',
  partitionKey: { name: 'engineerId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'periodType', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
  // RETAIN so accidental stack deletion doesn't lose assessment history
  removalPolicy: RemovalPolicy.RETAIN,
});

// GSI: lets admin query all assessments for a given period in one call
table.addGlobalSecondaryIndex({
  indexName: 'period-assessorType-index',
  partitionKey: { name: 'period', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'assessorType', type: dynamodb.AttributeType.STRING },
});

// ── IAM grants ────────────────────────────────────────────────────────────────
// Grant the Cognito group roles DynamoDB access (for direct SDK calls that use
// federated identity credentials — not used by the Next.js Lambda).
const adminsRole = backend.auth.resources.groups['Admins'].role;
const engineersRole = backend.auth.resources.groups['Engineers'].role;
table.grantReadWriteData(adminsRole);
table.grantReadWriteData(engineersRole);
table.grantReadWriteData(backend.auth.resources.authenticatedUserIamRole);

// ── Compute role policy ───────────────────────────────────────────────────────
// The Next.js API routes run inside Amplify Hosting's Lambda (compute role).
// That execution role is NOT the Cognito authenticated role above — it is a
// separate role assigned in the Amplify Hosting console.
//
// After the first deploy:
//   1. Open Amplify Hosting → App settings → Service role / Custom compute role
//   2. Attach the managed policy whose ARN is in amplify_outputs.json
//      (custom.computePolicyArn)  to that compute role.
//
// This policy grants the minimal DynamoDB permissions the API routes need.
const computePolicy = new iam.ManagedPolicy(
  assessmentsStack,
  'ComputeDynamoPolicy',
  {
    managedPolicyName: 'EngAssessmentsDynamoAccess',
    statements: [
      new iam.PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [table.tableArn, `${table.tableArn}/index/*`],
      }),
    ],
  },
);

// ── Outputs ───────────────────────────────────────────────────────────────────
backend.addOutput({
  custom: {
    tableName: table.tableName,
    tableRegion: assessmentsStack.region,
    // Attach this policy to the Amplify Hosting compute role (see comment above)
    computePolicyArn: computePolicy.managedPolicyArn,
  },
});
