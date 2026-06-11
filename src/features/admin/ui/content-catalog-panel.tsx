"use client";

import { Music2, Plus, Trash2, Type } from "lucide-react";
import { useState } from "react";

import type {
  AudioTrackOption,
  InvitationTemplateOption,
} from "@/entities/wedding/model";

export function ContentCatalogPanel({
  initialTracks,
  initialTemplates,
}: {
  initialTracks: AudioTrackOption[];
  initialTemplates: InvitationTemplateOption[];
}) {
  const [tracks, setTracks] = useState(initialTracks);
  const [templates, setTemplates] = useState(initialTemplates);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const addTrack = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/catalog/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trackTitle,
          artist: trackArtist,
          fileUrl: trackUrl,
          isActive: true,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        track?: AudioTrackOption;
      };
      if (!response.ok || !result.track) {
        throw new Error(result.error || "Не удалось добавить трек.");
      }
      setTracks((items) => [...items, result.track!]);
      setTrackTitle("");
      setTrackArtist("");
      setTrackUrl("");
      setMessage("Трек добавлен в библиотеку.");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error ? requestError.message : "Ошибка сохранения.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const addTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/catalog/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateTitle,
          content: templateContent,
          isActive: true,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        template?: InvitationTemplateOption;
      };
      if (!response.ok || !result.template) {
        throw new Error(result.error || "Не удалось добавить шаблон.");
      }
      setTemplates((items) => [...items, result.template!]);
      setTemplateTitle("");
      setTemplateContent("");
      setMessage("Шаблон добавлен в конструктор.");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error ? requestError.message : "Ошибка сохранения.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (
    type: "tracks" | "templates",
    id: string,
  ) => {
    setMessage("");
    const response = await fetch(`/api/admin/catalog/${type}?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setMessage("Не удалось удалить запись.");
      return;
    }
    if (type === "tracks") {
      setTracks((items) => items.filter((item) => item.id !== id));
    } else {
      setTemplates((items) => items.filter((item) => item.id !== id));
    }
  };

  const fieldClass =
    "min-h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-stone-500";

  return (
    <section className="mx-auto mt-8 grid max-w-[1500px] gap-6 xl:grid-cols-2">
      <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <Music2 size={22} />
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
              Динамический каталог
            </span>
            <h2 className="m-0 text-2xl font-semibold text-stone-900">Музыка</h2>
          </div>
        </div>
        <form className="grid gap-3" onSubmit={addTrack}>
          <input
            className={fieldClass}
            required
            placeholder="Название трека"
            value={trackTitle}
            onChange={(event) => setTrackTitle(event.target.value)}
          />
          <input
            className={fieldClass}
            required
            placeholder="Исполнитель"
            value={trackArtist}
            onChange={(event) => setTrackArtist(event.target.value)}
          />
          <input
            className={fieldClass}
            required
            type="url"
            placeholder="https://.../track.mp3"
            value={trackUrl}
            onChange={(event) => setTrackUrl(event.target.value)}
          />
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 font-semibold text-white disabled:opacity-60"
            disabled={isSaving}
          >
            <Plus size={17} /> Добавить трек
          </button>
        </form>
        <div className="mt-5 grid gap-2">
          {tracks.map((track) => (
            <div
              className="flex min-w-0 items-center gap-3 rounded-2xl bg-stone-50 p-3"
              key={track.id}
            >
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{track.title}</strong>
                <small className="block truncate text-stone-500">
                  {track.artist}
                </small>
              </div>
              <audio className="hidden max-w-56 sm:block" controls preload="none" src={track.fileUrl} />
              <button
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700"
                type="button"
                aria-label={`Удалить ${track.title}`}
                onClick={() => void removeItem("tracks", track.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-sm text-stone-500">Библиотека пока пуста.</p>
          )}
        </div>
      </article>

      <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <Type size={22} />
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
              Динамический каталог
            </span>
            <h2 className="m-0 text-2xl font-semibold text-stone-900">
              Тексты приглашений
            </h2>
          </div>
        </div>
        <form className="grid gap-3" onSubmit={addTemplate}>
          <input
            className={fieldClass}
            required
            placeholder="Название шаблона"
            value={templateTitle}
            onChange={(event) => setTemplateTitle(event.target.value)}
          />
          <textarea
            className={`${fieldClass} min-h-36 py-3`}
            required
            placeholder="Текст. Можно использовать {names}, {partnerOne}, {partnerTwo}."
            value={templateContent}
            onChange={(event) => setTemplateContent(event.target.value)}
          />
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 font-semibold text-white disabled:opacity-60"
            disabled={isSaving}
          >
            <Plus size={17} /> Добавить шаблон
          </button>
        </form>
        <div className="mt-5 grid gap-2">
          {templates.map((template) => (
            <div
              className="flex min-w-0 items-start gap-3 rounded-2xl bg-stone-50 p-3"
              key={template.id}
            >
              <div className="min-w-0 flex-1">
                <strong className="block">{template.title}</strong>
                <p className="m-0 mt-1 line-clamp-3 text-sm text-stone-500">
                  {template.content}
                </p>
              </div>
              <button
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700"
                type="button"
                aria-label={`Удалить ${template.title}`}
                onClick={() => void removeItem("templates", template.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-sm text-stone-500">Шаблоны пока не добавлены.</p>
          )}
        </div>
        {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
      </article>
    </section>
  );
}
