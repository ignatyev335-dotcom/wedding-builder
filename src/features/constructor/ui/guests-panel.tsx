"use client";

import {
  BusFront,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  GlassWater,
  Link2,
  ListChecks,
  Music2,
  Plus,
  Tag,
  Trash2,
  UserRoundX,
  Users,
  Utensils,
  Wine,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  alcoholPreferenceCodes,
  guestTagCodes,
  transportPreferenceCodes,
  type AlcoholPreferenceCode,
  type CustomQuestion,
  type GuestResponse,
  type GuestTagCode,
  type LanguageCode,
  type TransportPreferenceCode,
} from "@/entities/wedding/model";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

type GuestFilter = "ALL" | "ACCEPTED" | "DECLINED" | "PENDING";
type FoodKey = "meat" | "fish" | "vegan" | "unknown";

const statusLabels: Record<GuestResponse["status"], string> = {
  PENDING: "Ждем ответ",
  ACCEPTED: "Придет",
  DECLINED: "Не придет",
};

const statusClasses: Record<GuestResponse["status"], string> = {
  PENDING: "bg-stone-100 text-stone-600",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-rose-50 text-rose-700",
};

const tagLabels: Record<GuestTagCode, string> = {
  FAMILY: "Семья",
  FRIENDS: "Друзья",
  COLLEAGUES: "Коллеги",
};

const languageLabels: Record<LanguageCode, string> = {
  RU: "Русский",
  EN: "English",
  ZH: "中文",
};

const alcoholLabels: Record<AlcoholPreferenceCode, string> = {
  WINE: "Вино",
  CHAMPAGNE: "Шампанское",
  STRONG: "Крепкое",
  NONE: "Не пьют",
};

const transportLabels: Record<TransportPreferenceCode, string> = {
  TRANSFER: "Нужен трансфер",
  OWN_CAR: "На своей машине",
  SELF: "Доберутся сами",
};

const foodLabels: Record<FoodKey, string> = {
  meat: "Мясо",
  fish: "Рыба",
  vegan: "Веган",
  unknown: "Не выбрали",
};

