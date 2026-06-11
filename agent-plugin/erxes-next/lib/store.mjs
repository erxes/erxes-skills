// Persistent OAuth session store for the erxes plugin.
//
// Sessions are stored OUTSIDE the plugin source tree, in the OpenClaw runtime
// state directory, keyed by a fingerprint of (base URL, client id, client
// secret hash). Changing any of those values resolves to a different session
// file, so stale credentials are never reused for a different target.
//
// Directory mode: 700. File mode: 600.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DURATION_CHOICES = Object.freeze({ '3m': 90, '6m': 180, '1y': 365 }); // days
export const DEFAULT_DURATION = '6m';
const DAY_MS = 24 * 60 * 60 * 1000;

export function resolveStateDir(env = process.env) {
  if (env.ERXES_AUTH_STATE_DIR) return env.ERXES_AUTH_STATE_DIR;
  if (env.OPENCLAW_STATE_DIR) return path.join(env.OPENCLAW_STATE_DIR, 'erxes-next-plugin');
  const home = env.HOME || os.homedir();
  const openclawHome = path.join(home, '.openclaw');
  if (fs.existsSync(openclawHome)) return path.join(openclawHome, 'erxes-next-plugin');
  const xdgState = env.XDG_STATE_HOME || path.join(home, '.local', 'state');
  return path.join(xdgState, 'openclaw', 'erxes-next-plugin');
}

export function fingerprint(baseUrl, clientId, clientSecret) {
  const secretHash = createHash('sha256').update(String(clientSecret)).digest('hex');
  return createHash('sha256').update(`${baseUrl}\n${clientId}\n${secretHash}`).digest('hex');
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

export function readSession(dir, fp) {
  const session = readJson(sessionPath(dir, fp));
  if (!session || session.fingerprint !== fp || !session.accessToken) return null;
  return session;
}

export function writeSession(dir, fp, session) {
  ensureDir(dir);
  writeFileSecure(sessionPath(dir, fp), JSON.stringify(session, null, 2));
}

export function deleteSession(dir, fp) {
  try {
    fs.unlinkSync(sessionPath(dir, fp));
    return true;
  } catch {
    return false;
  }
}

export function deleteAllSessions(dir) {
  let removed = 0;
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return 0;
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
  return removed;
}

export function readConfig(dir) {
  return readJson(configPath(dir)) || {};
}

export function writeConfig(dir, config) {
  ensureDir(dir);
  writeFileSecure(configPath(dir), JSON.stringify(config, null, 2));
}

export function isValidDuration(key) {
  return Object.prototype.hasOwnProperty.call(DURATION_CHOICES, key);
}

// Precedence: ERXES_AUTH_DURATION env > stored config > default (6m).
export function resolveDuration(env, dir) {
  const fromEnv = (env.ERXES_AUTH_DURATION || '').trim();
  if (isValidDuration(fromEnv)) return fromEnv;
  const fromConfig = readConfig(dir).authDuration;
  if (isValidDuration(fromConfig)) return fromConfig;
  return DEFAULT_DURATION;
}

export function durationMs(key) {
  return DURATION_CHOICES[key] * DAY_MS;
}
