import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAdminAuditLog } from "@/features/admin/server/audit-log";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const trackSchema = z.object({
  title: z.string().trim().min(2).max(120),
  artist: z.string().trim().min(2).max(120),
  fileUrl: z.string().trim().min(2).max(2000),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  try {
    const parsed = trackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Проверьте название, исполнителя и MP3-файл." },
        { status: 400 },
      );
    }

    if (!parsed.data.fileUrl.startsWith("/uploads/admin/")) {
      return NextResponse.json(
        { error: "Музыку нужно загружать с компьютера через админку." },
        { status: 400 },
      );
    }

    const lastTrack = await prisma.audioTrack.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const track = await prisma.audioTrack.create({
      data: {
        ...parsed.data,
        sortOrder: (lastTrack?.sortOrder ?? -1) + 1,
      },
      select: {
        id: true,
        title: true,
        artist: true,
        fileUrl: true,
      },
    });

    await writeAdminAuditLog({
      actor: admin,
      action: "track.create",
      targetType: "AudioTrack",
      targetId: track.id,
      description: `Добавлен трек ${track.title}`,
    });

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error("Track create failed", error);
    return NextResponse.json(
      { error: "Не удалось добавить трек." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Трек не указан." }, { status: 400 });
    }

    await prisma.audioTrack.delete({ where: { id } });
    await writeAdminAuditLog({
      actor: admin,
      action: "track.delete",
      targetType: "AudioTrack",
      targetId: id,
      description: "Удален трек из каталога",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track delete failed", error);
    return NextResponse.json(
      { error: "Не удалось удалить трек." },
      { status: 500 },
    );
  }
}
