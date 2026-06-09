"use client";

import {
  BusFront,
  Check,
  CheckCircle2,
  Copy,
  Download,
  GlassWater,
  Link2,
  Plus,
  Tag,
  Trash2,
  UserRoundX,
  Users,
  Wine,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  guestTagCodes,
  type CustomQuestion,
  type GuestResponse,
  type GuestTagCode,
} from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";

const statusLabels = {
  PENDING: "Ждем ответа",
  ACCEPTED: "Придет",
  DECLINED: "Отказ",
} as const;

const tagLabels: Record<GuestTagCode, string> = {
  FAMILY: "Семья",
  FRIENDS: "Друзья",
  COLLEAGUES: "Коллеги",
};

export function GuestsPanel() {
  const siteId = useWeddingStore((state) => state.siteId);
  const guests = useWeddingStore((state) => state.guests);
  const setGuests = useWeddingStore((state) => state.setGuests);
  const prependGuest = useWeddingStore((state) => state.prependGuest);
  const updateGuest = useWeddingStore((state) => state.updateGuest);
  const customQuestions = useWeddingStore((state) => state.customQuestions);
  const setCustomQuestions = useWeddingStore((state) => state.setCustomQuestions);
  const [name, setName] = useState("");
  const [isCouple, setIsCouple] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [tags, setTags] = useState<GuestTagCode[]>([]);
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId || siteId === "quiz-draft") {
      return;
    }

    const controller = new AbortController();
    fetch(`/api/wedding-sites/${encodeURIComponent(siteId)}/guests`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить список гостей.");
        }

        return (await response.json()) as { guests: GuestResponse[] };
      })
      .then((data) => setGuests(data.guests))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }

        setError("Не удалось обновить список гостей.");
      });

    return () => controller.abort();
  }, [setGuests, siteId]);

  const attending = guests.reduce((total, guest) => {
    if (guest.status !== "ACCEPTED") return total;
    if (!guest.isCouple) return total + 1 + (guest.hasPlusOne ? 1 : 0);
    return total + (guest.attendanceChoice === "BOTH" ? 2 : 1);
  }, 0);
  const declined = guests.reduce(
    (total, guest) =>
      total + (guest.status === "DECLINED" ? (guest.isCouple ? 2 : 1) : 0),
    0,
  );
  const totalHeadcount =
    guests.reduce(
      (total, guest) =>
        total + (guest.isCouple ? 2 : 1 + (guest.hasPlusOne ? 1 : 0)),
      0,
    );
  const wine = guests.filter((guest) =>
    guest.alcoholPreferences.includes("WINE"),
  ).length;
  const champagne = guests.filter((guest) =>
    guest.alcoholPreferences.includes("CHAMPAGNE"),
  ).length;
  const strong = guests.filter((guest) =>
    guest.alcoholPreferences.includes("STRONG"),
  ).length;
  const nonAlcohol = guests.filter((guest) =>
    guest.alcoholPreferences.includes("NONE"),
  ).length;
  const transfer = guests.filter(
    (guest) =>
      guest.transportPreference === "TRANSFER" || guest.needsTransport,
  ).length;

  const addGuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!siteId || siteId === "quiz-draft") {
      setError("Сначала сохраните проект.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/wedding-sites/${encodeURIComponent(siteId)}/guests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, isCouple, partnerName, tags }),
        },
      );
      const data = (await response.json()) as {
        guest?: GuestResponse;
        error?: string;
      };

      if (!response.ok || !data.guest) {
        throw new Error(data.error || "Не удалось добавить гостя.");
      }

      prependGuest(data.guest);
      setName("");
      setPhone("");
      setIsCouple(false);
      setPartnerName("");
      setTags([]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось добавить гостя.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDraftTag = (tag: GuestTagCode) => {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  const toggleGuestTag = async (guest: GuestResponse, tag: GuestTagCode) => {
    if (!siteId || siteId === "quiz-draft") return;
    const nextTags = guest.tags.includes(tag)
      ? guest.tags.filter((item) => item !== tag)
      : [...guest.tags, tag];
    const response = await fetch(
      `/api/wedding-sites/${encodeURIComponent(siteId)}/guests`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id, tags: nextTags }),
      },
    );
    const data = (await response.json()) as { guest?: GuestResponse };
    if (response.ok && data.guest) updateGuest(data.guest);
  };

  const saveQuestions = (questions: CustomQuestion[]) => {
    setCustomQuestions(questions);
    window.setTimeout(() => void persistSiteExtras().catch(() => undefined), 0);
  };

  const addCustomQuestion = () => {
    if (customQuestions.length >= 2) return;
    saveQuestions([
      ...customQuestions,
      {
        id: crypto.randomUUID(),
        title: "Ваш вопрос",
        type: "TEXT",
        options: [],
      },
    ]);
  };

  const updateCustomQuestion = (
    id: string,
    patch: Partial<CustomQuestion>,
  ) => {
    saveQuestions(
      customQuestions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
  };

  const copyInvitation = async (guest: GuestResponse) => {
    if (!guest.invitationUrl) {
      return;
    }

    await navigator.clipboard.writeText(guest.invitationUrl);
    setCopiedId(guest.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  const downloadGuests = async () => {
    if (!siteId || siteId === "quiz-draft") return;

    const response = await fetch(
      `/api/wedding-sites/${encodeURIComponent(siteId)}/guests/export`,
    );
    if (!response.ok) {
      setError("Не удалось подготовить таблицу гостей.");
      return;
    }

    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vowly-guests-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="guests-heading">
        <span>Все под рукой</span>
        <h2>Ваши любимые гости</h2>
        <p>Добавьте близких и отправьте каждому персональное приглашение.</p>
      </header>

      <div className="guest-stats">
        <article>
          <Users size={18} />
          <span>Всего гостей</span>
          <strong>{totalHeadcount}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>Подтвердили</span>
          <strong>{attending}</strong>
        </article>
        <article>
          <XCircle size={18} />
          <span>Отказались</span>
          <strong>{declined}</strong>
        </article>
      </div>

      <div className="guest-insights">
        <article>
          <Wine size={17} />
          <div>
            <span>Вино</span>
            <strong>{wine}</strong>
          </div>
        </article>
        <article>
          <GlassWater size={17} />
          <div>
            <span>Шампанское</span>
            <strong>{champagne}</strong>
          </div>
        </article>
        <article>
          <GlassWater size={17} />
          <div>
            <span>Крепкое</span>
            <strong>{strong}</strong>
          </div>
        </article>
        <article>
          <GlassWater size={17} />
          <div>
            <span>Не пьют</span>
            <strong>{nonAlcohol}</strong>
          </div>
        </article>
        <article>
          <BusFront size={17} />
          <div>
            <span>Нужен трансфер</span>
            <strong>{transfer}</strong>
          </div>
        </article>
      </div>

      <form className="guest-quick-form" onSubmit={addGuest}>
        <div>
          <strong>Добавить гостя</strong>
          <small>Персональная ссылка создастся автоматически</small>
        </div>
        <label>
          <span>Имя</span>
          <input
            required
            minLength={2}
            value={name}
            placeholder="Александр"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          <span>Телефон</span>
          <input
            required
            type="tel"
            value={phone}
            placeholder="+7 999 123-45-67"
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="guest-couple-toggle">
          <input
            type="checkbox"
            checked={isCouple}
            onChange={(event) => setIsCouple(event.target.checked)}
          />
          <span>Пригласить пару по одной ссылке</span>
        </label>
        {isCouple && (
          <label>
            <span>Имя второго гостя</span>
            <input
              required
              minLength={2}
              value={partnerName}
              placeholder="Мария"
              onChange={(event) => setPartnerName(event.target.value)}
            />
          </label>
        )}
        <div className="guest-tag-picker">
          <span>Теги</span>
          <div>
            {guestTagCodes.map((tag) => (
              <button
                className={tags.includes(tag) ? "is-selected" : ""}
                type="button"
                key={tag}
                onClick={() => toggleDraftTag(tag)}
              >
                <Tag size={12} /> {tagLabels[tag]}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={isSaving}>
          <Plus size={16} />
          {isSaving ? "Добавляем..." : "Добавить"}
        </button>
        {error && <p className="guest-form-error">{error}</p>}
      </form>

      <section className="guest-question-builder">
        <div>
          <span>Умный опрос гостей</span>
          <strong>Ваши вопросы</strong>
          <small>Добавьте до двух вопросов, которые появятся в RSVP.</small>
        </div>
        {customQuestions.map((question, index) => (
          <article key={question.id}>
            <span>Вопрос {index + 1}</span>
            <input
              value={question.title}
              onChange={(event) =>
                updateCustomQuestion(question.id, {
                  title: event.target.value,
                })
              }
            />
            <select
              value={question.type}
              onChange={(event) =>
                updateCustomQuestion(question.id, {
                  type: event.target.value as CustomQuestion["type"],
                  options:
                    event.target.value === "OPTIONS"
                      ? question.options.length
                        ? question.options
                        : ["Да", "Нет"]
                      : [],
                })
              }
            >
              <option value="TEXT">Текстовое поле</option>
              <option value="OPTIONS">Варианты ответа</option>
            </select>
            {question.type === "OPTIONS" && (
              <input
                value={question.options.join(", ")}
                placeholder="Например: Да, Нет, Пока не знаю"
                onChange={(event) =>
                  updateCustomQuestion(question.id, {
                    options: event.target.value
                      .split(",")
                      .map((option) => option.trim())
                      .filter(Boolean)
                      .slice(0, 6),
                  })
                }
              />
            )}
            <button
              type="button"
              aria-label="Удалить вопрос"
              onClick={() =>
                saveQuestions(
                  customQuestions.filter((item) => item.id !== question.id),
                )
              }
            >
              <Trash2 size={14} />
            </button>
          </article>
        ))}
        {customQuestions.length < 2 && (
          <button type="button" onClick={addCustomQuestion}>
            <Plus size={15} /> Добавить вопрос
          </button>
        )}
      </section>

      <div className="guests-toolbar">
        <div>
          <strong>Список гостей</strong>
          <small>{guests.length ? "Ответы обновляются из базы" : "Пока никого нет"}</small>
        </div>
        <button
          type="button"
          disabled={!guests.length}
          onClick={() => void downloadGuests()}
        >
          <Download size={15} /> Скачать таблицу (CSV)
        </button>
      </div>

      {guests.length ? (
        <div className="guest-table guest-crm-table">
          <div className="guest-table-head">
            <span>Гость</span>
            <span>Статус</span>
            <span>Персональная ссылка</span>
          </div>
          {guests.map((guest) => (
            <article key={guest.id}>
              <div>
                <strong>{guest.name}</strong>
                {guest.isCouple && (
                  <small className="guest-pair-name">и {guest.partnerName}</small>
                )}
                <small>{guest.phone || "Телефон не указан"}</small>
                <small>
                  {guest.foodPreference || "Еда не выбрана"}
                  {guest.allergies ? ` · Аллергии: ${guest.allergies}` : ""}
                </small>
                {guest.isCouple && guest.partnerFoodPreference && (
                  <small>
                    {guest.partnerName}: {guest.partnerFoodPreference}
                    {guest.partnerAllergies
                      ? ` · Аллергии: ${guest.partnerAllergies}`
                      : ""}
                  </small>
                )}
                {guest.plusOneName && <small>С парой: {guest.plusOneName}</small>}
                {guest.musicRequest && <small>Трек: {guest.musicRequest}</small>}
                <div className="guest-row-tags">
                  {guestTagCodes.map((tag) => (
                    <button
                      className={guest.tags.includes(tag) ? "is-selected" : ""}
                      type="button"
                      key={tag}
                      onClick={() => void toggleGuestTag(guest, tag)}
                    >
                      {tagLabels[tag]}
                    </button>
                  ))}
                </div>
              </div>
              <span className={`guest-status status-${guest.status.toLowerCase()}`}>
                {statusLabels[guest.status]}
              </span>
              <div className="guest-link-cell">
                <span>
                  <Link2 size={13} />
                  {guest.invitationUrl ? "Ссылка готова" : "Старая запись"}
                </span>
                <button
                  type="button"
                  disabled={!guest.invitationUrl}
                  onClick={() => void copyInvitation(guest)}
                >
                  {copiedId === guest.id ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === guest.id ? "Скопировано" : "Копировать"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="guests-empty">
          <UserRoundX size={25} />
          <strong>Список пока пуст</strong>
          <p>Добавьте первого гостя, и мы подготовим для него личную ссылку.</p>
        </div>
      )}
    </>
  );
}
