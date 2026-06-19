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
  FileClock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuditLogPanel } from "@/features/admin/ui/audit-log-panel";
import { AdminInsightsPanel } from "@/features/admin/ui/admin-insights-panel";
import { AdminLogoutButton } from "@/features/admin/ui/admin-logout-button";
import { AdminSitesPanel } from "@/features/admin/ui/admin-sites-panel";
import { CatalogWorkspace } from "@/features/admin/ui/catalog-workspace";
import { EmailTemplatesPanel } from "@/features/admin/ui/email-templates-panel";
import { MonetizationPanel } from "@/features/admin/ui/monetization-panel";
import {
  PlatformContentPanel,
  type PlatformContentDraft,
} from "@/features/admin/ui/platform-content-panel";
import { PromoCodesPanel } from "@/features/admin/ui/promo-codes-panel";
import { ProductAnalyticsPanel } from "@/features/admin/ui/product-analytics-panel";
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
  { id: "overview", label: "Обзор", icon: Gauge },
  { id: "operations", label: "Операции", icon: Rocket },
  { id: "catalog", label: "Каталог", icon: LibraryBig },
  { id: "monetization", label: "Монетизация", icon: TicketPercent },
  { id: "email", label: "Почта", icon: Mail },
  { id: "analytics", label: "Аналитика", icon: Activity },
  { id: "users", label: "Клиенты", icon: Users },
  { id: "projects", label: "Проекты", icon: Globe2 },
  { id: "settings", label: "Интеграции", icon: Settings },
  { id: "logs", label: "Логи", icon: FileClock },
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
    mediaAssets,
    emailTemplates,
    auditLogs,
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
    prisma.mediaAsset.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
      },
    }),
    prisma.emailTemplate.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        key: true,
        title: true,
        subject: true,
        previewText: true,
        bodyHtml: true,
        bodyText: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        actorEmail: true,
        action: true,
        targetType: true,
        targetId: true,
        description: true,
        createdAt: true,
      },
    }),
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
          <Link className="admin-soft-link" href="/admin/visual-editor">
            <Eye size={15} /> Визуальный редактор
          </Link>
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

      <section className="admin-tab-shell">
        {adminSections.map((section, index) => (
          <input
            className="admin-tab-input"
            defaultChecked={index === 0}
            id={`admin-tab-${section.id}`}
            key={section.id}
            name="admin-dashboard-tab"
            type="radio"
          />
        ))}

        <nav className="admin-section-nav admin-cms-nav admin-tab-list" aria-label="Разделы админки">
          {adminSections.map(({ id, label, icon: Icon }) => (
            <label htmlFor={`admin-tab-${id}`} key={id}>
              <Icon size={16} />
              {label}
            </label>
          ))}
        </nav>

        <div className="admin-tab-panels">
          <section className="admin-tab-panel" data-tab="overview" id="overview">
            <div className="admin-command-grid">
              <CommandMetric icon={Users} label="Пользователи" value={usersCount} hint={`${premiumUsersCount} не на FREE`} />
              <CommandMetric icon={Globe2} label="Сайты" value={sitesCount} hint={`${publishedCount} опубликовано`} />
              <CommandMetric icon={HeartHandshake} label="Ответы гостей" value={guestsCount} hint="RSVP и CRM" />
              <CommandMetric icon={CreditCard} label="Оплаты" value={`${paidOrderRate}%`} hint={`${paidOrdersCount} оплачено`} />
            </div>

            <div className="admin-ops-grid">
              <div className="admin-ops-card">
                <CardHeading icon={Gauge} title="Здоровье платформы" subtitle="Что готово к реальной работе" />
                <div className="admin-health-list">
                  {healthItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <label
                        className={item.ready ? "is-ready" : "is-warning"}
                        htmlFor={`admin-tab-${item.href.replace("#", "")}`}
                        key={item.title}
                      >
                        <span>
                          <Icon size={18} />
                        </span>
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </div>
                        {item.ready ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      </label>
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
            </div>

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
          </section>

          <section className="admin-tab-panel admin-section-group" data-tab="operations" id="operations">
            <SectionHeader
              eyebrow="Операционный контур"
              title="Запуск, качество и быстрые действия"
              description="Отдельная рабочая зона для контроля готовности платформы: что уже настроено, где риск, что нужно закрыть перед продажами."
            />
            <div className="admin-ops-grid">
              <div className="admin-ops-card">
                <CardHeading icon={Gauge} title="Здоровье платформы" subtitle="Критичные системы продукта" />
                <div className="admin-health-list">
                  {healthItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <label
                        className={item.ready ? "is-ready" : "is-warning"}
                        htmlFor={`admin-tab-${item.href.replace("#", "")}`}
                        key={item.title}
                      >
                        <span>
                          <Icon size={18} />
                        </span>
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </div>
                        {item.ready ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="admin-ops-card">
                <CardHeading icon={Rocket} title="Чек-лист запуска" subtitle="Минимальный набор для боевого продукта" />
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
                <CardHeading icon={ShieldCheck} title="Правила взрослого продукта" subtitle="Что держим под контролем всегда" />
                <div className="admin-launch-list">
                  {[
                    "Все изменяемое управляется из админки, а не из кода.",
                    "Публикация требует входа, чтобы сайт не потерялся.",
                    "Кодировка проверяется перед каждой сборкой.",
                    "Публичная ссылка и CRM доступны из личного кабинета.",
                    "Тарифы и функции можно менять без разработки.",
                  ].map((item) => (
                    <div className="is-done" key={item}>
                      <span><CheckCircle2 size={16} /></span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="admin-tab-panel admin-section-group" data-tab="catalog" id="catalog">
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
              <MiniStat icon={LibraryBig} label="Медиа" value={mediaAssets.length} />
            </div>
            <CatalogWorkspace
              tracks={tracks}
              templates={templates}
              designThemes={designThemes}
              customFonts={customFonts}
              mediaAssets={mediaAssets}
            />
          </section>

          <section className="admin-tab-panel admin-section-group" data-tab="monetization" id="monetization">
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

          <section className="admin-tab-panel admin-section-group" data-tab="email" id="email">
            <SectionHeader
              eyebrow="Коммуникации"
              title="Почта, коды входа и рассылки"
              description="Шаблоны писем для входа, создания сайта, RSVP-сводок и будущих уведомлений клиентам."
            />
            <EmailTemplatesPanel
              initialTemplates={emailTemplates.map((template) => ({
                ...template,
                updatedAt: template.updatedAt.toISOString(),
              }))}
            />
          </section>

          <section className="admin-tab-panel admin-section-group" data-tab="analytics" id="analytics">
            <SectionHeader
              eyebrow="Аналитика"
              title="Воронка продукта и поведение пользователей"
              description="Смотрите, как люди проходят путь от входа и квиза до публикации, RSVP и оплаты."
            />
            <ProductAnalyticsPanel
              usersCount={usersCount}
              sitesCount={sitesCount}
              publishedCount={publishedCount}
              guestsCount={guestsCount}
              ordersCount={ordersCount}
              paidOrdersCount={paidOrdersCount}
              templatesCount={templates.length}
              tracksCount={tracks.length}
              themesCount={designThemes.length}
            />
          </section>

          <section className="admin-tab-panel admin-section-group" data-tab="users" id="users">
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

          <section className="admin-tab-panel admin-section-group" data-tab="projects" id="projects">
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

          <section className="admin-tab-panel admin-section-group" data-tab="settings" id="settings">
            <SectionHeader
              eyebrow="Интеграции и тексты"
              title="Ключи, сервисы и системные сообщения"
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

          <section className="admin-tab-panel admin-section-group" data-tab="logs" id="logs">
            <SectionHeader
              eyebrow="Аудит"
              title="Логи действий и изменений"
              description="Критичные изменения в платформе фиксируются здесь: настройки, тарифы, каталоги, почтовые шаблоны."
            />
            <AuditLogPanel
              logs={auditLogs.map((log) => ({
                ...log,
                createdAt: log.createdAt.toLocaleString("ru-RU"),
              }))}
            />
          </section>
        </div>
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
