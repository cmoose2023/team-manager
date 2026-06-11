import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { type AuthPayload } from './types';

// Lazily created so env vars are not required at build time
let _verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!_verifier) {
    _verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      tokenUse: 'access',
      clientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
    });
  }
  return _verifier;
}

/**
 * Verifies a Cognito access token and returns the caller's identity.
 * Throws if the token is invalid or expired.
 */
export async function verifyToken(token: string): Promise<AuthPayload> {
  const payload = await getVerifier().verify(token);
  const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
  return {
    username: payload.username as string,
    groups,
    isAdmin: groups.includes('Admins'),
  };
}

/**
 * Extracts the Bearer token from an Authorization header.
 * Returns null if the header is absent or malformed.
 */
export function extractToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}
