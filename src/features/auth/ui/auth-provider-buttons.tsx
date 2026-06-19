"use client";

import { Send } from "lucide-react";
import { signIn } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";

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

function normalizeTelegramUsername(value?: string | null) {
  return (value ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^t\.me\//i, "");
}

export function AuthProviderButtons({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const callbackName = `vowlyTelegramLogin_${useId().replace(/\W/g, "")}` as const;
  const telegramContainerRef = useRef<HTMLDivElement | null>(null);
  const [botUsername, setBotUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    void fetch("/api/runtime-config", { cache: "no-store" })
      .then((response) => response.json())
      .then((config: { telegramBotUsername?: string | null }) => {
        if (isMounted) {
          setBotUsername(normalizeTelegramUsername(config.telegramBotUsername));
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

      try {
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
      } catch {
        setError("Telegram не ответил. Попробуйте еще раз или войдите по почте/телефону.");
      }
    };

    return () => {
      delete window[callbackName];
    };
  }, [callbackName, redirectTo]);

  useEffect(() => {
    const container = telegramContainerRef.current;
    if (!container || !botUsername) return;

    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", `window.${callbackName}(user)`);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [botUsername, callbackName]);

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
          <div
            ref={telegramContainerRef}
            className="auth-provider-button telegram-widget"
            aria-label="Войти через Telegram"
          />
        ) : (
          <button className="auth-provider-button telegram" type="button" disabled>
            <span aria-hidden="true">
              <Send size={15} />
            </span>
            <i>Telegram</i>
          </button>
        )}
      </div>
      {!botUsername ? (
        <small className="telegram-login-note">
          Telegram включится после подключения бота в настройках проекта.
        </small>
      ) : null}
      {error ? <p className="login-error">{error}</p> : null}
    </section>
  );
}
