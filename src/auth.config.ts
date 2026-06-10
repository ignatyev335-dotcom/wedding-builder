export type AuthProviderDraft = {
  id: "google" | "telegram";
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
