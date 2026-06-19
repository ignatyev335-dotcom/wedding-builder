import {
  ArrowRight,
  Check,
  Gift,
  Heart,
  HelpCircle,
  MapPin,
  MessageCircle,
  Music2,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const featureCards = [
  {
    icon: MessageCircle,
    title: "Умный опрос гостей",
    text: "RSVP, меню, аллергии, трансфер и свои вопросы без таблиц в мессенджерах.",
  },
  {
    icon: MapPin,
    title: "Карта и тайминг",
    text: "Адрес, маршрут, программа дня и все детали, которые гости обычно спрашивают отдельно.",
  },
  {
    icon: Palette,
    title: "Стиль и дресс-код",
    text: "Палитра, примеры образов, шрифты и оформление из вашей собственной коллекции.",
  },
  {
    icon: Music2,
    title: "Музыка и атмосфера",
    text: "Добавьте трек из каталога или загрузите свою композицию для приглашения.",
  },
  {
    icon: Users,
    title: "Персональные ссылки",
    text: "Каждый гость получает свою ссылку, а пары могут отвечать по одному приглашению.",
  },
  {
    icon: Heart,
    title: "После свадьбы",
    text: "Сайт превращается в благодарственную страницу с фото и ссылкой на готовую галерею.",
  },
];

const steps = [
  ["01", "Ответьте на короткий квиз", "Имена, дата, стиль и базовые блоки. Без страха чистого листа."],
  ["02", "Настройте приглашение", "Тексты, фото, музыка, гости и детали праздника в одном конструкторе."],
  ["03", "Оживите сайт", "Сохраните проект в личном кабинете и отправьте гостям красивую ссылку."],
];

const designs = [
  ["Editorial", "Строгая типографика, воздух и ощущение дорогой полиграфии."],
  ["Botanical", "Мягкие зеленые оттенки, натуральные фактуры и спокойная романтика."],
  ["Evening", "Темный фон, золото, свечи и камерная вечерняя атмосфера."],
  ["Minimal", "Белый фон, тонкие линии и ничего лишнего."],
];

const faqItems = [
  ["Можно ли менять сайт после публикации?", "Да. Тексты, гости, фото, музыку и блоки можно обновлять хоть до дня свадьбы."],
  ["Нужно ли регистрироваться сразу?", "Нет. Сначала можно пройти квиз и собрать основу сайта, а аккаунт понадобится при сохранении."],
  ["Можно ли сделать сайт без своих фото?", "Да. В конструкторе можно выбрать нейтральные обложки и не загружать личные фотографии."],
  ["Работает ли сайт на телефоне?", "Да. Публичное приглашение и анкета гостей сделаны mobile-first."],
];

export default function HomePage() {
  return (
    <main className="landing landing-v2">
      <header className="landing-v2-nav">
        <Link className="brand" href="/" aria-label="Vowly">
          vowly
        </Link>
        <nav aria-label="Навигация по главной">
          <a href="#features">Возможности</a>
          <a href="#designs">Стили</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link className="landing-v2-login" href="/login">
          Вход / кабинет
        </Link>
      </header>

      <section className="landing-v2-hero">
        <div className="landing-v2-glow landing-v2-glow-one" />
        <div className="landing-v2-glow landing-v2-glow-two" />

        <div className="landing-v2-hero-copy">
          <span className="landing-v2-pill">
            <Sparkles size={15} />
            Свадебный сайт нового поколения
          </span>
          <h1>Свадебный сайт, который гости действительно откроют</h1>
          <p>
            Приглашение, RSVP, карта, музыка, гости и вся важная информация —
            в одном красивом месте. Без дизайнера, программиста и хаоса в чатах.
          </p>
          <div className="landing-v2-actions">
            <Link className="landing-v2-primary" href="/create">
              Создать сайт бесплатно
              <ArrowRight size={18} />
            </Link>
            <a className="landing-v2-secondary" href="#how-it-works">
              Как это работает
            </a>
          </div>
          <div className="landing-v2-trust">
            <span>15 минут на запуск</span>
            <span>RSVP и гости</span>
            <span>Mobile-first</span>
          </div>
        </div>

        <div className="landing-v2-phone-wrap" aria-hidden="true">
          <div className="landing-v2-note landing-v2-note-top">
            <Check size={15} />
            RSVP уже внутри
          </div>
          <div className="landing-v2-phone">
            <div className="landing-v2-speaker" />
            <div className="landing-v2-screen">
              <Image
                src="/images/landing-wedding-couple.webp"
                alt=""
                fill
                priority
                className="landing-v2-phone-photo"
              />
              <div className="landing-v2-screen-shade" />
              <div className="landing-v2-invite">
                <span>Приглашение на свадьбу</span>
                <h2>
                  Александр
                  <i>&</i>
                  Валентина
                </h2>
                <p>20 июня 2026</p>
                <small>Сбор гостей в 17:00 · Усадьба у леса</small>
              </div>
            </div>
          </div>
          <div className="landing-v2-note landing-v2-note-bottom">
            <Music2 size={15} />
            Музыка, карта и гости
          </div>
        </div>
      </section>

      <section className="landing-v2-stats" aria-label="Коротко о сервисе">
        <article>
          <strong>0 ₽</strong>
          <span>старт без оплаты</span>
        </article>
        <article>
          <strong>5 мин</strong>
          <span>чтобы собрать основу</span>
        </article>
        <article>
          <strong>1 ссылка</strong>
          <span>для гостей и всей информации</span>
        </article>
      </section>

      <section className="landing-v2-section" id="how-it-works">
        <div className="landing-v2-section-head">
          <span>Как это работает</span>
          <h2>От идеи до готового приглашения — без лишних экранов</h2>
          <p>
            Vowly ведет пару по шагам: сначала помогает собрать основу, потом
            аккуратно раскрывает настройки, которые действительно нужны.
          </p>
        </div>
        <div className="landing-v2-steps">
          {steps.map(([number, title, text]) => (
            <article key={number}>
              <b>{number}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v2-section landing-v2-feature-section" id="features">
        <div className="landing-v2-section-head">
          <span>Все под рукой</span>
          <h2>Блоки, которые снимают с пары рутину</h2>
          <p>
            Не просто красивая страница, а рабочий центр подготовки: гости,
            ответы, детали, стиль, музыка и сценарий после свадьбы.
          </p>
        </div>
        <div className="landing-v2-features">
          {featureCards.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v2-showcase" id="designs">
        <div className="landing-v2-showcase-copy">
          <span>Стили из вашей коллекции</span>
          <h2>Визуал можно менять без потери текста и гостей</h2>
          <p>
            Темы, шрифты, цвета и оформление модулей подтягиваются из админки.
            Пользователь меняет настроение сайта, а данные остаются на месте.
          </p>
          <Link className="landing-v2-primary is-dark" href="/create">
            Попробовать конструктор
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="landing-v2-design-grid">
          {designs.map(([title, text]) => (
            <article key={title}>
              <div>
                <span>{title.slice(0, 1)}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v2-after">
        <div>
          <span>
            <Gift size={15} />
            После свадьбы
          </span>
          <h2>Сайт не исчезает после праздника</h2>
          <p>
            После даты свадьбы приглашение может автоматически стать страницей
            благодарности: Love Story, теплый текст и ссылка на готовые фотографии.
          </p>
        </div>
        <div className="landing-v2-after-card">
          <Heart size={22} />
          <strong>Спасибо, что были с нами</strong>
          <small>Гости возвращаются к сайту уже как к красивому фотоальбому.</small>
        </div>
      </section>

      <section className="landing-v2-section landing-v2-faq" id="faq">
        <div className="landing-v2-section-head">
          <span>Вопросы</span>
          <h2>Спокойно отвечаем на главное</h2>
        </div>
        <div className="landing-v2-faq-list">
          {faqItems.map(([question, answer]) => (
            <details key={question}>
              <summary>
                <span>{question}</span>
                <HelpCircle size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-v2-final">
        <ShieldCheck size={24} />
        <h2>Создайте основу сайта сегодня, а детали дополняйте спокойно</h2>
        <p>
          Начните бесплатно. Сайт можно редактировать после публикации — вплоть
          до самого дня свадьбы.
        </p>
        <Link className="landing-v2-primary" href="/create">
          Создать сайт бесплатно
          <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="landing-v2-footer">
        <span className="brand">vowly</span>
        <div>
          <Link href="/login">Личный кабинет</Link>
          <a href="#features">Возможности</a>
          <a href="#faq">FAQ</a>
        </div>
        <small>Свадебные сайты, RSVP и гости в одном месте.</small>
      </footer>
    </main>
  );
}
