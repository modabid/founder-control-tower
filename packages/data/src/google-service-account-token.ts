import { createSign } from 'node:crypto';

export type TokenFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type GoogleServiceAccountOptions = {
  clientEmail: string;
  privateKey: string;
  fetchImpl?: TokenFetch;
  now?: () => Date;
};

type CachedToken = {
  token: string;
  expiresAtMs: number;
};

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_READ_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const JWT_LIFETIME_SECONDS = 3600;
const EARLY_REFRESH_MS = 60_000;

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function normalizePrivateKey(value: string): string {
  return String(value || '').replace(/\\n/g, '\n').trim();
}

export function buildGoogleServiceAccountAssertion(
  clientEmail: string,
  privateKey: string,
  now: Date
): string {
  const email = String(clientEmail || '').trim();
  const key = normalizePrivateKey(privateKey);
  if (!email) throw new Error('Google service-account client email is required.');
  if (!key.includes('BEGIN PRIVATE KEY')) throw new Error('Google service-account private key is invalid.');
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error('Google token clock is invalid.');

  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: email,
    scope: SHEETS_READ_SCOPE,
    aud: TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + JWT_LIFETIME_SECONDS
  }));
  const signingInput = header + '.' + payload;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(key).toString('base64url');
  return signingInput + '.' + signature;
}

export function createGoogleServiceAccountTokenProvider(options: GoogleServiceAccountOptions) {
  if (!options) throw new Error('Google service-account options are required.');
  const fetchImpl = options.fetchImpl || fetch;
  const clock = options.now || (() => new Date());
  let cache: CachedToken | null = null;

  return async function getAccessToken(): Promise<string> {
    const now = clock();
    const nowMs = now.getTime();
    if (!Number.isFinite(nowMs)) throw new Error('Google token clock is invalid.');

    if (cache && cache.token && cache.expiresAtMs - EARLY_REFRESH_MS > nowMs) {
      return cache.token;
    }

    const assertion = buildGoogleServiceAccountAssertion(options.clientEmail, options.privateKey, now);
    const response = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
      }).toString()
    });

    if (!response.ok) {
      throw new Error('Google OAuth token exchange failed with status ' + response.status + '.');
    }

    const body = await response.json() as { access_token?: unknown; expires_in?: unknown };
    const token = String(body.access_token || '').trim();
    const expiresIn = Number(body.expires_in);
    if (!token) throw new Error('Google OAuth token response did not contain an access token.');
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error('Google OAuth token response contained an invalid expiry.');

    cache = {
      token,
      expiresAtMs: nowMs + (expiresIn * 1000)
    };
    return token;
  };
}

export const GOOGLE_SHEETS_READ_SCOPE = SHEETS_READ_SCOPE;
export const GOOGLE_OAUTH_TOKEN_URL = TOKEN_URL;
