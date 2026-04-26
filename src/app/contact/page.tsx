import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_PAGE_BY_SLUG } from "@/lib/graphql/queries/cms";
import ContactSection from "@/components/ContactSection";

interface PageDetailData {
  cpPageDetail?: {
    name: string;
    content?: string;
  } | null;
}

export default async function ContactPage() {
  const client = await getServerApolloClient();
  const { data } = await client.query<PageDetailData>({
    query: GET_PAGE_BY_SLUG,
    variables: { slug: "contact", language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-8">
          {data?.cpPageDetail?.name ?? "Холбоо барих"}
        </h1>
        {data?.cpPageDetail?.content && (
          <div
            className="prose prose-lg max-w-none text-[var(--color-text-muted)] mb-12"
            dangerouslySetInnerHTML={{ __html: data.cpPageDetail.content }}
          />
        )}
      </div>
      <ContactSection />
    </>
  );
}
