import { getFounderReadModel, type FounderReadModel } from '../../data/src/founder-read-model.ts';
import type { SheetRangeReader } from '../../data/src/sheet-reader.ts';

export type FounderApiRequest = {
  method: string;
  headers?: Record<string, string | undefined>;
};

export type FounderApiResponse = {
  status: number;
  headers: Record<string, string>;
  body: {
    ok: boolean;
    data?: FounderReadModel;
    error?: string;
  };
};

export type FounderAuthorize = (request: FounderApiRequest) => boolean | Promise<boolean>;

export type FounderReadApiOptions = {
  reader: SheetRangeReader;
  authorize: FounderAuthorize;
  now: () => Date;
};

const JSON_HEADERS = Object.freeze({
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff'
});

export function createFounderReadApi(options: FounderReadApiOptions) {
  if (!options || !options.reader || typeof options.reader.readRange !== 'function') {
    throw new Error('Founder read API requires a SheetRangeReader.');
  }
  if (typeof options.authorize !== 'function') {
    throw new Error('Founder read API requires an explicit authorization function.');
  }
  if (typeof options.now !== 'function') {
    throw new Error('Founder read API requires a clock function.');
  }

  return async function handleFounderRead(request: FounderApiRequest): Promise<FounderApiResponse> {
    const method = String(request?.method || '').trim().toUpperCase();
    if (method !== 'GET') {
      return {
        status: 405,
        headers: { ...JSON_HEADERS, Allow: 'GET' },
        body: { ok: false, error: 'METHOD_NOT_ALLOWED' }
      };
    }

    const allowed = await options.authorize(request);
    if (!allowed) {
      return {
        status: 401,
        headers: { ...JSON_HEADERS },
        body: { ok: false, error: 'UNAUTHORIZED' }
      };
    }

    try {
      const now = options.now();
      if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
        throw new Error('Founder read API clock returned an invalid date.');
      }
      const model = await getFounderReadModel(options.reader, now.toISOString());
      return {
        status: 200,
        headers: { ...JSON_HEADERS },
        body: { ok: true, data: model }
      };
    } catch (_error) {
      // Deliberately avoid returning provider responses, tokens, sheet names beyond
      // the public contract, or stack traces to the client.
      return {
        status: 503,
        headers: { ...JSON_HEADERS },
        body: { ok: false, error: 'FOUNDER_DATA_UNAVAILABLE' }
      };
    }
  };
}
