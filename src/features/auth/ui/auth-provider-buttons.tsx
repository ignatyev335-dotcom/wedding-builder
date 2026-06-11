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

export function AuthProviderButtons() {
  const callbackName = `vowlyTelegramLogin_${useId().replaceAll(":", "")}` as const;
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const [error, setError] = useState("");

  useEffect(() => {
    window[callbackName] = (payload) => {
      void signIn("telegram", {
        ...Object.fromEntries(
          Object.entries(payload).map(([key, value]) => [key, String(value)]),
        ),
        redirectTo: "/account",
      });
    };
    return () => {
      delete window[callbackName];
    };
  }, [callbackName]);

  const oauth = async (provider: "google" | "yandex") => {
    setError("");
    try {
      await signIn(provider, { redirectTo: "/account" });
    } catch {
      setError("Провайдер пока не настроен. Проверьте ключи в Vercel.");
    }
  };

  return (
    <section className="auth-provider-section">
      <div className="auth-divider"><span>или продолжить через</span></div>
      <div className="auth-provider-buttons">
        <button type="button" onClick={() => void oauth("google")}>
          <b>G</b> Google
        </button>
        <button type="button" onClick={() => void oauth("yandex")}>
          <b>Я</b> Яндекс
        </button>
      </div>
      {botUsername ? (
        <div className="telegram-login-widget">
          <Script
            src="https://telegram.org/js/telegram-widget.js?22"
            strategy="afterInteractive"
            data-telegram-login={botUsername}
            data-size="large"
            data-radius="12"
            data-request-access="write"
            data-userpic="false"
            data-onauth={`${callbackName}(user)`}
          />
        </div>
      ) : (
        <button className="telegram-login-placeholder" type="button" disabled>
          <Send size={16} /> Telegram появится после подключения бота
        </button>
      )}
      {error && <p className="login-error">{error}</p>}
    </section>
  );
}
