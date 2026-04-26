import Link from "next/link";
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_FOOTER_MENU } from "@/lib/graphql/queries/cms";

interface MenuItem {
  _id: string;
  label?: string;
  url?: string;
  order?: number;
}

interface FooterMenuData {
  cpMenus?: MenuItem[];
}

export default async function Footer() {
  const client = await getServerApolloClient();
  const { data } = await client.query<FooterMenuData>({
    query: GET_FOOTER_MENU,
    variables: { language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  const menuItems = (data?.cpMenus ?? []).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <footer className="bg-[var(--color-primary-dark)] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm font-bold">Б</span>
              </div>
              <span className="text-lg font-semibold">Улаанбаатар Буян</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Дурсгалын үйлчилгээний тэргүүлэгч байгууллага. Бид таны хайртай хүмүүсийн дурсгалыг хүндэтгэн үйлчилнэ.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white/90">Холбоосууд</h3>
            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item._id}
                  href={item.url ?? "/"}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white/90">Холбоо барих</h3>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              <p>Улаанбаатар хот, Баянзүрх дүүрэг</p>
              <p>Утас: 7000-0000</p>
              <p>Имэйл: info@ulaanbaatar-buyan.mn</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm text-white/50">
          © {new Date().getFullYear()} Улаанбаатар Буян. Бүх эрх хуулиар хамгаалагдсан.
        </div>
      </div>
    </footer>
  );
}
