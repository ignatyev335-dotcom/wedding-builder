"use client";

import { Palette, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import type { DesignThemeOption } from "@/entities/wedding/model";

const fontOptions = [
  ["CORMORANT", "Cormorant Garamond"],
  ["ORANIENBAUM", "Oranienbaum"],
  ["MARCK", "Marck Script"],
  ["CAVEAT", "Caveat"],
  ["BAD_SCRIPT", "Bad Script"],
  ["PLAYFAIR", "Playfair Display"],
  ["MONTSERRAT", "Montserrat"],
] as const;

export function DesignThemePanel({
  initialThemes,
}: {
  initialThemes: DesignThemeOption[];
}) {
  const [themes, setThemes] = useState(initialThemes);
  const [name, setName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#F7F3EC");
  const [primaryColor, setPrimaryColor] = useState("#785D52");
  const [textColor, setTextColor] = useState("#2D2926");
  const [fontFamily, setFontFamily] = useState("CORMORANT");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

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
          fontFamily,
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
      setMessage("Тема сохранена и уже доступна в конструкторе.");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось сохранить тему.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const removeTheme = async (id: string) => {
    const response = await fetch(`/api/admin/design-themes?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setMessage("Не удалось удалить тему.");
      return;
    }
    setThemes((items) => items.filter((item) => item.id !== id));
    setMessage("Тема удалена.");
  };

  return (
    <section className="mx-auto mt-8 max-w-[1500px] rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
      <header className="mb-6 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-stone-900 text-white">
          <Palette size={21} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
            Визуальная система
          </span>
          <h2 className="m-0 text-2xl font-semibold text-stone-900">
            Конструктор стилей и палитр
          </h2>
          <p className="mb-0 mt-2 text-sm text-stone-500">
            Созданные темы сразу появляются у пользователей во вкладке «Стили».
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
            className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none focus:border-stone-500"
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
          Премиальный шрифт
          <select
            className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none focus:border-stone-500"
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value)}
          >
            {fontOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div
          className="min-h-32 overflow-hidden rounded-2xl border border-black/10 p-5 md:col-span-2 xl:col-span-4"
          style={{ color: textColor, backgroundColor }}
        >
          <span className="text-xs uppercase tracking-[0.2em] opacity-60">
            Предпросмотр
          </span>
          <strong className="mt-3 block text-3xl">{name || "Название темы"}</strong>
          <button
            className="mt-4 rounded-full px-5 py-2 text-sm font-semibold"
            style={{ backgroundColor: primaryColor, color: backgroundColor }}
            type="button"
          >
            Главная кнопка
          </button>
        </div>
        <button
          className="flex min-h-12 items-center justify-center gap-2 self-end rounded-xl bg-stone-900 px-5 font-semibold text-white disabled:opacity-60"
          disabled={isSaving}
        >
          <Plus size={17} />
          {isSaving ? "Сохраняем..." : "Сохранить изменения"}
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
            }}
          >
            <span
              className="h-12 w-12 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{theme.name}</strong>
              <small className="block truncate opacity-65">
                {fontOptions.find(([value]) => value === theme.fontFamily)?.[1] ??
                  theme.fontFamily}
              </small>
            </div>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-current/20 bg-white/30"
              type="button"
              aria-label={`Удалить тему ${theme.name}`}
              onClick={() => void removeTheme(theme.id)}
            >
              <Trash2 size={16} />
            </button>
          </article>
        ))}
        {themes.length === 0 && (
          <p className="text-sm text-stone-500">Пользовательских тем пока нет.</p>
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
