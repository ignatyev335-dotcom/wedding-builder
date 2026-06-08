"use client";

import {
  Check,
  Crown,
  LoaderCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import type { PackageCode } from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { QrCodeCard } from "@/features/constructor/ui/qr-code-card";

const packages: Array<{
  code: PackageCode;
  title: string;
  price: number;
  description: string;
  features: string[];
  accent?: boolean;
}> = [
  {
    code: "BASIC",
    title: "Базовый",
    price: 0,
    description: "Красивое приглашение для камерного запуска.",
    features: [
      "Бесплатный свадебный сайт",
      "Стандартные стили",
      "Логотип Vowly в футере",
    ],
  },
  {
    code: "INTERACTIVE",
    title: "Интерактив",
    price: 1990,
    description: "Самые необходимые функции для работы с гостями.",
    features: [
      "Всё из Базового",
      "Без логотипа Vowly",
      "Умный опрос гостей",
      "Выгрузка ответов в таблицу",
    ],
    accent: true,
  },
  {
    code: "PREMIUM",
    title: "Премиум Вайл",
    price: 2990,
    description: "Полный набор для персонального приглашения.",
    features: [
      "Всё из Интерактива",
      "Премиум музыка Suno",
      "Именные ссылки для гостей",
      "Интеграция с Telegram-ботом",
    ],
  },
];

const currency = new Intl.NumberFormat("ru-RU");

export function PackagesPanel() {
  const {
    siteId,
    selectedPackage,
    telegramProfile,
    setSelectedPackage,
    setTelegramProfile,
  } = useWeddingStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const selected = packages.find((item) => item.code === selectedPackage) ?? packages[0];

  const connectTelegram = async () => {
    setIsConnecting(true);
    setTelegramError("");
    const profile = {
      telegramId: `tg_${Date.now()}`,
      chatId: `chat_${Date.now()}`,
      name: "Александр и Мария",
    };

    try {
      if (siteId && siteId !== "quiz-draft") {
        const response = await fetch(`/api/wedding-sites/${siteId}/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });

        if (!response.ok) {
          throw new Error("Не удалось сохранить Telegram-профиль.");
        }
      }

      setTelegramProfile(profile);
    } catch (error) {
      setTelegramError(
        error instanceof Error ? error.message : "Ошибка подключения Telegram.",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <header className="packages-heading">
        <span>Ваш сайт почти готов</span>
        <h2>Оживите приглашение</h2>
        <p>Выберите уровень заботы, который подойдет именно вашей свадьбе.</p>
      </header>

      <div className="package-grid">
        {packages.map((item) => {
          const isSelected = selectedPackage === item.code;

          return (
            <button
              key={item.code}
              className={`package-card ${item.accent ? "is-accent" : ""} ${
                isSelected ? "is-selected" : ""
              }`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPackage(item.code)}
            >
              <span className="package-choice">
                {isSelected && <Check size={14} />}
              </span>
              <span className="package-title">
                {item.code === "PREMIUM" ? <Crown size={17} /> : <Sparkles size={17} />}
                <strong>{item.title}</strong>
              </span>
              <span className="package-price">
                <b>{currency.format(item.price)}</b> ₽
              </span>
              <small>{item.description}</small>
              <span className="package-features">
                {item.features.map((feature) => (
                  <i key={feature}>
                    <Check size={13} />
                    {feature}
                  </i>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {selectedPackage === "PREMIUM" && (
        <section className="package-telegram">
          <span><Send size={18} /></span>
          <div>
            <strong>{telegramProfile?.name ?? "Уведомления о гостях в Telegram"}</strong>
            <small>
              {telegramProfile
                ? "Аккаунт подключен"
                : "Привяжите аккаунт для уведомлений от бота"}
            </small>
          </div>
          <button
            type="button"
            disabled={isConnecting || Boolean(telegramProfile)}
            onClick={connectTelegram}
          >
            {isConnecting ? (
              <LoaderCircle className="spin" size={15} />
            ) : telegramProfile ? (
              "Подключено"
            ) : (
              "Войти через Telegram"
            )}
          </button>
        </section>
      )}
      {telegramError && <p className="telegram-error">{telegramError}</p>}

      <QrCodeCard />

      <section className="package-checkout">
        <div>
          <span>Выбран тариф</span>
          <strong>{selected.title}</strong>
          <b>{currency.format(selected.price)} ₽</b>
        </div>
        {selected.price === 0 ? (
          <button type="button">Оживить сайт и отправить гостям</button>
        ) : (
          <button type="button">
            Оживить сайт и отправить гостям
            <small>СБП</small>
          </button>
        )}
        <p>
          Не переживайте, вы сможете вносить изменения даже после публикации,
          вплоть до самого дня свадьбы.
        </p>
      </section>
    </>
  );
}
