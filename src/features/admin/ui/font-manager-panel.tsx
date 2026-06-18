"use client";

import { FileType2, Link2, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import type { CustomFontOption } from "@/entities/wedding/model";

type FontFormat = "woff2" | "woff" | "truetype" | "opentype";
type FontSource = "file" | "url";

function detectFontFormat(value: string): FontFormat {
  const lower = value.toLowerCase();
  if (lower.endsWith(".woff")) return "woff";
  if (lower.endsWith(".ttf")) return "truetype";
  if (lower.endsWith(".otf")) return "opentype";
  return "woff2";
}

export function FontManagerPanel({
  initialFonts,
}: {
  initialFonts: CustomFontOption[];
}) {
  const [fonts, setFonts] = useState(initialFonts);
  const [source, setSource] = useState<FontSource>("file");
  const [name, setName] = useState("");
  const [family, setFamily] = useState("");
  const [fontUrl, setFontUrl] = useState("");
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const uploadFont = async (file: File) => {
    const formData = new FormData();
    formData.append("kind", "font");
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as { error?: string; url?: string };
    if (!response.ok || !result.url) {
      throw new Error(result.error || "Не удалось загрузить файл шрифта.");
    }
    return result.url;
  };

  const addFont = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const fileUrl =
        source === "file"
          ? fontFile
            ? await uploadFont(fontFile)
            : ""
          : fontUrl.trim();

      if (!fileUrl) {
        throw new Error(
          source === "file"
            ? "Выберите файл шрифта с компьютера."
            : "Вставьте ссылку на файл шрифта.",
        );
      }

      const response = await fetch("/api/admin/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          family,
          fileUrl,
          format: detectFontFormat(source === "file" ? fontFile?.name ?? fileUrl : fileUrl),
        }),
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
      setFontUrl("");
      setFontFile(null);
      formRef.current?.reset();
      setMessage("Шрифт добавлен и доступен в конструкторе тем.");
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
      window.dispatchEvent(new CustomEvent<string>("vowly:font-removed", { detail: id }));
      setMessage("Шрифт удален.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить шрифт.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-panel">
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
      <header className="admin-card-heading">
        <span className="admin-card-icon">
          <FileType2 size={21} />
        </span>
        <div>
          <small>Типографика</small>
          <h2>Пользовательские шрифты</h2>
          <p>
            Добавляйте шрифты файлом с компьютера или ссылкой. После сохранения их можно выбрать в темах.
          </p>
        </div>
      </header>

      <form
        className="grid gap-3 rounded-3xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_170px_1.4fr_auto]"
        onSubmit={addFont}
        ref={formRef}
      >
        <input
          className="admin-input"
          required
          placeholder="Название в админке"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="admin-input"
          required
          placeholder="CSS-семейство, например Cera Pro"
          value={family}
          onChange={(event) => setFamily(event.target.value)}
        />
        <select
          className="admin-input"
          value={source}
          onChange={(event) => setSource(event.target.value as FontSource)}
        >
          <option value="file">Файл</option>
          <option value="url">Ссылка</option>
        </select>
        {source === "file" ? (
          <input
            className="admin-input"
            accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff"
            type="file"
            onChange={(event) => setFontFile(event.target.files?.[0] ?? null)}
          />
        ) : (
          <input
            className="admin-input"
            type="url"
            placeholder="https://cdn.site/font.woff2"
            value={fontUrl}
            onChange={(event) => setFontUrl(event.target.value)}
          />
        )}
        <button className="admin-primary-button" disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" size={17} /> : source === "file" ? <Upload size={17} /> : <Link2 size={17} />}
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
              <span className="mt-1 block truncate text-xl" style={{ fontFamily: `"${font.family}", serif` }}>
                Александр & Валентина
              </span>
              <small className="block truncate text-stone-500">
                {font.family} · {font.format.toUpperCase()}
              </small>
            </div>
            <button
              className="admin-danger-icon"
              type="button"
              aria-label={`Удалить ${font.name}`}
              disabled={deletingId === font.id}
              onClick={() => void removeFont(font.id)}
            >
              {deletingId === font.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            </button>
          </article>
        ))}
        {fonts.length === 0 && (
          <p className="admin-muted">
            Пользовательских шрифтов пока нет. Добавьте первый файл или ссылку.
          </p>
        )}
      </div>
      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
    </section>
  );
}
