import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="brand" href="/">
          vowly
        </Link>
        <Link className="nav-action" href="/quiz">
          Создать сайт
        </Link>
      </nav>

      <section className="hero-shell">
        <div className="hero-copy">
          <span className="pill">
            <Sparkles size={15} />
            Бесплатный старт за 3 минуты
          </span>
          <h1>
            Ваш свадебный сайт.
            <br />
            Уже почти готов.
          </h1>
          <p>
            Ответьте на несколько теплых вопросов, а мы соберем персональное
            приглашение с программой дня, пожеланиями по стилю и умным опросом гостей.
          </p>
          <Link className="primary-button" href="/quiz">
            Начать бесплатно
            <ArrowRight size={18} />
          </Link>
          <div className="trust-row">
            <span><Check size={15} /> Без карты</span>
            <span><Check size={15} /> Можно изменить все</span>
          </div>
        </div>

        <div className="phone-stage" aria-label="Пример свадебного приглашения">
          <div className="phone">
            <div className="phone-speaker" />
            <div className="invitation-preview">
              <span>Приглашение на свадьбу</span>
              <h2>Анна<br />&amp; Антон</h2>
              <p>12 сентября 2026</p>
              <div className="preview-line" />
              <small>Будем счастливы разделить этот день с вами</small>
            </div>
          </div>
          <div className="floating-note floating-note-top">Сайт создается сам</div>
          <div className="floating-note floating-note-bottom">Любую деталь можно изменить</div>
        </div>
      </section>
    </main>
  );
}
