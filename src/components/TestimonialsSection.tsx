import { FadeIn } from "@/components/motion/FadeIn";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Б. Батэрдэнэ",
      role: "Үйлчлүүлэгч",
      content:
        "Улаанбаатар Буянгийн хамт олон маш мэргэжлийн, хүндэтгэлтэй хандсан. Хайртай эхнэрээ алдсан хамгийн хэцүү үед бидэнд маш их дэмжлэг үзүүлсэн.",
      rating: 5,
    },
    {
      name: "Г. Оюунчимэг",
      role: "Үйлчлүүлэгч",
      content:
        "Эцгийнхээ дурсгалын арга хэмжээг зохион байгуулахад маш их тус болсон. Бүх зүйл цэгцтэй, хүндэтгэл бүхий болсон.",
      rating: 5,
    },
    {
      name: "Д. Ганбат",
      role: "Үйлчлүүлэгч",
      content:
        "24 цагийн үйлчилгээ нь маш чухал байсан. Шөнө дунд ч хариуцлагатай, хурдан шуурхай үйлчилсэн. Баярлалаа.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider">
              Сэтгэгдэл
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mt-3 mb-4">
              Үйлчлүүлэгчдийн сэтгэгдэл
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              Манай үйлчлүүлэгчид бидний тухай юу гэж боддог вэ?
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <FadeIn key={index} direction="up" delay={index * 0.15}>
              <div className="bg-[var(--color-muted)] rounded-xl p-8 relative">
                <Quote className="w-10 h-10 text-[var(--color-primary)]/20 absolute top-6 right-6" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[var(--color-accent)] text-[var(--color-accent)]"
                    />
                  ))}
                </div>
                <p className="text-[var(--color-text-muted)] leading-relaxed mb-6">{t.content}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-[var(--color-primary)]">
                      {t.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">{t.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
