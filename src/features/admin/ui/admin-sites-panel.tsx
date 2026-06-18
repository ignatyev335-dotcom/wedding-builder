"use client";

import { ExternalLink, Loader2, Search, Trash2 } from "lucide-react";
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
  const [sites, setSites] = useState(initialSites);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof filterOptions)[number]["value"]>("ALL");

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sites.filter((site) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : site.status === statusFilter;

      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;

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
  }, [sites, query, statusFilter]);

  const visibleIds = filteredSites.map((site) => site.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelected = (siteId: string) => {
    setSelectedIds((ids) =>
      ids.includes(siteId)
        ? ids.filter((id) => id !== siteId)
        : [...ids, siteId],
    );
  };

  const toggleVisibleSelected = () => {
    setSelectedIds((ids) =>
      allVisibleSelected
        ? ids.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...ids, ...visibleIds])),
    );
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Удалить выбранные сайты: ${selectedIds.length}?`)) return;

    setIsBulkDeleting(true);
    setMessage("");

    const idsToDelete = [...selectedIds];
    try {
      await Promise.all(
        idsToDelete.map(async (id) => {
          const response = await fetch(`/api/admin/sites/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Не удалось удалить часть сайтов.");
        }),
      );
      setSites((items) => items.filter((site) => !idsToDelete.includes(site.id)));
      setSelectedIds([]);
      setMessage("Выбранные сайты удалены.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось удалить сайты.",
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          className="admin-secondary-button"
          type="button"
          onClick={toggleVisibleSelected}
        >
          {allVisibleSelected ? "Снять выбор" : "Выбрать видимые"}
        </button>
        <button
          className="admin-secondary-button text-red-700"
          type="button"
          disabled={selectedIds.length === 0 || isBulkDeleting}
          onClick={() => void bulkDelete()}
        >
          {isBulkDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
          Удалить выбранные ({selectedIds.length})
        </button>
        {message && <span className="text-sm text-stone-500">{message}</span>}
      </div>

      <div className="admin-table">
        <div className="admin-table-head">
          <span>Выбор</span>
          <span>Проект</span>
          <span>Владелец</span>
          <span>Статус</span>
          <span>Гости</span>
          <span>Действия</span>
        </div>
        {filteredSites.map((site) => (
          <article key={site.id}>
            <label className="flex items-center">
              <input
                className="h-5 w-5 accent-stone-900"
                type="checkbox"
                checked={selectedIds.includes(site.id)}
                onChange={() => toggleSelected(site.id)}
              />
            </label>
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
              onStatusChange={(siteId, status) =>
                setSites((items) =>
                  items.map((item) =>
                    item.id === siteId ? { ...item, status } : item,
                  ),
                )
              }
              onRemove={(siteId) => {
                setSites((items) => items.filter((item) => item.id !== siteId));
                setSelectedIds((ids) => ids.filter((id) => id !== siteId));
              }}
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
