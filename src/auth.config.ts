export type AuthProviderDraft = {
  id: "google" | "yandex" | "telegram" | "otp";
  name: string;
  type: "oauth" | "credentials";
  enabled: boolean;
};

export const authProviders: AuthProviderDraft[] = [
  {
    id: "google",
    name: "Google",
    type: "oauth",
    enabled: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  },
  {
    id: "yandex",
    name: "Яндекс",
    type: "oauth",
    enabled: Boolean(process.env.AUTH_YANDEX_ID && process.env.AUTH_YANDEX_SECRET),
  },
  {
    id: "telegram",
    name: "Telegram",
    type: "credentials",
    enabled: Boolean(
      process.env.TELEGRAM_BOT_TOKEN &&
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    ),
  },
  {
    id: "otp",
    name: "Email или телефон",
    type: "credentials",
    enabled: true,
  },
];

export const enabledAuthProviders = authProviders.filter(
  (provider) => provider.enabled,
);
