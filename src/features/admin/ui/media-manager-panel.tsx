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

  const readFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1_500_000) {
      setMessage("Выберите SVG, PNG или WebP размером до 1,5 МБ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

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
      setMessage(result.error || "Не удалось добавить медиа.");
      return;
    }

    setAssets((items) => [result.asset!, ...items]);
    setName("");
    setUrl("");
    setMessage("Медиа добавлено в библиотеку конструктора.");
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/admin/media-assets?id=${id}`, {
      method: "DELETE",
    });
    if (response.ok) setAssets((items) => items.filter((item) => item.id !== id));
  };

  return (
    <section className="mx-auto mt-8 max-w-[1500px] rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
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
            accept="image/svg+xml,image/png,image/webp,image/jpeg"
            onChange={(event) => readFile(event.target.files?.[0])}
          />
        </label>
        <button className="admin-primary-button md:col-span-2 xl:col-span-4" type="submit">
          <Plus size={16} />
          Добавить медиа
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
