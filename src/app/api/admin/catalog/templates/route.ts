import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const templateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z
    .enum(["classic", "warm", "modern", "funny", "minimal"])
    .default("classic"),
  content: z.string().trim().min(10).max(3000),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  try {
    const parsed = templateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Проверьте название и текст шаблона." },
        { status: 400 },
      );
    }

    const sortOrder = await prisma.invitationTemplate.count();
    const template = await prisma.invitationTemplate.create({
      data: { ...parsed.data, sortOrder },
      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        isActive: true,
        sortOrder: true,
      },
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Template create failed", error);
    return NextResponse.json(
      { error: "Не удалось добавить шаблон." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Шаблон не указан." }, { status: 400 });
    }

    await prisma.invitationTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Template delete failed", error);
    return NextResponse.json(
      { error: "Не удалось удалить шаблон." },
      { status: 500 },
    );
  }
}
