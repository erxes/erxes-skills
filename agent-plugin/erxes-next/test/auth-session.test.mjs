import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { AuthError, createAuthManager } from '../lib/auth.mjs';
import { redactObject, redactText } from '../lib/redact.mjs';
import { DURATION_CHOICES, fingerprint, resolveStateDir } from '../lib/store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, '..', 'scripts', 'erxes-auth.mjs');

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_ENV = {
  ERXES_BASE_URL: 'https://demo.next.erxes.io/gateway',
  ERXES_CLIENT_ID: 'test-client',
  ERXES_CLIENT_SECRET: 'super-secret-value',
};

// Deterministic mock of the erxes OAuth + GraphQL endpoints.
function makeMockServer() {
  const state = {
    tokenCounter: 0,
    approved: true,
    refreshValid: true,
    calls: { deviceCode: 0, deviceGrant: 0, refreshGrant: 0, graphql: 0 },
    lastGraphqlHeaders: null,
    validAccessTokens: new Set(),
    expiresInSec: 28800,
  };

  const fetchImpl = async (url, opts) => {
    const body = JSON.parse(opts.body);
    const respond = (status, json) => ({
      status,
      text: async () => JSON.stringify(json),
    });

    if (url.endsWith('/oauth/device/code')) {
      state.calls.deviceCode += 1;
      return respond(200, {
        device_code: 'dev-code-1',
        verification_uri_complete: 'https://<subdomain>.next.erxes.io/oauth/approve?code=1',
        interval: 0,
        expires_in: 600,
      });
    }

    if (url.endsWith('/oauth/token')) {
      if (body.grant_type === 'refresh_token') {
        state.calls.refreshGrant += 1;
        if (!state.refreshValid || body.refresh_token !== `refresh-${state.tokenCounter}`) {
          return respond(400, { error: 'invalid_grant' });
        }
      } else {
        state.calls.deviceGrant += 1;
        if (!state.approved) return respond(400, { error: 'authorization_pending' });
      }
      state.tokenCounter += 1;
      const accessToken = `access-${state.tokenCounter}`;
      state.validAccessTokens.add(accessToken);
      return respond(200, {
        tokenType: 'Bearer',
        accessToken,
        refreshToken: `refresh-${state.tokenCounter}`,
        expiresIn: state.expiresInSec,
      });
    }

    if (url.endsWith('/graphql')) {
      state.calls.graphql += 1;
      state.lastGraphqlHeaders = opts.headers;
      const auth = opts.headers.Authorization || '';
      const token = auth.replace('Bearer ', '');
      if (!state.validAccessTokens.has(token)) {
        return respond(200, { errors: [{ message: 'Not authenticated' }] });
      }
      return respond(200, { data: { customers: [{ _id: 'c1', firstName: 'Bat' }] } });
    }

    throw new Error(`unexpected url: ${url}`);
  };

  return { state, fetchImpl };
}

function makeHarness({ env = {}, server = makeMockServer() } = {}) {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'erxes-auth-test-'));
  const clock = { now: 1_750_000_000_000 };
  const logs = [];
  const manager = createAuthManager({
    env: { ...BASE_ENV, ERXES_AUTH_STATE_DIR: stateDir, ...env },
    fetchImpl: server.fetchImpl,
    now: () => clock.now,
    sleep: async () => {},
    log: (msg) => logs.push(msg),
    printUrl: (url) => logs.push(`open: ${url}`),
  });
  return { manager, stateDir, clock, logs, server };
}

test('first request without a saved session requires oauth login', async () => {
  const { manager } = makeHarness();
  await assert.rejects(
    () => manager.graphql({ query: 'query { customers { _id } }' }),
    (err) => err instanceof AuthError && err.code === 'LOGIN_REQUIRED' && /login required/i.test(err.message),
  );
  const status = manager.status();
  assert.equal(status.authenticated, false);
  assert.match(status.reason, /login required/);
});

