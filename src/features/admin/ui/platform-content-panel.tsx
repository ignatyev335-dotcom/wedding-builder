"use client";

import { LayoutGrid, Save, Type } from "lucide-react";
import { useState } from "react";

export type PlatformContentDraft = {
  greetingEnabled: boolean;
  timelineEnabled: boolean;
  dressCodeEnabled: boolean;
  mapEnabled: boolean;
  rsvpEnabled: boolean;
  primaryButtonText: string;
  footerText: string;
  errorText: string;
};

const sections: Array<{
  key: keyof Pick<
    PlatformContentDraft,
    | "greetingEnabled"
    | "timelineEnabled"
    | "dressCodeEnabled"
    | "mapEnabled"
    | "rsvpEnabled"
  >;
  label: string;
}> = [
  { key: "greetingEnabled", label: "Приветствие" },
  { key: "timelineEnabled", label: "Тайминг" },
  { key: "dressCodeEnabled", label: "Дресс-код" },
  { key: "mapEnabled", label: "Карта" },
  { key: "rsvpEnabled", label: "RSVP-форма" },
];

export function PlatformContentPanel({
  initialContent,
}: {
  initialContent: PlatformContentDraft;
}) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить.");
      setMessage("Глобальные настройки сохранены.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto mt-8 grid max-w-[1500px] gap-6 xl:grid-cols-2">
      <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <PanelTitle
          icon={<LayoutGrid size={21} />}
          eyebrow="Конструктор секций"
          title="Структура свадебных сайтов"
        />
        <div className="mt-6 grid gap-3">
          {sections.map((section) => (
            <label
              className="flex min-h-14 cursor-pointer items-center justify-between rounded-2xl bg-stone-50 px-4"
              key={section.key}
            >
              <span className="font-medium text-stone-800">{section.label}</span>
              <input
                className="h-5 w-5 accent-stone-900"
                type="checkbox"
                checked={content[section.key]}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    [section.key]: event.target.checked,
                  }))
                }
              />
            </label>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
        <PanelTitle
          icon={<Type size={21} />}
          eyebrow="Текстовая матрица"
          title="Глобальные тексты интерфейса"
        />
        <div className="mt-6 grid gap-4">
          <TextField
            label="Заголовок главной кнопки"
            value={content.primaryButtonText}
            onChange={(primaryButtonText) =>
              setContent((current) => ({ ...current, primaryButtonText }))
            }
          />
          <TextField
            label="Текст подвала"
            value={content.footerText}
            onChange={(footerText) =>
              setContent((current) => ({ ...current, footerText }))
            }
          />
          <TextField
            label="Текст ошибки"
            value={content.errorText}
            multiline
            onChange={(errorText) =>
              setContent((current) => ({ ...current, errorText }))
            }
          />
        </div>
      </article>

      <div className="xl:col-span-2">
        <button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 font-semibold text-white disabled:opacity-60"
          type="button"
          disabled={isSaving}
          onClick={() => void save()}
        >
          <Save size={17} />
          {isSaving ? "Сохраняем..." : "Сохранить настройки CMS"}
        </button>
        {message && <p className="mt-3 text-sm text-stone-600">{message}</p>}
      </div>
    </section>
  );
}

function PanelTitle({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-stone-900 text-white">
        {icon}
      </span>
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
          {eyebrow}
        </span>
        <h2 className="m-0 text-2xl font-semibold text-stone-900">{title}</h2>
      </div>
    </header>
  );
}

function TextField({
  label,
  value,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const className =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-500";
  return (
    <label className="grid gap-2 text-sm font-semibold text-stone-700">
      {label}
      {multiline ? (
        <textarea
          className={`${className} min-h-24`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={className}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
