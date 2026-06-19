"use client";

import {
  Check,
  Crown,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { PackageCode } from "@/entities/wedding/model";
import { AuthProviderButtons } from "@/features/auth/ui/auth-provider-buttons";
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
    description: "Smart-функции для сбора ответов и подготовки к празднику.",
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

type PasswordAuthResponse = {
  error?: string;
};

type PublishResponse = {
  code?: string;
  error?: string;
  publicUrl?: string;
};

export function PackagesPanel() {
  const {
    siteId,
    slug,
    isPremium,
    removeBranding,
    selectedPackage,
    telegramProfile,
    isPrivate,
    pinCode,
    setSelectedPackage,
    setRemoveBranding,
    setPrivateSite,
    setPinCode,
  } = useWeddingStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [brandingError, setBrandingError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authIdentity, setAuthIdentity] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [botUsername, setBotUsername] = useState("");

  const selected = packages.find((item) => item.code === selectedPackage) ?? packages[0];

  useEffect(() => {
    let isMounted = true;
    void fetch("/api/runtime-config", { cache: "no-store" })
      .then((response) => response.json())
      .then((config: { telegramBotUsername?: string | null }) => {
        if (isMounted) setBotUsername(config.telegramBotUsername ?? "");
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, []);

  const saveSettings = () => {
    window.setTimeout(() => {
      void persistSiteExtras().catch(() => undefined);
    }, 0);
  };

  const publicUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/wedding/${slug}` : "";

  const connectTelegram = async () => {
    setIsConnecting(true);
    setTelegramError("");

    if (!siteId || siteId === "quiz-draft") {
      setTelegramError("Сначала сохраните проект, затем подключите Telegram.");
      setIsConnecting(false);
      return;
    }

    if (!botUsername) {
      setTelegramError("Укажите username Telegram-бота в админке: Ключи и интеграции.");
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

  const submitPasswordAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: authIdentity,
          password: authPassword,
          mode: authMode,
        }),
      });
      const payload = (await response.json()) as PasswordAuthResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось войти.");
      }

      setAuthRequired(false);
      setAuthPassword("");
      await publishSite();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Не удалось войти.");
    } finally {
      setAuthLoading(false);
    }
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
      const payload = (await response.json()) as PublishResponse;

      if (!response.ok) {
        if (response.status === 401 && payload.code === "AUTH_REQUIRED") {
          setAuthRequired(true);
          setPublishError("");
          return;
        }

        throw new Error(payload.error || "Не удалось опубликовать сайт.");
      }

      setPublishedUrl(payload.publicUrl || publicUrl);
      setPublishSuccess("Сайт опубликован. Теперь можно копировать ссылку и отправлять гостям.");
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Не удалось оживить сайт.");
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

    if (response.ok) {
      setRemoveBranding(nextValue);
    } else {
      setBrandingError(data.error || "Не удалось обновить подпись платформы.");
    }

    setIsSavingBranding(false);
  };

  return (
    <>
      <header className="packages-heading">
        <span>Публикация и тарифы</span>
        <h2>Оживить сайт и отправить гостям</h2>
        <p>
          Перед запуском мы попросим войти по почте или телефону. Так сайт будет привязан к личному кабинету и не потеряется.
        </p>
      </header>

      {authRequired ? (
        <div
          className="publish-auth-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Вход перед публикацией сайта"
        >
          <section className="publish-auth-dialog">
            <button
              className="publish-auth-close"
              type="button"
              aria-label="Закрыть окно входа"
              onClick={() => {
                setAuthRequired(false);
                setAuthError("");
              }}
            >
              <X size={18} />
            </button>
            <div className="publish-auth-intro">
              <span>
                <ShieldCheck size={18} /> Безопасный запуск
              </span>
              <h3>Войдите, чтобы сайт не потерялся</h3>
              <p>
                Мы привяжем проект к личному кабинету, а после входа сразу продолжим публикацию.
              </p>
            </div>

            <div className="auth-mode-tabs" aria-label="Выбор сценария входа">
              <button
                className={authMode === "login" ? "is-active" : ""}
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Войти
              </button>
              <button
                className={authMode === "register" ? "is-active" : ""}
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
              >
                Зарегистрироваться
              </button>
            </div>

            <form className="publish-auth-form" onSubmit={submitPasswordAuth}>
              <label>
                <span>Почта или телефон</span>
                <input
                  required
                  value={authIdentity}
                  placeholder="hello@example.ru или 89091234567"
                  autoComplete="email tel"
                  onChange={(event) => setAuthIdentity(event.target.value)}
                />
              </label>
              <label>
                <span>Пароль</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={authPassword}
                  placeholder="Минимум 8 символов"
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
              </label>
              <button type="submit" disabled={authLoading || authPassword.length < 8}>
                {authLoading
                  ? "Сохраняем..."
                  : authMode === "login"
                    ? "Войти и оживить сайт"
                    : "Создать аккаунт и оживить сайт"}
              </button>
            </form>

            {authError ? <p className="telegram-error">{authError}</p> : null}
            <AuthProviderButtons redirectTo={typeof window !== "undefined" ? window.location.href : "/dashboard"} />
          </section>
        </div>
      ) : null}

      <div className="package-grid">
        {packages.map((item) => {
          const isSelected = selectedPackage === item.code;
          return (
            <button
              key={item.code}
              className={`package-card ${item.accent ? "is-accent" : ""} ${isSelected ? "is-selected" : ""}`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPackage(item.code)}
            >
              <span className="package-choice">{isSelected ? <Check size={14} /> : null}</span>
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

      {selectedPackage === "PREMIUM" ? (
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
          <button type="button" disabled={isConnecting || Boolean(telegramProfile)} onClick={connectTelegram}>
            {isConnecting ? <LoaderCircle className="spin" size={15} /> : telegramProfile ? "Подключено" : "Войти через Telegram"}
          </button>
        </section>
      ) : null}
      {telegramError ? <p className="telegram-error">{telegramError}</p> : null}

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
        {brandingError ? <p className="telegram-error">{brandingError}</p> : null}

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
        {isPrivate ? (
          <label className="private-pin-field">
            <span>PIN-код для входа на сайт</span>
            <input
              inputMode="numeric"
              maxLength={4}
              value={pinCode}
              placeholder="2026"
              onChange={(event) => setPinCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              onBlur={() => {
                if (pinCode.length === 4) saveSettings();
              }}
            />
          </label>
        ) : null}
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
          {selected.price > 0 ? <small>СБП</small> : null}
        </button>
        {publishSuccess ? <p className="publish-feedback is-success">{publishSuccess}</p> : null}
        {publishError ? <p className="telegram-error">{publishError}</p> : null}
        {publishedUrl ? (
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
        ) : null}
        <p>
          Не переживайте, вы сможете вносить изменения даже после публикации, вплоть до самого дня свадьбы.
        </p>
      </section>
    </>
  );
}
