import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser, isSiteOwnerOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const brandingSchema = z.object({
  removeBranding: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const user = await getCurrentUser();
  if (!user || !(await isSiteOwnerOrAdmin(user, siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const parsed = brandingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректная настройка." }, { status: 400 });
  }

  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    select: { isPremium: true },
  });
  if (!site) {
    return NextResponse.json({ error: "Сайт не найден." }, { status: 404 });
  }
  if (parsed.data.removeBranding && !site.isPremium) {
    return NextResponse.json(
      { error: "Скрытие подписи доступно на премиальном тарифе." },
      { status: 403 },
    );
  }

  const updated = await prisma.weddingSite.update({
    where: { id: siteId },
    data: { removeBranding: parsed.data.removeBranding },
    select: { removeBranding: true },
  });

  return NextResponse.json(updated);
}
