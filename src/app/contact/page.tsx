import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_PAGES } from "@/lib/graphql/queries/cms";
import ContactSection from "@/components/ContactSection";

interface PageItem {
  _id: string;
  name: string;
  slug: string;
  content?: string;
}

interface PagesData {
  cpPages?: PageItem[];
}

export default async function ContactPage() {
  const client = await getServerApolloClient();
  const { data } = await client.query<PagesData>({
    query: GET_PAGES,
    variables: { language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  const page = data?.cpPages?.find((p) => p.slug === "contact");

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-8">
          {page?.name ?? "Холбоо барих"}
        </h1>
        {page?.content && (
          <div
            className="prose prose-lg max-w-none text-[var(--color-text-muted)] mb-12"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}
      </div>
      <ContactSection />
    </>
  );
}
