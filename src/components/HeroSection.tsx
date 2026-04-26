import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";
import { Heart, Phone, ChevronRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-[var(--color-primary)] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-2xl">
          <FadeIn direction="up">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-[var(--color-accent)]" />
              <span className="text-sm font-medium text-[var(--color-accent-light)] tracking-wide uppercase">
                Дурсгалын үйлчилгээ
              </span>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Хайртай хүмүүсийнхээ дурсгалыг{" "}
              <span className="text-[var(--color-accent)]">хүндэтгэлтэйгээр</span>{" "}
              хадгалъя
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8">
              Улаанбаатар Буян нь 20 гаруй жилийн туршлагатай дурсгалын үйлчилгээний төв бөгөөд
              таны гэр бүлд хамгийн сайн үйлчилгээг үзүүлэхээр зорьж ажилладаг.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[var(--color-primary)] font-semibold rounded-lg hover:bg-[var(--color-accent-light)] transition-colors"
              >
                Үйлчилгээ үзэх
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="tel:70000000"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4" />
                7000-0000
              </a>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
