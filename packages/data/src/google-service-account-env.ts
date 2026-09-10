export type GoogleServiceAccountRuntimeCredentials = {
  clientEmail: string;
  privateKey: string;
};

export type RuntimeEnv = Record<string, string | undefined>;

function required(value: unknown, label: string): string {
  const text = String(value || '').trim();
  if (!text) throw new Error(label + ' is required.');
  return text;
}

function validate(credentials: GoogleServiceAccountRuntimeCredentials): GoogleServiceAccountRuntimeCredentials {
  const clientEmail = required(credentials.clientEmail, 'Google service-account client email');
  const privateKey = required(credentials.privateKey, 'Google service-account private key').replace(/\\n/g, '\n');
  if (!clientEmail.includes('@')) throw new Error('Google service-account client email is invalid.');
  if (!privateKey.includes('BEGIN PRIVATE KEY')) throw new Error('Google service-account private key is invalid.');
  return { clientEmail, privateKey };
}

export function readGoogleServiceAccountRuntimeCredentials(env: RuntimeEnv): GoogleServiceAccountRuntimeCredentials {
  const encoded = String(env.FCT_GOOGLE_SERVICE_ACCOUNT_JSON_B64 || '').trim();
  if (encoded) {
    let parsed: unknown;
    try {
      const json = Buffer.from(encoded, 'base64').toString('utf8');
      parsed = JSON.parse(json);
    } catch (_error) {
      throw new Error('Google service-account JSON runtime secret is invalid.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Google service-account JSON runtime secret is invalid.');
    }
    const record = parsed as Record<string, unknown>;
    return validate({
      clientEmail: String(record.client_email || ''),
      privateKey: String(record.private_key || '')
    });
  }

  return validate({
    clientEmail: String(env.FCT_GOOGLE_SERVICE_ACCOUNT_EMAIL || ''),
    privateKey: String(env.FCT_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '')
  });
}
