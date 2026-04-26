import type { CmsCreateInput, ErxesContext } from "../types.js";

const MUTATION = `
  mutation CpContentCreateCMS($input: ContentCMSInput) {
    cpContentCreateCMS(input: $input) {
      _id
      name
      description
      clientPortalId
      content
      language
      languages
      postUrlField
      createdAt
      updatedAt
    }
  }
`;

interface CmsRecord {
  _id: string;
  name?: string | null;
  description?: string | null;
  clientPortalId?: string | null;
  content?: string | null;
  language?: string | null;
  languages?: string[] | null;
  postUrlField?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export async function cmsCreator(
  input: CmsCreateInput,
  intent: ErxesContext
): Promise<CmsRecord> {
  console.log(`→ [cms-creator] Creating CMS "${input.name}"...`);

  const response = await fetch(intent.erxes_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-token": intent.erxes_app_token,
    },
    body: JSON.stringify({
      query: MUTATION,
      variables: {
        input: {
          name: input.name,
          description: input.description ?? "",
          clientPortalId: input.clientPortalId,
          content: "CMS for energy-castle website",
          language: input.language,
          languages: input.languages,
          postUrlField: input.postUrlField ?? "slug",
        },
      },
    }),
  });

  const data = await response.json() as {
    data?: { cpContentCreateCMS?: CmsRecord };
    errors?: { message: string }[];
  };

  if (data.errors?.length || !data.data?.cpContentCreateCMS?._id) {
    throw new Error(data.errors?.[0]?.message ?? "Failed to create CMS");
  }

  console.log(`  ✓ CMS created → ${data.data.cpContentCreateCMS._id}`);
  return data.data.cpContentCreateCMS;
}
