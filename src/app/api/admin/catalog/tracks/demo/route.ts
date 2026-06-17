import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Демо-треки отключены. Музыку нужно загружать с компьютера через админку.",
    },
    { status: 410 },
  );
}
