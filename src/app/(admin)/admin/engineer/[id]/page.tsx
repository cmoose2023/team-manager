import { EngineerDetailClient } from './EngineerDetailClient';

export default async function EngineerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { id } = await params;
  const { period = '' } = await searchParams;

  return <EngineerDetailClient engineerId={id} initialPeriod={period} />;
}
