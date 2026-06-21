// Runtime OAuth/session manager for the erxes plugin.
//
// Responsibilities:
// - run the confidential device-flow login and persist the resulting session
// - load the saved session before every erxes API request
// - refresh expired access tokens silently (refresh tokens rotate)
// - expire sessions after the configured duration (3m / 6m / 1y)
// - execute GraphQL requests itself so tokens never reach the assistant
// - never include token or secret values in logs, errors, or returned data
//
// Persistence design (so the agent never has to OAuth again mid-session):
// - the session is keyed by base URL + client id only, so it can be located
//   and reused without the client secret being re-supplied
// - the client secret is stored inside the protected session file (mode 600,
//   outside the plugin source tree) so the access token can be refreshed
//   silently in later turns/conversations with no environment variables at all
// - the last-used non-secret client config is remembered so a fresh turn can
//   discover the saved session even when no env vars are provided

import {
  DEFAULT_DURATION,
  DURATION_CHOICES,
  deleteAllSessions,
  deleteSession,
  durationMs,
  fingerprint,
  findSession,
  isValidDuration,
  readConfig,
  readDefaultClient,
  rememberDefaultClient,
  resolveDuration,
  resolveStateDir,
  secretFingerprint,
  stateDirCandidates,
  writeConfig,
  writeSession,
} from './store.mjs';
import { collectSecrets, redactText } from './redact.mjs';

const ACCESS_TOKEN_SKEW_MS = 60_000;
const DEFAULT_ACCESS_TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // erxes confidential default: 28800s

export class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code; // CONFIG_MISSING | LOGIN_REQUIRED | OAUTH_ERROR | REQUEST_ERROR
  }
}

export function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function subdomainFromBaseUrl(baseUrl) {
  const match = /^https?:\/\/([^./:]+)/.exec(baseUrl);
  return match ? match[1] : '';
}

function pickToken(json) {
  if (!json || typeof json !== 'object') return null;
  const accessToken = json.accessToken ?? json.access_token;
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken: json.refreshToken ?? json.refresh_token ?? null,
    expiresInSec: Number(json.expiresIn ?? json.expires_in ?? 0) || 0,
  };
}

// Only ever surface the OAuth error code (e.g. invalid_client), never the body.
function safeOauthErrorCode(res) {
  const code = res.json?.error;
  return typeof code === 'string' && code ? code : `http ${res.status}`;
}

