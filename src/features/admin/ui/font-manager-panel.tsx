"use client";

import { FileType2, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import type { CustomFontOption } from "@/entities/wedding/model";

type FontFormat = "woff2" | "woff" | "truetype" | "opentype";

export function FontManagerPanel({
  initialFonts,
}: {
  initialFonts: CustomFontOption[];
}) {
  const [fonts, setFonts] = useState(initialFonts);
  const [name, setName] = useState("");
  const [family, setFamily] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [format, setFormat] = useState<FontFormat>("woff2");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const addFont = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, family, fileUrl, format }),
      });
      const result = (await response.json()) as {
        error?: string;
        font?: CustomFontOption;
      };

      if (!response.ok || !result.font) {
        throw new Error(result.error || "Не удалось добавить шрифт.");
      }

      const font = result.font;
      setFonts((items) => [font, ...items]);
      window.dispatchEvent(
        new CustomEvent<CustomFontOption>("vowly:font-added", { detail: font }),
      );
      setName("");
      setFamily("");
      setFileUrl("");
      setMessage("Шрифт добавлен и доступен при создании тем.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось добавить шрифт.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeFont = async (id: string) => {
    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/fonts?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить шрифт.");
      }
      setFonts((items) => items.filter((font) => font.id !== id));
      window.dispatchEvent(
        new CustomEvent<string>("vowly:font-removed", { detail: id }),
      );
      setMessage("Шрифт удалён. Темы, которые его использовали, вернутся к резервному шрифту.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить шрифт.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mx-auto mt-8 max-w-[1500px] rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
      <style>
        {fonts
          .map(
            (font) =>
              `@font-face{font-family:${JSON.stringify(font.family)};src:url(${JSON.stringify(
                font.fileUrl,
              )}) format(${JSON.stringify(font.format)});font-display:swap;}`,
          )
          .join("\n")}
      </style>
      <header className="mb-6 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-stone-900 text-white">
          <FileType2 size={21} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
            Типографика
          </span>
          <h2 className="m-0 text-2xl font-semibold text-stone-900">
            Пользовательские шрифты
          </h2>
          <p className="mb-0 mt-2 text-sm text-stone-500">
            Подключайте файлы WOFF2, WOFF, TTF или OTF по HTTPS-ссылке. Лучше всего
            использовать WOFF2: он меньше и быстрее загружается у гостей.
          </p>
        </div>
      </header>

      <form
        className="grid gap-3 rounded-3xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_160px_auto]"
        onSubmit={addFont}
      >
        <input
          className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 outline-none focus:border-stone-500"
          required
          placeholder="Название в админке"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 outline-none focus:border-stone-500"
          required
          placeholder="CSS-семейство, например Cera Pro"
          value={family}
          onChange={(event) => setFamily(event.target.value)}
        />
        <input
          className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 outline-none focus:border-stone-500"
          required
          type="url"
          placeholder="https://cdn.example.ru/font.woff2"
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
        />
        <select
          className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 outline-none"
          value={format}
          onChange={(event) =>
            setFormat(event.target.value as FontFormat)
          }
        >
          <option value="woff2">WOFF2</option>
          <option value="woff">WOFF</option>
          <option value="truetype">TTF</option>
          <option value="opentype">OTF</option>
        </select>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 font-semibold text-white disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
          Добавить
        </button>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fonts.map((font) => (
          <article
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 p-4"
            key={font.id}
          >
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{font.name}</strong>
              <span
                className="mt-1 block truncate text-xl"
                style={{ fontFamily: `"${font.family}", serif` }}
              >
                Александр & Валентина
              </span>
              <small className="block truncate text-stone-500">
                {font.family} · {font.format.toUpperCase()}
              </small>
            </div>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 disabled:opacity-60"
              type="button"
              aria-label={`Удалить ${font.name}`}
              disabled={deletingId === font.id}
              onClick={() => void removeFont(font.id)}
            >
              {deletingId === font.id ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </article>
        ))}
        {fonts.length === 0 && (
          <p className="text-sm text-stone-500">
            Пользовательских шрифтов пока нет. Встроенные шрифты продолжат работать.
          </p>
        )}
      </div>
      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
    </section>
  );
}
