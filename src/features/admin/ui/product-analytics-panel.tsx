import { BarChart3, MousePointerClick, TrendingUp } from "lucide-react";

type ProductAnalyticsPanelProps = {
  usersCount: number;
  sitesCount: number;
  publishedCount: number;
  guestsCount: number;
  ordersCount: number;
  paidOrdersCount: number;
  templatesCount: number;
  tracksCount: number;
  themesCount: number;
};

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function ProductAnalyticsPanel({
  usersCount,
  sitesCount,
  publishedCount,
  guestsCount,
  ordersCount,
  paidOrdersCount,
  templatesCount,
  tracksCount,
  themesCount,
}: ProductAnalyticsPanelProps) {
  const funnel = [
    {
      label: "Пользователи",
      value: usersCount,
      helper: "кто оставил контакт или вошел",
      width: 100,
    },
    {
      label: "Создали сайт",
      value: sitesCount,
      helper: `${percent(sitesCount, usersCount)}% от пользователей`,
      width: Math.max(12, percent(sitesCount, usersCount)),
    },
    {
      label: "Опубликовали",
      value: publishedCount,
      helper: `${percent(publishedCount, sitesCount)}% от сайтов`,
      width: Math.max(12, percent(publishedCount, sitesCount)),
    },
    {
      label: "Оплаты",
      value: paidOrdersCount,
      helper: `${percent(paidOrdersCount, ordersCount)}% от заказов`,
      width: Math.max(12, percent(paidOrdersCount, Math.max(ordersCount, 1))),
    },
  ];

  return (
    <section className="admin-panel product-analytics-panel">
      <header className="admin-panel-heading">
        <span>
          <BarChart3 size={18} />
        </span>
        <div>
          <small>Продуктовая аналитика</small>
          <h2>Воронка и живость платформы</h2>
          <p>Быстрый ответ на вопрос: где люди доходят до ценности, а где теряются.</p>
        </div>
      </header>

      <div className="analytics-funnel">
        {funnel.map((item) => (
          <article key={item.label}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
            <i>
              <b style={{ width: `${item.width}%` }} />
            </i>
            <small>{item.helper}</small>
          </article>
        ))}
      </div>

      <div className="analytics-signal-grid">
        <SignalCard
          icon={MousePointerClick}
          title="RSVP активность"
          value={guestsCount}
          helper="всего гостей в CRM"
        />
        <SignalCard
          icon={TrendingUp}
          title="Наполненность каталога"
          value={templatesCount + tracksCount + themesCount}
          helper={`${templatesCount} текстов · ${tracksCount} треков · ${themesCount} тем`}
        />
        <SignalCard
          icon={BarChart3}
          title="Публикация"
          value={`${percent(publishedCount, sitesCount)}%`}
          helper="доля активных сайтов"
        />
      </div>
    </section>
  );
}

function SignalCard({
  icon: Icon,
  title,
  value,
  helper,
}: {
  icon: typeof BarChart3;
  title: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article>
      <Icon size={18} />
      <small>{title}</small>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}
