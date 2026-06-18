"use client";

import { GripVertical, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import type {
  MonetizationFeatureOption,
  MonetizationPlan,
} from "@/entities/wedding/model";

const plans: { code: MonetizationPlan; label: string; hint: string }[] = [
  { code: "FREE", label: "Бесплатно", hint: "Что можно попробовать без оплаты" },
  { code: "PREMIUM", label: "Премиум", hint: "Функции, которые продают основной тариф" },
  { code: "VIP", label: "VIP", hint: "Максимальный пакет и сервисные плюшки" },
];

const vowlyFeaturePresets = [
  ["QUIZ", "Стартовый квиз", "Быстрый старт без страха чистого листа", "FREE"],
  ["BASIC_SITE", "Публичный сайт", "Ссылка на готовое приглашение", "FREE"],
  ["STANDARD_THEMES", "Темы из админки", "Динамические стили и палитры", "FREE"],
  ["PHOTO_UPLOAD", "Фото и Love Story", "Обложки, галерея и мудборды", "FREE"],
  ["RSVP", "Умный опрос гостей", "Ответы, меню, алкоголь, транспорт", "PREMIUM"],
  ["GUEST_CRM", "CRM гостей", "Таблица гостей, статусы и экспорт CSV", "PREMIUM"],
  ["PERSONAL_LINKS", "Именные ссылки", "Персональные ссылки с magic token", "PREMIUM"],
  ["QR_CODES", "QR-коды", "QR для сайта и печати", "PREMIUM"],
  ["CUSTOM_MUSIC", "Своя музыка", "MP3 с компьютера и каталог треков", "PREMIUM"],
  ["NO_BRANDING", "Без подписи Vowly", "White label для публичного сайта", "PREMIUM"],
  ["TELEGRAM_ALERTS", "Telegram-уведомления", "Мгновенные ответы гостей в Telegram", "VIP"],
  ["PRIVATE_PIN", "Приватный сайт", "Доступ по PIN-коду", "VIP"],
  ["POST_WEDDING", "Режим после свадьбы", "Автопереход к благодарности и фото", "VIP"],
  ["CREW_MODE", "Секретный тайминг", "Технический роут для подрядчиков", "VIP"],
] satisfies Array<[string, string, string, MonetizationPlan]>;

export function MonetizationPanel({
  initialFeatures,
}: {
  initialFeatures: MonetizationFeatureOption[];
}) {
  const [features, setFeatures] = useState(initialFeatures);
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    plan: "FREE" as MonetizationPlan,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const addFeatureFromData = async (data: typeof form) => {
    const response = await fetch("/api/admin/monetization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = (await response.json()) as {
      error?: string;
      feature?: MonetizationFeatureOption;
    };
    if (!response.ok || !result.feature) {
      throw new Error(result.error || "Не удалось добавить функцию.");
    }
    return result.feature;
  };

  const addFeature = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const feature = await addFeatureFromData(form);
      setFeatures((items) => [...items, feature]);
      setForm({ code: "", title: "", description: "", plan: "FREE" });
      setMessage("Функция добавлена в тарифную матрицу.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось добавить функцию.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadVowlyPresets = async () => {
    setBusyId("vowly-presets");
    setMessage("");
    try {
      const existingCodes = new Set(features.map((feature) => feature.code));
      const missing = vowlyFeaturePresets.filter(([code]) => !existingCodes.has(code));
      const created: MonetizationFeatureOption[] = [];

      for (const [code, title, description, plan] of missing) {
        created.push(await addFeatureFromData({ code, title, description, plan }));
      }

      setFeatures((items) => [...items, ...created]);
      setMessage(
        created.length
          ? `Добавлено функций: ${created.length}. Теперь их можно переносить между тарифами.`
          : "Все функции Vowly уже есть в матрице.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить функции Vowly.");
    } finally {
      setBusyId(null);
    }
  };

  const patchFeature = async (
    id: string,
    patch: Partial<Pick<MonetizationFeatureOption, "plan" | "sortOrder" | "isActive">>,
  ) => {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/monetization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const result = (await response.json()) as {
        error?: string;
        feature?: MonetizationFeatureOption;
      };
      if (!response.ok || !result.feature) {
        throw new Error(result.error || "Не удалось обновить функцию.");
      }
      setFeatures((items) =>
        items.map((item) => (item.id === id ? result.feature! : item)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось обновить функцию.");
    } finally {
      setBusyId(null);
    }
  };

  const removeFeature = async (id: string) => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/monetization?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Не удалось удалить функцию.");
      setFeatures((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить функцию.");
    } finally {
      setBusyId(null);
    }
  };

  const dropToPlan = async (plan: MonetizationPlan) => {
    if (!draggedId) return;
    const nextOrder = features.filter((feature) => feature.plan === plan).length;
    await patchFeature(draggedId, { plan, sortOrder: nextOrder });
    setDraggedId(null);
  };

  return (
    <section className="admin-panel">
      <header className="admin-card-heading">
        <span className="admin-card-icon">
          <GripVertical size={21} />
        </span>
        <div>
          <small>Монетизация</small>
          <h2>Матрица функций и тарифов</h2>
          <p>
            Управляйте тем, что входит в бесплатный, премиум и VIP-тариф. Функции можно переносить кнопками или перетаскиванием.
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className="admin-secondary-button"
          type="button"
          disabled={busyId === "vowly-presets"}
          onClick={() => void loadVowlyPresets()}
        >
          {busyId === "vowly-presets" ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
          Загрузить функции Vowly
        </button>
      </div>

      <form
        className="grid gap-3 rounded-3xl bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_160px_auto]"
        onSubmit={addFeature}
      >
        <input
          className="admin-input"
          required
          placeholder="Код, например CUSTOM_MUSIC"
          value={form.code}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
            }))
          }
        />
        <input
          className="admin-input"
          required
          placeholder="Название функции"
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
        />
        <input
          className="admin-input"
          placeholder="Короткое описание"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
        />
        <select
          className="admin-input"
          value={form.plan}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              plan: event.target.value as MonetizationPlan,
            }))
          }
        >
          {plans.map((plan) => (
            <option key={plan.code} value={plan.code}>
              {plan.label}
            </option>
          ))}
        </select>
        <button className="admin-primary-button" disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
          Добавить
        </button>
      </form>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <div
            className="min-h-56 rounded-3xl border border-stone-200 bg-stone-50 p-4"
            key={plan.code}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void dropToPlan(plan.code)}
          >
            <div className="mb-4">
              <h3 className="m-0 text-xl font-semibold text-stone-900">{plan.label}</h3>
              <p className="m-0 text-sm text-stone-500">{plan.hint}</p>
            </div>
            <div className="grid gap-2">
              {features
                .filter((feature) => feature.plan === plan.code)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((feature) => (
                  <article
                    className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"
                    draggable
                    key={feature.id}
                    onDragStart={() => setDraggedId(feature.id)}
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="mt-1 shrink-0 text-stone-300" size={17} />
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-stone-900">{feature.title}</strong>
                        <small className="block truncate text-stone-400">{feature.code}</small>
                        {feature.description && (
                          <p className="m-0 mt-1 text-sm text-stone-500">{feature.description}</p>
                        )}
                      </div>
                      <button
                        className="admin-danger-icon"
                        disabled={busyId === feature.id}
                        onClick={() => void removeFeature(feature.id)}
                        type="button"
                      >
                        {busyId === feature.id ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plans.map((target) => (
                        <button
                          className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600 hover:bg-stone-100"
                          disabled={busyId === feature.id || feature.plan === target.code}
                          key={target.code}
                          onClick={() =>
                            void patchFeature(feature.id, {
                              plan: target.code,
                              sortOrder: features.filter((item) => item.plan === target.code).length,
                            })
                          }
                          type="button"
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              {features.filter((feature) => feature.plan === plan.code).length === 0 && (
                <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-400">
                  Перетащите сюда функцию или создайте новую.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
    </section>
  );
}
