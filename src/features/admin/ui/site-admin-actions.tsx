"use client";

import { ArchiveRestore, Loader2, Power, Trash2 } from "lucide-react";
import { useState } from "react";

export function SiteAdminActions({
  siteId,
  isArchived,
  onStatusChange,
  onRemove,
}: {
  siteId: string;
  isArchived: boolean;
  onStatusChange: (siteId: string, status: "DRAFT" | "ARCHIVED") => void;
  onRemove: (siteId: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateStatus = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: isArchived }),
      });
      const result = (await response.json()) as {
        status?: "DRAFT" | "ARCHIVED";
        error?: string;
      };
      if (!response.ok || !result.status) {
        throw new Error(result.error || "Не удалось изменить статус.");
      }
      onStatusChange(siteId, result.status);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось изменить статус.");
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Удалить сайт и все связанные данные безвозвратно?")) {
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить сайт.");
      }
      onRemove(siteId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить сайт.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-site-actions">
      <button type="button" disabled={isLoading} onClick={() => void updateStatus()}>
        {isLoading ? (
          <Loader2 className="animate-spin" size={14} />
        ) : isArchived ? (
          <ArchiveRestore size={14} />
        ) : (
          <Power size={14} />
        )}
        {isArchived ? "Вернуть" : "В архив"}
      </button>
      <button className="is-danger" type="button" disabled={isLoading} onClick={() => void remove()}>
        {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
        Удалить
      </button>
      {message && <small className="text-red-600">{message}</small>}
    </div>
  );
}
