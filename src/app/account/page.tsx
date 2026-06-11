import { CalendarDays, Heart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandingToggle } from "@/features/account/ui/branding-toggle";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import { ProjectActions } from "@/features/dashboard/ui/project-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusLabels = {
  DRAFT: "Черновик",
  PUBLISHED: "Активен",
  ARCHIVED: "Деактивирован",
} as const;

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user || user.provider === "ANONYMOUS") redirect("/login");

  const sites = await prisma.weddingSite.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      data: true,
      guests: { select: { status: true } },
      _count: { select: { guests: true } },
    },
  });

  return (
    <main className="account-page">
      <header className="portal-header">
        <Link className="brand" href="/">
          vowly
        </Link>
        <div>
          <span>{user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <section className="account-heading">
        <span>Личный кабинет</span>
        <h1>Здравствуйте, {user.name || "влюбленные"}</h1>
        <p>Ваши проекты, гости и быстрые действия всегда под рукой.</p>
      </section>

      {sites.length ? (
        <section className="account-projects">
          {sites.map((site) => {
            const accepted = site.guests.filter(
              (guest) => guest.status === "ACCEPTED",
            ).length;
            const declined = site.guests.filter(
              (guest) => guest.status === "DECLINED",
            ).length;
            const responseProgress = site.guests.length
              ? Math.round(((accepted + declined) / site.guests.length) * 100)
              : 0;
            const daysLeft = site.data
              ? Math.max(
                  0,
                  Math.ceil(
                    // Server render intentionally calculates a live countdown.
                    // eslint-disable-next-line react-hooks/purity
                    (site.data.weddingDate.getTime() - Date.now()) / 86_400_000,
                  ),
                )
              : 0;

            return (
            <article className="account-project" key={site.id}>
              <div className="account-project-cover">
                <Heart size={20} />
                <span>Текущая свадьба</span>
                <h2>
                  {site.data?.partnerOneName || "Ваши имена"}
                  <i>&amp;</i>
                  {site.data?.partnerTwoName || "ваша история"}
                </h2>
                {site.data && (
                  <p>
                    <CalendarDays size={15} />
                    {site.data.weddingDate.toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                )}
              </div>
              <div className="account-project-body">
                <div className="account-project-insights">
                  <article>
                    <strong>{daysLeft}</strong>
                    <span>дней до свадьбы</span>
                  </article>
                  <article>
                    <strong>{accepted}</strong>
                    <span>подтвердили</span>
                  </article>
                  <article>
                    <strong>{declined}</strong>
                    <span>не смогут прийти</span>
                  </article>
                </div>
                <div className="account-rsvp-progress">
                  <div>
                    <span>Ответы гостей</span>
                    <strong>{responseProgress}%</strong>
                  </div>
                  <i><b style={{ width: `${responseProgress}%` }} /></i>
                </div>
                <div className="account-project-meta">
                  <span>
                    <small>Статус публикации</small>
                    <strong className={`account-status status-${site.status.toLowerCase()}`}>
                      {statusLabels[site.status]}
                    </strong>
                  </span>
                  <span>
                    <small>Ответов гостей</small>
                    <strong>{site._count.guests}</strong>
                  </span>
                  <span>
                    <small>Публичная ссылка</small>
                    <strong>/wedding/{site.slug}</strong>
                  </span>
                </div>
                <ProjectActions
                  siteId={site.id}
                  slug={site.slug}
                  status={site.status}
                />
                <BrandingToggle
                  siteId={site.id}
                  isPremium={site.isPremium}
                  initialValue={site.removeBranding}
                />
              </div>
            </article>
            );
          })}
        </section>
      ) : (
        <section className="account-empty">
          <Heart size={28} />
          <h2>Здесь появится ваш свадебный сайт</h2>
          <p>Пройдите короткий квиз, и первая версия будет готова через несколько минут.</p>
          <Link href="/quiz">Создать сайт</Link>
        </section>
      )}
    </main>
  );
}
