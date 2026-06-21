// Persistent OAuth session store for the erxes plugin.
//
// Sessions are stored OUTSIDE the plugin source tree, keyed by a fingerprint of
// (base URL, client id). Changing the base URL or client id resolves to a
// different session file, so a session is never reused for a different target.
// The client secret is NOT part of the key: a saved login can be reused (and
// silently refreshed) without re-supplying the secret, which is what keeps the
// agent from prompting for OAuth again mid-session.
//
// Durability: the session is written to a stable, home-based directory by
// default so it survives runtime restarts and ephemeral runtime state dirs.
// Reads search every plausible location, so a session written under one runtime
// layout is still found after the layout changes.
//
// Directory mode: 700. File mode: 600.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DURATION_CHOICES = Object.freeze({ '3m': 90, '6m': 180, '1y': 365 }); // days
export const DEFAULT_DURATION = '6m';
const DAY_MS = 24 * 60 * 60 * 1000;
const STATE_SUBDIR = 'erxes-next-plugin';

// All plausible state directories, in priority order. Writes go to the first
// (primary) entry; reads search every entry. A stable home-based path is
// preferred over the runtime state dir so a saved login is not lost when the
// runtime hands the plugin a fresh/ephemeral OPENCLAW_STATE_DIR between runs.
export function stateDirCandidates(env = process.env) {
  const dirs = [];
  const add = (dir) => {
    if (dir && !dirs.includes(dir)) dirs.push(dir);
  };
  if (env.ERXES_AUTH_STATE_DIR) add(env.ERXES_AUTH_STATE_DIR);
  const home = env.HOME || os.homedir();
  if (home) add(path.join(home, '.openclaw', STATE_SUBDIR));
  if (env.OPENCLAW_STATE_DIR) add(path.join(env.OPENCLAW_STATE_DIR, STATE_SUBDIR));
  const xdgState = env.XDG_STATE_HOME || (home ? path.join(home, '.local', 'state') : '');
  if (xdgState) add(path.join(xdgState, 'openclaw', STATE_SUBDIR));
  return dirs;
}

// Primary directory used for writes. Deterministic given a stable HOME and
// independent of whether the runtime sets OPENCLAW_STATE_DIR.
export function resolveStateDir(env = process.env) {
  const [primary] = stateDirCandidates(env);
  return primary || path.join(os.tmpdir(), STATE_SUBDIR);
}

// Session key. The client secret is intentionally excluded so a saved session
// can be located and reused without the secret being present.
export function fingerprint(baseUrl, clientId) {
  return createHash('sha256').update(`${baseUrl}\n${clientId}`).digest('hex');
}

// Stored separately inside the session so a rotated client secret is detected
// (and adopted) without leaking or comparing the raw secret elsewhere.
export function secretFingerprint(clientSecret) {
  return createHash('sha256').update(String(clientSecret)).digest('hex');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // best effort on platforms without chmod
  }
}

function sessionPath(dir, fp) {
  return path.join(dir, `session-${fp.slice(0, 16)}.json`);
}

function configPath(dir) {
  return path.join(dir, 'config.json');
}

function writeFileSecure(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, data, { mode: 0o600 });
  fs.renameSync(tmp, file);
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // best effort
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function isValidSession(session, fp) {
  return Boolean(session && session.fingerprint === fp && session.accessToken);
}

// Read a session from a single directory.
export function readSession(dir, fp) {
  const session = readJson(sessionPath(dir, fp));
  return isValidSession(session, fp) ? session : null;
}

// Read a session from the first directory that has a valid one.
export function findSession(dirs, fp) {
  for (const dir of dirs) {
    const session = readSession(dir, fp);
    if (session) return session;
  }
  return null;
}

export function writeSession(dir, fp, session) {
  ensureDir(dir);
  writeFileSecure(sessionPath(dir, fp), JSON.stringify(session, null, 2));
}

// Delete the session for this fingerprint from every candidate directory so a
// logout clears it regardless of which layout it was written under.
export function deleteSession(dirs, fp) {
  const list = Array.isArray(dirs) ? dirs : [dirs];
  let removed = 0;
  for (const dir of list) {
    try {
      fs.unlinkSync(sessionPath(dir, fp));
      removed += 1;
    } catch {
      // not present in this directory
    }
  }
  return removed;
}

export function deleteAllSessions(dirs) {
  const list = Array.isArray(dirs) ? dirs : [dirs];
  let removed = 0;
  for (const dir of list) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (/^session-[0-9a-f]+\.json$/.test(entry)) {
        try {
          fs.unlinkSync(path.join(dir, entry));
          removed += 1;
        } catch {
          // ignore
        }
      }
    }
  }
  return removed;
}

// Config (duration + last-used non-secret client) is read from the first
// directory that has it, and written to the primary directory.
export function readConfig(dirs) {
  const list = Array.isArray(dirs) ? dirs : [dirs];
  for (const dir of list) {
    const config = readJson(configPath(dir));
    if (config) return config;
  }
  return {};
}

export function writeConfig(dir, config) {
  ensureDir(dir);
  writeFileSecure(configPath(dir), JSON.stringify(config, null, 2));
}

// Remember the most recent non-secret client config so a later turn can find
// the saved session with no environment variables supplied at all.
export function rememberDefaultClient(dirs, primaryDir, client) {
  const config = readConfig(dirs);
  config.defaultClient = {
    baseUrl: client.baseUrl,
    clientId: client.clientId,
    subdomain: client.subdomain,
  };
  writeConfig(primaryDir, config);
}

export function readDefaultClient(dirs) {
  const client = readConfig(dirs).defaultClient;
  return client && client.baseUrl && client.clientId ? client : null;
}

export function isValidDuration(key) {
  return Object.prototype.hasOwnProperty.call(DURATION_CHOICES, key);
}

// Precedence: ERXES_AUTH_DURATION env > stored config > default (6m).
export function resolveDuration(env, dirs) {
  const fromEnv = (env.ERXES_AUTH_DURATION || '').trim();
  if (isValidDuration(fromEnv)) return fromEnv;
  const fromConfig = readConfig(dirs).authDuration;
  if (isValidDuration(fromConfig)) return fromConfig;
  return DEFAULT_DURATION;
}

export function durationMs(key) {
  return DURATION_CHOICES[key] * DAY_MS;
}
