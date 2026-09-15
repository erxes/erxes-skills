import type { ContentMutation, MutationResult } from "../types.js";

export interface MutationExecutorOptions {
  /**
   * Optional key extractor for deduplication. When provided, mutations whose
   * key already exists (in `existingKeys` or created earlier in this run) are
   * skipped instead of sent. For menu items, use `(item) => \`${url}|${kind}\``
   * so url + kind duplicates are never re-created.
   */
  keyFor?: (item: ContentMutation) => string | undefined;
  /** Keys already present in the CMS (e.g. pre-fetched menu url|kind keys). */
  existingKeys?: Set<string>;
}

export async function mutationExecutor(
  mutations: ContentMutation[],
  erxesEndpoint: string,
  erxesToken: string,
  options?: MutationExecutorOptions
): Promise<MutationResult[]> {
  const results: MutationResult[] = [];

  console.log(`→ [mutation-executor] Sending ${mutations.length} mutations to erxes...`);

  const seen = new Set<string>(options?.existingKeys ?? []);

  for (const item of mutations) {
    const key = options?.keyFor?.(item);
    if (key !== undefined) {
      if (seen.has(key)) {
        console.log(`  ≐ ${item.type} (${key}) already exists, skipping`);
        results.push({ type: item.type, success: true, data: undefined });
        continue;
      }
      // Reserve the key before the request so duplicate entries in the same
      // batch are never both sent, even when the first response is slow.
      seen.add(key);
    }

    try {
      const response = await fetch(erxesEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${erxesToken}`,
        },
        body: JSON.stringify({
          query: item.mutation,
          variables: item.variables ?? {},
        }),
      });

      const data = (await response.json()) as {
        errors?: { message: string }[];
        data: unknown;
      };

      if (data.errors?.length) {
        console.warn(`  ✗ ${item.type}:`, data.errors[0].message);
        results.push({ type: item.type, success: false, error: data.errors[0].message });
      } else {
        console.log(`  ✓ ${item.type} created`);
        results.push({ type: item.type, success: true, data: data.data });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  ✗ ${item.type} error:`, message);
      results.push({ type: item.type, success: false, error: message });
    }
  }

  return results;
}