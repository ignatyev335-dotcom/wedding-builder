import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { getSystemSettingValue } from "@/lib/system-settings";

const testSchema = z.object({
  kind: z.enum([
    "email",
    "telegram-bot",
    "telegram-message",
    "yandex-auth",
    "maps",
    "payments",
  ]),
  target: z.string().trim().max(300).optional(),
});

type TestResponse = {
  ok: boolean;
  title: string;
  message: string;
};

function json(payload: TestResponse, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return json(
      { ok: false, title: "Нет доступа", message: "Войдите в админку заново." },
      403,
    );
  }

  const parsed = testSchema.safeParse(await request.json());
  if (!parsed.success) {
    return json(
      { ok: false, title: "Неверный запрос", message: "Не удалось понять, что нужно проверить." },
      400,
    );
  }

  try {
    if (parsed.data.kind === "email") {
      return await testEmail(parsed.data.target ?? admin.email);
    }

    if (parsed.data.kind === "telegram-bot") {
      return await testTelegramBot();
    }

    if (parsed.data.kind === "telegram-message") {
      return await testTelegramMessage(parsed.data.target);
    }

    if (parsed.data.kind === "yandex-auth") {
      return await testYandexAuth();
    }

    if (parsed.data.kind === "maps") {
      return await testMaps();
    }

    return await testPayments();
  } catch (error) {
    return json(
      {
        ok: false,
        title: "Проверка не прошла",
        message: error instanceof Error ? error.message : "Сервис вернул неизвестную ошибку.",
      },
      500,
    );
  }
}

async function testEmail(targetEmail: string) {
  const apiKey = await getSystemSettingValue("RESEND_API_KEY");
  const from = await getSystemSettingValue("EMAIL_FROM");

  if (!apiKey || !from) {
    return json(
      {
        ok: false,
        title: "Почта не настроена",
        message: "Добавьте RESEND_API_KEY и EMAIL_FROM в системных ключах.",
      },
      400,
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [targetEmail],
      subject: "Vowly: тестовое письмо",
      html: `<div style="font-family:Arial,sans-serif;padding:24px"><h1>Почта работает</h1><p>Это тестовое письмо из админки Vowly.</p></div>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return json(
      {
        ok: false,
        title: "Resend отклонил письмо",
        message: `Статус ${response.status}. ${body.slice(0, 180)}`,
      },
      400,
    );
  }

  return json({ ok: true, title: "Почта работает", message: `Тест отправлен на ${targetEmail}.` });
}

async function testTelegramBot() {
  const botToken = await getSystemSettingValue("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return json(
      { ok: false, title: "Telegram не настроен", message: "Добавьте TELEGRAM_BOT_TOKEN." },
      400,
    );
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; result?: { username?: string } }
    | null;

  if (!response.ok || !payload?.ok) {
    return json(
      { ok: false, title: "Telegram токен не принят", message: "Проверьте токен бота из BotFather." },
      400,
    );
  }

  return json({
    ok: true,
    title: "Telegram-бот подключен",
    message: `Бот @${payload.result?.username ?? "unknown"} отвечает.`,
  });
}

async function testTelegramMessage(target?: string) {
  const botToken = await getSystemSettingValue("TELEGRAM_BOT_TOKEN");
  const chatId = target || (await getSystemSettingValue("TELEGRAM_TEST_CHAT_ID"));

  if (!botToken || !chatId) {
    return json(
      {
        ok: false,
        title: "Не хватает данных",
        message: "Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_TEST_CHAT_ID или введите chat_id вручную.",
      },
      400,
    );
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "Vowly: тестовое уведомление из админки. Все работает.",
    }),
  });

  if (!response.ok) {
    return json(
      { ok: false, title: "Сообщение не отправлено", message: `Telegram вернул статус ${response.status}.` },
      400,
    );
  }

  return json({ ok: true, title: "Сообщение отправлено", message: `Тест ушел в chat_id ${chatId}.` });
}

async function testYandexAuth() {
  const clientId = await getSystemSettingValue("AUTH_YANDEX_ID");
  const clientSecret = await getSystemSettingValue("AUTH_YANDEX_SECRET");

  if (!clientId || !clientSecret) {
    return json(
      {
        ok: false,
        title: "Яндекс ID не настроен",
        message: "Добавьте AUTH_YANDEX_ID и AUTH_YANDEX_SECRET. Для стабильной авторизации продублируйте их в Vercel env.",
      },
      400,
    );
  }

  return json({
    ok: true,
    title: "Ключи Яндекса найдены",
    message: "Проверьте callback URL: /api/auth/callback/yandex. После изменения OAuth-ключей нужен новый деплой.",
  });
}

async function testMaps() {
  const apiKey = await getSystemSettingValue("YANDEX_GEOCODER_API_KEY");
  if (!apiKey) {
    return json(
      { ok: false, title: "Карты не настроены", message: "Добавьте YANDEX_GEOCODER_API_KEY." },
      400,
    );
  }

  const url = new URL("https://geocode-maps.yandex.ru/v1/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("geocode", "Москва, Красная площадь");
  url.searchParams.set("format", "json");
  url.searchParams.set("results", "1");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return json(
      { ok: false, title: "Геокодер не отвечает", message: `Яндекс вернул статус ${response.status}.` },
      400,
    );
  }

  return json({ ok: true, title: "Карты работают", message: "Геокодер Яндекса успешно ответил." });
}

async function testPayments() {
  const yookassaShopId = await getSystemSettingValue("YOOKASSA_SHOP_ID");
  const yookassaSecret = await getSystemSettingValue("YOOKASSA_SECRET_KEY");
  const tbankTerminal = await getSystemSettingValue("TBANK_TERMINAL_KEY");
  const tbankPassword = await getSystemSettingValue("TBANK_PASSWORD");

  if ((yookassaShopId && yookassaSecret) || (tbankTerminal && tbankPassword)) {
    return json({
      ok: true,
      title: "Платежные ключи заполнены",
      message: "Ключи найдены. Следующий шаг — подключить создание платежей и вебхуки.",
    });
  }

  return json(
    {
      ok: false,
      title: "Платежи не настроены",
      message: "Добавьте пару ключей ЮKassa или Т-Банка.",
    },
    400,
  );
}
