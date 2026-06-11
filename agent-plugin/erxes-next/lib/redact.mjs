// Redaction helpers so logs, errors, and tool output never leak credentials.

const SENSITIVE_KEY_RE =
  /(token|secret|password|passwd|cookie|authorization|api[-_]?key|session[-_]?key|device_code|deviceCode)/i;

const BEARER_RE = /\b(Bearer)\s+[A-Za-z0-9._~+/=-]+/g;

export const REDACTED = '[redacted]';

// Deep-copy a value, replacing the value of any sensitive-looking key.
export function redactObject(value) {
  if (Array.isArray(value)) return value.map(redactObject);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY_RE.test(key) ? REDACTED : redactObject(val);
    }
    return out;
  }
  return value;
}

// Scrub known secret values and bearer headers out of free-form text.
export function redactText(text, secrets = []) {
  let out = String(text ?? '');
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length >= 4) {
      out = out.split(secret).join(REDACTED);
    }
  }
  return out.replace(BEARER_RE, `$1 ${REDACTED}`);
}

// Collect every secret value currently in play so errors can be scrubbed.
export function collectSecrets(env = {}, session = null) {
  const secrets = [];
  if (env.ERXES_CLIENT_SECRET) secrets.push(env.ERXES_CLIENT_SECRET);
  if (session?.accessToken) secrets.push(session.accessToken);
  if (session?.refreshToken) secrets.push(session.refreshToken);
  return secrets;
}
