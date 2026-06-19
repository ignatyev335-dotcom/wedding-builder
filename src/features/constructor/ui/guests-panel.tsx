"use client";

import { Check, Copy, Plus, Tag, Trash2, UserRoundPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  AlcoholPreferenceCode,
  CustomQuestion,
  GuestResponse,
  GuestTagCode,
  LanguageCode,
  RsvpQuestionKey,
  TransportPreferenceCode,
} from "@/entities/wedding/model";
import { guestTagCodes } from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

type GuestFilter = "ALL" | "ACCEPTED" | "DECLINED" | "PENDING";

type ConstructorGuest = GuestResponse & {
  inviteLanguage?: LanguageCode | string | null;
};

type GuestFormState = {
  name: string;
  phone: string;
  inviteLanguage: LanguageCode;
  isCouple: boolean;
  partnerName: string;
  tags: GuestTagCode[];
};

const emptyGuestForm: GuestFormState = {
  name: "",
  phone: "",
  inviteLanguage: "RU",
  isCouple: false,
  partnerName: "",
  tags: [],
};

const languageLabels: Record<LanguageCode, string> = {
  RU: "Русский",
  EN: "English",
  ZH: "中文",
};

const statusLabels: Record<GuestResponse["status"], string> = {
  PENDING: "Ждем ответ",
  ACCEPTED: "Придет",
  DECLINED: "Не придет",
};

const statusStyles: Record<GuestResponse["status"], string> = {
  PENDING: "bg-stone-100 text-stone-600",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-rose-50 text-rose-700",
};

const tagLabels: Record<GuestTagCode, string> = {
  FAMILY: "Семья",
  FRIENDS: "Друзья",
  COLLEAGUES: "Коллеги",
};

const alcoholLabels: Record<AlcoholPreferenceCode, string> = {
  WINE: "Вино",
  CHAMPAGNE: "Шампанское",
  STRONG: "Крепкий алкоголь",
  NONE: "Не пьет",
};

const transportLabels: Record<TransportPreferenceCode, string> = {
  TRANSFER: "Нужен трансфер",
  OWN_CAR: "На своей машине",
  SELF: "Доберется сам",
};

const foodLabels: Record<string, string> = {
  MEAT: "Мясо",
  FISH: "Рыба",
  VEGAN: "Веган",
};

const rsvpQuestionOptions: Array<{
  key: RsvpQuestionKey;
  title: string;
  description: string;
}> = [
  {
    key: "plusOne",
    title: "Гость со спутником",
    description: "Показывать вопрос про +1 и имя спутника.",
  },
  {
    key: "food",
    title: "Предпочтения по меню",
    description: "Мясо, рыба, веганское меню и аллергии.",
  },
  {
    key: "alcohol",
    title: "Бар и напитки",
    description: "Вино, шампанское, крепкий алкоголь или без алкоголя.",
  },
  {
    key: "transport",
    title: "Трансфер",
    description: "Понять, кому нужна помощь с дорогой.",
  },
  {
    key: "music",
    title: "Музыкальное пожелание",
    description: "Собрать треки, под которые гости хотят танцевать.",
  },
];

const questionPresets: Array<Pick<CustomQuestion, "title" | "type" | "options">> = [
  {
    title: "Будете ли вы с детьми?",
    type: "OPTIONS",
    options: ["Да", "Нет"],
  },
  {
    title: "Нужен ли детский стул?",
    type: "OPTIONS",
    options: ["Да", "Нет", "Пока не знаю"],
  },
  {
    title: "Нужен ли трансфер обратно после банкета?",
    type: "OPTIONS",
    options: ["Да", "Нет"],
  },
  {
    title: "Есть ли важные пожелания организатору?",
    type: "TEXT",
    options: [],
  },
];

function makeQuestionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `question-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInvitationUrl(siteId: string | null | undefined, token: string) {
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://vowly.ru";
  return `${baseUrl}/wedding/${siteId ?? "demo"}?guest=${token}`;
}

function toggleTag(tags: GuestTagCode[], tag: GuestTagCode) {
  return tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag];
}

function getAlcoholText(values?: AlcoholPreferenceCode[] | null) {
  if (!values?.length) return "не указано";
  return values.map((item) => alcoholLabels[item]).join(", ");
}

function getFoodText(value?: string | null) {
  if (!value) return "не указано";
  return foodLabels[value] ?? value;
}

function getTransportText(value?: TransportPreferenceCode | null) {
  if (!value) return "не указано";
  return transportLabels[value];
}

function getLanguageText(value?: string | null) {
  if (!value) return languageLabels.RU;
  return languageLabels[value as LanguageCode] ?? languageLabels.RU;
}

export function GuestsPanel() {
  const {
    siteId,
    customQuestions,
    rsvpQuestionSettings,
    setCustomQuestions,
    setRsvpQuestionSetting,
  } = useWeddingStore();

  const [guests, setGuests] = useState<ConstructorGuest[]>([]);
  const [guestForm, setGuestForm] = useState<GuestFormState>(emptyGuestForm);
  const [bulkGuests, setBulkGuests] = useState("");
  const [filter, setFilter] = useState<GuestFilter>("ALL");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questionById = useMemo(() => {
    return new Map(
      customQuestions.map((question) => [
        question.id,
        question.title || "Дополнительный вопрос",
      ]),
    );
  }, [customQuestions]);

  const guestStats = useMemo(() => {
    const answered = guests.filter((guest) => guest.status !== "PENDING").length;

    return {
      total: guests.length,
      answered,
      pending: guests.length - answered,
    };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    if (filter === "ALL") return guests;
    return guests.filter((guest) => guest.status === filter);
  }, [filter, guests]);

  useEffect(() => {
    let cancelled = false;

    async function loadGuests() {
      if (!siteId) {
        setGuests([]);
        return;
      }

      try {
        const response = await fetch(`/api/wedding-sites/${siteId}/guests`);
        if (!response.ok) return;

        const data = (await response.json()) as { guests?: ConstructorGuest[] };
        if (!cancelled) setGuests(data.guests ?? []);
      } catch {
        if (!cancelled) setError("Не удалось загрузить гостей. Попробуйте обновить страницу.");
      }
    }

    void loadGuests();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  async function createGuest(payload: GuestFormState) {
    if (!siteId) {
      setError("Сначала сохраните сайт, а затем добавляйте гостей.");
      return;
    }

    const guestName = payload.name.trim();
    if (!guestName) {
      setError("Введите имя гостя.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wedding-sites/${siteId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: guestName,
          phone: payload.phone.trim() || null,
          inviteLanguage: payload.inviteLanguage,
          isCouple: payload.isCouple,
          partnerName: payload.isCouple ? payload.partnerName.trim() || null : null,
          tags: payload.tags,
        }),
      });

      if (!response.ok) throw new Error("create_guest_failed");

      const data = (await response.json()) as { guest?: ConstructorGuest };
      if (data.guest) setGuests((items) => [data.guest!, ...items]);

      setGuestForm(emptyGuestForm);
    } catch {
      setError("Не получилось добавить гостя. Проверьте данные и попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  }

  async function addBulkGuests() {
    const names = bulkGuests
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!names.length) return;

    for (const name of names) {
      await createGuest({ ...emptyGuestForm, name });
    }

    setBulkGuests("");
  }

  async function updateGuestTags(guest: ConstructorGuest, tag: GuestTagCode) {
    const nextTags = toggleTag(guest.tags ?? [], tag);
    setGuests((items) =>
      items.map((item) => (item.id === guest.id ? { ...item, tags: nextTags } : item)),
    );

    try {
      await fetch(`/api/wedding-sites/${siteId}/guests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: guest.id,
          tags: nextTags,
        }),
      });
    } catch {
      setError("Теги сохранены локально, но сервер пока не ответил.");
    }
  }

  async function copyGuestLink(guest: ConstructorGuest) {
    if (!guest.magicToken) {
      setError("У этого гостя пока нет персональной ссылки.");
      return;
    }

    const link = getInvitationUrl(siteId, guest.magicToken);
    await navigator.clipboard.writeText(link);
    setCopiedToken(guest.magicToken);
    window.setTimeout(() => setCopiedToken(null), 1800);
  }

  async function saveQuestions(nextQuestions: CustomQuestion[]) {
    setCustomQuestions(nextQuestions);
    setIsSavingQuestions(true);

    try {
      await fetch(`/api/wedding-sites/${siteId}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customQuestions: nextQuestions }),
      });
    } catch {
      setError("Вопросы обновлены локально, но не сохранились на сервере.");
    } finally {
      setIsSavingQuestions(false);
    }
  }

  async function updateRsvpQuestionSetting(key: RsvpQuestionKey, enabled: boolean) {
    setRsvpQuestionSetting(key, enabled);

    try {
      await fetch(`/api/wedding-sites/${siteId}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvpQuestionSettings: {
            ...rsvpQuestionSettings,
            [key]: enabled,
          },
        }),
      });
    } catch {
      setError("Настройка вопроса обновлена локально, но не сохранилась на сервере.");
    }
  }

  function addQuestion(preset?: Pick<CustomQuestion, "title" | "type" | "options">) {
    const question: CustomQuestion = {
      id: makeQuestionId(),
      title: preset?.title ?? "Новый вопрос",
      type: preset?.type ?? "TEXT",
      options: preset?.options ?? [],
    };

    void saveQuestions([...customQuestions, question]);
  }

  function updateQuestion(id: string, patch: Partial<CustomQuestion>) {
    const nextQuestions = customQuestions.map((question) =>
      question.id === id ? { ...question, ...patch } : question,
    );
    void saveQuestions(nextQuestions);
  }

  function removeQuestion(id: string) {
    void saveQuestions(customQuestions.filter((question) => question.id !== id));
  }

  return (
    <section className="constructor-section animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
      <div className="space-y-3">
        <p className="section-kicker">Приглашения</p>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-stone-950 md:text-5xl">
          Ваши любимые гости
        </h1>
        <p className="max-w-2xl text-base leading-7 text-stone-600">
          Здесь создаются персональные ссылки и настраивается опрос. Подробную
          аналитику и сводки удобнее смотреть уже в личном кабинете.
        </p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-base text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3eb] text-[#51664f]">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#51664f]">
                Список приглашений
              </p>
              <p className="mt-1 text-base text-stone-600">
                Добавлено гостей: <b className="text-stone-950">{guestStats.total}</b>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:flex sm:items-center">
            <div className="rounded-2xl bg-stone-50 px-5 py-3">
              <p className="text-2xl font-semibold text-stone-950">{guestStats.answered}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">ответили</p>
            </div>
            <div className="rounded-2xl bg-stone-50 px-5 py-3">
              <p className="text-2xl font-semibold text-stone-950">{guestStats.pending}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">ждут</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3f5ef] text-[#51664f]">
            <UserRoundPlus size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-stone-950">Добавить гостя</h2>
            <p className="mt-1 text-base text-stone-600">
              Ссылка создастся автоматически. Ее можно сразу отправить в мессенджер.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-600">Имя гостя</span>
            <input
              value={guestForm.name}
              onChange={(event) =>
                setGuestForm((state) => ({ ...state, name: event.target.value }))
              }
              placeholder="Александр"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-600">Телефон</span>
            <input
              value={guestForm.phone}
              onChange={(event) =>
                setGuestForm((state) => ({ ...state, phone: event.target.value }))
              }
              placeholder="+7 999 123-45-67"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.3fr]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-600">Язык приглашения</span>
            <select
              value={guestForm.inviteLanguage}
              onChange={(event) =>
                setGuestForm((state) => ({
                  ...state,
                  inviteLanguage: event.target.value as LanguageCode,
                }))
              }
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
            >
              {Object.entries(languageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <label className="flex items-center gap-3 text-base font-medium text-stone-800">
              <input
                type="checkbox"
                checked={guestForm.isCouple}
                onChange={(event) =>
                  setGuestForm((state) => ({
                    ...state,
                    isCouple: event.target.checked,
                  }))
                }
                className="h-5 w-5 rounded border-stone-300"
              />
              Пригласить пару по одной ссылке
            </label>

            {guestForm.isCouple ? (
              <input
                value={guestForm.partnerName}
                onChange={(event) =>
                  setGuestForm((state) => ({
                    ...state,
                    partnerName: event.target.value,
                  }))
                }
                placeholder="Имя спутника или спутницы"
                className="mt-4 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-stone-600">Теги</p>
          <div className="flex flex-wrap gap-2">
            {guestTagCodes.map((tag) => {
              const active = guestForm.tags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setGuestForm((state) => ({
                      ...state,
                      tags: toggleTag(state.tags, tag),
                    }))
                  }
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "border-[#51664f] bg-[#edf3eb] text-[#51664f]"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  <Tag size={14} />
                  {tagLabels[tag]}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void createGuest(guestForm)}
          disabled={isLoading}
          className="primary-action mt-6 w-full whitespace-nowrap"
        >
          <Plus size={18} />
          {isLoading ? "Добавляем..." : "Добавить гостя"}
        </button>

        <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-600">
              Быстро добавить списком
            </span>
            <textarea
              value={bulkGuests}
              onChange={(event) => setBulkGuests(event.target.value)}
              placeholder={"Анна Иванова\nМария Петрова\nИван и Елена"}
              rows={4}
              className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
            />
          </label>
          <button
            type="button"
            onClick={() => void addBulkGuests()}
            disabled={isLoading || !bulkGuests.trim()}
            className="secondary-action mt-3 w-full whitespace-nowrap"
          >
            Добавить список
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Умный опрос гостей</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
              Какие вопросы задавать
            </h2>
            <p className="mt-2 max-w-2xl text-base text-stone-600">
              Оставьте только то, что действительно нужно вашей свадьбе. Если
              алкоголя нет, просто выключите этот пункт.
            </p>
          </div>
          {isSavingQuestions ? (
            <span className="text-sm text-stone-500">Сохраняем...</span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3">
          {rsvpQuestionOptions.map((option) => {
            const enabled = rsvpQuestionSettings[option.key] !== false;

            return (
              <div
                key={option.key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div>
                  <p className="text-base font-semibold text-stone-950">{option.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-500">
                    {option.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() =>
                    void updateRsvpQuestionSetting(option.key, !enabled)
                  }
                  className={`switch shrink-0 transition-all duration-200 ${
                    enabled ? "is-on" : ""
                  }`}
                >
                  <i />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-stone-950">
                Свои вопросы
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Можно добавить 1-2 вопроса под особенности вашей свадьбы.
              </p>
            </div>
            <button
              type="button"
              onClick={() => addQuestion()}
              className="secondary-action whitespace-nowrap"
            >
              <Plus size={16} />
              Добавить вопрос
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {questionPresets.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => addQuestion(preset)}
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition-all duration-200 hover:border-[#51664f] hover:text-[#51664f]"
              >
                {preset.title}
              </button>
            ))}
          </div>

          {customQuestions.length ? (
            <div className="mt-5 space-y-3">
              {customQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                    <input
                      value={question.title}
                      onChange={(event) =>
                        updateQuestion(question.id, { title: event.target.value })
                      }
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
                    />
                    <select
                      value={question.type}
                      onChange={(event) =>
                        updateQuestion(question.id, {
                          type: event.target.value as CustomQuestion["type"],
                          options:
                            event.target.value === "TEXT"
                              ? []
                              : question.options?.length
                                ? question.options
                                : ["Да", "Нет"],
                        })
                      }
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
                    >
                      <option value="TEXT">Текст</option>
                      <option value="OPTIONS">Варианты</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-500 transition-all duration-200 hover:text-rose-600"
                      aria-label="Удалить вопрос"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {question.type === "OPTIONS" ? (
                    <input
                      value={(question.options ?? []).join(", ")}
                      onChange={(event) =>
                        updateQuestion(question.id, {
                          options: event.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Варианты через запятую"
                      className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition-all duration-200 focus:border-[#51664f]"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-5 text-center text-base text-stone-500">
              Дополнительных вопросов пока нет.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">Список гостей</h2>
            <p className="mt-1 text-base text-stone-600">
              Ссылки, статусы и ответы по каждому приглашению.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["ALL", "Все"],
                ["ACCEPTED", "Придут"],
                ["DECLINED", "Не придут"],
                ["PENDING", "Ждем ответ"],
              ] as Array<[GuestFilter, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  filter === value
                    ? "bg-stone-950 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredGuests.length ? (
          <div className="mt-6 space-y-4">
            {filteredGuests.map((guest) => {
              const customAnswers = Object.entries(guest.customAnswers ?? {});

              return (
                <article
                  key={guest.id}
                  className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-4 transition-all duration-200 hover:border-[#51664f]/40 md:p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-semibold text-stone-950">
                          {guest.name}
                          {guest.partnerName ? ` и ${guest.partnerName}` : ""}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[guest.status]}`}
                        >
                          {statusLabels[guest.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-stone-500">
                        {guest.phone || "Телефон не указан"} ·{" "}
                        {getLanguageText(guest.inviteLanguage)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void copyGuestLink(guest)}
                      className="secondary-action whitespace-nowrap"
                    >
                      {copiedToken === guest.magicToken ? (
                        <>
                          <Check size={16} />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Ссылка
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {guestTagCodes.map((tag) => {
                      const active = guest.tags?.includes(tag);

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => void updateGuestTags(guest, tag)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                            active
                              ? "border-[#51664f] bg-[#edf3eb] text-[#51664f]"
                              : "border-stone-200 bg-white text-stone-500"
                          }`}
                        >
                          {tagLabels[tag]}
                        </button>
                      );
                    })}
                  </div>

                  {guest.status !== "PENDING" ? (
                    <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-2">
                      <p className="rounded-2xl bg-white px-4 py-3">
                        <b className="text-stone-950">Меню:</b>{" "}
                        {getFoodText(guest.foodPreference)}
                      </p>
                      <p className="rounded-2xl bg-white px-4 py-3">
                        <b className="text-stone-950">Аллергии:</b>{" "}
                        {guest.allergies || "не указано"}
                      </p>
                      <p className="rounded-2xl bg-white px-4 py-3">
                        <b className="text-stone-950">Бар:</b>{" "}
                        {getAlcoholText(guest.alcoholPreferences)}
                      </p>
                      <p className="rounded-2xl bg-white px-4 py-3">
                        <b className="text-stone-950">Транспорт:</b>{" "}
                        {getTransportText(guest.transportPreference)}
                      </p>
                      {guest.musicRequest ? (
                        <p className="rounded-2xl bg-white px-4 py-3 md:col-span-2">
                          <b className="text-stone-950">Музыка:</b>{" "}
                          {guest.musicRequest}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {customAnswers.length ? (
                    <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm text-stone-600">
                      {customAnswers.map(([questionId, answer]) => (
                        <p key={questionId}>
                          <b className="text-stone-950">
                            {questionById.get(questionId) ?? "Дополнительный вопрос"}:
                          </b>{" "}
                          {String(answer)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center">
            <Users className="mx-auto text-stone-400" size={34} />
            <h3 className="mt-4 text-xl font-semibold text-stone-950">
              Список пока пуст
            </h3>
            <p className="mx-auto mt-2 max-w-md text-base text-stone-500">
              Добавьте первого гостя, и мы подготовим для него персональную ссылку.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
