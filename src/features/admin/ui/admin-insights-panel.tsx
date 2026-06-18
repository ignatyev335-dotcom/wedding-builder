import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";

export function AdminInsightsPanel({
  usersCount,
  sitesCount,
  publishedCount,
  guestsCount,
  tracksCount,
  templatesCount,
  themesCount,
  premiumUsersCount,
}: {
  usersCount: number;
  sitesCount: number;
  publishedCount: number;
  guestsCount: number;
  tracksCount: number;
  templatesCount: number;
  themesCount: number;
  premiumUsersCount: number;
}) {
  const publishRate = sitesCount ? Math.round((publishedCount / sitesCount) * 100) : 0;
  const guestsPerSite = sitesCount ? Math.round(guestsCount / sitesCount) : 0;
  const premiumRate = usersCount ? Math.round((premiumUsersCount / usersCount) * 100) : 0;

  const alerts = [
    tracksCount === 0 ? "В каталоге музыки нет ни одного трека." : null,
    templatesCount === 0 ? "Нет шаблонов приглашений для конструктора." : null,
    themesCount === 0 ? "Нет тем оформления из админки." : null,
  ].filter(Boolean);

  return (
    <section className="admin-panel" id="overview-pulse">
      <header className="admin-card-heading">
        <span className="admin-card-icon">
          <BarChart3 size={21} />
        </span>
        <div>
          <small>Обзор продукта</small>
          <h2>Пульс Vowly</h2>
          <p>
            Быстрые метрики, которые показывают, создают ли пользователи сайты, публикуют ли их и пользуются ли RSVP.
          </p>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <InsightCard
          icon={<TrendingUp size={19} />}
          label="Публикация сайтов"
          value={`${publishRate}%`}
          hint={`${publishedCount} из ${sitesCount} сайтов опубликованы`}
        />
        <InsightCard
          icon={<MousePointerClick size={19} />}
          label="Гостей на сайт"
          value={String(guestsPerSite)}
          hint="Среднее количество гостей в CRM"
        />
        <InsightCard
          icon={<CheckCircle2 size={19} />}
          label="Платные пользователи"
          value={`${premiumRate}%`}
          hint={`${premiumUsersCount} пользователей не на FREE`}
        />
      </div>

      <div className="mt-4 rounded-3xl border border-stone-200 bg-stone-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-700">
          <AlertTriangle size={16} />
          Что стоит проверить
        </div>
        {alerts.length > 0 ? (
          <ul className="m-0 grid gap-2 p-0 text-sm text-stone-600">
            {alerts.map((alert) => (
              <li className="list-none rounded-2xl bg-white px-4 py-3" key={alert}>
                {alert}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 rounded-2xl bg-white px-4 py-3 text-sm text-stone-600">
            Базовые каталоги заполнены. Можно тестировать пользовательский путь.
          </p>
        )}
      </div>
    </section>
  );
}

function InsightCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5">
      <span className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-stone-900 text-white">
        {icon}
      </span>
      <small className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </small>
      <strong className="mt-2 block text-4xl font-semibold text-stone-900">
        {value}
      </strong>
      <p className="m-0 mt-2 text-sm text-stone-500">{hint}</p>
    </article>
  );
}
