import { cookies } from 'next/headers';
import { NavBar } from '@/components/NavBar';

async function getUsernameFromCookies(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
  if (!clientId) return '';

  const cookieStore = await cookies();
  const token = cookieStore.get(
    `CognitoIdentityServiceProvider.${clientId}.accessToken`,
  )?.value;
  if (!token) return '';

  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    return (decoded.username as string | undefined) ?? '';
  } catch {
    return '';
  }
}

export default async function EngineerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await getUsernameFromCookies();

  return (
    <>
      <NavBar username={username} homeHref="/dashboard" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
}
