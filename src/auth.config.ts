export type AuthProviderDraft = {
  id: "yandex" | "telegram";
  name: string;
  type: "oauth" | "credentials";
  enabled: boolean;
};

export const authProviders: AuthProviderDraft[] = [
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
];

export const enabledAuthProviders = authProviders.filter(
  (provider) => provider.enabled,
);
