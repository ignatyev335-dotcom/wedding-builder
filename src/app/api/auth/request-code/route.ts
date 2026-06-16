import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Вход по одноразовому коду отключен. Используйте Яндекс ID, Telegram или почту с паролем.",
    },
    { status: 410 },
  );
}
