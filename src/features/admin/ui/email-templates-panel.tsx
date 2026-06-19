"use client";

import { Mail, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

export type AdminEmailTemplate = {
  id: string;
  key: string;
  title: string;
  subject: string;
  previewText: string;
  bodyHtml: string;
  bodyText: string;
  isActive: boolean;
  updatedAt: string;
};

const presets = [
  {
    key: "auth_code",
    title: "Код входа",
    subject: "Ваш код входа в Vowly",
    previewText: "Код действует несколько минут.",
    bodyHtml:
      "<h1>Ваш код входа: {{code}}</h1><p>Введите его на сайте Vowly, чтобы продолжить.</p>",
    bodyText: "Ваш код входа: {{code}}",
  },
  {
    key: "site_created",
    title: "Сайт создан",
    subject: "{{coupleNames}}, ваш свадебный сайт готов",
    previewText: "Ссылка на сайт и следующие шаги внутри письма.",
    bodyHtml:
      "<h1>Ваш сайт готов</h1><p>Ссылка: <a href='{{siteUrl}}'>{{siteUrl}}</a></p><p>Редактировать: <a href='{{dashboardUrl}}'>личный кабинет</a></p>",
    bodyText: "Ваш сайт готов: {{siteUrl}}",
  },
  {
    key: "rsvp_digest",
    title: "Сводка RSVP",
    subject: "Новые ответы гостей на Vowly",
    previewText: "Короткая сводка по гостям.",
    bodyHtml:
      "<h1>Новые ответы гостей</h1><p>Подтвердили: {{accepted}}</p><p>Отказались: {{declined}}</p>",
    bodyText: "Новые ответы гостей. Подтвердили: {{accepted}}, отказались: {{declined}}.",
  },
] as const;

const emptyDraft = {
  key: "",
  title: "",
  subject: "",
  previewText: "",
  bodyHtml: "",
  bodyText: "",
  isActive: true,
};

export function EmailTemplatesPanel({
  initialTemplates,
}: {
  initialTemplates: AdminEmailTemplate[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const applyPreset = (preset: (typeof presets)[number]) => {
    setDraft({ ...preset, isActive: true });
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as {
        template?: AdminEmailTemplate;
        error?: string;
      };
      if (!response.ok || !result.template) {
        throw new Error(result.error || "Не удалось сохранить шаблон.");
      }

      setTemplates((items) => [
        result.template!,
        ...items.filter((item) => item.id !== result.template!.id),
      ]);
      setDraft(emptyDraft);
      setMessage("Шаблон письма сохранен.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить шаблон.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Удалить почтовый шаблон?")) return;
    const previous = templates;
    setTemplates((items) => items.filter((item) => item.id !== id));

    try {
      const response = await fetch(`/api/admin/email-templates?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Не удалось удалить шаблон.");
    } catch (error) {
      setTemplates(previous);
      setMessage(error instanceof Error ? error.message : "Не удалось удалить шаблон.");
    }
  };

  return (
    <section className="admin-panel">
      <header className="admin-panel-heading">
        <span>
          <Mail size={18} />
        </span>
        <div>
          <small>Центр коммуникаций</small>
          <h2>Почтовые шаблоны</h2>
          <p>Коды входа, письма после создания сайта, RSVP-сводки и будущие рассылки.</p>
        </div>
      </header>

      <div className="admin-preset-row">
        {presets.map((preset) => (
          <button key={preset.key} type="button" onClick={() => applyPreset(preset)}>
            <Plus size={15} />
            {preset.title}
          </button>
        ))}
      </div>

      <form className="admin-email-form" onSubmit={save}>
        <input
          value={draft.key}
          onChange={(event) => setDraft((state) => ({ ...state, key: event.target.value }))}
          placeholder="Ключ: auth_code"
        />
        <input
          value={draft.title}
          onChange={(event) => setDraft((state) => ({ ...state, title: event.target.value }))}
          placeholder="Название"
        />
        <input
          value={draft.subject}
          onChange={(event) => setDraft((state) => ({ ...state, subject: event.target.value }))}
          placeholder="Тема письма"
        />
        <input
          value={draft.previewText}
          onChange={(event) =>
            setDraft((state) => ({ ...state, previewText: event.target.value }))
          }
          placeholder="Прехедер"
        />
        <textarea
          value={draft.bodyHtml}
          onChange={(event) => setDraft((state) => ({ ...state, bodyHtml: event.target.value }))}
          placeholder="HTML письма. Можно использовать переменные {{code}}, {{siteUrl}}, {{coupleNames}}"
          rows={7}
        />
        <textarea
          value={draft.bodyText}
          onChange={(event) => setDraft((state) => ({ ...state, bodyText: event.target.value }))}
          placeholder="Текстовая версия письма"
          rows={4}
        />
        <label className="admin-check-row">
          <input
            checked={draft.isActive}
            type="checkbox"
            onChange={(event) =>
              setDraft((state) => ({ ...state, isActive: event.target.checked }))
            }
          />
          Шаблон активен
        </label>
        <button className="admin-primary-button" disabled={isSaving} type="submit">
          <Save size={16} />
          {isSaving ? "Сохраняем..." : "Сохранить шаблон"}
        </button>
      </form>

      <div className="admin-template-list">
        {templates.map((template) => (
          <article key={template.id}>
            <div>
              <strong>{template.title}</strong>
              <small>
                {template.key} · {template.subject}
              </small>
            </div>
            <span className={template.isActive ? "is-active" : ""}>
              {template.isActive ? "Активен" : "Выключен"}
            </span>
            <button type="button" onClick={() => void remove(template.id)}>
              <Trash2 size={16} />
            </button>
          </article>
        ))}
        {!templates.length ? <p>Почтовых шаблонов пока нет.</p> : null}
      </div>
      {message ? <p className="admin-form-message">{message}</p> : null}
    </section>
  );
}
