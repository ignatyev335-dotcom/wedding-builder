import { ArrowRight, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link className="brand" href="/" aria-label="Vowly">
          vowly
        </Link>
        <Link className="nav-action" href="/login">
          <LayoutDashboard size={16} />
          <span>Вход / Личный кабинет</span>
        </Link>
      </header>

      <section className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#f8e8e8,_transparent_38%),radial-gradient(circle_at_bottom_right,_#e7e5f5,_transparent_42%),linear-gradient(to_bottom,_#fffdfb,_#f7f4f1)] px-4">
        <Image
          className="pointer-events-none absolute -right-24 bottom-0 hidden h-[70%] w-[42%] rounded-tl-[12rem] object-cover opacity-10 blur-[2px] md:block"
          src="/images/landing-wedding-couple.webp"
          alt=""
          width={900}
          height={1200}
          priority
        />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center px-4 text-center">
          <span className="rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm backdrop-blur">
            Свадебное приглашение нового поколения
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Идеальный свадебный сайт и пригласительные за 15 минут
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
            Интерактивная карта, подбор музыки, онлайн-подтверждение RSVP и
            списки гостей в один клик. Попробуйте бесплатно и без дизайнеров.
          </p>
          <Link
            className="mt-10 inline-flex flex-shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-indigo-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl"
            href="/create"
          >
            Создать сайт бесплатно
            <ArrowRight size={18} />
          </Link>
          <small className="mt-5 text-sm text-gray-500">
            Бесплатный старт. Изменения можно вносить даже после публикации.
          </small>
        </div>
      </section>
    </main>
  );
}
