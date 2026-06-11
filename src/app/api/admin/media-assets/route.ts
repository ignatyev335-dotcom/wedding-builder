import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const assetSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["ICON", "STICKER"]),
  url: z
    .string()
    .trim()
    .min(1)
    .max(2_000_000)
    .refine(
      (value) =>
        value.startsWith("https://") ||
        value.startsWith("/") ||
        value.startsWith("data:image/"),
      "Нужна ссылка или изображение.",
    ),
});

export async function POST(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }
  const parsed = assetSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте название, тип и ссылку на изображение." },
      { status: 400 },
    );
  }

  const asset = await prisma.mediaAsset.create({ data: parsed.data });
  return NextResponse.json({ asset }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Медиа не указано." }, { status: 400 });
  }

  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
