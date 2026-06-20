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

import { getProductVisualConfig } from "@/features/platform-visual/config";

export const dynamic = "force-dynamic";

const featureCards = [
  {
    icon: MessageCircle,
    title: "Умный опрос гостей",
    text: "RSVP, меню, аллергии, трансфер и свои вопросы в одной аккуратной анкете.",
  },
  {
    icon: MapPin,
    title: "Карта и тайминг",
    text: "Адрес, маршрут, программа дня и важные детали без бесконечных уточнений.",
  },
  {
    icon: Palette,
    title: "Стиль и дресс-код",
    text: "Палитра, примеры образов, шрифты и оформление из вашей коллекции.",
  },
  {
    icon: Music2,
    title: "Музыка и атмосфера",
    text: "Фоновая музыка из каталога или свой трек для настроения приглашения.",
  },
  {
    icon: Users,
    title: "Персональные ссылки",
    text: "Именные приглашения для гостей, пар и отдельных групп списка.",
  },
  {
    icon: Heart,
    title: "После свадьбы",
    text: "Благодарственная версия сайта с Love Story и ссылкой на готовые фото.",
  },
];

const steps = [
  ["01", "Соберите основу", "Имена, дата, место, стиль и нужные блоки появляются через короткий мастер."],
  ["02", "Доведите детали", "Тексты, фото, музыка, гости и анкета настраиваются в одном конструкторе."],
  ["03", "Отправьте гостям", "Сайт сохраняется в кабинете, а приглашения уходят персональными ссылками."],
];

const designs = [
  ["Editorial", "Строгая типографика, воздух и ощущение дорогой полиграфии."],
  ["Botanical", "Мягкие зеленые оттенки, натуральные фактуры и спокойная романтика."],
  ["Evening", "Темный фон, золото, свечи и камерная вечерняя атмосфера."],
  ["Minimal", "Белый фон, тонкие линии и ничего лишнего."],
];

const faqItems = [
  ["Можно ли менять сайт после публикации?", "Да. Тексты, гости, фото, музыку и блоки можно обновлять до самого дня свадьбы."],
  ["Нужно ли регистрироваться сразу?", "Нет. Сначала можно собрать основу сайта, а аккаунт понадобится при сохранении."],
  ["Можно ли сделать сайт без своих фото?", "Да. В конструкторе можно выбрать нейтральные обложки и не загружать личные фотографии."],
  ["Работает ли сайт на телефоне?", "Да. Публичное приглашение и анкета гостей сделаны mobile-first."],
];

