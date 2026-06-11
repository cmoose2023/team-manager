import { SelfAssessmentClient } from './SelfAssessmentClient';

export default async function SelfAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = '' } = await searchParams;
  return <SelfAssessmentClient initialPeriod={period} />;
}
