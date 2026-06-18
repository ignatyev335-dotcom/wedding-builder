import {
  Activity,
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  CreditCard,
  Database,
  Gauge,
  Globe2,
  HeartHandshake,
  KeyRound,
  LibraryBig,
  Mail,
  MessageCircle,
  Palette,
  Rocket,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
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
  { href: "#overview", label: "Обзор", icon: Gauge },
  { href: "#catalog", label: "Каталог", icon: LibraryBig },
  { href: "#monetization", label: "Монетизация", icon: TicketPercent },
  { href: "#users", label: "Клиенты", icon: Users },
  { href: "#projects", label: "Проекты", icon: Globe2 },
  { href: "#settings", label: "Настройки", icon: Settings },
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
    ordersCount,
    paidOrdersCount,
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
    mediaAssetsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionPlan: { not: "FREE" } } }),
    prisma.weddingSite.count(),
    prisma.weddingSite.count({ where: { status: "PUBLISHED" } }),
    prisma.guest.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
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
    prisma.mediaAsset.count({ where: { isActive: true } }),
  ]);

  const settingKeys = new Set(settings.map((setting) => setting.key));
  const publishRate = sitesCount ? Math.round((publishedCount / sitesCount) * 100) : 0;
  const paidOrderRate = ordersCount ? Math.round((paidOrdersCount / ordersCount) * 100) : 0;
  const recentSites = sites.slice(0, 5);

  const healthItems = [
    {
      title: "Авторизация",
      description: "Яндекс ID и Telegram для входа клиентов.",
      ready: settingKeys.has("YANDEX_CLIENT_ID") || settingKeys.has("TELEGRAM_BOT_TOKEN"),
      icon: ShieldCheck,
      href: "#settings",
    },
    {
      title: "Почта и коды",
      description: "Отправка кодов входа и писем клиентам.",
      ready: settingKeys.has("RESEND_API_KEY") || settingKeys.has("SMTP_FROM"),
      icon: Mail,
      href: "#settings",
    },
    {
      title: "Платежи",
      description: "ЮKassa или Т-Банк для платных тарифов.",
      ready: settingKeys.has("YOOKASSA_SECRET_KEY") || settingKeys.has("TBANK_PASSWORD"),
      icon: CreditCard,
      href: "#settings",
    },
    {
      title: "Каталог продукта",
      description: "Музыка, тексты, темы и шрифты для конструктора.",
      ready: tracks.length > 0 && templates.length > 0 && designThemes.length > 0,
      icon: LibraryBig,
      href: "#catalog",
    },
  ];

  const launchTasks = [
    { label: "Добавить минимум 3 темы оформления", done: designThemes.length >= 3 },
    { label: "Добавить минимум 5 шаблонов текста", done: templates.length >= 5 },
    { label: "Добавить музыку или отключить блок музыки", done: tracks.length > 0 },
    { label: "Настроить отправку кодов на почту", done: settingKeys.has("RESEND_API_KEY") || settingKeys.has("SMTP_FROM") },
    { label: "Разложить функции по тарифам", done: monetizationFeatures.length >= 6 },
  ];

  return (
    <main className="admin-page admin-control-room">
      <header className="portal-header admin-topbar">
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

      <section className="admin-hero-panel">
        <div>
          <span className="admin-eyebrow">
            <Activity size={15} /> Операционный центр платформы
          </span>
          <h1>Vowly под контролем</h1>
          <p>
            Управляйте каталогом, тарифами, клиентами, проектами, ключами и готовностью продукта из одной спокойной панели.
          </p>
        </div>
        <div className="admin-hero-score">
          <strong>{publishRate}%</strong>
          <span>сайтов опубликовано</span>
        </div>
      </section>

      <nav className="admin-section-nav admin-cms-nav" aria-label="Разделы админки">
        {adminSections.map(({ href, label, icon: Icon }) => (
          <a href={href} key={href}>
            <Icon size={16} />
            {label}
          </a>
        ))}
      </nav>

      <section className="admin-command-grid" id="overview">
        <CommandMetric icon={Users} label="Пользователи" value={usersCount} hint={`${premiumUsersCount} не на FREE`} />
        <CommandMetric icon={Globe2} label="Сайты" value={sitesCount} hint={`${publishedCount} опубликовано`} />
        <CommandMetric icon={HeartHandshake} label="Ответы гостей" value={guestsCount} hint="RSVP и CRM" />
        <CommandMetric icon={CreditCard} label="Оплаты" value={`${paidOrderRate}%`} hint={`${paidOrdersCount} оплачено`} />
      </section>

      <section className="admin-ops-grid">
        <div className="admin-ops-card">
          <CardHeading icon={Gauge} title="Здоровье платформы" subtitle="Что готово к реальной работе" />
          <div className="admin-health-list">
            {healthItems.map((item) => {
              const Icon = item.icon;
              return (
                <a className={item.ready ? "is-ready" : "is-warning"} href={item.href} key={item.title}>
                  <span>
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </div>
                  {item.ready ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </a>
              );
            })}
          </div>
        </div>

        <div className="admin-ops-card">
          <CardHeading icon={Rocket} title="Чек-лист запуска" subtitle="Минимум, чтобы продукт выглядел готовым" />
          <div className="admin-launch-list">
            {launchTasks.map((task) => (
              <div className={task.done ? "is-done" : ""} key={task.label}>
                <span>{task.done ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}</span>
                <p>{task.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-ops-card">
          <CardHeading icon={MessageCircle} title="Последние проекты" subtitle="Быстрый взгляд на новые сайты" />
          <div className="admin-activity-list">
            {recentSites.map((site) => (
              <a href={`/wedding/${site.slug}`} target="_blank" rel="noreferrer" key={site.id}>
                <strong>
                  {site.data?.partnerOneName ?? "Пара"} & {site.data?.partnerTwoName ?? "Vowly"}
                </strong>
                <small>
                  {statusLabels[site.status]} · {site._count.guests} гостей · {site.user.email ?? site.user.name ?? "без контакта"}
                </small>
              </a>
            ))}
            {!recentSites.length ? <p>Пока нет созданных сайтов.</p> : null}
          </div>
        </div>
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

      <section className="admin-section-group" id="catalog">
        <SectionHeader
          eyebrow="Каталог продукта"
          title="Контент, музыка, тексты, шрифты и темы"
          description="Все, что пользователь видит в квизе, конструкторе и на готовом сайте, должно приходить из этой библиотеки. Это главный центр управления вкусом Vowly."
        />
        <div className="admin-catalog-summary">
          <MiniStat icon={BookOpenText} label="Тексты" value={templates.length} />
          <MiniStat icon={Database} label="Треки" value={tracks.length} />
          <MiniStat icon={Palette} label="Темы" value={designThemes.length} />
          <MiniStat icon={SlidersHorizontal} label="Шрифты" value={customFonts.length} />
          <MiniStat icon={LibraryBig} label="Медиа" value={mediaAssetsCount} />
        </div>
        <ContentCatalogPanel initialTracks={tracks} initialTemplates={templates} />
        <FontManagerPanel initialFonts={customFonts} />
        <DesignThemePanel initialThemes={designThemes} customFonts={customFonts} />
      </section>

      <section className="admin-section-group" id="monetization">
        <SectionHeader
          eyebrow="Деньги и ценность"
          title="Монетизация, тарифы и промокоды"
          description="Здесь решается, какие функции бесплатные, какие продаются, какие тарифы стоит продвигать и где давать скидки."
        />
        <PromoCodesPanel
          initialPromoCodes={promoCodes.map((promo) => ({
            ...promo,
            expiresAt: promo.expiresAt?.toISOString() ?? null,
          }))}
        />
        <MonetizationPanel initialFeatures={monetizationFeatures} />
      </section>

      <section className="admin-section-group" id="users">
        <SectionHeader
          eyebrow="Клиенты"
          title="Пользователи и тарифы"
          description="Меняйте тариф вручную, выдавайте премиум, удаляйте тестовые аккаунты и смотрите, у кого сколько проектов."
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
          description="Открывайте живые ссылки, ищите по email или именам пары, фильтруйте статусы, архивируйте и удаляйте без перезагрузки страницы."
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
          eyebrow="Настройки платформы"
          title="Ключи, интеграции и системные тексты"
          description="Яндекс, Telegram, почта, SMS, платежи, аналитика и глобальные тексты интерфейса. Секреты хранятся скрыто и перезаписываются при необходимости."
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
              maskedValue: setting.isSecret ? maskSetting(readableValue) : readableValue,
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

function CardHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Gauge;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="admin-ops-heading">
      <span>
        <Icon size={18} />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </header>
  );
}

function CommandMetric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <article>
      <span>
        <Icon size={19} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: number;
}) {
  return (
    <article>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
