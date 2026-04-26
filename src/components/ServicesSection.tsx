import { getServerApolloClient } from "@/lib/apollo/server-client";
import { GET_PAGES } from "@/lib/graphql/queries/cms";
import { FadeIn } from "@/components/motion/FadeIn";
import { Flower2, Flame, Music, Car, UtensilsCrossed, Camera } from "lucide-react";

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

export default async function ServicesSection() {
  const client = await getServerApolloClient();
  const { data } = await client.query<PagesData>({
    query: GET_PAGES,
    variables: { language: "mn" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  const servicesPage = (data?.cpPages ?? []).find(
    (p) => p.slug === "services"
  );

  const services = [
    {
      icon: Flame,
      title: "Шар өргөх үйлчилгээ",
      description: "Уламжлалт ёс заншилд нийцсэн шар өргөх үйлчилгээг мэргэжлийн түвшинд гүйцэтгэнэ.",
    },
    {
      icon: Flower2,
      title: "Цэцэгний үйлчилгээ",
      description: "Олон төрлийн сонголттой, чанартай цэцгийн баглаа, хөтлөгч цэцэгний үйлчилгээ.",
    },
    {
      icon: Music,
      title: "Хөгжмийн үйлчилгээ",
      description: "Хөгжимчид, дуучдын үйлчилгээ, хуримын болон дурсгалын арга хэмжээний хөгжим.",
    },
    {
      icon: Car,
      title: "Тээврийн үйлчилгээ",
      description: "Дурсгалын арга хэмжээнд зориулсан тэрэгний үйлчилгээ, зочдыг тээвэрлэх үйлчилгээ.",
    },
    {
      icon: UtensilsCrossed,
      title: "Хүлээн авалтын үйлчилгээ",
      description: "Дурсгалын хүлээн авалтыг зохион байгуулах, хоолны үйлчилгээ.",
    },
    {
      icon: Camera,
      title: "Гэрэл зураг, видео",
      description: "Мэргэжлийн гэрэл зурагчид, видео бичлэг хийх үйлчилгээ.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider">
              Үйлчилгээ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mt-3 mb-4">
              {servicesPage?.name ?? "Манай үйлчилгээнүүд"}
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              Бид таны хэрэгцээнд нийцсэн олон төрлийн дурсгалын үйлчилгээг санал болгож байна.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <FadeIn key={index} direction="up" delay={index * 0.1}>
              <div className="group bg-[var(--color-muted)] rounded-xl p-8 hover:bg-[var(--color-primary)] transition-colors duration-300">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)] group-hover:bg-white/20 flex items-center justify-center mb-5 transition-colors">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-foreground)] group-hover:text-white mb-3 transition-colors">
                  {service.title}
                </h3>
                <p className="text-[var(--color-text-muted)] group-hover:text-white/80 leading-relaxed transition-colors">
                  {service.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
