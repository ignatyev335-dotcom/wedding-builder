import { NextResponse } from "next/server";

import { getRuntimeSettings } from "@/lib/runtime-settings";

export async function GET() {
  const settings = await getRuntimeSettings([
    "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
    "YANDEX_METRICA_ID",
  ]);

  return NextResponse.json({
    telegramBotUsername: settings.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    yandexMetricaId: settings.YANDEX_METRICA_ID,
  });
}
