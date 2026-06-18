import {
  Database,
  Globe2,
  LayoutDashboard,
  Palette,
  Settings,
  ShieldCheck,
  TicketPercent,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminInsightsPanel } from "@/features/admin/ui/admin-insights-panel";
import { AdminLogoutButton } from "@/features/admin/ui/admin-logout-button";
import { AdminSitesPanel } from "@/features/admin/ui/admin-sites-panel";
import { ContentCatalogPanel } from "@/features/admin/ui/content-catalog-panel";
import { DesignThemePanel } from "@/features/admin/ui/design-theme-panel";
import { FontManagerPanel } from "@/features/admin/ui/font-manager-panel";
import { MonetizationPanel } from "@/features/admin/ui/monetization-panel";
import {
  PlatformContentPanel,
  type PlatformContentDraft,
} from "@/features/admin/ui/platform-content-panel";
import { PromoCodesPanel } from "@/features/admin/ui/promo-codes-panel";
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

const adminSections = [
  { href: "#overview", label: "Обзор", icon: LayoutDashboard },
  { href: "#sales", label: "Продажи", icon: TicketPercent },
  { href: "#content", label: "Контент", icon: Database },
  { href: "#design", label: "Дизайн", icon: Palette },
  { href: "#users", label: "Пользователи", icon: Users },
  { href: "#projects", label: "Проекты", icon: Globe2 },
  { href: "#settings", label: "Ключи", icon: Settings },
] as const;

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "ADMIN") redirect("/admin");

  const [
    usersCount,
    premiumUsersCount,
    sitesCount,
    publishedCount,
    guestsCount,
    sites,
    settings,
    tracks,
    templates,
    designThemes,
    customFonts,
    platformContent,
    managedUsers,
    monetizationFeatures,
    promoCodes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionPlan: { not: "FREE" } } }),
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
      select: { id: true, title: true, category: true, content: true },
    }),
    prisma.designTheme.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        backgroundColor: true,
        primaryColor: true,
        textColor: true,
        gradientCss: true,
        fontFamily: true,
        customFont: {
          select: {
            id: true,
            name: true,
            family: true,
            fileUrl: true,
            format: true,
          },
        },
      },
    }),
    prisma.customFont.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        family: true,
        fileUrl: true,
        format: true,
      },
    }),
    prisma.platformContent.findUnique({ where: { id: "global" } }),
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
    prisma.monetizationFeature.findMany({
      orderBy: [{ plan: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        plan: true,
        sortOrder: true,
        isActive: true,
      },
    }),
    prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        description: true,
        discountPercent: true,
        targetPlan: true,
        maxRedemptions: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
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
        <span>Центр управления платформой</span>
        <h1>Vowly под контролем</h1>
        <p>
          Контент, дизайн, продажи, пользователи, проекты и ключи собраны в
          одном рабочем пространстве.
        </p>
      </section>

      <nav className="admin-section-nav" aria-label="Разделы админки">
        {adminSections.map(({ href, label, icon: Icon }) => (
          <a href={href} key={href}>
            <Icon size={16} />
            {label}
          </a>
        ))}
      </nav>

      <section className="admin-stats">
        <article>
          <Users size={20} />
          <span>Пользователей</span>
          <strong>{usersCount}</strong>
        </article>
        <article>
          <Globe2 size={20} />
          <span>Сайтов</span>
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

      <AdminInsightsPanel
        usersCount={usersCount}
        sitesCount={sitesCount}
        publishedCount={publishedCount}
        guestsCount={guestsCount}
        tracksCount={tracks.length}
        templatesCount={templates.length}
        themesCount={designThemes.length}
        premiumUsersCount={premiumUsersCount}
      />

      <section className="admin-section-group" id="sales">
        <SectionHeader
          eyebrow="Деньги и упаковка"
          title="Продажи, тарифы и промокоды"
          description="Здесь решается, что продаем, кому даем скидку и какие функции входят в каждый пакет."
        />
        <PromoCodesPanel
          initialPromoCodes={promoCodes.map((promo) => ({
            ...promo,
            expiresAt: promo.expiresAt?.toISOString() ?? null,
          }))}
        />
        <MonetizationPanel initialFeatures={monetizationFeatures} />
      </section>

      <section className="admin-section-group" id="content">
        <SectionHeader
          eyebrow="Библиотека продукта"
          title="Контент, музыка и тексты"
          description="Все, что пользователь выбирает в квизе и конструкторе, должно приходить отсюда."
        />
        <ContentCatalogPanel initialTracks={tracks} initialTemplates={templates} />
      </section>

      <section className="admin-section-group" id="design">
        <SectionHeader
          eyebrow="Визуальная система"
          title="Шрифты и темы"
          description="Управляйте типографикой, цветами, градиентами и стилями без правок кода."
        />
        <FontManagerPanel initialFonts={customFonts} />
        <DesignThemePanel initialThemes={designThemes} customFonts={customFonts} />
      </section>

      <section className="admin-section-group" id="users">
        <SectionHeader
          eyebrow="Клиенты"
          title="Пользователи и тарифы"
          description="Меняйте тариф вручную, выдавайте премиум и удаляйте тестовые аккаунты."
        />
        <UserPlansPanel
          initialUsers={managedUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            subscriptionPlan: user.subscriptionPlan,
            sitesCount: user._count.weddingSites,
          }))}
        />
      </section>

      <section className="admin-section-group" id="projects">
        <SectionHeader
          eyebrow="Проекты"
          title="Свадебные сайты"
          description="Смотрите живые ссылки, фильтруйте проекты, архивируйте и удаляйте без перезагрузки страницы."
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
      </section>

      <section className="admin-section-group" id="settings">
        <SectionHeader
          eyebrow="Платформа"
          title="Ключи, тексты и глобальные настройки"
          description="API-ключи, SMTP, Telegram, платежи, аналитика и системные тексты."
        />
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
              errorText: "Что-то пошло не так. Попробуйте еще раз.",
            }) satisfies PlatformContentDraft
          }
        />
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="admin-section-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}
