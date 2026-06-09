import { Database, Globe2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/features/auth/ui/logout-button";
import { SiteAdminActions } from "@/features/admin/ui/site-admin-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusLabels = {
  DRAFT: "Черновик",
  PUBLISHED: "Активен",
  ARCHIVED: "Деактивирован",
} as const;

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [usersCount, sitesCount, sites] = await Promise.all([
    prisma.user.count(),
    prisma.weddingSite.count(),
    prisma.weddingSite.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        data: {
          select: {
            partnerOneName: true,
            partnerTwoName: true,
            weddingDate: true,
          },
        },
        _count: { select: { guests: true } },
      },
      take: 100,
    }),
  ]);

  return (
    <main className="admin-page">
      <header className="portal-header">
        <Link className="brand" href="/">
          vowly
        </Link>
        <div>
          <span>
            <ShieldCheck size={15} /> Суперадмин
          </span>
          <LogoutButton />
        </div>
      </header>

      <section className="admin-heading">
        <span>Центр управления</span>
        <h1>Платформа под контролем</h1>
        <p>Пользователи, проекты и состояние публикаций в одном окне.</p>
      </section>

      <section className="admin-stats">
        <article>
          <Users size={20} />
          <span>Всего пользователей</span>
          <strong>{usersCount}</strong>
        </article>
        <article>
          <Globe2 size={20} />
          <span>Всего сайтов</span>
          <strong>{sitesCount}</strong>
        </article>
        <article>
          <Database size={20} />
          <span>PostgreSQL</span>
          <strong>{sitesCount}</strong>
        </article>
        <article>
          <Database size={20} />
          <span>SQLite</span>
          <strong>0</strong>
        </article>
      </section>

      <section className="admin-sites">
        <div className="admin-sites-heading">
          <div>
            <span>Последние 100 проектов</span>
            <h2>Свадебные сайты</h2>
          </div>
        </div>
        <div className="admin-table">
          <div className="admin-table-head">
            <span>Проект</span>
            <span>Владелец</span>
            <span>Статус</span>
            <span>Гости</span>
            <span>Действия</span>
          </div>
          {sites.map((site) => (
            <article key={site.id}>
              <div>
                <strong>
                  {site.data
                    ? `${site.data.partnerOneName} & ${site.data.partnerTwoName}`
                    : site.slug}
                </strong>
                <small>/wedding/{site.slug}</small>
              </div>
              <div>
                <span>{site.user.email || site.user.name || "Анонимный пользователь"}</span>
                <small>{site.createdAt.toLocaleDateString("ru-RU")}</small>
              </div>
              <span className={`admin-status status-${site.status.toLowerCase()}`}>
                {statusLabels[site.status]}
              </span>
              <strong>{site._count.guests}</strong>
              <SiteAdminActions
                siteId={site.id}
                isArchived={site.status === "ARCHIVED"}
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
