import { createFounderReadApi } from '../packages/api/src/founder-read-api.ts';
import { createFounderBearerAuthorizer } from '../packages/api/src/bearer-auth.ts';
import { GoogleSheetsRestReader } from '../packages/data/src/google-sheets-rest.ts';
import { readGoogleServiceAccountRuntimeCredentials } from '../packages/data/src/google-service-account-env.ts';
import { createGoogleServiceAccountTokenProvider } from '../packages/data/src/google-service-account-token.ts';

const DEFAULT_SPREADSHEET_ID = '1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU';

type FounderApiHandler = ReturnType<typeof createFounderReadApi>;
let cachedApi: FounderApiHandler | null = null;

function requiredEnv(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(name + ' is required.');
  return value;
}

function getFounderApi(): FounderApiHandler {
  if (cachedApi) return cachedApi;

  const googleCredentials = readGoogleServiceAccountRuntimeCredentials(process.env);
  const founderAccessToken = requiredEnv('FCT_WEB_ACCESS_TOKEN');
  const spreadsheetId = String(process.env.FCT_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID).trim();

  const getAccessToken = createGoogleServiceAccountTokenProvider({
    clientEmail: googleCredentials.clientEmail,
    privateKey: googleCredentials.privateKey
  });

  const reader = new GoogleSheetsRestReader(spreadsheetId, getAccessToken);
  cachedApi = createFounderReadApi({
    reader,
    authorize: createFounderBearerAuthorizer(founderAccessToken),
    now: () => new Date()
  });
  return cachedApi;
}

function requestHeaders(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function safeUnavailableResponse(): Response {
  return Response.json(
    { ok: false, error: 'FOUNDER_DATA_UNAVAILABLE' },
    {
      status: 503,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Vercel-CDN-Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  );
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const api = getFounderApi();
      const result = await api({
        method: request.method,
        headers: requestHeaders(request)
      });

      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: {
          ...result.headers,
          'Vercel-CDN-Cache-Control': 'no-store',
          'CDN-Cache-Control': 'no-store'
        }
      });
    } catch (_error) {
      // Configuration/provider details are intentionally not returned to the browser.
      return safeUnavailableResponse();
    }
  }
};
