import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_PAGE_BY_SLUG, GET_PAGES } from "@/lib/graphql/queries/cms";
import { notFound } from "next/navigation";

interface PageData {
  cpPages?: Array<{ slug: string }>;
}

interface PageDetailData {
  cpPageDetail?: {
    name: string;
    content?: string;
  } | null;
}

export async function generateStaticParams() {
  const client = await getServerApolloClient();
  const { data } = await client.query<PageData>({
    query: GET_PAGES,
    variables: { language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  return (data?.cpPages ?? []).map((p) => ({ slug: p.slug }));
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const client = await getServerApolloClient();
  const { data } = await client.query<PageDetailData>({
    query: GET_PAGE_BY_SLUG,
    variables: { slug: params.slug, language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  if (!data?.cpPageDetail) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-8">
        {data.cpPageDetail.name}
      </h1>
      <div
        className="prose prose-lg max-w-none text-[var(--color-text-muted)]"
        dangerouslySetInnerHTML={{ __html: data.cpPageDetail.content ?? "" }}
      />
    </div>
  );
}
