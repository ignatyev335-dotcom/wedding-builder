"use client";

import { Check, Copy, EyeOff, ExternalLink, Pencil, Rocket, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ProjectActions({
  siteId,
  slug,
  status,
}: {
  siteId: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState("");

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/wedding/${slug}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const updateStatus = async (nextStatus: "PUBLISHED" | "ARCHIVED") => {
    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/wedding-sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as {
        status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
        error?: string;
      };

      if (!response.ok || !payload.status) {
        throw new Error(payload.error || "Не удалось обновить статус сайта.");
      }

      setCurrentStatus(payload.status);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось обновить статус сайта.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="dashboard-actions">
      <Link href={`/constructor?siteId=${siteId}`}>
        <Pencil size={16} /> Редактировать дизайн
      </Link>
      <Link href={`/constructor?siteId=${siteId}&tab=guests`}>
        <Users size={16} /> Ваши любимые гости
      </Link>
      <button type="button" onClick={copyPublicLink}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
      </button>
      {currentStatus === "PUBLISHED" ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void updateStatus("ARCHIVED")}
        >
          <EyeOff size={16} /> Скрыть сайт от гостей
        </button>
      ) : (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void updateStatus("PUBLISHED")}
        >
          <Rocket size={16} /> Опубликовать
        </button>
      )}
      <Link className="dashboard-open-site" href={`/wedding/${slug}`} target="_blank">
        <ExternalLink size={16} /> Открыть сайт
      </Link>
      {error ? <p className="dashboard-action-error">{error}</p> : null}
    </div>
  );
}
