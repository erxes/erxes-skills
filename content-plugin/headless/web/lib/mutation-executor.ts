import type { ContentMutation, MutationResult } from "../types.js";

export async function mutationExecutor(
  mutations: ContentMutation[],
  erxesEndpoint: string,
  erxesToken: string
): Promise<MutationResult[]> {
  const results: MutationResult[] = [];

  console.log(`→ [mutation-executor] Sending ${mutations.length} mutations to erxes...`);

  for (const item of mutations) {
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

      const data = await response.json() as { errors?: { message: string }[]; data: unknown };

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
