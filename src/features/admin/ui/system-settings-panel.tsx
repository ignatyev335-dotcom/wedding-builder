"use client";

import { KeyRound, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

type SettingRow = {
  key: string;
  label: string;
  category: string;
  maskedValue: string;
  isSecret: boolean;
  updatedAt: string;
};

export function SystemSettingsPanel({
  initialSettings,
}: {
  initialSettings: SettingRow[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    key: "",
    label: "",
    category: "INTEGRATIONS",
    value: "",
    isSecret: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as {
      error?: string;
      setting?: Omit<SettingRow, "maskedValue" | "isSecret">;
    };
    setIsSaving(false);
    if (!response.ok || !data.setting) {
      setMessage(data.error ?? "Не удалось сохранить настройку.");
      return;
    }

    const next: SettingRow = {
      ...data.setting,
      maskedValue: form.isSecret ? "••••••••" : form.value,
      isSecret: form.isSecret,
      updatedAt: new Date(data.setting.updatedAt).toISOString(),
    };
    setSettings((current) => [
      next,
      ...current.filter((item) => item.key !== next.key),
    ]);
    setForm({
      key: "",
      label: "",
      category: "INTEGRATIONS",
      value: "",
      isSecret: true,
    });
    setMessage("Настройка сохранена и зашифрована.");
  };

  const remove = async (key: string) => {
    const response = await fetch(
      `/api/admin/settings?key=${encodeURIComponent(key)}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      setSettings((current) => current.filter((item) => item.key !== key));
    }
  };

  return (
    <section className="system-settings">
      <div className="admin-sites-heading">
        <div>
          <span>Интеграции платформы</span>
          <h2>Системные ключи</h2>
          <p>Секретные значения шифруются перед сохранением в PostgreSQL.</p>
        </div>
      </div>

      <form className="system-settings-form" onSubmit={save}>
        <label>
          <span>Ключ</span>
          <input
            required
            value={form.key}
            placeholder="PAYMENT_API_KEY"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                key: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
              }))
            }
          />
        </label>
        <label>
          <span>Название</span>
          <input
            required
            value={form.label}
            placeholder="Ключ платёжного шлюза"
            onChange={(event) =>
              setForm((current) => ({ ...current, label: event.target.value }))
            }
          />
        </label>
        <label>
          <span>Категория</span>
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="INTEGRATIONS">Интеграции</option>
            <option value="PAYMENTS">Платежи</option>
            <option value="EMAIL">Почта</option>
            <option value="ANALYTICS">Аналитика</option>
          </select>
        </label>
        <label>
          <span>Значение</span>
          <input
            required
            type={form.isSecret ? "password" : "text"}
            value={form.value}
            placeholder="Вставьте значение"
            onChange={(event) =>
              setForm((current) => ({ ...current, value: event.target.value }))
            }
          />
        </label>
        <label className="system-settings-secret">
          <input
            type="checkbox"
            checked={form.isSecret}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isSecret: event.target.checked,
              }))
            }
          />
          <span>Секретный ключ</span>
        </label>
        <button type="submit" disabled={isSaving}>
          {form.key ? <Save size={16} /> : <Plus size={16} />}
          {isSaving ? "Сохраняем..." : "Сохранить ключ"}
        </button>
        {message && <p>{message}</p>}
      </form>

      <div className="system-settings-list">
        {settings.map((setting) => (
          <article key={setting.key}>
            <KeyRound size={18} />
            <div>
              <strong>{setting.label}</strong>
              <small>{setting.key} · {setting.category}</small>
            </div>
            <code>{setting.maskedValue}</code>
            <button
              type="button"
              aria-label={`Удалить ${setting.label}`}
              onClick={() => void remove(setting.key)}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
