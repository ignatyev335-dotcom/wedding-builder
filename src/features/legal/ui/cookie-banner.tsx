"use client";

import { useSyncExternalStore } from "react";

const cookieConsentKey = "vowly-cookie-consent";
const cookieConsentEvent = "vowly-cookie-consent-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(cookieConsentEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(cookieConsentEvent, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(cookieConsentKey) === "accepted";
}

export function CookieBanner() {
  const isAccepted = useSyncExternalStore(subscribe, getSnapshot, () => true);

  if (isAccepted) {
    return null;
  }

  return (
    <aside className="cookie-banner" aria-label="Уведомление о cookie">
      <div>
        <strong>Мы используем cookie</strong>
        <p>
          Они помогают сохранять настройки конструктора и улучшать работу сайта.
          Подробнее в <a href="#">Политике конфиденциальности</a>.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(cookieConsentKey, "accepted");
          window.dispatchEvent(new Event(cookieConsentEvent));
        }}
      >
        Понятно
      </button>
    </aside>
  );
}
