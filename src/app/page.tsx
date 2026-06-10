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

      <section className="hero-shell">
        <div className="hero-copy">
          <span className="hero-eyebrow">Свадебный сайт нового поколения</span>
          <h1>Создайте идеальный свадебный сайт за 15 минут</h1>
          <p>
            Элегантные пригласительные, умный сбор гостей и вся информация в
            одном месте. Без дизайнеров и программистов.
          </p>
          <Link className="primary-button" href="/create">
            Создать сайт бесплатно
            <ArrowRight size={18} />
          </Link>
          <small className="hero-caption">
            Бесплатный старт. Дизайн и данные можно изменить в любой момент.
          </small>
        </div>

        <div
          className="phone-stage"
          aria-label="Пример свадебного сайта Александра и Валентины"
        >
          <div className="landing-orbit landing-orbit-one" />
          <div className="landing-orbit landing-orbit-two" />
          <div className="phone">
            <div className="phone-speaker" />
            <div className="invitation-preview">
              <Image
                className="landing-couple-photo"
                src="/images/landing-wedding-couple.webp"
                alt="Счастливая пара на свадьбе"
                fill
                priority
                sizes="(max-width: 800px) 220px, 336px"
              />
              <div className="landing-photo-shade" />
              <div className="landing-invitation-copy">
                <span>Приглашение на свадьбу</span>
                <h2>
                  Александр
                  <i>&amp;</i>
                  Валентина
                </h2>
                <p>12 сентября 2026</p>
                <small>Будем счастливы разделить этот день с вами</small>
              </div>
            </div>
          </div>
          <div className="floating-note floating-note-top">
            Умный RSVP для гостей
          </div>
          <div className="floating-note floating-note-bottom">
            Ваш дизайн готов за 15 минут
          </div>
        </div>
      </section>
    </main>
  );
}
