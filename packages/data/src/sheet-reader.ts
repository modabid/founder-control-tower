export type SheetMatrix = unknown[][];

export interface SheetRangeReader {
  readRange(range: string): Promise<SheetMatrix>;
}

export type SheetRecord = Record<string, unknown>;

export function recordsFromMatrix(matrix: SheetMatrix, requiredHeaders: string[] = []): SheetRecord[] {
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  const headers = (matrix[0] || []).map((value) => String(value ?? '').trim());
  const seen = new Set<string>();
  headers.forEach((header) => {
    if (!header) return;
    if (seen.has(header)) throw new Error('Duplicate sheet header: ' + header);
    seen.add(header);
  });

  requiredHeaders.forEach((header) => {
    if (!seen.has(header)) throw new Error('Required sheet header missing: ' + header);
  });

  return matrix.slice(1)
    .filter((row) => Array.isArray(row) && row.some((value) => value !== '' && value !== null && value !== undefined))
    .map((row) => {
      const record: SheetRecord = {};
      headers.forEach((header, index) => {
        if (header) record[header] = row[index] ?? '';
      });
      return record;
    });
}

export function numberValue(value: unknown, label: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(label + ' must be numeric.');
}

export function optionalNumber(value: unknown, label: string): number | null {
  if (value === '' || value === null || value === undefined) return null;
  return numberValue(value, label);
}

export function googleSerialToIsoDate(value: unknown): string | null {
  if (value === '' || value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const text = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  const serial = optionalNumber(value, 'Google Sheets date serial');
  if (serial === null) return null;
  const millis = Math.round((serial - 25569) * 86400000);
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid Google Sheets date serial.');
  return date.toISOString().slice(0, 10);
}

export function currentMonthKey(asOfIso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(asOfIso)) throw new Error('asOfIso must start with YYYY-MM-DD.');
  return asOfIso.slice(0, 7);
}
