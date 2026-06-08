"use client";

import { CheckCircle2, Clock3, Download, UserRoundX, Users } from "lucide-react";

import { exportGuestsToCsv } from "@/features/constructor/lib/export-guests";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

const statusLabels = {
  PENDING: "Ждем ответа",
  ATTENDING: "Идет",
  NOT_ATTENDING: "Не идет",
} as const;

export function GuestsPanel() {
  const guests = useWeddingStore((state) => state.guests);
  const attending = guests.filter((guest) => guest.status === "ATTENDING").length;
  const waiting = guests.length - attending;

  return (
    <>
      <header className="guests-heading">
        <span>Всё под рукой</span>
        <h2>Ваши любимые гости</h2>
        <p>Все ответы из умного опроса появляются здесь в реальном времени.</p>
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

      <div className="guests-toolbar">
        <div>
          <strong>Список ответов</strong>
          <small>{guests.length ? "Обновляется автоматически" : "Пока нет ответов"}</small>
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
        <div className="guest-table">
          <div className="guest-table-head">
            <span>Гость</span>
            <span>Статус</span>
            <span>Детали</span>
          </div>
          {guests.map((guest) => (
            <article key={guest.id}>
              <div>
                <strong>{guest.name}</strong>
                <small>
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(guest.respondedAt))}
                </small>
              </div>
              <span className={`guest-status status-${guest.status.toLowerCase()}`}>
                {statusLabels[guest.status]}
              </span>
              <dl>
                <div><dt>Еда</dt><dd>{guest.dietaryRestrictions || "Нет ограничений"}</dd></div>
                <div><dt>Напитки</dt><dd>{guest.drinks || "Не указано"}</dd></div>
                <div><dt>Трансфер</dt><dd>{guest.needsTransport ? "Нужен" : "Не нужен"}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="guests-empty">
          <UserRoundX size={25} />
          <strong>Ответов пока нет</strong>
          <p>Заполните умный опрос в телефоне справа и увидите магию.</p>
        </div>
      )}
    </>
  );
}
