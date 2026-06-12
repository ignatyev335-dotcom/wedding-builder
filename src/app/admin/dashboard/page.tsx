import { Database, Globe2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSitesPanel } from "@/features/admin/ui/admin-sites-panel";
import { AdminLogoutButton } from "@/features/admin/ui/admin-logout-button";
import { ContentCatalogPanel } from "@/features/admin/ui/content-catalog-panel";
import { DesignThemePanel } from "@/features/admin/ui/design-theme-panel";
import { MediaManagerPanel } from "@/features/admin/ui/media-manager-panel";
import {
  PlatformContentPanel,
  type PlatformContentDraft,
} from "@/features/admin/ui/platform-content-panel";
import { SystemSettingsPanel } from "@/features/admin/ui/system-settings-panel";
import { UserPlansPanel } from "@/features/admin/ui/user-plans-panel";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { decryptSetting, maskSetting } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

const statusLabels = {
  DRAFT: "Черновик",
  PUBLISHED: "Активен",
  ARCHIVED: "Архив",
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
    platformContent,
    mediaAssets,
    managedUsers,
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
    prisma.platformContent.findUnique({ where: { id: "global" } }),
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, url: true },
    }),
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        _count: { select: { weddingSites: true } },
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
        <p>Пользователи, проекты, библиотека контента и ключевые настройки в одном окне.</p>
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

      <ContentCatalogPanel initialTracks={tracks} initialTemplates={templates} />

      <DesignThemePanel initialThemes={designThemes} />

      <PlatformContentPanel
        initialContent={
          (platformContent ?? {
            greetingEnabled: true,
            timelineEnabled: true,
            dressCodeEnabled: true,
            mapEnabled: true,
            rsvpEnabled: true,
            primaryButtonText: "Отправить ответ",
            footerText: "Создано на Vowly",
            errorText: "Что-то пошло не так. Попробуйте ещё раз.",
          }) satisfies PlatformContentDraft
        }
      />

      <MediaManagerPanel initialAssets={mediaAssets} />

      <UserPlansPanel
        initialUsers={managedUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan,
          sitesCount: user._count.weddingSites,
        }))}
      />

      <AdminSitesPanel
        initialSites={sites.map((site) => ({
          id: site.id,
          slug: site.slug,
          ownerEmail: site.user.email,
          ownerName: site.user.name,
          partnerOneName: site.data?.partnerOneName ?? null,
          partnerTwoName: site.data?.partnerTwoName ?? null,
          status: site.status,
          guestsCount: site._count.guests,
          createdAt: site.createdAt.toLocaleDateString("ru-RU"),
        }))}
        statusLabels={statusLabels}
      />
    </main>
  );
}
