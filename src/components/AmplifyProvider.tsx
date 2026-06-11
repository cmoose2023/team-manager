'use client';

import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/lib/amplify-config';

// Configure once at module load on the client.
// ssr: true tells Amplify to persist tokens in cookies (accessible server-side).
Amplify.configure(amplifyConfig, { ssr: true });

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