export function createAuthManager(options = {}) {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const now = options.now ?? (() => Date.now());
  const log = options.log ?? ((message) => console.error(message)); // safe messages only
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const printUrl =
    options.printUrl ??
    ((url) => console.error(`Open this URL in your browser to approve access:\n${url}`));
  const stateDir = options.stateDir ?? resolveStateDir(env);
  // Reads search every plausible location; writes go to the primary dir.
  const readDirs = options.stateDir ? [options.stateDir] : stateDirCandidates(env);

  // Resolve the client config. Base URL + client id come from the environment,
  // falling back to the remembered non-secret config so later turns work with
  // no env at all. The secret is only required for a fresh OAuth login.
  function clientConfig({ requireSecret = false } = {}) {
    let baseUrl = normalizeBaseUrl(env.ERXES_BASE_URL);
    let clientId = (env.ERXES_CLIENT_ID || '').trim();
    const clientSecret = (env.ERXES_CLIENT_SECRET || '').trim();

    if (!baseUrl || !clientId) {
      const stored = readDefaultClient(readDirs);
      if (stored) {
        if (!baseUrl) baseUrl = normalizeBaseUrl(stored.baseUrl);
        if (!clientId) clientId = stored.clientId;
      }
    }

    const missing = [];
    if (!baseUrl) missing.push('ERXES_BASE_URL');
    if (!clientId) missing.push('ERXES_CLIENT_ID');
    if (requireSecret && !clientSecret) missing.push('ERXES_CLIENT_SECRET');
    if (missing.length) {
      throw new AuthError(
        `missing required erxes config: ${missing.join(', ')}`,
        'CONFIG_MISSING',
      );
    }
    return {
      baseUrl,
      clientId,
      clientSecret: clientSecret || null,
      subdomain: subdomainFromBaseUrl(baseUrl),
    };
  }

  function fingerprintFor(cfg) {
    return fingerprint(cfg.baseUrl, cfg.clientId);
  }

  // The secret used to refresh: the one provided this run, else the one saved
  // in the session at login time.
  function effectiveSecret(cfg, session) {
    return cfg.clientSecret ?? session?.clientSecret ?? null;
  }

  async function postJson(url, body) {
    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const secrets = collectSecrets(env);
      throw new AuthError(
        `erxes request failed: ${redactText(err?.message || 'network error', secrets)}`,
        'REQUEST_ERROR',
      );
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // non-JSON response
    }
    return { status: res.status, json, text };
  }

  function buildSession(cfg, token, existing = null) {
    const t = now();
    // Keep the client secret available for silent refresh in later turns.
    const clientSecret = cfg.clientSecret ?? existing?.clientSecret ?? null;
    return {
      version: 2,
      fingerprint: fingerprintFor(cfg),
      baseUrl: cfg.baseUrl,
      subdomain: cfg.subdomain,
      clientId: cfg.clientId,
      clientSecret,
      secretHash: clientSecret ? secretFingerprint(clientSecret) : existing?.secretHash ?? null,
      createdAt: existing?.createdAt ?? t,
      updatedAt: t,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken ?? existing?.refreshToken ?? null,
      accessTokenExpiresAt: t + (token.expiresInSec ? token.expiresInSec * 1000 : DEFAULT_ACCESS_TOKEN_TTL_MS),
    };
  }

  function persistSession(session, cfg) {
    writeSession(stateDir, session.fingerprint, session);
    rememberDefaultClient(readDirs, stateDir, cfg);
  }

  async function login({ openUrl } = {}) {
    const cfg = clientConfig({ requireSecret: true });
    const start = await postJson(`${cfg.baseUrl}/oauth/device/code`, {
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });
    const deviceCode = start.json?.device_code ?? start.json?.deviceCode;
    let verificationUri =
      start.json?.verification_uri_complete ??
      start.json?.verificationUriComplete ??
      start.json?.verification_uri;
    if (!deviceCode || !verificationUri) {
      throw new AuthError(
        `failed to start oauth device flow (${safeOauthErrorCode(start)})`,
        'OAUTH_ERROR',
      );
    }
    verificationUri = verificationUri.replace(/<subdomain>/g, cfg.subdomain);
    const intervalSec = Number(start.json?.interval) || 5;
    const deadline = now() + (Number(start.json?.expires_in) || 600) * 1000;

    log('oauth device flow started');
    printUrl(verificationUri);
    if (openUrl) {
      try {
        openUrl(verificationUri);
      } catch {
        // browser open is best effort; the URL was already printed
      }
    }

    while (now() < deadline) {
      await sleep(intervalSec * 1000);
      const res = await postJson(`${cfg.baseUrl}/oauth/token`, {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCode,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
      });
      const token = pickToken(res.json);
      if (token) {
        const session = buildSession(cfg, token);
        persistSession(session, cfg);
        log('oauth login succeeded; session saved');
        return status();
      }
      const code = res.json?.error ?? '';
      if (code === 'authorization_pending' || code === 'slow_down' || res.text.includes('authorization_pending')) {
        continue;
      }
      throw new AuthError(`oauth login failed (${safeOauthErrorCode(res)})`, 'OAUTH_ERROR');
    }
    throw new AuthError('oauth device flow timed out after 10 minutes; run login again', 'OAUTH_ERROR');
  }

  async function postRefresh(cfg, refreshToken, secret) {
    const res = await postJson(`${cfg.baseUrl}/oauth/token`, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: secret,
    });
    return pickToken(res.json);
  }

  async function refreshSession(cfg, session) {
    const secret = effectiveSecret(cfg, session);
    if (!secret) {
      throw new AuthError(
        'erxes access token expired and no client secret is available to refresh it; provide ERXES_CLIENT_SECRET once or re-login',
        'LOGIN_REQUIRED',
      );
    }
    const token = await postRefresh(cfg, session.refreshToken, secret);
    if (token) {
      const updated = buildSession({ ...cfg, clientSecret: secret }, token, session);
      persistSession(updated, cfg);
      log('oauth refresh succeeded');
      return updated;
    }

    // The refresh token may have just been rotated by a concurrent erxes call in
    // the same runtime (the agent can fire tool invocations in parallel). Reload
    // the persisted session: if another process already refreshed, reuse its
    // newer session or retry with its token instead of forcing the user to OAuth
    // again — re-login should only happen when the session is genuinely gone.
    const latest = findSession(readDirs, fingerprintFor(cfg));
    if (
      latest &&
      latest.refreshToken &&
      latest.refreshToken !== session.refreshToken
    ) {
      if (
        latest.accessToken &&
        now() < latest.accessTokenExpiresAt - ACCESS_TOKEN_SKEW_MS
      ) {
        log('oauth refresh superseded by concurrent refresh; reusing session');
        return latest;
      }
      const retryToken = await postRefresh(cfg, latest.refreshToken, effectiveSecret(cfg, latest));
      if (retryToken) {
        const updated = buildSession({ ...cfg, clientSecret: effectiveSecret(cfg, latest) }, retryToken, latest);
        persistSession(updated, cfg);
        log('oauth refresh succeeded on retry');
        return updated;
      }
    }

    log('oauth refresh failed');
    throw new AuthError(
      'erxes oauth refresh failed; re-login required (run scripts/login.sh)',
      'LOGIN_REQUIRED',
    );
  }

  // Adopt a freshly supplied secret into the saved session (rotation), or
  // backfill it into an older session that did not persist one.
  function syncStoredSecret(cfg, session) {
    if (!cfg.clientSecret) return session;
    const hash = secretFingerprint(cfg.clientSecret);
    if (session.secretHash === hash && session.clientSecret) return session;
    const updated = { ...session, clientSecret: cfg.clientSecret, secretHash: hash };
    writeSession(stateDir, updated.fingerprint, updated);
    return updated;
  }

  // Load the saved session, enforce the configured duration, refresh silently
  // when the access token is stale. Throws LOGIN_REQUIRED when OAuth is needed.
  async function ensureSession() {
    const cfg = clientConfig();
    let session = findSession(readDirs, fingerprintFor(cfg));
    if (!session) {
      throw new AuthError(
        'no saved erxes oauth session for this base URL/client; first-time OAuth login required (run scripts/login.sh)',
        'LOGIN_REQUIRED',
      );
    }
    session = syncStoredSecret(cfg, session);
    const duration = resolveDuration(env, readDirs);
    if (now() >= session.createdAt + durationMs(duration)) {
      log('oauth session expired');
      throw new AuthError(
        `erxes oauth session expired (older than configured ${duration} duration); re-login required (run scripts/login.sh)`,
        'LOGIN_REQUIRED',
      );
    }
    log('oauth session loaded');
    if (now() < session.accessTokenExpiresAt - ACCESS_TOKEN_SKEW_MS) return session;
    if (!session.refreshToken) {
      throw new AuthError(
        'erxes access token expired and no refresh token saved; re-login required (run scripts/login.sh)',
        'LOGIN_REQUIRED',
      );
    }
    return refreshSession(cfg, session);
  }

  function isAuthFailure(res) {
    if (res.status === 401) return true;
    const errors = res.json?.errors;
    if (!Array.isArray(errors)) return false;
    return errors.some((e) =>
      /unauthorized|not authenticated|unauthenticated|token expired|invalid token/i.test(
        `${e?.message ?? ''} ${e?.extensions?.code ?? ''}`,
      ),
    );
  }

  async function graphql({ query, variables, operationName } = {}) {
    if (!query || typeof query !== 'string') {
      throw new AuthError('graphql query string is required', 'REQUEST_ERROR');
    }
    let session = await ensureSession();
    const cfg = clientConfig();

    const doRequest = async (s) => {
      let res;
      try {
        res = await fetchImpl(`${cfg.baseUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'erxes-subdomain': s.subdomain,
            Authorization: `Bearer ${s.accessToken}`,
          },
          body: JSON.stringify({ query, variables, operationName }),
        });
      } catch (err) {
        const secrets = collectSecrets(env, s);
        throw new AuthError(
          `erxes graphql request failed: ${redactText(err?.message || 'network error', secrets)}`,
          'REQUEST_ERROR',
        );
      }
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        // non-JSON response
      }
      return { status: res.status, json, text };
    };

    let res = await doRequest(session);
    // An auth-rejected request was never executed, so one silent refresh +
    // retry is safe for both queries and mutations.
    if (isAuthFailure(res) && session.refreshToken) {
      session = await refreshSession(cfg, session);
      res = await doRequest(session);
    }
    if (res.json == null) {
      throw new AuthError(`erxes graphql request failed with http ${res.status}`, 'REQUEST_ERROR');
    }
    return res.json;
  }

  // Safe status report: never includes token or secret values.
  function status() {
    let cfg = null;
    try {
      cfg = clientConfig();
    } catch {
      // missing config is a valid "not authenticated" state
    }
    const duration = resolveDuration(env, readDirs);
    if (!cfg) {
      return {
        authenticated: false,
        authDuration: duration,
        reason: 'missing ERXES_BASE_URL / ERXES_CLIENT_ID configuration and no saved session',
      };
    }
    const session = findSession(readDirs, fingerprintFor(cfg));
    if (!session) {
      return {
        authenticated: false,
        baseUrl: cfg.baseUrl,
        clientId: cfg.clientId,
        authDuration: duration,
        reason: 'no saved oauth session; login required',
      };
    }
    const sessionExpiresAt = session.createdAt + durationMs(duration);
    const expired = now() >= sessionExpiresAt;
    const result = {
      authenticated: !expired,
      baseUrl: session.baseUrl,
      subdomain: session.subdomain,
      clientId: session.clientId,
      authDuration: duration,
      sessionCreatedAt: new Date(session.createdAt).toISOString(),
      sessionExpiresAt: new Date(sessionExpiresAt).toISOString(),
      accessTokenExpiresAt: new Date(session.accessTokenExpiresAt).toISOString(),
      canRefresh: Boolean(session.refreshToken && (session.clientSecret || cfg.clientSecret)),
    };
    if (expired) result.reason = 'session older than configured duration; login required';
    return result;
  }

  function logout({ all = false } = {}) {
    if (all) {
      const cleared = deleteAllSessions(readDirs);
      log('oauth sessions cleared');
      return { cleared };
    }
    const cfg = clientConfig();
    const removed = deleteSession(readDirs, fingerprintFor(cfg));
    log(removed ? 'oauth session cleared' : 'no saved oauth session to clear');
    return { cleared: removed };
  }

  function setDuration(key) {
    if (!isValidDuration(key)) {
      throw new AuthError(
        `invalid auth duration "${key}"; supported values: ${Object.keys(DURATION_CHOICES).join(', ')}`,
        'REQUEST_ERROR',
      );
    }
    const config = readConfig(readDirs);
    config.authDuration = key;
    writeConfig(stateDir, config);
    log(`oauth session duration set to ${key}`);
    return { authDuration: key };
  }

  function getDuration() {
    const fromEnv = (env.ERXES_AUTH_DURATION || '').trim();
    const fromConfig = readConfig(readDirs).authDuration;
    const duration = resolveDuration(env, readDirs);
    const source = isValidDuration(fromEnv)
      ? 'env'
      : isValidDuration(fromConfig)
        ? 'config'
        : 'default';
    return { authDuration: duration, source, default: DEFAULT_DURATION };
  }

  return {
    stateDir,
    login,
    ensureSession,
    graphql,
    status,
    logout,
    setDuration,
    getDuration,
  };
}
