import type { SheetMatrix, SheetRangeReader } from './sheet-reader.ts';

export type BridgeFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type AppsScriptBridgeReaderOptions = {
  endpointUrl: string;
  token: string;
  fetchImpl?: BridgeFetch;
};

type BridgePayload = {
  ok?: unknown;
  contractVersion?: unknown;
  ranges?: unknown;
  error?: unknown;
};

const BRIDGE_ACTION = 'READ_FOUNDER_SOURCE_V1';
const TRUSTED_URL = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

function validatedEndpointUrl(value: string): string {
  const endpoint = String(value || '').trim();
  if (!TRUSTED_URL.test(endpoint)) {
    throw new Error('Apps Script bridge URL is not a trusted production web-app URL.');
  }
  return endpoint;
}

function validatedBridgeToken(value: string): string {
  const token = String(value || '').trim();
  if (token.length < 32) throw new Error('Apps Script bridge token must be at least 32 characters.');
  return token;
}

export class AppsScriptBridgeReader implements SheetRangeReader {
  private readonly endpointUrl: string;
  private readonly token: string;
  private readonly fetchImpl: BridgeFetch;
  private bundlePromise: Promise<Record<string, SheetMatrix>> | null = null;

  constructor(options: AppsScriptBridgeReaderOptions) {
    if (!options) throw new Error('Apps Script bridge reader options are required.');
    this.endpointUrl = validatedEndpointUrl(options.endpointUrl);
    this.token = validatedBridgeToken(options.token);
    this.fetchImpl = options.fetchImpl || fetch;
  }

  async readRange(range: string): Promise<SheetMatrix> {
    const cleanRange = String(range || '').trim();
    if (!cleanRange) throw new Error('range is required.');
    const ranges = await this.loadBundle();
    const matrix = ranges[cleanRange];
    if (!Array.isArray(matrix)) throw new Error('Apps Script bridge response omitted required range.');
    return matrix;
  }

  private async loadBundle(): Promise<Record<string, SheetMatrix>> {
    if (!this.bundlePromise) this.bundlePromise = this.fetchBundle();
    try {
      return await this.bundlePromise;
    } catch (error) {
      // Allow a later request to retry after a transient bridge/provider failure.
      this.bundlePromise = null;
      throw error;
    }
  }

  private async fetchBundle(): Promise<Record<string, SheetMatrix>> {
    const response = await this.fetchImpl(this.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json'
      },
      body: JSON.stringify({ action: BRIDGE_ACTION, token: this.token }),
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error('Apps Script read bridge request failed with status ' + response.status + '.');
    }

    const body = await response.json() as BridgePayload;
    if (body.ok !== true || body.contractVersion !== '1.0' || !body.ranges || typeof body.ranges !== 'object' || Array.isArray(body.ranges)) {
      throw new Error('Apps Script read bridge returned an invalid or unavailable source bundle.');
    }

    const ranges = body.ranges as Record<string, unknown>;
    const out: Record<string, SheetMatrix> = {};
    Object.entries(ranges).forEach(([range, matrix]) => {
      if (!Array.isArray(matrix)) throw new Error('Apps Script read bridge returned an invalid range matrix.');
      out[range] = matrix as SheetMatrix;
    });
    return out;
  }
}

export const APPS_SCRIPT_BRIDGE_ACTION = BRIDGE_ACTION;
export const APPS_SCRIPT_BRIDGE_URL_PATTERN = TRUSTED_URL;
