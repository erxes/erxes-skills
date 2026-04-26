/**
 * Create a CMS in erxes from site.config.json / env.
 * Usage: tsx scripts/erxes-cms.ts
 *
 * Output: prints the created CMS record as JSON
 */
import "dotenv/config";
import { configLoader } from "../lib/config-loader.js";
import { cmsCreator } from "../lib/cms-creator.js";
import type { ErxesContext } from "../types.js";

async function main() {
  const intent = await configLoader();

  const ctx: ErxesContext = {
    erxes_endpoint: intent.erxes_endpoint,
    erxes_app_token: intent.erxes_app_token,
    language: intent.language,
  };

  const cms = await cmsCreator(
    {
      name: intent.name,
      description: intent.extra_notes ?? `${intent.site_type} website`,
      clientPortalId: intent.client_portal_id,
      language: intent.language,
      languages: intent.languages,
      postUrlField: "slug",
    },
    ctx
  );

  console.log(JSON.stringify(cms, null, 2));
}

main();
