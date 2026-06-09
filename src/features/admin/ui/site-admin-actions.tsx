"use client";

import { ArchiveRestore, Power, Trash2 } from "lucide-react";
import { useState } from "react";

export function SiteAdminActions({
  siteId,
  isArchived,
}: {
  siteId: string;
  isArchived: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/admin/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: isArchived }),
    });
    setIsLoading(false);
    if (response.ok) window.location.reload();
  };

  const remove = async () => {
    if (!window.confirm("Удалить сайт и все связанные данные безвозвратно?")) {
      return;
    }
    setIsLoading(true);
    const response = await fetch(`/api/admin/sites/${siteId}`, {
      method: "DELETE",
    });
    setIsLoading(false);
    if (response.ok) window.location.reload();
  };

  return (
    <div className="admin-site-actions">
      <button type="button" disabled={isLoading} onClick={() => void updateStatus()}>
        {isArchived ? <ArchiveRestore size={14} /> : <Power size={14} />}
        {isArchived ? "Вернуть" : "Деактивировать"}
      </button>
      <button
        className="is-danger"
        type="button"
        disabled={isLoading}
        onClick={() => void remove()}
      >
        <Trash2 size={14} />
        Удалить
      </button>
    </div>
  );
}
