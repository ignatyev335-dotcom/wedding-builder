"use client";

import { Check, Copy, ExternalLink, Pencil, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ProjectActions({
  siteId,
  slug,
}: {
  siteId: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/wedding/${slug}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
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
      <Link className="dashboard-open-site" href={`/wedding/${slug}`} target="_blank">
        <ExternalLink size={16} /> Открыть сайт
      </Link>
    </div>
  );
}