test('successful oauth login persists the session with strict permissions', async () => {
  const { manager, stateDir, server } = makeHarness();
  const result = await manager.login();
  assert.equal(result.authenticated, true);
  assert.equal(server.state.calls.deviceCode, 1);

  const dirMode = fs.statSync(stateDir).mode & 0o777;
  assert.equal(dirMode, 0o700);
  const files = fs.readdirSync(stateDir).filter((f) => f.startsWith('session-'));
  assert.equal(files.length, 1);
  const fileMode = fs.statSync(path.join(stateDir, files[0])).mode & 0o777;
  assert.equal(fileMode, 0o600);

  const saved = JSON.parse(fs.readFileSync(path.join(stateDir, files[0]), 'utf8'));
  assert.equal(saved.accessToken, 'access-1');
  assert.equal(saved.refreshToken, 'refresh-1');
  // The client secret itself must never be persisted.
  assert.ok(!JSON.stringify(saved).includes(BASE_ENV.ERXES_CLIENT_SECRET));
});

test('subsequent requests reuse the saved session without re-running oauth', async () => {
  const { manager, server } = makeHarness();
  await manager.login();
  const first = await manager.graphql({ query: 'query { customers { _id } }' });
  const second = await manager.graphql({ query: 'query { customers { _id } }' });
  assert.equal(first.data.customers[0]._id, 'c1');
  assert.equal(second.data.customers[0]._id, 'c1');
  assert.equal(server.state.calls.deviceCode, 1, 'device flow must run only once');
  assert.equal(server.state.calls.refreshGrant, 0, 'no refresh needed while token is fresh');
});

test('a fresh manager instance (runtime restart) reuses the persisted session', async () => {
  const { manager, stateDir, clock, server } = makeHarness();
  await manager.login();

  const restarted = createAuthManager({
    env: { ...BASE_ENV, ERXES_AUTH_STATE_DIR: stateDir },
    fetchImpl: server.fetchImpl,
    now: () => clock.now,
    sleep: async () => {},
    log: () => {},
  });
  const result = await restarted.graphql({ query: 'query { customers { _id } }' });
  assert.equal(result.data.customers[0]._id, 'c1');
  assert.equal(server.state.calls.deviceCode, 1);
});

test('expired access token with valid refresh token refreshes silently', async () => {
  const { manager, clock, server, logs } = makeHarness();
  await manager.login();
  clock.now += 9 * 60 * 60 * 1000; // past the 8h access token TTL
  const result = await manager.graphql({ query: 'query { customers { _id } }' });
  assert.equal(result.data.customers[0]._id, 'c1');
  assert.equal(server.state.calls.refreshGrant, 1);
  assert.equal(server.state.calls.deviceCode, 1, 'no new oauth prompt');
  assert.ok(logs.includes('oauth refresh succeeded'));
});

test('refresh rotates and persists both tokens', async () => {
  const { manager, stateDir, clock } = makeHarness();
  await manager.login();
  clock.now += 9 * 60 * 60 * 1000;
  await manager.graphql({ query: 'query { customers { _id } }' });
  const file = fs.readdirSync(stateDir).find((f) => f.startsWith('session-'));
  const saved = JSON.parse(fs.readFileSync(path.join(stateDir, file), 'utf8'));
  assert.equal(saved.accessToken, 'access-2');
  assert.equal(saved.refreshToken, 'refresh-2');
});

test('session older than the configured duration requires oauth again', async () => {
  const { manager, clock } = makeHarness({ env: { ERXES_AUTH_DURATION: '3m' } });
  await manager.login();
  clock.now += 91 * DAY_MS;
  await assert.rejects(
    () => manager.graphql({ query: 'query { customers { _id } }' }),
    (err) => err.code === 'LOGIN_REQUIRED' && /expired/.test(err.message) && /3m/.test(err.message),
  );
  assert.equal(manager.status().authenticated, false);
});

test('duration defaults to 6m and can be set to 3m/6m/1y via config', async () => {
  const { manager, clock } = makeHarness();
  assert.deepEqual(manager.getDuration(), { authDuration: '6m', source: 'default', default: '6m' });

  manager.setDuration('1y');
  assert.equal(manager.getDuration().authDuration, '1y');
  assert.equal(manager.getDuration().source, 'config');
  assert.throws(() => manager.setDuration('2y'), /invalid auth duration/);

  await manager.login();
  clock.now += 200 * DAY_MS; // past 6m but inside 1y
  assert.equal(manager.status().authenticated, true);
  clock.now += 200 * DAY_MS; // past 1y
  assert.equal(manager.status().authenticated, false);
  assert.deepEqual(Object.keys(DURATION_CHOICES), ['3m', '6m', '1y']);
});

