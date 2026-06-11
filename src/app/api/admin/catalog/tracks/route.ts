import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const trackSchema = z.object({
  title: z.string().trim().min(2).max(120),
  artist: z.string().trim().min(1).max(120),
  fileUrl: z.string().trim().url().max(2000),
  isActive: z.boolean().default(true),
});

async function requireAdmin() {
  return getCurrentAdmin();
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const parsed = trackSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте название, исполнителя и ссылку на аудиофайл." },
      { status: 400 },
    );
  }

  const sortOrder = await prisma.audioTrack.count();
  const track = await prisma.audioTrack.create({
    data: { ...parsed.data, sortOrder },
  });
  return NextResponse.json({ track }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Трек не указан." }, { status: 400 });
  }

  await prisma.audioTrack.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
