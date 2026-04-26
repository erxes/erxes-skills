import Link from "next/link";
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_HEADER_MENU } from "@/lib/graphql/queries/cms";
import MobileMenu from "./MobileMenu";

interface MenuItem {
  _id: string;
  label?: string;
  url?: string;
  order?: number;
}

interface HeaderMenuData {
  cpMenus?: MenuItem[];
}

export default async function Header() {
  const client = await getServerApolloClient();
  const { data } = await client.query<HeaderMenuData>({
    query: GET_HEADER_MENU,
    variables: { language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  const menuItems = (data?.cpMenus ?? []).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-muted)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">Б</span>
            </div>
            <span className="text-lg font-semibold text-[var(--color-primary)] tracking-tight">
              Улаанбаатар Буян
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item._id}
                href={item.url ?? "/"}
                className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <MobileMenu items={menuItems} />
        </div>
      </div>
    </header>
  );
}
