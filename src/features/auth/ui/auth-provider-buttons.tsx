"use client";

import { Send } from "lucide-react";
import { signIn } from "next-auth/react";
import Script from "next/script";
import { useEffect, useId, useState } from "react";

type TelegramPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    [key: `vowlyTelegramLogin_${string}`]:
      | ((payload: TelegramPayload) => void)
      | undefined;
  }
}

export function AuthProviderButtons({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const callbackName = `vowlyTelegramLogin_${useId().replace(/\W/g, "")}` as const;
  const [botUsername, setBotUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    void fetch("/api/runtime-config", { cache: "no-store" })
      .then((response) => response.json())
      .then((config: { telegramBotUsername?: string | null }) => {
        if (isMounted) {
          setBotUsername(
            (config.telegramBotUsername ?? "")
              .trim()
              .replace(/^@/, "")
              .replace(/^https?:\/\/t\.me\//i, "")
              .replace(/^t\.me\//i, ""),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    window[callbackName] = async (payload) => {
      setError("");
      const result = await signIn("telegram", {
        ...Object.fromEntries(
          Object.entries(payload).map(([key, value]) => [key, String(value)]),
        ),
        redirect: false,
      });

      if (result?.error) {
        setError("Telegram не подтвердил вход. Проверьте токен бота и домен в BotFather.");
        return;
      }

      window.location.assign(redirectTo);
    };
    return () => {
      delete window[callbackName];
    };
  }, [callbackName, redirectTo]);

  const loginWithYandex = async () => {
    setError("");
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
        {botUsername ? (
          <div className="auth-provider-button telegram-widget">
            <Script
              src="https://telegram.org/js/telegram-widget.js?22"
              strategy="afterInteractive"
              data-telegram-login={botUsername}
              data-size="large"
              data-radius="12"
              data-request-access="write"
              data-userpic="false"
              data-onauth={`window.${callbackName}(user)`}
            />
          </div>
        ) : (
          <button className="auth-provider-button telegram" type="button" disabled>
            <span aria-hidden="true">
              <Send size={15} />
            </span>
            <i>Telegram</i>
          </button>
        )}
      </div>
      {!botUsername && (
        <small className="telegram-login-note">
          Telegram включится после подключения бота в настройках проекта.
        </small>
      )}
      {error && <p className="login-error">{error}</p>}
    </section>
  );
}
