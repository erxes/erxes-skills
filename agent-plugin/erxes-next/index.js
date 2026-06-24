// OpenClaw extension entry for the erxes plugin package.
// Agent-facing behavior is provided by the plugin manifest, instructions, and
// the auth/session CLI (scripts/erxes-auth.mjs). The persistent OAuth session
// manager is exported here for programmatic runtime use as well.
export { createAuthManager, AuthError } from './lib/auth.mjs';
export { resolveStateDir, DURATION_CHOICES, DEFAULT_DURATION } from './lib/store.mjs';

export default {
  id: 'erxes-next-plugin',
  name: 'erxes-next-plugin',
  // OpenClaw 2026.6.x rejects any plugin that declares a code extension but
  // exports no register()/activate() entrypoint (the loader aborts the whole
  // CLI, which breaks `openclaw agents add`). This plugin is manifest- and
  // instructions-driven: its agent-facing behavior comes from
  // openclaw.plugin.json + instructions.md, and OAuth/session work runs through
  // scripts/erxes-auth.mjs (lib/auth.mjs + lib/store.mjs). There is no
  // provider/tool/command to wire up programmatically, so register() is a
  // deliberate no-op whose only job is to satisfy the plugin contract so the
  // plugin loads cleanly.
  register() {},
};
