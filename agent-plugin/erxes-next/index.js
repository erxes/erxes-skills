// OpenClaw extension entry for the erxes plugin package.
export { createAuthManager, AuthError } from "./lib/auth.mjs";
export {
  resolveStateDir,
  DURATION_CHOICES,
  DEFAULT_DURATION,
} from "./lib/store.mjs";

import { createAuthManager } from "./lib/auth.mjs";

const jsonResult = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  details: payload,
});

const searchParameters = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: {
      type: "string",
      description: "Capability or business workflow to search for.",
    },
    plugin: { type: "string", description: "Optional erxes plugin name." },
    module: { type: "string", description: "Optional module name." },
    cursor: {
      type: "string",
      description: "Pagination cursor returned by a previous search.",
    },
    limit: { type: "number", minimum: 1, maximum: 100, default: 50 },
  },
};

const callParameters = {
  type: "object",
  additionalProperties: false,
  required: ["toolId"],
  properties: {
    toolId: {
      type: "string",
      description: "Exact tool id returned by erxes_tools_search.",
    },
    input: {
      type: "object",
      additionalProperties: true,
      description: "Input matching the selected tool schema.",
    },
    confirmationId: {
      type: "string",
      description:
        "One-time confirmation id. Supply it only after the user explicitly confirms the pending admin action.",
    },
  },
};

const createSearchTool = () => ({
  label: "Search erxes tools",
  name: "erxes_tools_search",
  description:
    "Discover live erxes capabilities filtered by the OAuth permissions the customer selected. Search before calling a workflow that is not already grounded in a returned tool definition.",
  parameters: searchParameters,
  execute: async (_toolCallId, args = {}) => {
    const query = new URLSearchParams();
    for (const key of ["query", "plugin", "module", "cursor", "limit"]) {
      if (args[key] !== undefined && args[key] !== "") {
        query.set(key, String(args[key]));
      }
    }
    const suffix = query.size ? `?${query.toString()}` : "";
    const result = await createAuthManager().apiRequest({
      path: `/agent-tools/manifest${suffix}`,
    });
    return jsonResult(result);
  },
});

const createCallTool = () => ({
  label: "Call erxes tool",
  name: "erxes_tool_call",
  description:
    "Execute one exact live erxes capability. Inputs must match the schema returned by erxes_tools_search. If confirmation is required, stop and ask the user before resubmitting the returned confirmation id.",
  parameters: callParameters,
  execute: async (_toolCallId, args = {}) => {
    const result = await createAuthManager().apiRequest({
      path: "/agent-tools/call",
      method: "POST",
      body: {
        toolId: args.toolId,
        ...(args.input === undefined ? {} : { input: args.input }),
        ...(args.confirmationId ? { confirmationId: args.confirmationId } : {}),
      },
    });
    return jsonResult(result);
  },
});

export default {
  id: "erxes-next-plugin",
  name: "erxes-next-plugin",
  register(api) {
    api.registerTool(createSearchTool());
    api.registerTool(createCallTool());
  },
};
