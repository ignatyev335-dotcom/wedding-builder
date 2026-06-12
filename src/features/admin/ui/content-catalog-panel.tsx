"use client";

import { Loader2, Music2, Plus, Trash2, Type, WandSparkles } from "lucide-react";
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
  const [isSavingTrack, setIsSavingTrack] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSeedingTracks, setIsSeedingTracks] = useState(false);
  const [isSeedingTemplates, setIsSeedingTemplates] = useState(false);
  const [busyTrackId, setBusyTrackId] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fieldClass =
    "min-h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-stone-500";

  const addTrack = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTrack(true);
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

      const track = result.track;
      setTracks((items) => [...items, track]);
      setTrackTitle("");
      setTrackArtist("");
      setTrackUrl("");
      setMessage("Трек добавлен в библиотеку.");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error ? requestError.message : "Ошибка сохранения.",
      );
    } finally {
      setIsSavingTrack(false);
    }
  };

  const addTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTemplate(true);
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

      const template = result.template;
      setTemplates((items) => [...items, template]);
      setTemplateTitle("");
      setTemplateContent("");
      setMessage("Шаблон добавлен в конструктор.");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error ? requestError.message : "Ошибка сохранения.",
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const seedCatalog = async (type: "tracks" | "templates") => {
    const isTracks = type === "tracks";

    if (isTracks) {
      setIsSeedingTracks(true);
    } else {
      setIsSeedingTemplates(true);
    }

    setMessage("");

    try {
      const response = await fetch(`/api/admin/catalog/${type}/demo`, {
        method: "POST",
      });

      const result = (await response.json()) as {
        error?: string;
        tracks?: AudioTrackOption[];
        templates?: InvitationTemplateOption[];
      };

      if (!response.ok) {
        throw new Error(
          result.error ||
            (isTracks
              ? "Не удалось загрузить демо-треки."
              : "Не удалось загрузить демо-шаблоны."),
        );
      }

      if (isTracks && result.tracks) {
        const demoTracks = result.tracks;
        setTracks((items) => {
          const merged = [...items];
          for (const track of demoTracks) {
            if (!merged.some((item) => item.id === track.id)) {
              merged.push(track);
            }
          }
          return merged;
        });
        setMessage("Демо-треки загружены.");
      }

      if (!isTracks && result.templates) {
        const demoTemplates = result.templates;
        setTemplates((items) => {
          const merged = [...items];
          for (const template of demoTemplates) {
            if (!merged.some((item) => item.id === template.id)) {
              merged.push(template);
            }
          }
          return merged;
        });
        setMessage("Демо-шаблоны загружены.");
      }
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Ошибка загрузки пресетов.",
      );
    } finally {
      if (isTracks) {
        setIsSeedingTracks(false);
      } else {
        setIsSeedingTemplates(false);
      }
    }
  };

  const removeItem = async (type: "tracks" | "templates", id: string) => {
    if (type === "tracks") {
      setBusyTrackId(id);
    } else {
      setBusyTemplateId(id);
    }

    setMessage("");

    try {
      const response = await fetch(`/api/admin/catalog/${type}?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить запись.");
      }

      if (type === "tracks") {
        setTracks((items) => items.filter((item) => item.id !== id));
      } else {
        setTemplates((items) => items.filter((item) => item.id !== id));
      }
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось удалить запись.",
      );
    } finally {
      if (type === "tracks") {
        setBusyTrackId(null);
      } else {
        setBusyTemplateId(null);
      }
    }
  };

  return (
    <section className="mx-auto mt-8 grid max-w-[1500px] gap-6 xl:grid-cols-2">
      <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Music2 size={22} />
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
                Динамический каталог
              </span>
              <h2 className="m-0 text-2xl font-semibold text-stone-900">Музыка</h2>
            </div>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-stone-200 px-4 text-sm text-stone-600 transition hover:border-stone-400 disabled:opacity-60"
            type="button"
            disabled={isSeedingTracks}
            onClick={() => void seedCatalog("tracks")}
          >
            {isSeedingTracks ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <WandSparkles size={15} />
            )}
            Загрузить демо-треки
          </button>
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
            disabled={isSavingTrack}
          >
            {isSavingTrack ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Plus size={17} />
            )}
            {isSavingTrack ? "Сохраняем..." : "Добавить трек"}
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
              <audio
                className="hidden max-w-56 sm:block"
                controls
                preload="none"
                src={track.fileUrl}
              />
              <button
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 disabled:opacity-60"
                type="button"
                aria-label={`Удалить ${track.title}`}
                disabled={busyTrackId === track.id}
                onClick={() => void removeItem("tracks", track.id)}
              >
                {busyTrackId === track.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-sm text-stone-500">Библиотека пока пуста.</p>
          )}
        </div>
      </article>

      <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
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
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-stone-200 px-4 text-sm text-stone-600 transition hover:border-stone-400 disabled:opacity-60"
            type="button"
            disabled={isSeedingTemplates}
            onClick={() => void seedCatalog("templates")}
          >
            {isSeedingTemplates ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <WandSparkles size={15} />
            )}
            Загрузить демо-шаблоны
          </button>
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
            disabled={isSavingTemplate}
          >
            {isSavingTemplate ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Plus size={17} />
            )}
            {isSavingTemplate ? "Сохраняем..." : "Добавить шаблон"}
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
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 disabled:opacity-60"
                type="button"
                aria-label={`Удалить ${template.title}`}
                disabled={busyTemplateId === template.id}
                onClick={() => void removeItem("templates", template.id)}
              >
                {busyTemplateId === template.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
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
