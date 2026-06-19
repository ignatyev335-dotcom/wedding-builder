import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { getSystemSettingValue } from "@/lib/system-settings";

type MetrikaStatResponse = {
  totals?: number[];
};

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const counterId = (await getSystemSettingValue("YANDEX_METRICA_ID"))?.trim();
  const oauthToken = (await getSystemSettingValue("YANDEX_METRICA_OAUTH_TOKEN"))?.trim();

  if (!counterId || !/^\d+$/.test(counterId)) {
    return NextResponse.json({
      configured: false,
      message: "Добавьте числовой YANDEX_METRICA_ID в системных ключах.",
    });
  }

  if (!oauthToken) {
    return NextResponse.json({
      configured: true,
      counterId,
      message:
        "Счетчик подключен к публичным сайтам. Для статистики в админке добавьте YANDEX_METRICA_OAUTH_TOKEN.",
    });
  }

  const url = new URL("https://api-metrika.yandex.net/stat/v1/data");
  url.searchParams.set("ids", counterId);
  url.searchParams.set("date1", "7daysAgo");
  url.searchParams.set("date2", "today");
  url.searchParams.set("metrics", "ym:s:visits,ym:s:users,ym:s:pageviews");
  url.searchParams.set("accuracy", "full");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `OAuth ${oauthToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return NextResponse.json(
      {
        configured: true,
        counterId,
        error: `Метрика вернула статус ${response.status}. ${body.slice(0, 180)}`,
      },
      { status: 400 },
    );
  }

  const payload = (await response.json()) as MetrikaStatResponse;
  const [visits = 0, users = 0, pageviews = 0] = payload.totals ?? [];

  return NextResponse.json({
    configured: true,
    counterId,
    visits: Math.round(visits),
    users: Math.round(users),
    pageviews: Math.round(pageviews),
    period: "7 дней",
  });
}
