"use client";

import {
  BarChart3,
  BusFront,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Link2,
  ListChecks,
  Plus,
  Tag,
  Trash2,
  UserRoundPlus,
  Users,
  Utensils,
  Wine,
  X,
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
  "Меню и аллергии",
  "Алкогольные предпочтения",
  "Трансфер до площадки",
  "Любимый трек для танцев",
];

const questionPresets: Array<Pick<CustomQuestion, "title" | "type" | "options">> = [
  { title: "Будете ли вы с детьми?", type: "OPTIONS", options: ["Да", "Нет"] },
  { title: "Нужен ли детский стул?", type: "OPTIONS", options: ["Да", "Нет", "Пока не знаю"] },
  { title: "Нужен ли трансфер обратно после банкета?", type: "OPTIONS", options: ["Да", "Нет"] },
  { title: "Есть ли важные пожелания организатору?", type: "TEXT", options: [] },
];

function normalizeFood(value?: string | null): FoodKey {
  if (!value) return "unknown";
  const normalized = value.toLowerCase();
  if (normalized.includes("мяс") || normalized.includes("meat")) return "meat";
  if (normalized.includes("рыб") || normalized.includes("fish")) return "fish";
  if (normalized.includes("вег") || normalized.includes("vegan")) return "vegan";
  return "unknown";
}

function getHeadcount(guest: GuestResponse) {
  if (guest.status === "DECLINED") return 0;
  if (guest.isCouple && guest.partnerName && guest.status === "ACCEPTED") {
    if (guest.attendanceChoice === "PRIMARY" || guest.attendanceChoice === "PARTNER") return 1;
    if (guest.attendanceChoice === "NONE") return 0;
    return 2;
  }
  return guest.status === "ACCEPTED" ? 1 : 0;
}

function makeQuestionId() {
  return `question-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInvitationUrl(siteId: string, guest: GuestResponse) {
  if (guest.invitationUrl) return guest.invitationUrl;
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/wedding/${siteId}?guest=${guest.magicToken}`;
}

