import { CalendarDays, Car, GlassWater, Heart, Utensils } from "lucide-react";
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

const statusLabelsForGuest = {
  ACCEPTED: "Придет",
  DECLINED: "Не придет",
  PENDING: "Ждем ответ",
} as const;

function parseAlcoholPreferences(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user || user.provider === "ANONYMOUS") redirect("/login");
  if (user.role === "ADMIN") redirect("/admin/dashboard");

  const sites = await prisma.weddingSite.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      data: true,
      guests: {
        orderBy: [{ respondedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          status: true,
          alcoholPreferences: true,
          foodPreference: true,
          partnerFoodPreference: true,
          needsTransport: true,
          transportPreference: true,
          respondedAt: true,
          createdAt: true,
        },
      },
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
            const pending = site.guests.length - accepted - declined;
            const wine = site.guests.filter((guest) =>
              parseAlcoholPreferences(guest.alcoholPreferences).includes("WINE"),
            ).length;
            const champagne = site.guests.filter((guest) =>
              parseAlcoholPreferences(guest.alcoholPreferences).includes("CHAMPAGNE"),
            ).length;
            const strongAlcohol = site.guests.filter((guest) =>
              parseAlcoholPreferences(guest.alcoholPreferences).includes("STRONG"),
            ).length;
            const noAlcohol = site.guests.filter((guest) =>
              parseAlcoholPreferences(guest.alcoholPreferences).includes("NONE"),
            ).length;
            const transferCount = site.guests.filter(
              (guest) =>
                guest.needsTransport ||
                guest.transportPreference === "TRANSFER",
            ).length;
            const menuStats = site.guests.reduce<Record<string, number>>(
              (accumulator, guest) => {
                [guest.foodPreference, guest.partnerFoodPreference]
                  .filter(Boolean)
                  .forEach((item) => {
                    const label = item || "Не выбрано";
                    accumulator[label] = (accumulator[label] ?? 0) + 1;
                  });
                return accumulator;
              },
              {},
            );
            const topMenu = Object.entries(menuStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            const latestResponses = site.guests
              .filter((guest) => guest.respondedAt)
              .slice(0, 4);
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
                <div className="account-guest-command">
                  <article>
                    <span><Heart size={16} /> Гости</span>
                    <strong>{site.guests.length}</strong>
                    <small>{accepted} придут · {declined} отказались · {pending} ждут</small>
                  </article>
                  <article>
                    <span><GlassWater size={16} /> Бар</span>
                    <strong>{wine + champagne + strongAlcohol}</strong>
                    <small>
                      Вино {wine} · Шампанское {champagne} · Крепкое {strongAlcohol} · Не пьют {noAlcohol}
                    </small>
                  </article>
                  <article>
                    <span><Car size={16} /> Трансфер</span>
                    <strong>{transferCount}</strong>
                    <small>гостей отметили, что им нужна помощь с дорогой</small>
                  </article>
                  <article>
                    <span><Utensils size={16} /> Меню</span>
                    <strong>{topMenu[0]?.[0] ?? "Пока нет"}</strong>
                    <small>
                      {topMenu.length
                        ? topMenu.map(([label, count]) => `${label}: ${count}`).join(" · ")
                        : "Предпочтения появятся после первых ответов"}
                    </small>
                  </article>
                </div>
                <div className="account-latest-rsvp">
                  <div>
                    <strong>Последние ответы</strong>
                    <Link href={`/constructor?siteId=${site.id}&tab=guests`}>
                      Открыть CRM
                    </Link>
                  </div>
                  {latestResponses.length ? (
                    latestResponses.map((guest) => (
                      <span key={guest.id}>
                        <b>{guest.name}</b>
                        <i>{statusLabelsForGuest[guest.status]}</i>
                      </span>
                    ))
                  ) : (
                    <p>Когда гости начнут отвечать на приглашения, здесь появится живая лента.</p>
                  )}
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
