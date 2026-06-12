"use client";

import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SiteAdminActions } from "@/features/admin/ui/site-admin-actions";

type SiteStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type AdminSite = {
  id: string;
  slug: string;
  ownerEmail: string | null;
  ownerName: string | null;
  partnerOneName: string | null;
  partnerTwoName: string | null;
  status: SiteStatus;
  guestsCount: number;
  createdAt: string;
};

const filterOptions = [
  { value: "ALL", label: "Все" },
  { value: "DRAFT", label: "Черновики" },
  { value: "PUBLISHED", label: "Активные" },
  { value: "ARCHIVED", label: "Архивные" },
] as const;

export function AdminSitesPanel({
  initialSites,
  statusLabels,
}: {
  initialSites: AdminSite[];
  statusLabels: Record<SiteStatus, string>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof filterOptions)[number]["value"]>("ALL");

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialSites.filter((site) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : site.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        site.ownerEmail,
        site.ownerName,
        site.partnerOneName,
        site.partnerTwoName,
        site.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [initialSites, query, statusFilter]);

  return (
    <section className="admin-sites">
      <div className="admin-sites-heading gap-4">
        <div>
          <span>Последние 100 проектов</span>
          <h2>Свадебные сайты</h2>
        </div>
        <div className="flex w-full flex-col gap-3 lg:max-w-3xl lg:items-end">
          <label className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 text-stone-500 shadow-sm lg:max-w-xl">
            <Search size={18} />
            <input
              className="w-full bg-transparent text-base text-stone-900 outline-none"
              type="search"
              value={query}
              placeholder="Поиск по email, именам пары или slug"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  statusFilter === option.value
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                }`}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
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
        {filteredSites.map((site) => (
          <article key={site.id}>
            <div>
              <strong>
                {site.partnerOneName || site.partnerTwoName
                  ? `${site.partnerOneName ?? "Пара"} & ${site.partnerTwoName ?? "Vowly"}`
                  : site.slug}
              </strong>
              <a
                className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900"
                href={`/wedding/${site.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <small>/wedding/{site.slug}</small>
                <ExternalLink size={14} />
              </a>
            </div>
            <div>
              <span>{site.ownerEmail || site.ownerName || "Анонимный пользователь"}</span>
              <small>{site.createdAt}</small>
            </div>
            <span className={`admin-status status-${site.status.toLowerCase()}`}>
              {statusLabels[site.status]}
            </span>
            <strong>{site.guestsCount}</strong>
            <SiteAdminActions
              siteId={site.id}
              isArchived={site.status === "ARCHIVED"}
            />
          </article>
        ))}
        {filteredSites.length === 0 && (
          <article>
            <div className="col-span-full py-2 text-sm text-stone-500">
              Ничего не найдено. Попробуйте изменить запрос или фильтр.
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
