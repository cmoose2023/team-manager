import { DashboardClient } from './DashboardClient';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = '' } = await searchParams;
  return <DashboardClient initialPeriod={period} />;
}
