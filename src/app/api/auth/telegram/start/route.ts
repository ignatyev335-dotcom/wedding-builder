import { NextResponse } from "next/server";

import {
  createTelegramLoginToken,
  hashTelegramLoginToken,
  normalizeTelegramBotUsername,
} from "@/lib/auth/telegram-login-ticket";
import { prisma } from "@/lib/prisma";
import { getRuntimeSetting } from "@/lib/runtime-settings";

export async function POST() {
  const botUsername = normalizeTelegramBotUsername(
    await getRuntimeSetting("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"),
  );

  if (!botUsername) {
    return NextResponse.json(
      { error: "Telegram-бот пока не подключен в админке." },
      { status: 503 },
    );
  }

  const token = createTelegramLoginToken();
  const tokenHash = hashTelegramLoginToken(token);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.telegramLoginTicket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  await prisma.telegramLoginTicket.create({
    data: {
      tokenHash,
      expiresAt,
    },
  });

  return NextResponse.json({
    token,
    botUrl: `https://t.me/${botUsername}?start=login_${token}`,
    expiresAt: expiresAt.toISOString(),
  });
}