const builtInQuestions = [
  "Присутствие и формат прихода",
  "Предпочтения по меню и аллергии",
  "Бар: вино, шампанское, крепкое или без алкоголя",
  "Транспорт до площадки",
  "Трек для танцевального плейлиста",
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

function normalizeFood(value?: string | null): FoodKey {
  if (!value) {
    return "unknown";
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("мяс") || normalized.includes("meat") || normalized.includes("СЏСЃ".toLowerCase())) {
    return "meat";
  }

  if (normalized.includes("рыб") || normalized.includes("fish") || normalized.includes("С‹Р±".toLowerCase())) {
    return "fish";
  }

  if (normalized.includes("вег") || normalized.includes("vegan")) {
    return "vegan";
  }

  return "unknown";
}

function getHeadcount(guest: GuestResponse) {
  if (guest.status === "DECLINED") {
    return 0;
  }

  if (guest.isCouple && guest.partnerName) {
    if (guest.status === "ACCEPTED") {
      if (guest.attendanceChoice === "PRIMARY" || guest.attendanceChoice === "PARTNER") {
        return 1;
      }

      if (guest.attendanceChoice === "NONE") {
        return 0;
      }

      return 2;
    }
  }

  return guest.status === "ACCEPTED" ? 1 : 0;
}

function getInvitationUrl(siteId: string, guest: GuestResponse) {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/wedding/${siteId}?guest=${guest.magicToken}`;
}

function makeQuestionId() {
  return `question-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function PreferenceCard({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: typeof Wine;
  title: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-stone-100 p-2 text-stone-600">
          <Icon className="h-5 w-5" />
        </div>
        <strong className="font-serif text-2xl text-stone-900">{value}</strong>
      </div>
      <p className="mt-3 text-sm font-medium text-stone-800">{title}</p>
      {note ? <p className="mt-1 text-xs leading-relaxed text-stone-500">{note}</p> : null}
    </div>
  );
}

export function GuestsPanel() {
  const {
    siteId,
    customQuestions,
    setCustomQuestions,
  } = useWeddingStore();

  const [guests, setGuests] = useState<GuestResponse[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteLanguage, setInviteLanguage] = useState<LanguageCode>("RU");
  const [isCouple, setIsCouple] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [tags, setTags] = useState<GuestTagCode[]>([]);
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  const [filter, setFilter] = useState<GuestFilter>("ALL");
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGuests() {
      if (!siteId) {
        return;
      }

      setIsLoadingGuests(true);
      setGuestError(null);

      try {
        const response = await fetch(`/api/wedding-sites/${siteId}/guests`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Не удалось загрузить список гостей.");
        }

        const payload = (await response.json()) as { guests?: GuestResponse[] };

        if (!cancelled) {
          setGuests(payload.guests ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setGuestError(error instanceof Error ? error.message : "Не удалось загрузить список гостей.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingGuests(false);
        }
      }
    }

    void loadGuests();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const guestStats = useMemo(() => {
    const accepted = guests.filter((guest) => guest.status === "ACCEPTED").length;
    const declined = guests.filter((guest) => guest.status === "DECLINED").length;
    const pending = guests.filter((guest) => guest.status === "PENDING").length;
    const headcount = guests.reduce((sum, guest) => sum + getHeadcount(guest), 0);

    return {
      accepted,
      declined,
      pending,
      total: guests.length,
      headcount,
    };
  }, [guests]);

  const preferenceStats = useMemo(() => {
    const food: Record<FoodKey, number> = {
      meat: 0,
      fish: 0,
      vegan: 0,
      unknown: 0,
    };
    const alcohol: Record<AlcoholPreferenceCode, number> = {
      WINE: 0,
      CHAMPAGNE: 0,
      STRONG: 0,
      NONE: 0,
    };
    const transport: Record<TransportPreferenceCode, number> = {
      TRANSFER: 0,
      OWN_CAR: 0,
      SELF: 0,
    };
    let allergies = 0;
    let danceTracks = 0;

    guests.forEach((guest) => {
      if (guest.status !== "ACCEPTED") {
        return;
      }

      food[normalizeFood(guest.foodPreference)] += 1;

      if (guest.isCouple && guest.partnerName) {
        food[normalizeFood(guest.partnerFoodPreference)] += 1;
      }

      guest.alcoholPreferences.forEach((preference) => {
        if (alcoholPreferenceCodes.includes(preference)) {
          alcohol[preference] += 1;
        }
      });

      if (guest.transportPreference && transportPreferenceCodes.includes(guest.transportPreference)) {
        transport[guest.transportPreference] += 1;
      } else if (guest.needsTransport) {
        transport.TRANSFER += 1;
      }

      if (guest.allergies?.trim()) {
        allergies += 1;
      }

      if (guest.musicRequest?.trim()) {
        danceTracks += 1;
      }
    });

    return {
      alcohol,
      allergies,
      danceTracks,
      food,
      transport,
    };
  }, [guests]);

  const customAnswerSummary = useMemo(() => {
    return customQuestions.map((question) => {
      const answers = guests
        .map((guest) => guest.customAnswers?.[question.id])
        .filter((answer): answer is string => Boolean(answer?.trim()));

      return {
        answers,
        question,
      };
    });
  }, [customQuestions, guests]);

  const filteredGuests = useMemo(() => {
    if (filter === "ALL") {
      return guests;
    }

    return guests.filter((guest) => guest.status === filter);
  }, [filter, guests]);

  async function addGuest() {
    if (!siteId) {
      setGuestError("Сначала сохраните сайт, чтобы добавлять гостей.");
      return;
    }

    if (!name.trim()) {
      setGuestError("Введите имя гостя.");
      return;
    }

    setIsSavingGuest(true);
    setGuestError(null);

    try {
      const response = await fetch(`/api/wedding-sites/${siteId}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteLanguage,
          isCouple,
          name: name.trim(),
          partnerName: isCouple ? partnerName.trim() : "",
          phone: phone.trim(),
          tags,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось добавить гостя.");
      }

      const payload = (await response.json()) as { guest?: GuestResponse };

      if (payload.guest) {
        setGuests((current) => [payload.guest!, ...current]);
      }

      setName("");
      setPhone("");
      setPartnerName("");
      setIsCouple(false);
      setTags([]);
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : "Не удалось добавить гостя.");
    } finally {
      setIsSavingGuest(false);
    }
  }

  async function updateGuestTags(guest: GuestResponse, nextTags: GuestTagCode[]) {
    if (!siteId) {
      return;
    }

    setGuests((current) => current.map((item) => (item.id === guest.id ? { ...item, tags: nextTags } : item)));

    try {
      await fetch(`/api/wedding-sites/${siteId}/guests`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestId: guest.id,
          tags: nextTags,
        }),
      });
    } catch {
      setGuests((current) => current.map((item) => (item.id === guest.id ? guest : item)));
    }
  }

  async function copyGuestLink(guest: GuestResponse) {
    if (!siteId) {
      return;
    }

    const invitationUrl = getInvitationUrl(siteId, guest);

    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopiedGuestId(guest.id);
      window.setTimeout(() => setCopiedGuestId(null), 1800);
    } catch {
      setGuestError("Не удалось скопировать ссылку. Попробуйте вручную.");
    }
  }

  function downloadCsv() {
    const rows = [
      [
        "Имя",
        "Телефон",
        "Статус",
        "Пара",
        "Теги",
        "Еда",
        "Аллергии",
        "Алкоголь",
        "Транспорт",
        "Музыка",
        "Ссылка",
      ],
      ...guests.map((guest) => [
        guest.name,
        guest.phone,
        statusLabels[guest.status],
        guest.partnerName ?? "",
        guest.tags.map((tag) => tagLabels[tag]).join(", "),
        [guest.foodPreference, guest.partnerFoodPreference].filter(Boolean).join(" / "),
        guest.allergies ?? "",
        guest.alcoholPreferences.map((preference) => alcoholLabels[preference]).join(", "),
        guest.transportPreference ? transportLabels[guest.transportPreference] : guest.needsTransport ? "Нужен трансфер" : "",
        guest.musicRequest ?? "",
        siteId ? getInvitationUrl(siteId, guest) : "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "vowly-guests.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveQuestions(nextQuestions: CustomQuestion[], message = "Опросник обновлен.") {
    if (!siteId) {
      setQuestionMessage("Сначала сохраните сайт, чтобы редактировать опросник.");
      return;
    }

    const limitedQuestions = nextQuestions.slice(0, 5);
    setCustomQuestions(limitedQuestions);
    setQuestionMessage("Сохраняем...");

    try {
      await persistSiteExtras();
      setQuestionMessage(message);
    } catch {
      setQuestionMessage("Не удалось сохранить опросник. Попробуйте еще раз.");
    }
  }

  function addQuestion(preset?: Pick<CustomQuestion, "title" | "type" | "options">) {
    if (customQuestions.length >= 5) {
      setQuestionMessage("Можно добавить до 5 дополнительных вопросов.");
      return;
    }

    const nextQuestion: CustomQuestion = {
      id: makeQuestionId(),
      options: preset?.options ?? [],
      title: preset?.title ?? "Новый вопрос",
      type: preset?.type ?? "TEXT",
    };

    void saveQuestions([...customQuestions, nextQuestion], "Вопрос добавлен.");
  }

  function updateQuestion(questionId: string, patch: Partial<CustomQuestion>) {
    const nextQuestions = customQuestions.map((question) =>
      question.id === questionId
        ? {
            ...question,
            ...patch,
            options: patch.type === "TEXT" ? [] : patch.options ?? question.options,
          }
        : question,
    );

    void saveQuestions(nextQuestions, "Опросник обновлен.");
  }

  function removeQuestion(questionId: string) {
    void saveQuestions(
      customQuestions.filter((question) => question.id !== questionId),
      "Вопрос удален.",
    );
  }

  function toggleDraftTag(tag: GuestTagCode) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  return (
    <section className="constructor-section space-y-8">
      <header className="space-y-3">
        <p className="section-kicker">Все под рукой</p>
        <h2>Ваши любимые гости</h2>
        <p>
          Добавляйте гостей, собирайте ответы, меню, бар, транспорт и индивидуальные пожелания в одной аккуратной CRM.
        </p>
      </header>

      <div className="guest-stats">
        <div>
          <Users className="h-5 w-5" />
          <span>Всего гостей</span>
          <strong>{guestStats.total}</strong>
        </div>
        <div>
          <CheckCircle2 className="h-5 w-5" />
          <span>Подтвердили</span>
          <strong>{guestStats.accepted}</strong>
        </div>
        <div>
          <XCircle className="h-5 w-5" />
          <span>Отказались</span>
          <strong>{guestStats.declined}</strong>
        </div>
      </div>

      <div className="rounded-[28px] border border-stone-200 bg-white/70 p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Предпочтения гостей</p>
            <h3 className="font-serif text-3xl text-stone-950">Сводка для ресторана и организатора</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              Блок автоматически собирает ответы RSVP: еду, бар, транспорт, аллергии и песни для вечеринки.
            </p>
          </div>
          <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
            Примерно гостей на площадке: {guestStats.headcount}
          </div>
        </div>

        <div className="guest-preference-grid">
          <PreferenceCard
            icon={Utensils}
            title="Меню"
            value={`${preferenceStats.food.meat}/${preferenceStats.food.fish}/${preferenceStats.food.vegan}`}
            note={`Мясо / рыба / веган. Без выбора: ${preferenceStats.food.unknown}`}
          />
          <PreferenceCard
            icon={Wine}
            title="Бар"
            value={preferenceStats.alcohol.WINE + preferenceStats.alcohol.CHAMPAGNE + preferenceStats.alcohol.STRONG}
            note={`Вино: ${preferenceStats.alcohol.WINE}, шампанское: ${preferenceStats.alcohol.CHAMPAGNE}, крепкое: ${preferenceStats.alcohol.STRONG}, не пьют: ${preferenceStats.alcohol.NONE}`}
          />
          <PreferenceCard
            icon={BusFront}
            title="Трансфер"
            value={preferenceStats.transport.TRANSFER}
            note={`Своя машина: ${preferenceStats.transport.OWN_CAR}, доберутся сами: ${preferenceStats.transport.SELF}`}
          />
          <PreferenceCard
            icon={ClipboardList}
            title="Особые отметки"
            value={preferenceStats.allergies}
            note={`Аллергии и ограничения. Треков в плейлист: ${preferenceStats.danceTracks}`}
          />
        </div>
      </div>

      <div className="guest-quick-form">
        <div>
          <h3>Добавить гостя</h3>
          <p>Персональная ссылка создастся автоматически.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span>Имя</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Александр"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
            />
          </label>
          <label>
            <span>Телефон</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 999 123-45-67" />
          </label>
        </div>

        <label>
          <span>Язык приглашения</span>
          <select value={inviteLanguage} onChange={(event) => setInviteLanguage(event.target.value as LanguageCode)}>
            {Object.entries(languageLabels).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="guest-couple-toggle">
          <input checked={isCouple} onChange={(event) => setIsCouple(event.target.checked)} type="checkbox" />
          <span>Пригласить пару по одной ссылке</span>
        </label>

        {isCouple ? (
          <label>
            <span>Имя второго гостя</span>
            <input
              value={partnerName}
              onChange={(event) => setPartnerName(event.target.value)}
              placeholder="Мария"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
            />
          </label>
        ) : null}

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">Теги</span>
          <div className="guest-tag-row">
            {guestTagCodes.map((tag) => (
              <button
                key={tag}
                type="button"
                className={tags.includes(tag) ? "active" : ""}
                onClick={() => toggleDraftTag(tag)}
              >
                <Tag className="h-3.5 w-3.5" />
                {tagLabels[tag]}
              </button>
            ))}
          </div>
        </div>

        {guestError ? <p className="text-sm text-red-600">{guestError}</p> : null}

        <button className="primary-action" type="button" onClick={addGuest} disabled={isSavingGuest}>
          <Plus className="h-4 w-4" />
          {isSavingGuest ? "Добавляем..." : "Добавить"}
        </button>
      </div>

      <div className="guest-question-builder">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Умный опрос гостей</p>
            <h3>Ваши вопросы</h3>
            <p>Основные вопросы уже включены в RSVP. Ниже можно добавить свои уточнения.</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            {customQuestions.length}/5 вопросов
          </span>
        </div>

        <div className="builtin-question-grid">
          {builtInQuestions.map((question) => (
            <div key={question}>
              <Check className="h-4 w-4" />
              <span>{question}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-800">Быстрые заготовки</p>
          <div className="question-preset-row">
            {questionPresets.map((preset) => (
              <button key={preset.title} type="button" onClick={() => addQuestion(preset)}>
                <Plus className="h-3.5 w-3.5" />
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {customQuestions.map((question) => (
            <div key={question.id} className="question-editor-card">
              <div className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
                <label>
                  <span>Текст вопроса</span>
                  <input
                    value={question.title}
                    onChange={(event) => updateQuestion(question.id, { title: event.target.value })}
                    placeholder="Например: будете ли с детьми?"
                  />
                </label>
                <label>
                  <span>Тип ответа</span>
                  <select
                    value={question.type}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        options: event.target.value === "OPTIONS" ? question.options.length ? question.options : ["Да", "Нет"] : [],
                        type: event.target.value as CustomQuestion["type"],
                      })
                    }
                  >
                    <option value="TEXT">Текст</option>
                    <option value="OPTIONS">Варианты</option>
                  </select>
                </label>
                <button className="secondary-action danger" type="button" onClick={() => removeQuestion(question.id)}>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </button>
              </div>
              {question.type === "OPTIONS" ? (
                <label className="mt-3 block">
                  <span>Варианты через запятую</span>
                  <input
                    value={question.options.join(", ")}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        options: event.target.value
                          .split(",")
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Да, Нет, Пока не знаю"
                  />
                </label>
              ) : null}
            </div>
          ))}
        </div>

        <button className="secondary-action w-full justify-center" type="button" onClick={() => addQuestion()}>
          <Plus className="h-4 w-4" />
          Добавить свой вопрос
        </button>

        {customAnswerSummary.some((item) => item.answers.length > 0) ? (
          <div className="custom-answer-summary">
            <p className="text-sm font-medium text-stone-800">Ответы на ваши вопросы</p>
            {customAnswerSummary
              .filter((item) => item.answers.length > 0)
              .map((item) => (
                <div key={item.question.id}>
                  <span>{item.question.title}</span>
                  <strong>{item.answers.length}</strong>
                </div>
              ))}
          </div>
        ) : null}

        {questionMessage ? <p className="text-sm text-stone-500">{questionMessage}</p> : null}
      </div>

      <div className="guest-list-header">
        <div>
          <h3>Список гостей</h3>
          <p>{isLoadingGuests ? "Загружаем гостей..." : guests.length ? "Все ссылки и ответы под рукой." : "Пока никого нет."}</p>
        </div>
        <button className="secondary-action" type="button" onClick={downloadCsv} disabled={!guests.length}>
          <Download className="h-4 w-4" />
          Скачать таблицу CSV
        </button>
      </div>

      <div className="guest-filter-row">
        {[
          ["ALL", "Все"],
          ["ACCEPTED", "Придут"],
          ["DECLINED", "Не придут"],
          ["PENDING", "Ждем ответ"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            type="button"
            onClick={() => setFilter(value as GuestFilter)}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredGuests.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="guest-table">
              <thead>
                <tr>
                  <th>Гость</th>
                  <th>Статус</th>
                  <th>Предпочтения</th>
                  <th>Теги</th>
                  <th>Ссылка</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id}>
                    <td>
                      <strong>{guest.name}</strong>
                      {guest.partnerName ? <span> + {guest.partnerName}</span> : null}
                      <small>{guest.phone || "Телефон не указан"}</small>
                    </td>
                    <td>
                      <span className={`guest-status ${statusClasses[guest.status]}`}>{statusLabels[guest.status]}</span>
                    </td>
                    <td>
                      <span>{foodLabels[normalizeFood(guest.foodPreference)]}</span>
                      <small>
                        {guest.alcoholPreferences.length
                          ? guest.alcoholPreferences.map((preference) => alcoholLabels[preference]).join(", ")
                          : "Бар не выбран"}
                      </small>
                      <small>
                        {guest.transportPreference ? transportLabels[guest.transportPreference] : "Транспорт не выбран"}
                      </small>
                    </td>
                    <td>
                      <div className="guest-tag-row compact">
                        {guestTagCodes.map((tag) => {
                          const nextTags = guest.tags.includes(tag)
                            ? guest.tags.filter((item) => item !== tag)
                            : [...guest.tags, tag];

                          return (
                            <button
                              key={tag}
                              type="button"
                              className={guest.tags.includes(tag) ? "active" : ""}
                              onClick={() => updateGuestTags(guest, nextTags)}
                            >
                              {tagLabels[tag]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <button className="copy-link-button" type="button" onClick={() => copyGuestLink(guest)}>
                        {copiedGuestId === guest.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedGuestId === guest.id ? "Скопировано" : "Скопировать"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredGuests.map((guest) => (
              <article key={guest.id} className="guest-mobile-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{guest.name}</strong>
                    {guest.partnerName ? <p>+ {guest.partnerName}</p> : null}
                    <span>{guest.phone || "Телефон не указан"}</span>
                  </div>
                  <span className={`guest-status ${statusClasses[guest.status]}`}>{statusLabels[guest.status]}</span>
                </div>
                <dl>
                  <div>
                    <dt>Еда</dt>
                    <dd>{foodLabels[normalizeFood(guest.foodPreference)]}</dd>
                  </div>
                  <div>
                    <dt>Алкоголь</dt>
                    <dd>
                      {guest.alcoholPreferences.length
                        ? guest.alcoholPreferences.map((preference) => alcoholLabels[preference]).join(", ")
                        : "Не выбрано"}
                    </dd>
                  </div>
                  <div>
                    <dt>Транспорт</dt>
                    <dd>{guest.transportPreference ? transportLabels[guest.transportPreference] : "Не выбрано"}</dd>
                  </div>
                </dl>
                <button className="copy-link-button w-full justify-center" type="button" onClick={() => copyGuestLink(guest)}>
                  <Link2 className="h-4 w-4" />
                  {copiedGuestId === guest.id ? "Ссылка скопирована" : "Скопировать приглашение"}
                </button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-guest-state">
          <UserRoundX className="h-10 w-10" />
          <strong>Список пока пуст</strong>
          <p>Добавьте первого гостя, и мы подготовим для него личную ссылку.</p>
        </div>
      )}

      <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 text-sm leading-relaxed text-stone-500">
        <div className="mb-2 flex items-center gap-2 font-medium text-stone-700">
          <ListChecks className="h-4 w-4" />
          Как это работает
        </div>
        Гость открывает персональную ссылку, отвечает на RSVP и выбирает предпочтения. Ответ сразу появляется в этой
        панели, а CSV можно отправить координатору или ресторану.
      </div>
    </section>
  );
}
