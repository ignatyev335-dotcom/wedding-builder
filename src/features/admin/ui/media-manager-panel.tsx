"use client";

import { ImagePlus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export type AdminMediaAsset = {
  id: string;
  name: string;
  type: "ICON" | "STICKER";
  url: string;
};

const maxImageSize = 1_500_000;
const imageExtensions = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

function isImageFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    imageExtensions.some((extension) => file.name.toLowerCase().endsWith(extension))
  );
}

export function MediaManagerPanel({
  initialAssets,
}: {
  initialAssets: AdminMediaAsset[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [name, setName] = useState("");
  const [type, setType] = useState<AdminMediaAsset["type"]>("ICON");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const readFile = (file?: File) => {
    if (!file) return;
    if (!isImageFile(file) || file.size > maxImageSize) {
      setMessage("Выберите SVG, PNG, JPG или WebP размером до 1,5 МБ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/media-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, url }),
      });
      const result = (await response.json()) as {
        error?: string;
        asset?: AdminMediaAsset;
      };
      if (!response.ok || !result.asset) {
        throw new Error(result.error || "Не удалось добавить медиа.");
      }

      setAssets((items) => [result.asset!, ...items]);
      setName("");
      setUrl("");
      setMessage("Медиа добавлено в библиотеку конструктора.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось добавить медиа.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/media-assets?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить медиа.");
      }
      setAssets((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить медиа.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-panel">
      <header className="mb-6 flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-900 text-white">
          <ImagePlus size={21} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
            Медиа-менеджер
          </span>
          <h2 className="m-0 text-2xl font-semibold">Иконки и стикеры</h2>
          <p className="mt-1 text-sm text-stone-500">
            Загружайте аккуратные SVG/PNG/WebP-элементы для будущих шаблонов и блоков.
          </p>
        </div>
      </header>

      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={add}>
        <input
          className="min-h-12 rounded-xl border border-stone-200 bg-stone-50 px-4"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название"
          required
        />
        <select
          className="min-h-12 rounded-xl border border-stone-200 bg-stone-50 px-4"
          value={type}
          onChange={(event) => setType(event.target.value as AdminMediaAsset["type"])}
        >
          <option value="ICON">Иконка</option>
          <option value="STICKER">Стикер</option>
        </select>
        <input
          className="min-h-12 rounded-xl border border-stone-200 bg-stone-50 px-4"
          value={url.startsWith("data:") ? "" : url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://... или /uploads/..."
        />
        <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 text-sm font-semibold text-stone-600">
          Загрузить файл
          <input
            className="hidden"
            type="file"
            accept="image/svg+xml,image/png,image/webp,image/jpeg,.svg,.png,.jpg,.jpeg,.webp"
            onChange={(event) => readFile(event.target.files?.[0])}
          />
        </label>
        <button className="admin-primary-button md:col-span-2 xl:col-span-4" type="submit" disabled={isSaving}>
          <Plus size={16} />
          {isSaving ? "Добавляем..." : "Добавить медиа"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-stone-600">{message}</p> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {assets.map((asset) => (
          <article
            className="rounded-2xl border border-stone-200 bg-stone-50 p-3"
            key={asset.id}
          >
            <div className="relative h-32 overflow-hidden rounded-xl bg-white">
              <Image src={asset.url} alt={asset.name} fill className="object-contain p-4" unoptimized />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate">{asset.name}</strong>
                <small className="text-stone-500">{asset.type === "ICON" ? "Иконка" : "Стикер"}</small>
              </div>
              <button
                className="admin-danger-icon"
                type="button"
                onClick={() => void remove(asset.id)}
                disabled={deletingId === asset.id}
                aria-label="Удалить медиа"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {!assets.length ? (
          <p className="rounded-2xl bg-stone-50 p-5 text-sm text-stone-500">
            Медиа пока не добавлены.
          </p>
        ) : null}
      </div>
    </section>
  );
}
