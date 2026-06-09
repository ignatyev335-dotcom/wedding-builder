"use client";

import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Link2,
  Plus,
  UserRoundX,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { GuestResponse } from "@/entities/wedding/model";
import { exportGuestsToCsv } from "@/features/constructor/lib/export-guests";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

const statusLabels = {
  PENDING: "Ждем ответа",
  ACCEPTED: "Придет",
  DECLINED: "Отказ",
} as const;

export function GuestsPanel() {
  const siteId = useWeddingStore((state) => state.siteId);
  const guests = useWeddingStore((state) => state.guests);
  const setGuests = useWeddingStore((state) => state.setGuests);
  const prependGuest = useWeddingStore((state) => state.prependGuest);
  const [name, setName] = useState("");
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

  const attending = guests.filter((guest) => guest.status === "ACCEPTED").length;
  const waiting = guests.length - attending;

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
          body: JSON.stringify({ name, phone }),
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

  const copyInvitation = async (guest: GuestResponse) => {
    if (!guest.invitationUrl) {
      return;
    }

    await navigator.clipboard.writeText(guest.invitationUrl);
    setCopiedId(guest.id);
    window.setTimeout(() => setCopiedId(null), 1600);
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
          <strong>{guests.length}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>Подтвердили</span>
          <strong>{attending}</strong>
        </article>
        <article>
          <Clock3 size={18} />
          <span>Отказ / ждем</span>
          <strong>{waiting}</strong>
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
        <button type="submit" disabled={isSaving}>
          <Plus size={16} />
          {isSaving ? "Добавляем..." : "Добавить"}
        </button>
        {error && <p className="guest-form-error">{error}</p>}
      </form>

      <div className="guests-toolbar">
        <div>
          <strong>Список гостей</strong>
          <small>{guests.length ? "Ответы обновляются из базы" : "Пока никого нет"}</small>
        </div>
        <button
          type="button"
          disabled={!guests.length}
          onClick={() => exportGuestsToCsv(guests)}
        >
          <Download size={15} /> Выгрузить CSV
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
                <small>{guest.phone || "Телефон не указан"}</small>
                <small>
                  {guest.foodPreference || "Еда не выбрана"}
                  {guest.allergies ? ` · Аллергии: ${guest.allergies}` : ""}
                </small>
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