export default async function HomePage() {
  const visualConfig = await getProductVisualConfig();
  const landing = visualConfig.landing;
  const section = (id: string) =>
    landing.sections.find((item) => item.id === id) ?? {
      enabled: true,
      order: 1,
      size: "normal",
      align: "center",
      textAlign: "center",
      density: "normal",
      buttonSize: "normal",
    };
  const sectionStyle = (id: string) => ({ order: section(id).order });
  const sectionClass = (id: string, baseClass: string) => {
    const current = section(id);
    return [
      baseClass,
      `product-section-size-${current.size}`,
      `product-section-align-${current.align}`,
      `product-section-text-${current.textAlign}`,
      `product-section-density-${current.density}`,
      `product-section-button-${current.buttonSize}`,
    ].join(" ");
  };
  const [mockupFirstName = "Александр", mockupSecondName = "Валентина"] =
    landing.mockupCouple.split("&").map((part) => part.trim()).filter(Boolean);

  return (
    <main className="landing landing-v2" style={{ display: "flex", flexDirection: "column" }}>
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

      {section("hero").enabled && <section className={sectionClass("hero", "landing-v2-hero")} style={sectionStyle("hero")}>
        <div className="landing-v2-glow landing-v2-glow-one" />
        <div className="landing-v2-glow landing-v2-glow-two" />

        <div className="landing-v2-hero-copy">
          {landing.badge ? <span className="landing-v2-pill">
            <Sparkles size={15} />
            {landing.badge}
          </span> : null}
          <h1>{landing.title}</h1>
          <p>{landing.subtitle}</p>
          <div className="landing-v2-actions">
            <Link className="landing-v2-primary" href="/create">
              {landing.primaryCta}
              <ArrowRight size={18} />
            </Link>
            <a className="landing-v2-secondary" href="#how-it-works">
              {landing.secondaryCta}
            </a>
          </div>
          <div className="landing-v2-trust">
            <span>Квиз вместо пустого листа</span>
            <span>Гости и ответы в CRM</span>
            <span>Публичный сайт mobile-first</span>
          </div>
          <div className="landing-v2-signature">
            <span>Для пары</span>
            <i />
            <span>Для гостей</span>
            <i />
            <span>Для организатора</span>
          </div>
        </div>

        <div className="landing-v2-phone-wrap" aria-hidden="true">
          <div className="landing-v2-note landing-v2-note-top">
            <Check size={15} />
            RSVP уже внутри
          </div>
          <div className="landing-v2-mini-card landing-v2-mini-card-left">
            <span>17:00</span>
            <strong>Сбор гостей</strong>
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
                  {mockupFirstName}
                  <i>&</i>
                  {mockupSecondName}
                </h2>
                <p>{landing.mockupDate}</p>
                <small>Сбор гостей в 17:00 · Усадьба у леса</small>
              </div>
            </div>
          </div>
          <div className="landing-v2-mini-card landing-v2-mini-card-right">
            <span>84%</span>
            <strong>подтвердили участие</strong>
          </div>
          <div className="landing-v2-note landing-v2-note-bottom">
            <Music2 size={15} />
            Музыка, карта и гости
          </div>
        </div>
      </section>}

      {section("stats").enabled && <section className={sectionClass("stats", "landing-v2-stats")} aria-label="Коротко о сервисе" style={sectionStyle("stats")}>
        <article>
          <strong>01</strong>
          <span>одна ссылка вместо десятка сообщений</span>
        </article>
        <article>
          <strong>15</strong>
          <span>минут, чтобы собрать первую версию</span>
        </article>
        <article>
          <strong>∞</strong>
          <span>правки после публикации без пересборки</span>
        </article>
      </section>}

      {section("how").enabled && <section className={sectionClass("how", "landing-v2-section")} id="how-it-works" style={sectionStyle("how")}>
        <div className="landing-v2-section-head">
          <span>Как это работает</span>
          <h2>От первой идеи до аккуратной ссылки для гостей</h2>
          <p>
            Сервис ведет пару по шагам: сначала собирает основу, затем открывает
            настройки и помогает довести приглашение до законченного вида.
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
      </section>}

      {section("features").enabled && <section className={sectionClass("features", "landing-v2-section landing-v2-feature-section")} id="features" style={sectionStyle("features")}>
        <div className="landing-v2-section-head">
          <span>Все под рукой</span>
          <h2>Все, что обычно расползается по чатам и таблицам</h2>
          <p>
            Vowly выглядит как приглашение, но работает как центр подготовки:
            собирает ответы, хранит детали и держит гостевой список в порядке.
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
      </section>}

      {section("designs").enabled && <section className={sectionClass("designs", "landing-v2-showcase")} id="designs" style={sectionStyle("designs")}>
        <div className="landing-v2-showcase-copy">
          <span>Стили из вашей коллекции</span>
          <h2>Визуал меняется, содержание остается на месте</h2>
          <p>
            Темы, шрифты, цвета и оформление модулей подтягиваются из админки.
            Пара меняет настроение сайта, не переписывая тексты и не теряя гостей.
          </p>
          <Link className="landing-v2-primary is-dark" href="/create">
            Открыть конструктор
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
      </section>}

      {section("after").enabled && <section className={sectionClass("after", "landing-v2-after")} style={sectionStyle("after")}>
        <div>
          <span>
            <Gift size={15} />
            После свадьбы
          </span>
          <h2>Сайт не исчезает после праздника</h2>
          <p>
            После даты свадьбы приглашение становится страницей благодарности:
            Love Story, теплый текст и ссылка на готовые фотографии.
          </p>
        </div>
        <div className="landing-v2-after-card">
          <Heart size={22} />
          <strong>Спасибо, что были с нами</strong>
          <small>Гости возвращаются к сайту уже как к красивому фотоальбому.</small>
        </div>
      </section>}

      {section("faq").enabled && <section className={sectionClass("faq", "landing-v2-section landing-v2-faq")} id="faq" style={sectionStyle("faq")}>
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
      </section>}

      {section("final").enabled && <section className={sectionClass("final", "landing-v2-final")} style={sectionStyle("final")}>
        <ShieldCheck size={24} />
        <h2>Создайте основу сайта сегодня, а детали дополняйте спокойно</h2>
        <p>
          Начните с квиза, сохраните проект в кабинете и возвращайтесь к
          настройкам тогда, когда появятся новые детали.
        </p>
        <Link className="landing-v2-primary" href="/create">
          Создать сайт
          <ArrowRight size={18} />
        </Link>
      </section>}

      <footer className="landing-v2-footer" style={{ order: 99 }}>
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
