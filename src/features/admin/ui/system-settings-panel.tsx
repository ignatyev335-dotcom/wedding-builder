"use client";

import { CheckCircle2, KeyRound, PlugZap, Plus, Save, Trash2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

type SettingRow = {
  key: string;
  label: string;
  category: string;
  maskedValue: string;
  isSecret: boolean;
  updatedAt: string;
};

type ConnectionTestKind =
  | "email"
  | "telegram-bot"
  | "telegram-message"
  | "yandex-auth"
  | "maps"
  | "payments";

type ConnectionTestResult = {
  ok: boolean;
  title: string;
  message: string;
};

const presets = [
  { key: "AUTH_YANDEX_ID", label: "Яндекс ID: Client ID", category: "AUTH", isSecret: false },
  { key: "AUTH_YANDEX_SECRET", label: "Яндекс ID: Client Secret", category: "AUTH", isSecret: true },
  { key: "TELEGRAM_BOT_TOKEN", label: "Telegram: токен бота", category: "TELEGRAM", isSecret: true },
  { key: "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", label: "Telegram: username бота", category: "TELEGRAM", isSecret: false },
  { key: "TELEGRAM_WEBHOOK_SECRET", label: "Telegram: секрет вебхука", category: "TELEGRAM", isSecret: true },
  { key: "TELEGRAM_TEST_CHAT_ID", label: "Telegram: тестовый chat_id", category: "TELEGRAM", isSecret: false },
  { key: "RESEND_API_KEY", label: "Почта: Resend API key", category: "EMAIL", isSecret: true },
  { key: "EMAIL_FROM", label: "Почта: отправитель", category: "EMAIL", isSecret: false },
  { key: "SUPPORT_EMAIL", label: "Почта поддержки", category: "EMAIL", isSecret: false },
  { key: "SMS_API_KEY", label: "SMS: API key", category: "SMS", isSecret: true },
  { key: "SMS_SENDER", label: "SMS: подпись отправителя", category: "SMS", isSecret: false },
  { key: "YANDEX_GEOCODER_API_KEY", label: "Яндекс Геокодер: API key", category: "MAPS", isSecret: true },
  { key: "YANDEX_METRICA_ID", label: "Яндекс Метрика ID", category: "ANALYTICS", isSecret: false },
  { key: "VK_PIXEL_ID", label: "VK pixel ID", category: "ANALYTICS", isSecret: false },
  { key: "YOOKASSA_SHOP_ID", label: "ЮKassa: shopId", category: "PAYMENTS", isSecret: false },
  { key: "YOOKASSA_SECRET_KEY", label: "ЮKassa: secret key", category: "PAYMENTS", isSecret: true },
  { key: "TBANK_TERMINAL_KEY", label: "Т-Банк: terminal key", category: "PAYMENTS", isSecret: false },
  { key: "TBANK_PASSWORD", label: "Т-Банк: password", category: "PAYMENTS", isSecret: true },
] as const;

const connectionTests: { kind: ConnectionTestKind; title: string; description: string }[] = [
  { kind: "email", title: "Почта", description: "Отправить тестовое письмо через Resend" },
  { kind: "telegram-bot", title: "Telegram-бот", description: "Проверить токен через getMe" },
  { kind: "telegram-message", title: "Telegram-сообщение", description: "Отправить тест в TELEGRAM_TEST_CHAT_ID" },
  { kind: "yandex-auth", title: "Яндекс ID", description: "Проверить наличие OAuth-ключей" },
  { kind: "maps", title: "Карты", description: "Проверить Яндекс Геокодер" },
  { kind: "payments", title: "Платежи", description: "Проверить заполненность ключей" },
];

const categories = ["AUTH", "TELEGRAM", "EMAIL", "SMS", "MAPS", "ANALYTICS", "PAYMENTS", "OTHER"];

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
  const [testTarget, setTestTarget] = useState("");
  const [testingKind, setTestingKind] = useState<ConnectionTestKind | null>(null);
  const [testResults, setTestResults] = useState<Partial<Record<ConnectionTestKind, ConnectionTestResult>>>({});

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
      setMessage("Настройка сохранена. Telegram, почта, карты и платежные проверки подхватят ее сразу.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось сохранить ключ.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runTest = async (kind: ConnectionTestKind) => {
    setTestingKind(kind);
    try {
      const response = await fetch("/api/admin/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, target: testTarget || undefined }),
      });
      const result = (await response.json()) as ConnectionTestResult;
      setTestResults((current) => ({ ...current, [kind]: result }));
    } catch {
      setTestResults((current) => ({
        ...current,
        [kind]: {
          ok: false,
          title: "Проверка сорвалась",
          message: "Не удалось выполнить запрос. Проверьте соединение и попробуйте снова.",
        },
      }));
    } finally {
      setTestingKind(null);
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
            Управляйте Telegram, почтой, SMS, картами, аналитикой и платежами из одного места.
            Секретные значения шифруются перед сохранением.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-[28px] border border-stone-200 bg-white/70 p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Диагностика подключений</p>
            <h3 className="m-0 mt-1 text-xl font-semibold text-stone-900">Проверить, что сервисы реально работают</h3>
          </div>
          <label className="grid gap-1 text-sm font-semibold text-stone-600 lg:w-80">
            Email или Telegram chat_id для теста
            <input
              className="min-h-11 rounded-2xl border border-stone-200 bg-white px-4 outline-none focus:border-stone-500"
              value={testTarget}
              placeholder="mail@example.ru или 123456789"
              onChange={(event) => setTestTarget(event.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {connectionTests.map((test) => {
            const result = testResults[test.kind];
            return (
              <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={test.kind}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-stone-900">{test.title}</strong>
                    <small className="text-stone-500">{test.description}</small>
                  </div>
                  {result ? (
                    result.ok ? <CheckCircle2 className="text-emerald-600" size={20} /> : <XCircle className="text-red-600" size={20} />
                  ) : (
                    <PlugZap className="text-stone-400" size={20} />
                  )}
                </div>
                {result ? (
                  <p className={`mt-3 text-sm leading-6 ${result.ok ? "text-emerald-800" : "text-red-700"}`}>
                    <b>{result.title}.</b> {result.message}
                  </p>
                ) : null}
                <button
                  className="mt-3 min-h-10 w-full rounded-full bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-50"
                  type="button"
                  disabled={testingKind === test.kind}
                  onClick={() => void runTest(test.kind)}
                >
                  {testingKind === test.kind ? "Проверяем..." : "Проверить"}
                </button>
              </article>
            );
          })}
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
            placeholder="TELEGRAM_BOT_TOKEN"
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
            placeholder="Telegram: токен бота"
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
