"use client";

import { KeyRound, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type SettingRow = {
  key: string;
  label: string;
  category: string;
  maskedValue: string;
  isSecret: boolean;
  updatedAt: string;
};

const presets = [
  { key: "YANDEX_CLIENT_ID", label: "Yandex ID: Client ID", category: "AUTH", isSecret: false },
  { key: "YANDEX_CLIENT_SECRET", label: "Yandex ID: Client Secret", category: "AUTH", isSecret: true },
  { key: "TELEGRAM_BOT_TOKEN", label: "Telegram bot token", category: "TELEGRAM", isSecret: true },
  { key: "TELEGRAM_BOT_USERNAME", label: "Telegram bot username", category: "TELEGRAM", isSecret: false },
  { key: "TELEGRAM_WEBHOOK_SECRET", label: "Telegram webhook secret", category: "TELEGRAM", isSecret: true },
  { key: "SMTP_HOST", label: "Почта: SMTP host", category: "EMAIL", isSecret: false },
  { key: "SMTP_PORT", label: "Почта: SMTP port", category: "EMAIL", isSecret: false },
  { key: "SMTP_USER", label: "Почта: SMTP login", category: "EMAIL", isSecret: false },
  { key: "SMTP_PASSWORD", label: "Почта: SMTP password", category: "EMAIL", isSecret: true },
  { key: "SMTP_FROM", label: "Почта отправителя", category: "EMAIL", isSecret: false },
  { key: "SUPPORT_EMAIL", label: "Почта поддержки", category: "EMAIL", isSecret: false },
  { key: "RESEND_API_KEY", label: "Resend API key", category: "EMAIL", isSecret: true },
  { key: "YANDEX_METRICA_ID", label: "Яндекс Метрика ID", category: "ANALYTICS", isSecret: false },
  { key: "VK_PIXEL_ID", label: "VK pixel ID", category: "ANALYTICS", isSecret: false },
  { key: "YOOKASSA_SHOP_ID", label: "ЮKassa shopId", category: "PAYMENTS", isSecret: false },
  { key: "YOOKASSA_SECRET_KEY", label: "ЮKassa secret key", category: "PAYMENTS", isSecret: true },
  { key: "TBANK_TERMINAL_KEY", label: "Т-Банк terminal key", category: "PAYMENTS", isSecret: false },
  { key: "TBANK_PASSWORD", label: "Т-Банк password", category: "PAYMENTS", isSecret: true },
] as const;

const categories = ["AUTH", "TELEGRAM", "EMAIL", "ANALYTICS", "PAYMENTS", "OTHER"];

export function SystemSettingsPanel({
  initialSettings,
}: {
  initialSettings: SettingRow[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    key: "",
    label: "",
    category: "AUTH",
    value: "",
    isSecret: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const groupedSettings = useMemo(() => {
    return settings.reduce<Record<string, SettingRow[]>>((acc, setting) => {
      acc[setting.category] = acc[setting.category] ?? [];
      acc[setting.category].push(setting);
      return acc;
    }, {});
  }, [settings]);

  const applyPreset = (preset: (typeof presets)[number]) => {
    setForm((current) => ({
      ...current,
      key: preset.key,
      label: preset.label,
      category: preset.category,
      isSecret: preset.isSecret,
      value: "",
    }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        error?: string;
        setting?: Omit<SettingRow, "maskedValue" | "isSecret">;
      };
      if (!response.ok || !data.setting) {
        throw new Error(data.error ?? "Не удалось сохранить настройку.");
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
        category: "AUTH",
        value: "",
        isSecret: true,
      });
      setMessage("Настройка сохранена.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось сохранить ключ.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (key: string) => {
    setBusyKey(key);
    try {
      const response = await fetch(
        `/api/admin/settings?key=${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setSettings((current) => current.filter((item) => item.key !== key));
      }
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section className="system-settings admin-panel">
      <div className="admin-card-heading">
        <span className="admin-card-icon">
          <KeyRound size={21} />
        </span>
        <div>
          <small>Инфраструктура</small>
          <h2>Системные ключи и почта сайта</h2>
          <p>
            Управляйте авторизацией, Telegram, почтой, аналитикой и платежными
            ключами из одного места. Секреты шифруются перед сохранением.
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {presets.map((preset) => (
          <button
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm transition hover:border-stone-400 hover:bg-white"
            key={preset.key}
            onClick={() => applyPreset(preset)}
            type="button"
          >
            <strong className="block text-stone-900">{preset.label}</strong>
            <span className="text-xs text-stone-500">
              {preset.key} · {preset.category}
            </span>
          </button>
        ))}
      </div>

      <form className="system-settings-form" onSubmit={save}>
        <label>
          <span>Ключ</span>
          <input
            required
            value={form.key}
            placeholder="SMTP_PASSWORD"
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
            placeholder="Пароль SMTP"
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
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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
        {Object.entries(groupedSettings).map(([category, items]) => (
          <div className="grid gap-2" key={category}>
            <h3 className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-stone-400">
              {category}
            </h3>
            {items.map((setting) => (
              <article key={setting.key}>
                <KeyRound size={18} />
                <div>
                  <strong>{setting.label}</strong>
                  <small>
                    {setting.key} · {new Date(setting.updatedAt).toLocaleDateString("ru-RU")}
                  </small>
                </div>
                <code>{setting.maskedValue}</code>
                <button
                  type="button"
                  aria-label={`Удалить ${setting.label}`}
                  disabled={busyKey === setting.key}
                  onClick={() => void remove(setting.key)}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
