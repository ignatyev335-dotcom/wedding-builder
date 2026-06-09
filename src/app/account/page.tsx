import { CalendarDays, ExternalLink, Heart, Pencil, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandingToggle } from "@/features/account/ui/branding-toggle";
import { LogoutButton } from "@/features/auth/ui/logout-button";
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
  if (user.role === "ADMIN") redirect("/admin/dashboard");

  const sites = await prisma.weddingSite.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      data: true,
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
          {sites.map((site) => (
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
                <div className="account-actions">
                  <Link href={`/constructor?siteId=${site.id}`}>
                    <Pencil size={16} />
                    Перейти в конструктор
                  </Link>
                  <Link href={`/constructor?siteId=${site.id}&tab=guests`}>
                    <Users size={16} />
                    Посмотреть ответы гостей (CRM)
                  </Link>
                  <Link href={`/wedding/${site.slug}`} target="_blank">
                    <ExternalLink size={16} />
                    Открыть сайт
                  </Link>
                </div>
                <BrandingToggle
                  siteId={site.id}
                  isPremium={site.isPremium}
                  initialValue={site.removeBranding}
                />
              </div>
            </article>
          ))}
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
