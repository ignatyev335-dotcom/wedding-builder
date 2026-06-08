import { CalendarDays, Heart, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { ProjectActions } from "@/features/dashboard/ui/project-actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function DashboardPage() {
  const site = await prisma.weddingSite.findFirst({
    orderBy: { updatedAt: "desc" },
    include: {
      user: true,
      data: true,
      _count: { select: { guests: true } },
    },
  });

  if (!site?.data) {
    return (
      <main className="dashboard-empty">
        <span className="brand">vowly</span>
        <Heart size={30} />
        <h1>Создайте первое приглашение</h1>
        <p>Ответьте на три коротких вопроса, и мы подготовим основу сайта.</p>
        <Link href="/quiz">Начать</Link>
      </main>
    );
  }

  const weddingDate = new Date(site.data.weddingDate);
  const today = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (Date.UTC(
        weddingDate.getUTCFullYear(),
        weddingDate.getUTCMonth(),
        weddingDate.getUTCDate(),
      ) -
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) /
        86_400_000,
    ),
  );
  const packageName =
    site.personalLinks || site.premiumMusic || site.telegramAlerts
      ? "Премиум Вайл"
      : site.rsvpEnabled || site.removeBranding
        ? "Интерактив"
        : "Базовый";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link href="/" className="brand">vowly</Link>
        <span>Личный кабинет</span>
      </header>

      <section className="dashboard-welcome">
        <div>
          <span>Ваше пространство</span>
          <h1>Здравствуйте, {site.user.name ?? "влюбленные"}</h1>
          <p>Здесь собраны проект, гости и быстрые действия перед свадьбой.</p>
        </div>
        <div className="dashboard-countdown">
          <small>До свадьбы</small>
          <strong>{daysLeft}</strong>
          <span>дней</span>
        </div>
      </section>

      <section className="dashboard-project">
        <div className="dashboard-project-cover">
          <span><Sparkles size={16} /> Текущий проект</span>
          <h2>{site.data.partnerOneName} <i>&amp;</i> {site.data.partnerTwoName}</h2>
          <p><CalendarDays size={15} /> {dateFormatter.format(weddingDate)}</p>
        </div>
        <div className="dashboard-project-info">
          <div className="dashboard-project-meta">
            <span><small>Тариф</small><strong>{packageName}</strong></span>
            <span><small>Ответов гостей</small><strong>{site._count.guests}</strong></span>
            <span><small>Адрес сайта</small><strong>/wedding/{site.slug}</strong></span>
          </div>
          <ProjectActions siteId={site.id} slug={site.slug} />
        </div>
      </section>

      <section className="dashboard-tip">
        <Users size={20} />
        <div>
          <strong>Совет перед отправкой</strong>
          <p>Заполните умный опрос самостоятельно один раз и проверьте, как ответ появляется в списке любимых гостей.</p>
        </div>
      </section>
    </main>
  );
}
