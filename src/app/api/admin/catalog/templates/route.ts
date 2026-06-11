import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const templateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(10).max(3000),
  isActive: z.boolean().default(true),
});

async function requireAdmin() {
  return getCurrentAdmin();
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

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
  });
  return NextResponse.json({ template }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Шаблон не указан." }, { status: 400 });
  }

  await prisma.invitationTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
