import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const fontSchema = z.object({
  name: z.string().trim().min(2).max(100),
  family: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[\p{L}\p{N}\s_-]+$/u),
  fileUrl: z.string().trim().min(2).max(2000),
  format: z.enum(["woff2", "woff", "truetype", "opentype"]),
});

export async function POST(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  try {
    const parsed = fontSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Проверьте название, CSS-семейство и файл шрифта." },
        { status: 400 },
      );
    }

    const isLocalUpload = parsed.data.fileUrl.startsWith("/uploads/admin/");
    const isRemoteFont = /^https:\/\/.+\.(woff2|woff|ttf|otf)(\?.*)?$/i.test(
      parsed.data.fileUrl,
    );

    if (!isLocalUpload && !isRemoteFont) {
      return NextResponse.json(
        {
          error:
            "Шрифт нужно загрузить файлом или указать прямую https-ссылку на .woff2, .woff, .ttf или .otf.",
        },
        { status: 400 },
      );
    }

    const font = await prisma.customFont.create({
      data: parsed.data,
      select: {
        id: true,
        name: true,
        family: true,
        fileUrl: true,
        format: true,
      },
    });

    return NextResponse.json({ font }, { status: 201 });
  } catch (error) {
    console.error("Custom font create failed", error);
    return NextResponse.json(
      {
        error:
          "Не удалось добавить шрифт. Возможно, такое CSS-семейство уже занято.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Шрифт не указан." }, { status: 400 });
    }

    await prisma.customFont.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Custom font delete failed", error);
    return NextResponse.json(
      { error: "Не удалось удалить шрифт." },
      { status: 500 },
    );
  }
}