test('env ERXES_AUTH_DURATION overrides stored config', () => {
  const { manager } = makeHarness({ env: { ERXES_AUTH_DURATION: '1y' } });
  manager.setDuration('3m');
  assert.deepEqual(manager.getDuration(), { authDuration: '1y', source: 'env', default: '6m' });
});

test('logout deletes the persisted session and the next request requires oauth', async () => {
  const { manager, stateDir } = makeHarness();
  await manager.login();
  const result = manager.logout();
  assert.equal(result.cleared, 1);
  assert.equal(fs.readdirSync(stateDir).filter((f) => f.startsWith('session-')).length, 0);
  await assert.rejects(
    () => manager.graphql({ query: 'query { customers { _id } }' }),
    (err) => err.code === 'LOGIN_REQUIRED',
  );
});

test('changing base URL, clientId, or clientSecret separates sessions safely', async () => {
  const server = makeMockServer();
  const { manager, stateDir, clock } = makeHarness({ server });
  await manager.login();

  for (const change of [
    { ERXES_BASE_URL: 'https://other.next.erxes.io/gateway' },
    { ERXES_CLIENT_ID: 'another-client' },
    { ERXES_CLIENT_SECRET: 'rotated-secret' },
  ]) {
    const changed = createAuthManager({
      env: { ...BASE_ENV, ERXES_AUTH_STATE_DIR: stateDir, ...change },
      fetchImpl: server.fetchImpl,
      now: () => clock.now,
      sleep: async () => {},
      log: () => {},
    });
    await assert.rejects(
      () => changed.graphql({ query: 'query { customers { _id } }' }),
      (err) => err.code === 'LOGIN_REQUIRED',
      `changed ${Object.keys(change)[0]} must not reuse the old session`,
    );
  }
  // The original session is untouched and still works.
  const original = await manager.graphql({ query: 'query { customers { _id } }' });
  assert.equal(original.data.customers[0]._id, 'c1');
});

test('graphql sends the saved bearer token and subdomain header', async () => {
  const { manager, server } = makeHarness();
  await manager.login();
  await manager.graphql({ query: 'query { customers { _id } }', variables: { page: 1 } });
  assert.equal(server.state.lastGraphqlHeaders.Authorization, 'Bearer access-1');
  assert.equal(server.state.lastGraphqlHeaders['erxes-subdomain'], 'demo');
});

test('mid-life auth rejection triggers one silent refresh and retry', async () => {
  const { manager, server } = makeHarness();
  await manager.login();
  server.state.validAccessTokens.clear(); // server-side invalidation before TTL
  const result = await manager.graphql({ query: 'query { customers { _id } }' });
  assert.equal(result.data.customers[0]._id, 'c1');
  assert.equal(server.state.calls.refreshGrant, 1);
});

test('invalid refresh token yields a safe reauth message without secrets', async () => {
  const { manager, clock, server } = makeHarness();
  await manager.login();
  server.state.refreshValid = false;
  clock.now += 9 * 60 * 60 * 1000;
  await assert.rejects(
    () => manager.graphql({ query: 'query { customers { _id } }' }),
    (err) =>
      err.code === 'LOGIN_REQUIRED' &&
      /re-login required/.test(err.message) &&
      !/access-|refresh-|super-secret/.test(err.message),
  );
});

