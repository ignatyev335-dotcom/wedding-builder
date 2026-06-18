"use client";

import { Loader2, Music2, Plus, Tag, Trash2, Type } from "lucide-react";
import { useRef, useState } from "react";

import type {
  AudioTrackOption,
  InvitationTemplateOption,
} from "@/entities/wedding/model";

const templateCategories = [
  { value: "classic", label: "Классические" },
  { value: "warm", label: "Теплые" },
  { value: "modern", label: "Современные" },
  { value: "funny", label: "С юмором" },
  { value: "minimal", label: "Минимализм" },
] as const;

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
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateCategory, setTemplateCategory] = useState("classic");
  const [templateContent, setTemplateContent] = useState("");
  const [isSavingTrack, setIsSavingTrack] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const trackFormRef = useRef<HTMLFormElement>(null);

  const fieldClass =
    "min-h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-stone-500";

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("kind", "audio");
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { error?: string; url?: string };
    if (!response.ok || !result.url) {
      throw new Error(result.error || "Не удалось загрузить MP3-файл.");
    }
    return result.url;
  };

  const addTrack = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trackFile) {
      setMessage("Выберите MP3-файл с компьютера.");
      return;
    }

    setIsSavingTrack(true);
    setMessage("");

    try {
      const fileUrl = await uploadFile(trackFile);
      const response = await fetch("/api/admin/catalog/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trackTitle,
          artist: trackArtist,
          fileUrl,
          isActive: true,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        track?: AudioTrackOption;
      };
      if (!response.ok || !result.track) {
        throw new Error(result.error || "Не удалось добавить трек в базу.");
      }

      setTracks((items) => [result.track!, ...items]);
      setTrackTitle("");
      setTrackArtist("");
      setTrackFile(null);
      trackFormRef.current?.reset();
      setMessage("Трек добавлен в базу и сразу появится в конструкторе.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения трека.");
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
          category: templateCategory,
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

      setTemplates((items) => [result.template!, ...items]);
      setTemplateTitle("");
      setTemplateCategory("classic");
      setTemplateContent("");
      setMessage("Шаблон добавлен и сразу появится в конструкторе.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ошибка сохранения шаблона.",
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const removeItem = async (type: "tracks" | "templates", id: string) => {
    setBusyId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/catalog/${type}?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить запись.");
      }

      if (type === "tracks") {
        setTracks((items) => items.filter((item) => item.id !== id));
      } else {
        setTemplates((items) => items.filter((item) => item.id !== id));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить запись.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="admin-section-grid">
      <article className="admin-card">
        <PanelTitle
          icon={<Music2 size={22} />}
          eyebrow="Каталог музыки"
          title="Треки для приглашений"
          description="Загружайте MP3 с компьютера. После сохранения трек сразу доступен в квизе и конструкторе."
        />
        <form className="grid gap-3" onSubmit={addTrack} ref={trackFormRef}>
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
            placeholder="Исполнитель или настроение"
            value={trackArtist}
            onChange={(event) => setTrackArtist(event.target.value)}
          />
          <input
            className={fieldClass}
            required
            accept="audio/mpeg,audio/mp3,.mp3"
            type="file"
            onChange={(event) => setTrackFile(event.target.files?.[0] ?? null)}
          />
          <button className="admin-primary-button" disabled={isSavingTrack}>
            {isSavingTrack ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            {isSavingTrack ? "Загружаем..." : "Добавить трек"}
          </button>
        </form>
        <div className="mt-5 grid gap-2">
          {tracks.map((track) => (
            <div className="admin-list-row" key={track.id}>
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{track.title}</strong>
                <small className="block truncate text-stone-500">{track.artist}</small>
              </div>
              <audio className="hidden max-w-56 sm:block" controls preload="none" src={track.fileUrl} />
              <button
                className="admin-danger-icon"
                type="button"
                aria-label={`Удалить ${track.title}`}
                disabled={busyId === track.id}
                onClick={() => void removeItem("tracks", track.id)}
              >
                {busyId === track.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              </button>
            </div>
          ))}
          {tracks.length === 0 && <p className="admin-muted">Библиотека музыки пока пустая.</p>}
        </div>
      </article>

      <article className="admin-card">
        <PanelTitle
          icon={<Type size={22} />}
          eyebrow="Тексты"
          title="Шаблоны приглашений"
          description="Разделяйте тексты по тегам: так пользователю проще выбрать тон приглашения."
        />
        <form className="grid gap-3" onSubmit={addTemplate}>
          <input
            className={fieldClass}
            required
            placeholder="Название шаблона"
            value={templateTitle}
            onChange={(event) => setTemplateTitle(event.target.value)}
          />
          <select
            className={fieldClass}
            value={templateCategory}
            onChange={(event) => setTemplateCategory(event.target.value)}
          >
            {templateCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <textarea
            className={`${fieldClass} min-h-36 py-3`}
            required
            placeholder="Текст. Можно использовать {names}, {partnerOne}, {partnerTwo}."
            value={templateContent}
            onChange={(event) => setTemplateContent(event.target.value)}
          />
          <button className="admin-primary-button" disabled={isSavingTemplate}>
            {isSavingTemplate ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            {isSavingTemplate ? "Сохраняем..." : "Добавить шаблон"}
          </button>
        </form>
        <div className="mt-5 grid gap-2">
          {templates.map((template) => (
            <div className="admin-list-row items-start" key={template.id}>
              <div className="min-w-0 flex-1">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
                  <Tag size={12} />
                  {templateCategories.find((item) => item.value === template.category)?.label ?? "Классические"}
                </span>
                <strong className="block">{template.title}</strong>
                <p className="m-0 mt-1 line-clamp-3 text-sm text-stone-500">{template.content}</p>
              </div>
              <button
                className="admin-danger-icon"
                type="button"
                aria-label={`Удалить ${template.title}`}
                disabled={busyId === template.id}
                onClick={() => void removeItem("templates", template.id)}
              >
                {busyId === template.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              </button>
            </div>
          ))}
          {templates.length === 0 && <p className="admin-muted">Шаблоны пока не добавлены.</p>}
        </div>
        {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
      </article>
    </section>
  );
}

function PanelTitle({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="admin-card-heading">
      <span className="admin-card-icon">{icon}</span>
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}
