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
      setMessage("Выберите SVG/PNG/WebP размером до 1,5 МБ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        </div>
      </header>

      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={add}>
        <input
          className="min-h-12 rounded-xl border border-stone-200 bg-stone-50 px-4"
          required
          placeholder="Название"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <select
          className="min-h-12 rounded-xl border border-stone-200 bg-stone-50 px-4"
          value={type}
          onChange={(event) => setType(event.target.value as AdminMediaAsset["type"])}
        >
          <option value="ICON">SVG-иконка</option>
          <option value="STICKER">PNG-стикер</option>
        </select>
        <input
          className="min-h-12 rounded-xl border border-stone-200 bg-stone-50 px-4"
          required
          placeholder="https://... или загрузите файл"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 text-sm font-semibold">
          Загрузить SVG / PNG
          <input
            className="hidden"
            type="file"
            accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
            onChange={(event) => readFile(event.target.files?.[0])}
          />
        </label>
        <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 font-semibold text-white md:col-span-2 xl:col-span-4">
          <Plus size={17} /> Добавить в библиотеку
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-stone-600">{message}</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {assets.map((asset) => (
          <article
            className="relative grid min-h-40 place-items-center rounded-2xl bg-stone-50 p-4 text-center"
            key={asset.id}
          >
            <Image
              className="h-20 w-20 object-contain"
              src={asset.url}
              width={80}
              height={80}
              unoptimized
              alt=""
            />
            <div className="min-w-0">
              <strong className="block truncate text-sm">{asset.name}</strong>
              <small className="text-stone-500">
                {asset.type === "ICON" ? "Иконка" : "Стикер"}
              </small>
            </div>
            <button
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-red-700 shadow-sm"
              type="button"
              aria-label={`Удалить ${asset.name}`}
              onClick={() => void remove(asset.id)}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
