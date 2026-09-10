import type { SheetMatrix, SheetRangeReader } from './sheet-reader.ts';

export type AccessTokenProvider = () => Promise<string>;
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class GoogleSheetsRestReader implements SheetRangeReader {
  private readonly spreadsheetId: string;
  private readonly getAccessToken: AccessTokenProvider;
  private readonly fetchImpl: FetchLike;

  constructor(
    spreadsheetId: string,
    getAccessToken: AccessTokenProvider,
    fetchImpl: FetchLike = fetch
  ) {
    if (!String(spreadsheetId || '').trim()) throw new Error('spreadsheetId is required.');
    this.spreadsheetId = spreadsheetId;
    this.getAccessToken = getAccessToken;
    this.fetchImpl = fetchImpl;
  }

  async readRange(range: string): Promise<SheetMatrix> {
    const cleanRange = String(range || '').trim();
    if (!cleanRange) throw new Error('range is required.');

    const token = await this.getAccessToken();
    if (!String(token || '').trim()) throw new Error('Google Sheets access token is unavailable.');

    const url = 'https://sheets.googleapis.com/v4/spreadsheets/' +
      encodeURIComponent(this.spreadsheetId) + '/values/' +
      encodeURIComponent(cleanRange) +
      '?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER';

    const response = await this.fetchImpl(url, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error('Google Sheets read failed (' + response.status + '): ' + text.slice(0, 500));
    }

    const body = await response.json() as { values?: unknown[][] };
    return Array.isArray(body.values) ? body.values : [];
  }
}
