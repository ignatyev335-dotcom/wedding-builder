"use client";

import { Loader2, Palette, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  CustomFontOption,
  DesignThemeOption,
} from "@/entities/wedding/model";

const gradientPresets = [
  {
    label: "Без градиента",
    value: "",
  },
  {
    label: "Молочный рассвет",
    value: "radial-gradient(circle at 20% 10%, #fff7ed 0, transparent 34%), linear-gradient(135deg, #f8f3ea 0%, #edf4ec 100%)",
  },
  {
    label: "Пудровое сияние",
    value: "radial-gradient(circle at 80% 0%, #fce7f3 0, transparent 35%), linear-gradient(135deg, #fff7f0 0%, #f4eee7 100%)",
  },
  {
    label: "Вечернее золото",
    value: "radial-gradient(circle at 50% 0%, rgba(212,175,55,.35) 0, transparent 36%), linear-gradient(135deg, #1f1b18 0%, #3a3028 100%)",
  },
] as const;

export function DesignThemePanel({
  initialThemes,
  customFonts,
}: {
  initialThemes: DesignThemeOption[];
  customFonts: CustomFontOption[];
}) {
  const [themes, setThemes] = useState(initialThemes);
  const [availableFonts, setAvailableFonts] = useState(customFonts);
  const [name, setName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#F7F3EC");
  const [primaryColor, setPrimaryColor] = useState("#785D52");
  const [textColor, setTextColor] = useState("#2D2926");
  const [gradientCss, setGradientCss] = useState("");
  const [fontSelection, setFontSelection] = useState(
    customFonts[0] ? `custom:${customFonts[0].id}` : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const selectedCustomFont = useMemo(() => {
    if (!fontSelection.startsWith("custom:")) return null;
    return (
      availableFonts.find(
        (font) => font.id === fontSelection.slice("custom:".length),
      ) ?? null
    );
  }, [availableFonts, fontSelection]);

  useEffect(() => {
    const handleAdded = (event: Event) => {
      const font = (event as CustomEvent<CustomFontOption>).detail;
      setAvailableFonts((items) => [
        font,
        ...items.filter((item) => item.id !== font.id),
      ]);
      setFontSelection((current) => current || `custom:${font.id}`);
    };
    const handleRemoved = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      setAvailableFonts((items) => items.filter((font) => font.id !== id));
      setFontSelection((current) => (current === `custom:${id}` ? "" : current));
    };

    window.addEventListener("vowly:font-added", handleAdded);
    window.addEventListener("vowly:font-removed", handleRemoved);
    return () => {
      window.removeEventListener("vowly:font-added", handleAdded);
      window.removeEventListener("vowly:font-removed", handleRemoved);
    };
  }, []);

  const selectedFontFamily = selectedCustomFont?.family ?? "serif";
  const previewFont = selectedCustomFont
    ? `"${selectedCustomFont.family}", serif`
    : "serif";

  const saveTheme = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/design-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          backgroundColor,
          primaryColor,
          textColor,
          gradientCss: gradientCss.trim() || null,
          fontFamily: selectedFontFamily,
          customFontId: selectedCustomFont?.id ?? null,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        theme?: DesignThemeOption;
      };
      if (!response.ok || !result.theme) {
        throw new Error(result.error || "Не удалось сохранить тему.");
      }

      setThemes((items) => [result.theme!, ...items]);
      setName("");
      setMessage("Тема сохранена и уже доступна в квизе и конструкторе.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось сохранить тему.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const removeTheme = async (id: string) => {
    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/design-themes?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Не удалось удалить тему.");
      }
      setThemes((items) => items.filter((item) => item.id !== id));
      setMessage("Тема удалена.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось удалить тему.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-panel">
      {availableFonts.map((font) => (
        <style key={font.id}>{`@font-face{font-family:${JSON.stringify(
          font.family,
        )};src:url(${JSON.stringify(font.fileUrl)}) format(${JSON.stringify(
          font.format,
        )});font-display:swap;}`}</style>
      ))}

      <header className="admin-card-heading">
        <span className="admin-card-icon">
          <Palette size={21} />
        </span>
        <div>
          <small>Визуальная система</small>
          <h2>Конструктор тем и палитр</h2>
          <p>
            Создавайте единые темы из своих цветов, градиентов и загруженных
            шрифтов. Эти темы сразу попадают в квиз и конструктор.
          </p>
        </div>
      </header>

      <form
        className="grid gap-4 rounded-3xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={saveTheme}
      >
        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          Название темы
          <input
            className="admin-input"
            required
            value={name}
            placeholder="Например, Северное сияние"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <ColorField
          label="Цвет фона"
          value={backgroundColor}
          onChange={setBackgroundColor}
        />
        <ColorField
          label="Цвет кнопок"
          value={primaryColor}
          onChange={setPrimaryColor}
        />
        <ColorField
          label="Цвет текста"
          value={textColor}
          onChange={setTextColor}
        />
        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          Шрифт темы
          <select
            className="admin-input"
            required
            value={fontSelection}
            onChange={(event) => setFontSelection(event.target.value)}
          >
            <option value="" disabled>
              Выберите загруженный шрифт
            </option>
            {availableFonts.map((font) => (
              <option key={font.id} value={`custom:${font.id}`}>
                {font.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-stone-700 md:col-span-2 xl:col-span-5">
          Градиент фона
          <select
            className="admin-input"
            value={gradientCss}
            onChange={(event) => setGradientCss(event.target.value)}
          >
            {gradientPresets.map((preset) => (
              <option key={preset.label} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <textarea
            className="admin-input min-h-24 py-3 font-mono text-xs"
            placeholder="Можно вставить свой CSS-gradient, например linear-gradient(...)"
            value={gradientCss}
            onChange={(event) => setGradientCss(event.target.value)}
          />
        </label>

        <div
          className="min-h-36 overflow-hidden rounded-2xl border border-black/10 p-5 md:col-span-2 xl:col-span-4"
          style={{
            color: textColor,
            backgroundColor,
            backgroundImage: gradientCss || undefined,
            fontFamily: previewFont,
          }}
        >
          <span className="text-xs uppercase tracking-[0.2em] opacity-60">
            Предпросмотр
          </span>
          <strong className="mt-3 block text-3xl">
            {name || "Название темы"}
          </strong>
          <button
            className="mt-4 rounded-full px-5 py-2 text-sm font-semibold"
            style={{ backgroundColor: primaryColor, color: backgroundColor }}
            type="button"
          >
            Главная кнопка
          </button>
        </div>

        <button
          className="admin-primary-button self-end"
          disabled={isSaving || !selectedCustomFont}
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <Plus size={17} />
          )}
          {isSaving ? "Сохраняем..." : "Сохранить тему"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => (
          <article
            className="flex min-w-0 items-center gap-4 rounded-2xl border border-black/10 p-4"
            key={theme.id}
            style={{
              color: theme.textColor,
              backgroundColor: theme.backgroundColor,
              backgroundImage: theme.gradientCss ?? undefined,
              fontFamily: theme.customFont
                ? `"${theme.customFont.family}", serif`
                : theme.fontFamily,
            }}
          >
            <span
              className="h-12 w-12 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{theme.name}</strong>
              <small className="block truncate opacity-65">
                {theme.customFont?.name ?? theme.fontFamily}
              </small>
            </div>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-current/20 bg-white/30 disabled:opacity-60"
              type="button"
              aria-label={`Удалить тему ${theme.name}`}
              disabled={deletingId === theme.id}
              onClick={() => void removeTheme(theme.id)}
            >
              {deletingId === theme.id ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </article>
        ))}
        {themes.length === 0 && (
          <p className="admin-muted">
            Тем пока нет. Создайте первую тему, чтобы она появилась на сайте.
          </p>
        )}
      </div>
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-stone-700">
      {label}
      <span className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 bg-white px-3">
        <input
          className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <code className="text-xs uppercase text-stone-500">{value}</code>
      </span>
    </label>
  );
}
