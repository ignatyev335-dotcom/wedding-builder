"use client";

import { LoaderCircle, Send } from "lucide-react";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type TelegramStartResponse = {
  token?: string;
  botUrl?: string;
  error?: string;
};

type TelegramStatusResponse = {
  status?: "PENDING" | "CONFIRMED" | "EXPIRED";
  redirectTo?: string;
  error?: string;
};

export function AuthProviderButtons({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [telegramHint, setTelegramHint] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const loginWithTelegram = async () => {
    setError("");
    setTelegramHint("");
    setIsTelegramLoading(true);

    try {
      const response = await fetch("/api/auth/telegram/start", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
      const payload = (await response.json()) as TelegramStartResponse;

      if (!response.ok || !payload.token || !payload.botUrl) {
        throw new Error(payload.error || "Telegram-вход пока не настроен.");
      }

      window.open(payload.botUrl, "_blank", "noopener,noreferrer");
      setTelegramHint("Откройте Telegram, нажмите Start у бота — мы сами вернем вас в кабинет.");
      startTelegramPolling(payload.token);
    } catch (requestError) {
      setIsTelegramLoading(false);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Telegram не ответил. Попробуйте еще раз.",
      );
    }
  };

  const startTelegramPolling = (token: string) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    const startedAt = Date.now();
    pollTimerRef.current = setInterval(async () => {
      if (Date.now() - startedAt > 5 * 60 * 1000) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setIsTelegramLoading(false);
        setTelegramHint("");
        setError("Время входа через Telegram истекло. Запустите вход еще раз.");
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/telegram/status?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as TelegramStatusResponse;

        if (payload.status === "CONFIRMED") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          window.location.assign(payload.redirectTo ?? redirectTo);
          return;
        }

        if (payload.status === "EXPIRED" || response.status === 410) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsTelegramLoading(false);
          setTelegramHint("");
          setError("Ссылка Telegram устарела. Нажмите кнопку входа еще раз.");
        }
      } catch {
        // Сеть может моргнуть, продолжаем ждать до истечения токена.
      }
    }, 1600);
  };

  const loginWithYandex = async () => {
    setError("");
    setTelegramHint("");
    try {
      await signIn("yandex", { redirectTo });
    } catch {
      setError("Яндекс ID пока не настроен. Проверьте AUTH_YANDEX_ID и AUTH_YANDEX_SECRET в Vercel.");
    }
  };

  return (
    <section className="auth-provider-section">
      <div className="auth-divider">
        <span>или продолжить через</span>
      </div>
      <div className="auth-provider-buttons">
        <button className="auth-provider-button yandex" type="button" onClick={() => void loginWithYandex()}>
          <span aria-hidden="true">Я</span>
          <i>Яндекс ID</i>
        </button>
        <button
          className="auth-provider-button telegram"
          type="button"
          disabled={isTelegramLoading}
          onClick={() => void loginWithTelegram()}
        >
          <span aria-hidden="true">
            {isTelegramLoading ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />}
          </span>
          <i>{isTelegramLoading ? "Ждем Telegram" : "Telegram"}</i>
        </button>
      </div>
      {telegramHint ? <small className="telegram-login-note">{telegramHint}</small> : null}
      {error ? <p className="login-error">{error}</p> : null}
    </section>
  );
}
