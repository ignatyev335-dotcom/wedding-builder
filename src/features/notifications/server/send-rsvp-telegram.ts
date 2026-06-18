import type { Guest, TransportPreference, User, WeddingSite } from "@prisma/client";

import { getSystemSettingValue } from "@/lib/system-settings";

type TelegramWeddingSite = Pick<WeddingSite, "telegramAlerts"> & {
  user: Pick<User, "telegramChatId">;
};

type TelegramGuest = Pick<
  Guest,
  "name" | "status" | "alcoholPreferences" | "needsTransport" | "transportPreference"
>;

const alcoholLabels: Record<string, string> = {
  WINE: "вино",
  CHAMPAGNE: "шампанское",
  STRONG: "крепкий алкоголь",
  NONE: "не пьет",
};

const transportLabels: Record<TransportPreference, string> = {
  TRANSFER: "нужен трансфер",
  OWN_CAR: "на своей машине",
  SELF: "доберется самостоятельно",
};

export async function sendRsvpTelegramNotification(
  site: TelegramWeddingSite,
  guest: TelegramGuest,
) {
  const botToken = await getSystemSettingValue("TELEGRAM_BOT_TOKEN");
  const chatId = site.user.telegramChatId;

  if (!site.telegramAlerts || !botToken || !chatId) return;

  let alcohol: string[] = [];
  try {
    alcohol = JSON.parse(guest.alcoholPreferences) as string[];
  } catch {
    alcohol = [];
  }

  const accepted = guest.status === "ACCEPTED";
  const transport = guest.transportPreference
    ? transportLabels[guest.transportPreference]
    : guest.needsTransport
      ? "нужен трансфер"
      : "не указан";
  const drinks = alcohol.length
    ? alcohol.map((item) => alcoholLabels[item] ?? item).join(", ")
    : "не указаны";
  const text = accepted
    ? [
        `Ура! ${guest.name} подтвердил(а) участие!`,
        `Предпочтения по бару: ${drinks}.`,
        `Транспорт: ${transport}.`,
      ].join("\n")
    : `${guest.name} сообщил(а), что не сможет присутствовать.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Telegram RSVP notification failed", error);
  } finally {
    clearTimeout(timeout);
  }
}
