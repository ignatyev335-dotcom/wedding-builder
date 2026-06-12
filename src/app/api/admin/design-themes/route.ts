import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const builtInFontFamilies = [
  "CORMORANT",
  "ORANIENBAUM",
  "MARCK",
  "CAVEAT",
  "BAD_SCRIPT",
  "PLAYFAIR",
  "MONTSERRAT",
] as const;

const themeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  backgroundColor: colorSchema,
  primaryColor: colorSchema,
  textColor: colorSchema,
  fontFamily: z.string().trim().min(2).max(100),
  customFontId: z.string().cuid().nullable().optional(),
});

async function requireAdmin() {
  return getCurrentAdmin();
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const parsed = themeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте название, цвета и выбранный шрифт." },
      { status: 400 },
    );
  }

  if (
    !parsed.data.customFontId &&
    !builtInFontFamilies.includes(
      parsed.data.fontFamily as (typeof builtInFontFamilies)[number],
    )
  ) {
    return NextResponse.json(
      { error: "Выбранный встроенный шрифт не поддерживается." },
      { status: 400 },
    );
  }

  if (parsed.data.customFontId) {
    const customFont = await prisma.customFont.findFirst({
      where: { id: parsed.data.customFontId, isActive: true },
      select: { id: true },
    });
    if (!customFont) {
      return NextResponse.json(
        { error: "Пользовательский шрифт не найден." },
        { status: 400 },
      );
    }
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
    data: parsed.data,
    select: {
      id: true,
      name: true,
      backgroundColor: true,
      primaryColor: true,
      textColor: true,
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
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Тема не указана." }, { status: 400 });
  }

  await prisma.designTheme.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