test('logs and status output never contain secrets or token values', async () => {
  const { manager, clock, logs, server } = makeHarness();
  await manager.login();
  await manager.graphql({ query: 'query { customers { _id } }' });
  clock.now += 9 * 60 * 60 * 1000;
  await manager.graphql({ query: 'query { customers { _id } }' });
  server.state.refreshValid = false;
  clock.now += 9 * 60 * 60 * 1000;
  await manager.graphql({ query: 'query { customers { _id } }' }).catch(() => {});
  manager.logout();

  const sensitive = /access-\d|refresh-\d|super-secret-value|Bearer /;
  for (const line of logs) {
    assert.ok(!sensitive.test(line), `log line leaks secrets: ${line}`);
  }
  assert.ok(logs.includes('oauth session loaded'));
  assert.ok(logs.includes('oauth refresh succeeded'));
  assert.ok(logs.includes('oauth refresh failed'));
  assert.ok(logs.includes('oauth session cleared'));

  const statusText = JSON.stringify(manager.status());
  assert.ok(!sensitive.test(statusText), 'status output leaks secrets');
});

test('redaction helpers scrub keys, values, and bearer headers', () => {
  const redacted = redactObject({
    accessToken: 'a1',
    refresh_token: 'r1',
    clientSecret: 's1',
    Authorization: 'Bearer xyz',
    nested: { password: 'p', safe: 'ok' },
  });
  assert.deepEqual(redacted, {
    accessToken: '[redacted]',
    refresh_token: '[redacted]',
    clientSecret: '[redacted]',
    Authorization: '[redacted]',
    nested: { password: '[redacted]', safe: 'ok' },
  });
  assert.equal(
    redactText('error super-secret-value with Bearer abc.def', ['super-secret-value']),
    'error [redacted] with Bearer [redacted]',
  );
});

test('state dir resolution prefers explicit env, then openclaw home', () => {
  assert.equal(resolveStateDir({ ERXES_AUTH_STATE_DIR: '/tmp/x' }), '/tmp/x');
  assert.equal(
    resolveStateDir({ OPENCLAW_STATE_DIR: '/srv/openclaw' }),
    path.join('/srv/openclaw', 'erxes-next-plugin'),
  );
  const fp = fingerprint('https://a/gateway', 'c1', 's1');
  assert.notEqual(fp, fingerprint('https://a/gateway', 'c1', 's2'));
  assert.notEqual(fp, fingerprint('https://b/gateway', 'c1', 's1'));
});

test('CLI: status without a session exits 0 and reports unauthenticated', () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'erxes-auth-cli-'));
  const out = execFileSync(process.execPath, [CLI, 'status'], {
    env: { ...process.env, ...BASE_ENV, ERXES_AUTH_STATE_DIR: stateDir },
    encoding: 'utf8',
  });
  const status = JSON.parse(out);
  assert.equal(status.authenticated, false);
  assert.ok(!out.includes(BASE_ENV.ERXES_CLIENT_SECRET));
});

test('CLI: graphql without a session exits 2 with a safe login message', () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'erxes-auth-cli-'));
  try {
    execFileSync(process.execPath, [CLI, 'graphql', '--query', 'query { customers { _id } }'], {
      env: { ...process.env, ...BASE_ENV, ERXES_AUTH_STATE_DIR: stateDir },
      encoding: 'utf8',
    });
    assert.fail('expected non-zero exit');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /login required/i);
    assert.ok(!String(err.stderr).includes(BASE_ENV.ERXES_CLIENT_SECRET));
  }
});

test('CLI: missing config exits 3 and set/get-duration round-trips', () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'erxes-auth-cli-'));
  const cleanEnv = { ...process.env, ERXES_AUTH_STATE_DIR: stateDir };
  delete cleanEnv.ERXES_BASE_URL;
  delete cleanEnv.ERXES_CLIENT_ID;
  delete cleanEnv.ERXES_CLIENT_SECRET;
  try {
    execFileSync(process.execPath, [CLI, 'logout'], { env: cleanEnv, encoding: 'utf8' });
    assert.fail('expected non-zero exit');
  } catch (err) {
    assert.equal(err.status, 3);
  }
  const set = execFileSync(process.execPath, [CLI, 'set-duration', '1y'], {
    env: cleanEnv,
    encoding: 'utf8',
  });
  assert.equal(JSON.parse(set).authDuration, '1y');
  const get = execFileSync(process.execPath, [CLI, 'get-duration'], {
    env: cleanEnv,
    encoding: 'utf8',
  });
  assert.deepEqual(JSON.parse(get), { authDuration: '1y', source: 'config', default: '6m' });
});
