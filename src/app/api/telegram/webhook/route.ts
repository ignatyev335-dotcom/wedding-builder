import { NextResponse } from "next/server";

import { hashTelegramLoginToken } from "@/lib/auth/telegram-login-ticket";
import { prisma } from "@/lib/prisma";
import { getSystemSettingValue } from "@/lib/system-settings";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; first_name?: string; last_name?: string };
    from?: { id?: number; first_name?: string; last_name?: string };
  };
};

export async function POST(request: Request) {
  const webhookSecret = await getSystemSettingValue("TELEGRAM_WEBHOOK_SECRET");
  if (
    !webhookSecret ||
    request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const chatId = message?.chat?.id;
  const telegramId = message?.from?.id;

  if (!chatId || !telegramId) {
    return NextResponse.json({ ok: true });
  }

  const loginMatch = message?.text?.match(/^\/start\s+login_([A-Za-z0-9_-]+)$/);
  if (loginMatch) {
    await confirmTelegramLogin({
      token: loginMatch[1],
      telegramId: String(telegramId),
      chatId: String(chatId),
      firstName: message.from?.first_name,
      lastName: message.from?.last_name,
    });

    return NextResponse.json({ ok: true });
  }

  const siteMatch = message?.text?.match(/^\/start\s+site_([A-Za-z0-9_-]+)$/);
  if (!siteMatch) {
    return NextResponse.json({ ok: true });
  }

  const site = await prisma.weddingSite.findUnique({
    where: { id: siteMatch[1] },
    select: { id: true, userId: true },
  });
  if (!site) {
    return NextResponse.json({ ok: true });
  }

  const name = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean)
    .join(" ");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: site.userId },
      data: {
        telegramId: String(telegramId),
        telegramChatId: String(chatId),
        name: name || undefined,
      },
    }),
    prisma.weddingSite.update({
      where: { id: site.id },
      data: { telegramAlerts: true },
    }),
  ]);

  await sendTelegramMessage(
    String(chatId),
    "Готово! Vowly будет присылать сюда новые ответы гостей.",
  );

  return NextResponse.json({ ok: true });
}

async function confirmTelegramLogin({
  token,
  telegramId,
  chatId,
  firstName,
  lastName,
}: {
  token: string;
  telegramId: string;
  chatId: string;
  firstName?: string;
  lastName?: string;
}) {
  const ticket = await prisma.telegramLoginTicket.findUnique({
    where: { tokenHash: hashTelegramLoginToken(token) },
  });

  if (!ticket || ticket.expiresAt < new Date() || ticket.status === "CONFIRMED") {
    return;
  }

  const name = [firstName, lastName].filter(Boolean).join(" ") || "Telegram";
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ telegramId }, { telegramChatId: chatId }],
    },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          telegramId,
          telegramChatId: chatId,
          name,
          provider: "TELEGRAM",
        },
      })
    : await prisma.user.create({
        data: {
          telegramId,
          telegramChatId: chatId,
          name,
          provider: "TELEGRAM",
        },
      });

  await prisma.telegramLoginTicket.update({
    where: { id: ticket.id },
    data: {
      status: "CONFIRMED",
      telegramId,
      chatId,
      name,
      userId: user.id,
      confirmedAt: new Date(),
    },
  });

  await sendTelegramMessage(
    chatId,
    "Готово! Возвращайтесь на сайт Vowly — вход уже подтвержден.",
  );
}

async function sendTelegramMessage(chatId: string, text: string) {
  const botToken = await getSystemSettingValue("TELEGRAM_BOT_TOKEN");
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  }).catch(() => undefined);
}
