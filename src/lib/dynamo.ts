import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? 'EngAssessments';
export const GSI_NAME = 'period-assessorType-index';

/** Builds the DynamoDB sort key from a period and assessor type. */
export function makePeriodType(period: string, assessorType: 'admin' | 'self'): string {
  return `${period}#${assessorType}`;
}
