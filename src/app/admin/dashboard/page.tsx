import { Database, Globe2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/features/admin/ui/admin-logout-button";
import { ContentCatalogPanel } from "@/features/admin/ui/content-catalog-panel";
import { DesignThemePanel } from "@/features/admin/ui/design-theme-panel";
import { SiteAdminActions } from "@/features/admin/ui/site-admin-actions";
import { SystemSettingsPanel } from "@/features/admin/ui/system-settings-panel";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { decryptSetting, maskSetting } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

const statusLabels = {
  DRAFT: "Черновик",
  PUBLISHED: "Активен",
  ARCHIVED: "Деактивирован",
} as const;

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin");

  const [
    usersCount,
    sitesCount,
    publishedCount,
    guestsCount,
    sites,
    settings,
    tracks,
    templates,
    designThemes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.weddingSite.count(),
    prisma.weddingSite.count({ where: { status: "PUBLISHED" } }),
    prisma.guest.count(),
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
    prisma.systemSetting.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.audioTrack.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, artist: true, fileUrl: true },
    }),
    prisma.invitationTemplate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, content: true },
    }),
    prisma.designTheme.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        backgroundColor: true,
        primaryColor: true,
        textColor: true,
        fontFamily: true,
      },
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
          <AdminLogoutButton />
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
          <span>Опубликовано</span>
          <strong>{publishedCount}</strong>
        </article>
        <article>
          <Database size={20} />
          <span>Ответов гостей</span>
          <strong>{guestsCount}</strong>
        </article>
      </section>

      <SystemSettingsPanel
        initialSettings={settings.map((setting) => {
          let readableValue = setting.value;
          if (setting.isSecret) {
            try {
              readableValue = decryptSetting(setting.value);
            } catch {
              readableValue = "";
            }
          }
          return {
            key: setting.key,
            label: setting.label,
            category: setting.category,
            maskedValue: setting.isSecret
              ? maskSetting(readableValue)
              : readableValue,
            isSecret: setting.isSecret,
            updatedAt: setting.updatedAt.toISOString(),
          };
        })}
      />

      <ContentCatalogPanel
        initialTracks={tracks}
        initialTemplates={templates}
      />

      <DesignThemePanel initialThemes={designThemes} />

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
