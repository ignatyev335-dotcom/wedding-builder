import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const telegramProfileSchema = z.object({
  telegramId: z.string().min(3).max(64),
  chatId: z.string().min(3).max(64),
  name: z.string().min(2).max(100),
});

type TelegramRouteProps = {
  params: Promise<{ siteId: string }>;
};

export async function POST(request: Request, { params }: TelegramRouteProps) {
  const { siteId } = await params;
  const parsed = telegramProfileSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный Telegram-профиль." }, { status: 400 });
  }

  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    select: { userId: true },
  });

  if (!site) {
    return NextResponse.json({ error: "Свадебный сайт не найден." }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id: site.userId },
    data: {
      provider: "TELEGRAM",
      telegramId: parsed.data.telegramId,
      telegramChatId: parsed.data.chatId,
      name: parsed.data.name,
    },
    select: {
      telegramId: true,
      telegramChatId: true,
      name: true,
    },
  });

  return NextResponse.json({
    telegramId: user.telegramId,
    chatId: user.telegramChatId,
    name: user.name,
  });
}