function StatCard({
  icon: Icon,
  label,
  tone = "stone",
  value,
}: {
  icon: typeof Users;
  label: string;
  tone?: "stone" | "green" | "rose";
  value: number;
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : tone === "rose"
        ? "border-rose-100 bg-rose-50 text-rose-800"
        : "border-stone-200 bg-white text-stone-900";

  return (
    <article className={`rounded-[24px] border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-5 w-5 opacity-70" />
        <strong className="font-serif text-3xl leading-none">{value}</strong>
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
    </article>
  );
}

function PreferenceLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 py-3 last:border-b-0">
      <span className="text-sm text-stone-500">{label}</span>
      <strong className="text-sm text-stone-900">{value}</strong>
    </div>
  );
}

export function GuestsPanel() {
  const { siteId, customQuestions, setCustomQuestions } = useWeddingStore();

  const [guests, setGuests] = useState<GuestResponse[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bulkGuests, setBulkGuests] = useState("");
  const [inviteLanguage, setInviteLanguage] = useState<LanguageCode>("RU");
  const [isCouple, setIsCouple] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [tags, setTags] = useState<GuestTagCode[]>([]);
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  const [filter, setFilter] = useState<GuestFilter>("ALL");
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadGuests() {
      if (!siteId) return;
      setIsLoadingGuests(true);
      setGuestError(null);

      try {
        const response = await fetch(`/api/wedding-sites/${siteId}/guests`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Не удалось загрузить список гостей.");
        const payload = (await response.json()) as { guests?: GuestResponse[] };
        if (!cancelled) setGuests(payload.guests ?? []);
      } catch (error) {
        if (!cancelled) {
          setGuestError(error instanceof Error ? error.message : "Не удалось загрузить гостей.");
        }
      } finally {
        if (!cancelled) setIsLoadingGuests(false);
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
    return { accepted, declined, headcount, pending, total: guests.length };
  }, [guests]);

  const preferenceStats = useMemo(() => {
    const food: Record<FoodKey, number> = { meat: 0, fish: 0, vegan: 0, unknown: 0 };
    const alcohol: Record<AlcoholPreferenceCode, number> = { WINE: 0, CHAMPAGNE: 0, STRONG: 0, NONE: 0 };
    const transport: Record<TransportPreferenceCode, number> = { TRANSFER: 0, OWN_CAR: 0, SELF: 0 };
    let allergies = 0;
    let danceTracks = 0;

    guests.forEach((guest) => {
      if (guest.status !== "ACCEPTED") return;
      food[normalizeFood(guest.foodPreference)] += 1;
      if (guest.isCouple && guest.partnerName) food[normalizeFood(guest.partnerFoodPreference)] += 1;
      guest.alcoholPreferences.forEach((preference) => {
        if (alcoholPreferenceCodes.includes(preference)) alcohol[preference] += 1;
      });
      if (guest.transportPreference && transportPreferenceCodes.includes(guest.transportPreference)) {
        transport[guest.transportPreference] += 1;
      } else if (guest.needsTransport) {
        transport.TRANSFER += 1;
      }
      if (guest.allergies?.trim()) allergies += 1;
      if (guest.musicRequest?.trim()) danceTracks += 1;
    });

    return { alcohol, allergies, danceTracks, food, transport };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    if (filter === "ALL") return guests;
    return guests.filter((guest) => guest.status === filter);
  }, [filter, guests]);

  const customAnswerSummary = useMemo(() => {
    return customQuestions.map((question) => {
      const answers = guests
        .map((guest) => guest.customAnswers?.[question.id])
        .filter((answer): answer is string => Boolean(answer?.trim()));
      return { answers, question };
    });
  }, [customQuestions, guests]);

  async function createGuest(input: {
    isCouple?: boolean;
    name: string;
    partnerName?: string;
    phone?: string;
  }) {
    if (!siteId) throw new Error("Сначала сохраните сайт, чтобы добавлять гостей.");
    if (!input.name.trim()) throw new Error("Введите имя гостя.");

    const response = await fetch(`/api/wedding-sites/${siteId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteLanguage,
        isCouple: Boolean(input.isCouple),
        name: input.name.trim(),
        partnerName: input.isCouple ? input.partnerName?.trim() ?? "" : "",
        phone: input.phone?.trim() ?? "",
        tags,
      }),
    });

    if (!response.ok) throw new Error("Не удалось добавить гостя.");
    const payload = (await response.json()) as { guest?: GuestResponse };
    if (!payload.guest) throw new Error("Сервер не вернул гостя.");
    return payload.guest;
  }

  async function addGuest() {
    setIsSavingGuest(true);
    setGuestError(null);
    try {
      const guest = await createGuest({ isCouple, name, partnerName, phone });
      setGuests((current) => [guest, ...current]);
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

  async function addBulkGuests() {
    const rows = bulkGuests
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => {
        const [guestName, guestPhone] = row.split(",").map((part) => part.trim());
        return { name: guestName, phone: guestPhone ?? "" };
      })
      .filter((row) => row.name);

    if (!rows.length) {
      setGuestError("Добавьте гостей списком: имя, телефон.");
      return;
    }

    setIsSavingGuest(true);
    setGuestError(null);
    try {
      const created: GuestResponse[] = [];
      for (const row of rows) {
        created.push(await createGuest(row));
      }
      setGuests((current) => [...created.reverse(), ...current]);
      setBulkGuests("");
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : "Не удалось добавить список гостей.");
    } finally {
      setIsSavingGuest(false);
    }
  }

  async function updateGuestTags(guest: GuestResponse, nextTags: GuestTagCode[]) {
    if (!siteId) return;
    setGuests((current) => current.map((item) => (item.id === guest.id ? { ...item, tags: nextTags } : item)));
    try {
      await fetch(`/api/wedding-sites/${siteId}/guests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id, tags: nextTags }),
      });
    } catch {
      setGuests((current) => current.map((item) => (item.id === guest.id ? guest : item)));
    }
  }

  async function copyGuestLink(guest: GuestResponse) {
    if (!siteId) return;
    try {
      await navigator.clipboard.writeText(getInvitationUrl(siteId, guest));
      setCopiedGuestId(guest.id);
      window.setTimeout(() => setCopiedGuestId(null), 1800);
    } catch {
      setGuestError("Не удалось скопировать ссылку. Попробуйте вручную.");
    }
  }

  function downloadCsv() {
    const rows = [
      ["Имя", "Телефон", "Статус", "Пара", "Теги", "Еда", "Аллергии", "Алкоголь", "Транспорт", "Музыка", "Ссылка"],
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
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
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
      id: `question-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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
    void saveQuestions(customQuestions.filter((question) => question.id !== questionId), "Вопрос удален.");
  }

  function toggleDraftTag(tag: GuestTagCode) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  return (
    <section className="constructor-section space-y-6">
      <header className="space-y-3">
        <p className="section-kicker">Гости и RSVP</p>
        <h2>Ваши любимые гости</h2>
        <p>Добавьте гостей, отправьте персональные ссылки, а ответы соберутся здесь автоматически.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={Users} label="Всего гостей" value={guestStats.total} />
        <StatCard icon={CheckCircle2} label="Подтвердили" value={guestStats.accepted} tone="green" />
        <StatCard icon={XCircle} label="Отказались" value={guestStats.declined} tone="rose" />
      </div>

      <section className="rounded-[30px] border border-stone-200 bg-white/80 p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Начните отсюда</p>
            <h3 className="font-serif text-3xl leading-tight text-stone-950">Добавить гостя</h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">После добавления Vowly сразу создаст личную ссылку для приглашения.</p>
          </div>
          <button className="secondary-action justify-center" type="button" onClick={() => setDetailsOpen(true)}>
            <BarChart3 className="h-4 w-4" />
            Подробная сводка
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-stone-600">
            Имя
            <input className="min-h-12 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none focus:border-stone-500" value={name} onChange={(event) => setName(event.target.value)} placeholder="Александр" autoCapitalize="words" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-600">
            Телефон
            <input className="min-h-12 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none focus:border-stone-500" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 999 123-45-67" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-600">
            Язык приглашения
            <select className="min-h-12 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none focus:border-stone-500" value={inviteLanguage} onChange={(event) => setInviteLanguage(event.target.value as LanguageCode)}>
              {Object.entries(languageLabels).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-stone-700">
            <input checked={isCouple} onChange={(event) => setIsCouple(event.target.checked)} type="checkbox" />
            Пригласить пару по одной ссылке
          </label>
        </div>

        {isCouple ? (
          <label className="mt-4 grid gap-2 text-sm font-medium text-stone-600">
            Имя второго гостя
            <input className="min-h-12 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none focus:border-stone-500" value={partnerName} onChange={(event) => setPartnerName(event.target.value)} placeholder="Мария" autoCapitalize="words" autoCorrect="off" spellCheck={false} />
          </label>
        ) : null}

        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Теги</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {guestTagCodes.map((tag) => (
              <button key={tag} type="button" className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm transition ${tags.includes(tag) ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600"}`} onClick={() => toggleDraftTag(tag)}>
                <Tag className="h-3.5 w-3.5" />
                {tagLabels[tag]}
              </button>
            ))}
          </div>
        </div>

        <button className="primary-action mt-5 w-full justify-center" type="button" onClick={addGuest} disabled={isSavingGuest}>
          <UserRoundPlus className="h-4 w-4" />
          {isSavingGuest ? "Добавляем..." : "Добавить гостя"}
        </button>

        <details className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-stone-800">Добавить списком</summary>
          <p className="mt-2 text-sm leading-6 text-stone-500">Каждый гость с новой строки: имя, телефон.</p>
          <textarea className="mt-3 min-h-28 w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm outline-none focus:border-stone-500" value={bulkGuests} onChange={(event) => setBulkGuests(event.target.value)} placeholder={"Иван, +79991234567\nМария, +79990000000"} />
          <button className="secondary-action mt-3 justify-center" type="button" onClick={addBulkGuests} disabled={isSavingGuest}>
            <Plus className="h-4 w-4" />
            Добавить список
          </button>
        </details>

        {guestError ? <p className="mt-4 text-sm text-red-600">{guestError}</p> : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="font-serif text-3xl text-stone-950">Ссылки и ответы</h3>
            <p className="mt-1 text-sm text-stone-500">{isLoadingGuests ? "Загружаем гостей..." : guests.length ? "Здесь будут статусы и персональные ссылки." : "Пока гостей нет."}</p>
          </div>
          <button className="secondary-action justify-center" type="button" onClick={downloadCsv} disabled={!guests.length}>
            <Download className="h-4 w-4" />
            Скачать CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["ALL", "Все"],
            ["ACCEPTED", "Придут"],
            ["DECLINED", "Не придут"],
            ["PENDING", "Ждем ответ"],
          ].map(([value, label]) => (
            <button key={value} className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${filter === value ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`} type="button" onClick={() => setFilter(value as GuestFilter)}>
              {label}
            </button>
          ))}
        </div>

        {filteredGuests.length ? (
          <div className="grid gap-3">
            {filteredGuests.map((guest) => (
              <article key={guest.id} className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-base text-stone-950">{guest.name}</strong>
                      {guest.partnerName ? <span className="text-sm text-stone-500">+ {guest.partnerName}</span> : null}
                      <span className={`guest-status ${statusClasses[guest.status]}`}>{statusLabels[guest.status]}</span>
                    </div>
                    <p className="mt-1 text-sm text-stone-500">{guest.phone || "Телефон не указан"}</p>
                  </div>
                  <button className="copy-link-button justify-center" type="button" onClick={() => copyGuestLink(guest)}>
                    {copiedGuestId === guest.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedGuestId === guest.id ? "Скопировано" : "Скопировать ссылку"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-stone-500 md:grid-cols-3">
                  <span>Еда: <b className="text-stone-800">{foodLabels[normalizeFood(guest.foodPreference)]}</b></span>
                  <span>Бар: <b className="text-stone-800">{guest.alcoholPreferences.length ? guest.alcoholPreferences.map((item) => alcoholLabels[item]).join(", ") : "не выбран"}</b></span>
                  <span>Трансфер: <b className="text-stone-800">{guest.transportPreference ? transportLabels[guest.transportPreference] : "не выбран"}</b></span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {guestTagCodes.map((tag) => {
                    const nextTags = guest.tags.includes(tag) ? guest.tags.filter((item) => item !== tag) : [...guest.tags, tag];
                    return (
                      <button key={tag} type="button" className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${guest.tags.includes(tag) ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-500"}`} onClick={() => updateGuestTags(guest, nextTags)}>
                        {tagLabels[tag]}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
            <div>
              <Users className="mx-auto h-10 w-10 text-stone-400" />
              <strong className="mt-3 block text-stone-900">Список пока пуст</strong>
              <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">Добавьте первого гостя, и мы подготовим для него личную ссылку.</p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-stone-200 bg-white/75 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Умный опрос гостей</p>
            <h3 className="font-serif text-3xl text-stone-950">Вопросы RSVP</h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">Основные вопросы уже включены. Ниже можно добавить свои уточнения.</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{customQuestions.length}/5 вопросов</span>
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {builtInQuestions.map((question) => (
            <div className="flex items-center gap-2 rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-600" key={question}>
              <Check className="h-4 w-4 text-emerald-600" />
              {question}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {questionPresets.map((preset) => (
            <button className="secondary-action" key={preset.title} type="button" onClick={() => addQuestion(preset)}>
              <Plus className="h-4 w-4" />
              {preset.title}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {customQuestions.map((question) => (
            <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={question.id}>
              <div className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
                <label className="grid gap-2 text-sm font-medium text-stone-600">
                  Текст вопроса
                  <input className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 outline-none focus:border-stone-500" value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-stone-600">
                  Тип ответа
                  <select className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 outline-none focus:border-stone-500" value={question.type} onChange={(event) => updateQuestion(question.id, { options: event.target.value === "OPTIONS" ? question.options.length ? question.options : ["Да", "Нет"] : [], type: event.target.value as CustomQuestion["type"] })}>
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
                <label className="mt-3 grid gap-2 text-sm font-medium text-stone-600">
                  Варианты через запятую
                  <input className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 outline-none focus:border-stone-500" value={question.options.join(", ")} onChange={(event) => updateQuestion(question.id, { options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean) })} placeholder="Да, Нет, Пока не знаю" />
                </label>
              ) : null}
            </article>
          ))}
        </div>

        <button className="secondary-action mt-4 w-full justify-center" type="button" onClick={() => addQuestion()}>
          <Plus className="h-4 w-4" />
          Добавить свой вопрос
        </button>

        {customAnswerSummary.some((item) => item.answers.length > 0) ? (
          <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="mb-2 text-sm font-medium text-stone-800">Ответы на ваши вопросы</p>
            {customAnswerSummary.filter((item) => item.answers.length > 0).map((item) => (
              <PreferenceLine key={item.question.id} label={item.question.title} value={item.answers.length} />
            ))}
          </div>
        ) : null}

        {questionMessage ? <p className="mt-3 text-sm text-stone-500">{questionMessage}</p> : null}
      </section>

      {detailsOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-stone-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <section className="max-h-[86svh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Подробная сводка</p>
                <h3 className="font-serif text-3xl text-stone-950">Все ответы гостей</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">Информация для ресторана, координатора и ведущего.</p>
              </div>
              <button className="icon-button" type="button" aria-label="Закрыть" onClick={() => setDetailsOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><Utensils className="h-4 w-4" />Меню</div>
                <PreferenceLine label="Мясо" value={preferenceStats.food.meat} />
                <PreferenceLine label="Рыба" value={preferenceStats.food.fish} />
                <PreferenceLine label="Веган" value={preferenceStats.food.vegan} />
                <PreferenceLine label="Не выбрали" value={preferenceStats.food.unknown} />
              </div>
              <div className="rounded-2xl border border-stone-200 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><Wine className="h-4 w-4" />Бар</div>
                <PreferenceLine label="Вино" value={preferenceStats.alcohol.WINE} />
                <PreferenceLine label="Шампанское" value={preferenceStats.alcohol.CHAMPAGNE} />
                <PreferenceLine label="Крепкий алкоголь" value={preferenceStats.alcohol.STRONG} />
                <PreferenceLine label="Не пьют" value={preferenceStats.alcohol.NONE} />
              </div>
              <div className="rounded-2xl border border-stone-200 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><BusFront className="h-4 w-4" />Транспорт</div>
                <PreferenceLine label="Нужен трансфер" value={preferenceStats.transport.TRANSFER} />
                <PreferenceLine label="На своей машине" value={preferenceStats.transport.OWN_CAR} />
                <PreferenceLine label="Доберутся сами" value={preferenceStats.transport.SELF} />
              </div>
              <div className="rounded-2xl border border-stone-200 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><ClipboardList className="h-4 w-4" />Особые отметки</div>
                <PreferenceLine label="Аллергии" value={preferenceStats.allergies} />
                <PreferenceLine label="Треки для танцев" value={preferenceStats.danceTracks} />
                <PreferenceLine label="Ожидаем гостей" value={guestStats.headcount} />
              </div>
            </div>

            <button className="primary-action mt-5 w-full justify-center" type="button" onClick={downloadCsv} disabled={!guests.length}>
              <Download className="h-4 w-4" />
              Скачать таблицу CSV
            </button>
          </section>
        </div>
      ) : null}

      <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4 text-sm leading-relaxed text-stone-500">
        <div className="mb-2 flex items-center gap-2 font-medium text-stone-700">
          <ListChecks className="h-4 w-4" />
          Как это работает
        </div>
        Гость открывает персональную ссылку, отвечает на RSVP и выбирает предпочтения. Ответ сразу появляется здесь, а CSV можно отправить координатору или ресторану.
      </div>
    </section>
  );
}
