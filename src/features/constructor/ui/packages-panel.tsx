"use client";

import {
  Check,
  Crown,
  Download,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import type { PackageCode } from "@/entities/wedding/model";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
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
    description: "Аккуратный сайт без лишней сложности, чтобы быстро отправить ссылку гостям.",
    features: ["Публичная ссылка", "Стандартная публикация", "Подпись Vowly внизу сайта"],
  },
  {
    code: "INTERACTIVE",
    title: "Интерактив",
    price: 1990,
    description: "Все важные smart-функции для сбора ответов и подготовки к празднику.",
    features: [
      "Скрытие подписи Vowly",
      "Умный RSVP-опрос гостей",
      "Выгрузка ответов в CSV",
      "Персональные ссылки гостей",
    ],
    accent: true,
  },
  {
    code: "PREMIUM",
    title: "Премиум",
    price: 2990,
    description: "Максимальная версия для красивого запуска и автоматизации.",
    features: [
      "Все из тарифа Интерактив",
      "Премиум-музыка",
      "Telegram-уведомления",
      "Галерея после свадьбы",
    ],
  },
];

const currency = new Intl.NumberFormat("ru-RU");

export function PackagesPanel() {
  const {
    siteId,
    slug,
    isPremium,
    removeBranding,
    selectedPackage,
    telegramProfile,
    partnerOneName,
    partnerTwoName,
    weddingDate,
    heroImageDesktop,
    heroImageMobile,
    coverPhoto,
    isPrivate,
    pinCode,
    setSelectedPackage,
    setRemoveBranding,
    setPrivateSite,
    setPinCode,
  } = useWeddingStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [cardError, setCardError] = useState("");
  const [brandingError, setBrandingError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const selected =
    packages.find((item) => item.code === selectedPackage) ?? packages[0];

  const saveSettings = () => {
    window.setTimeout(() => {
      void persistSiteExtras().catch(() => undefined);
    }, 0);
  };

  const connectTelegram = async () => {
    setIsConnecting(true);
    setTelegramError("");
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

    if (!siteId || siteId === "quiz-draft") {
      setTelegramError("Сначала сохраните проект, затем подключите Telegram.");
      setIsConnecting(false);
      return;
    }
    if (!botUsername) {
      setTelegramError("Укажите NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в настройках проекта.");
      setIsConnecting(false);
      return;
    }

    window.open(
      `https://t.me/${botUsername.replace(/^@/, "")}?start=site_${siteId}`,
      "_blank",
      "noopener,noreferrer",
    );
    setIsConnecting(false);
  };

  const copyPublishedUrl = async () => {
    if (!publishedUrl) return;
    await navigator.clipboard.writeText(publishedUrl);
    setPublishError("");
    setPublishSuccess("Ссылка скопирована. Можно отправлять гостям.");
  };

  const publishSite = async () => {
    if (!siteId || siteId === "quiz-draft") {
      setPublishError("Сначала создайте сайт из квиза, затем публикуйте.");
      return;
    }

    setIsPublishing(true);
    setPublishError("");
    setPublishSuccess("");

    try {
      await persistSiteExtras();

      const response = await fetch(`/api/wedding-sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось опубликовать сайт.");
      }

      const nextUrl =
        slug && typeof window !== "undefined"
          ? `${window.location.origin}/wedding/${slug}`
          : "";
      setPublishedUrl(nextUrl);
      setPublishSuccess("Сайт опубликован. Можно копировать ссылку и отправлять гостям.");
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Не удалось оживить сайт.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleBranding = async () => {
    if (!siteId || siteId === "quiz-draft" || !isPremium || isSavingBranding) return;

    const nextValue = !removeBranding;
    setIsSavingBranding(true);
    setBrandingError("");

    const response = await fetch(`/api/wedding-sites/${siteId}/branding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeBranding: nextValue }),
    });
    const data = (await response.json()) as { error?: string };

    if (response.ok) setRemoveBranding(nextValue);
    else setBrandingError(data.error || "Не удалось обновить подпись платформы.");
    setIsSavingBranding(false);
  };

  const downloadSaveTheDate = async () => {
    const source = heroImageMobile ?? heroImageDesktop ?? coverPhoto;
    if (!source) {
      setCardError("Сначала загрузите обложку в разделе «Медиа».");
      return;
    }

    setIsGeneratingCard(true);
    setCardError("");

    try {
      const image = await loadCanvasImage(source);
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas недоступен.");

      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(
        image,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height,
      );

      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(16,18,15,.18)");
      gradient.addColorStop(0.55, "rgba(16,18,15,.08)");
      gradient.addColorStop(1, "rgba(16,18,15,.72)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.textAlign = "center";
      context.fillStyle = "#ffffff";
      context.font = "500 42px Georgia";
      context.fillText("Сохраните эту дату", 540, 1030);
      context.font = "italic 92px Georgia";
      context.fillText(`${partnerOneName} & ${partnerTwoName}`, 540, 1145);
      context.font = "500 43px Arial";
      context.fillText(
        new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date(`${weddingDate}T12:00:00`)),
        540,
        1235,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.94),
      );
      if (!blob) throw new Error("Не удалось подготовить изображение.");

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "save-the-date.jpg";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setCardError(
        error instanceof Error ? error.message : "Не удалось скачать открытку.",
      );
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return (
    <>
      <header className="packages-heading">
        <span>Публикация и тарифы</span>
        <h2>Оживить сайт и отправить гостям</h2>
        <p>
          Выберите пакет, проверьте QR-код и запустите сайт. Изменения можно
          вносить даже после публикации.
        </p>
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
          <span>
            <Send size={18} />
          </span>
          <div>
            <strong>{telegramProfile?.name ?? "Подключение Telegram"}</strong>
            <small>
              {telegramProfile
                ? "Аккаунт подключен"
                : "Бот будет присылать уведомления об ответах гостей"}
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

      <section className="premium-tools">
        <div className={`private-site-setting branding-setting ${!isPremium ? "is-locked" : ""}`}>
          <span>{isPremium ? <EyeOff size={18} /> : <LockKeyhole size={18} />}</span>
          <div>
            <strong>Скрыть подпись Vowly</strong>
            <small>
              {isPremium
                ? "Премиум-пользователи могут убрать платформенную подпись."
                : "Доступно после активации платного пакета."}
            </small>
          </div>
          <button
            className={`switch ${removeBranding ? "is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={removeBranding}
            disabled={!isPremium || isSavingBranding}
            onClick={() => void toggleBranding()}
          >
            <i />
          </button>
        </div>
        {brandingError && <p className="telegram-error">{brandingError}</p>}

        <div className="private-site-setting">
          <span>
            <LockKeyhole size={18} />
          </span>
          <div>
            <strong>Закрытая свадьба</strong>
            <small>Гости увидят сайт только после ввода PIN-кода.</small>
          </div>
          <button
            className={`switch ${isPrivate ? "is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={() => {
              setPrivateSite(!isPrivate);
              if (isPrivate) saveSettings();
            }}
          >
            <i />
          </button>
        </div>
        {isPrivate && (
          <label className="private-pin-field">
            <span>PIN-код для входа на сайт</span>
            <input
              inputMode="numeric"
              maxLength={4}
              value={pinCode}
              placeholder="2026"
              onChange={(event) =>
                setPinCode(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              onBlur={() => {
                if (pinCode.length === 4) saveSettings();
              }}
            />
          </label>
        )}

        <button
          className="save-date-download"
          type="button"
          disabled={isGeneratingCard}
          onClick={() => void downloadSaveTheDate()}
        >
          <Download size={17} />
          {isGeneratingCard ? "Готовим открытку..." : "Скачать Save the Date"}
        </button>
        {cardError && <p className="telegram-error">{cardError}</p>}
      </section>

      <section className="package-checkout">
        <div>
          <span>Выбранный пакет</span>
          <strong>{selected.title}</strong>
          <b>{currency.format(selected.price)} ₽</b>
        </div>
        <button type="button" disabled={isPublishing} onClick={() => void publishSite()}>
          {isPublishing
            ? "Публикуем сайт..."
            : selected.price === 0
              ? "Оживить сайт и отправить гостям"
              : "Оплатить и оживить сайт"}
          {selected.price > 0 && <small>СБП</small>}
        </button>
        {publishSuccess && <p className="publish-feedback is-success">{publishSuccess}</p>}
        {publishError && <p className="telegram-error">{publishError}</p>}
        {publishedUrl && (
          <div className="publish-result">
            <a href={publishedUrl} target="_blank" rel="noreferrer">
              {publishedUrl}
            </a>
            <div>
              <button type="button" onClick={() => void copyPublishedUrl()}>
                Скопировать ссылку
              </button>
              <a href={publishedUrl} target="_blank" rel="noreferrer">
                Открыть сайт
              </a>
            </div>
          </div>
        )}
        <p>
          Не переживайте, вы сможете вносить изменения даже после публикации,
          вплоть до самого дня свадьбы.
        </p>
      </section>
    </>
  );
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось загрузить обложку."));
    image.src = source;
  });
}
