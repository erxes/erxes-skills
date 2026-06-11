// OpenClaw extension entry for the erxes plugin package.
// Agent-facing behavior is provided by the plugin manifest, instructions, and
// the auth/session CLI (scripts/erxes-auth.mjs). The persistent OAuth session
// manager is exported here for programmatic runtime use as well.
export { createAuthManager, AuthError } from './lib/auth.mjs';
export { resolveStateDir, DURATION_CHOICES, DEFAULT_DURATION } from './lib/store.mjs';

export default {
  id: 'erxes-next-plugin',
  name: 'erxes-next-plugin',
};
