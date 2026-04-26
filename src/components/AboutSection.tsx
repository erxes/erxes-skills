import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_PAGES } from "@/lib/graphql/queries/cms";
import { FadeIn } from "@/components/motion/FadeIn";
import { Building2, Users, Award, Clock } from "lucide-react";

interface PageItem {
  _id: string;
  name?: string;
  slug?: string;
  status?: string;
  content?: string;
}

interface PagesData {
  cpPages?: PageItem[];
}

export default async function AboutSection() {
  const client = await getServerApolloClient();
  const { data } = await client.query<PagesData>({
    query: GET_PAGES,
    variables: { language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  const aboutPage = (data?.cpPages ?? []).find(
    (p) => p.slug === "about"
  );

  const stats = [
    { icon: Building2, label: "Жилийн туршлага", value: "20+" },
    { icon: Users, label: "Сэтгэл ханамжтай үйлчлүүлэгч", value: "10,000+" },
    { icon: Award, label: "Мэргэжлийн ажилтан", value: "50+" },
    { icon: Clock, label: "24/7 үйлчилгээ", value: "Тасралтгүй" },
  ];

  return (
    <section className="py-20 md:py-28 bg-[var(--color-muted)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn direction="left">
            <div>
              <span className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                Бидний тухай
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mt-3 mb-6">
                {aboutPage?.name ?? "Улаанбаатар Буян"}
              </h2>
              <div
                className="prose prose-lg text-[var(--color-text-muted)] leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html:
                    aboutPage?.content ??
                    `<p>Улаанбаатар Буян дурсгалын үйлчилгээний төв нь 2003 онд байгуулагдсан бөгөөд Монгол улсдаа тэргүүлэгч байгууллага болоод байна.</p>
                    <p>Бид гэр бүл, хайртай хүмүүсээ алдсан хүмүүст хамгийн сайн үйлчилгээг үзүүлэхээр зорьж ажилладаг. Манай мэргэжлийн баг таны хэрэгцээнд нийцсэн, хүндэтгэл бүхий үйлчилгээг санал болгодог.</p>`,
                }}
              />
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={0.2}>
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-[var(--color-surface)] rounded-xl p-6 text-center shadow-sm border border-[var(--color-muted)]"
                >
                  <stat.icon className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
