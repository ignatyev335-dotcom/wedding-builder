import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const themeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  backgroundColor: colorSchema,
  primaryColor: colorSchema,
  textColor: colorSchema,
  gradientCss: z.string().trim().max(500).nullable().optional(),
  fontFamily: z.string().trim().min(2).max(100),
  customFontId: z.string().cuid(),
});

export async function POST(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const parsed = themeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте название, цвета, градиент и выбранный шрифт." },
      { status: 400 },
    );
  }

  const customFont = await prisma.customFont.findFirst({
    where: { id: parsed.data.customFontId, isActive: true },
    select: { id: true, family: true },
  });
  if (!customFont) {
    return NextResponse.json(
      { error: "Сначала загрузите шрифт, затем создайте тему." },
      { status: 400 },
    );
  }

  const existing = await prisma.designTheme.findUnique({
    where: { name: parsed.data.name },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Тема с таким названием уже существует." },
      { status: 409 },
    );
  }

  const theme = await prisma.designTheme.create({
    data: {
      ...parsed.data,
      fontFamily: customFont.family,
    },
    select: {
      id: true,
      name: true,
      backgroundColor: true,
      primaryColor: true,
      textColor: true,
      gradientCss: true,
      fontFamily: true,
      customFont: {
        select: {
          id: true,
          name: true,
          family: true,
          fileUrl: true,
          format: true,
        },
      },
    },
  });

  return NextResponse.json({ theme }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Тема не указана." }, { status: 400 });
  }

  await prisma.designTheme.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
