import type { FounderApiRequest, FounderAuthorize } from './founder-read-api.ts';

function constantTimeTextEqual(left: string, right: string): boolean {
  const a = String(left || '');
  const b = String(right || '');
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function readAuthorizationHeader(request: FounderApiRequest): string {
  const headers = request?.headers || {};
  return String(headers.authorization || headers.Authorization || '').trim();
}

export function createFounderBearerAuthorizer(expectedToken: string): FounderAuthorize {
  const expected = String(expectedToken || '').trim();
  if (expected.length < 24) {
    throw new Error('Founder web access token must be at least 24 characters.');
  }

  return function authorizeFounderRequest(request: FounderApiRequest): boolean {
    const authorization = readAuthorizationHeader(request);
    if (!authorization.startsWith('Bearer ')) return false;
    const supplied = authorization.slice(7).trim();
    return constantTimeTextEqual(supplied, expected);
  };
}

export const _testOnlyConstantTimeTextEqual = constantTimeTextEqual;
