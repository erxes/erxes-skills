import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_PAGES } from "@/lib/graphql/queries/cms";
import { notFound } from "next/navigation";

interface PageItem {
  _id: string;
  name: string;
  slug: string;
  content?: string;
}

interface PagesData {
  cpPages?: PageItem[];
}

export async function generateStaticParams() {
  return [
    { slug: "about" },
    { slug: "services" },
    { slug: "contact" },
  ];
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const client = await getServerApolloClient();
  const { data } = await client.query<PagesData>({
    query: GET_PAGES,
    variables: { language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  const page = data?.cpPages?.find((p) => p.slug === params.slug);
  if (!page) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-8">
        {page.name}
      </h1>
      <div
        className="prose prose-lg max-w-none text-[var(--color-text-muted)]"
        dangerouslySetInnerHTML={{ __html: page.content ?? "" }}
      />
    </div>
  );
}
