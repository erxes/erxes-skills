import { FadeIn } from "@/components/motion/FadeIn";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";

export default function ContactSection() {
  return (
    <section className="py-20 md:py-28 bg-[var(--color-muted)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider">
              Холбоо барих
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mt-3 mb-4">
              Бидэнтэй холбогдох
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              Танд асуулт байна уу? Бид танд туслахад бэлэн байна.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FadeIn direction="left">
            <div className="bg-[var(--color-surface)] rounded-xl p-8 shadow-sm border border-[var(--color-muted)]">
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Холбоо барих мэдээлэл</h3>
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Хаяг</p>
                    <p className="text-[var(--color-text-muted)]">Улаанбаатар хот, Баянзүрх дүүрэг, 13-р хороо, Буянтын гудамж 25</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Утас</p>
                    <p className="text-[var(--color-text-muted)]">7000-0000, 7000-0001</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Имэйл</p>
                    <p className="text-[var(--color-text-muted)]">info@ulaanbaatar-buyan.mn</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Ажлын цаг</p>
                    <p className="text-[var(--color-text-muted)]">Даваа-Ням: 24 цагийн үйлчилгээ</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={0.2}>
            <form className="bg-[var(--color-surface)] rounded-xl p-8 shadow-sm border border-[var(--color-muted)] flex flex-col gap-5">
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">Мессеж илгээх</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Нэр</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                    placeholder="Таны нэр"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Утас</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                    placeholder="Утасны дугаар"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Имэйл</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                  placeholder="Имэйл хаяг"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Мессеж</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] resize-none"
                  placeholder="Таны мессеж..."
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                <Send className="w-4 h-4" />
                Илгээх
              </button>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
