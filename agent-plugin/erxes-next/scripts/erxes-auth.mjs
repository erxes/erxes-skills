#!/usr/bin/env node
// erxes plugin auth/session CLI.
//
// Commands:
//   login                       run confidential OAuth device flow, persist session
//   status                      safe auth status JSON (never tokens)
//   graphql --query <q> [--variables <json>] [--operation-name <name>]
//           --query-file <path> / --variables-file <path> / query on stdin
//   refresh                     force a silent token refresh
//   logout [--all]              delete saved session(s)
//   set-duration <3m|6m|1y>     set session persistence duration
//   get-duration                show effective duration and its source
//
// Env: ERXES_BASE_URL, ERXES_CLIENT_ID, ERXES_CLIENT_SECRET,
//      optional ERXES_AUTH_DURATION (3m|6m|1y), ERXES_AUTH_STATE_DIR.
//
// Exit codes: 0 ok, 2 login required, 3 missing config, 1 other errors.
// Secrets are never written to stdout/stderr.

import fs from 'node:fs';
import { AuthError, createAuthManager } from '../lib/auth.mjs';
import { collectSecrets, redactText } from '../lib/redact.mjs';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key === 'all' || key === 'no-browser') {
        args[key] = true;
      } else {
        args[key] = argv[i + 1];
        i += 1;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

async function readStdin() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

async function resolveGraphqlInput(args) {
  let query = args.query;
  if (!query && args['query-file']) query = fs.readFileSync(args['query-file'], 'utf8');
  if (!query && !process.stdin.isTTY) query = (await readStdin()).trim();

  let variables;
  const rawVariables = args.variables ?? (args['variables-file'] ? fs.readFileSync(args['variables-file'], 'utf8') : undefined);
  if (rawVariables !== undefined && rawVariables !== '') {
    try {
      variables = JSON.parse(rawVariables);
    } catch {
      throw new AuthError('--variables must be valid JSON', 'REQUEST_ERROR');
    }
  }

  // Allow a full request body ({"query": ..., "variables": ...}) on stdin too.
  if (query && query.startsWith('{')) {
    try {
      const body = JSON.parse(query);
      if (typeof body.query === 'string') {
        return {
          query: body.query,
          variables: variables ?? body.variables,
          operationName: args['operation-name'] ?? body.operationName,
        };
      }
    } catch {
      // not a JSON body; treat as a raw query string
    }
  }
  return { query, variables, operationName: args['operation-name'] };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const manager = createAuthManager();

  switch (command) {
    case 'login': {
      // The approval URL is printed for the user to open; the CLI never
      // spawns a browser itself (keeps the plugin free of exec patterns).
      const result = await manager.login();
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case 'status': {
      console.log(JSON.stringify(manager.status(), null, 2));
      return;
    }
    case 'graphql': {
      const input = await resolveGraphqlInput(args);
      const result = await manager.graphql(input);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case 'refresh': {
      await manager.ensureSession();
      console.log(JSON.stringify(manager.status(), null, 2));
      return;
    }
    case 'logout': {
      const result = manager.logout({ all: Boolean(args.all) });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case 'set-duration': {
      const result = manager.setDuration(args._[0]);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case 'get-duration': {
      console.log(JSON.stringify(manager.getDuration(), null, 2));
      return;
    }
    default:
      console.error(
        'usage: erxes-auth.mjs <login|status|graphql|refresh|logout|set-duration|get-duration>',
      );
      process.exitCode = 1;
  }
}

main().catch((err) => {
  const secrets = collectSecrets(process.env);
  const message = redactText(err?.message || 'unexpected error', secrets);
  console.error(message);
  if (err instanceof AuthError && err.code === 'LOGIN_REQUIRED') process.exitCode = 2;
  else if (err instanceof AuthError && err.code === 'CONFIG_MISSING') process.exitCode = 3;
  else process.exitCode = 1;
});
