import { test } from "node:test";
import assert from "node:assert/strict";

import plugin from "../index.js";

test("registers the declared permission-filtered erxes tools", () => {
  const tools = [];

  plugin.register({ registerTool: (tool) => tools.push(tool) });

  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["erxes_tools_search", "erxes_tool_call"]
  );
  assert.equal(tools[0].parameters.additionalProperties, false);
  assert.deepEqual(tools[1].parameters.required, ["toolId"]);
});
