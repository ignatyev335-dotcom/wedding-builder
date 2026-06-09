import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; first_name?: string; last_name?: string };
    from?: { id?: number; first_name?: string; last_name?: string };
  };
};

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (
    !webhookSecret ||
    request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const match = message?.text?.match(/^\/start\s+site_([A-Za-z0-9_-]+)$/);
  const chatId = message?.chat?.id;
  const telegramId = message?.from?.id;

  if (!match || !chatId || !telegramId) {
    return NextResponse.json({ ok: true });
  }

  const site = await prisma.weddingSite.findUnique({
    where: { id: match[1] },
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

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Готово! Vowly будет присылать сюда новые ответы гостей.",
      }),
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
