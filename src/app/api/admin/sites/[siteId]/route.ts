import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({ active: z.boolean() });

async function requireAdmin() {
  return getCurrentAdmin();
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный статус." }, { status: 400 });
  }
  const { siteId } = await params;
  const site = await prisma.weddingSite.update({
    where: { id: siteId },
    data: {
      status: parsed.data.active ? "DRAFT" : "ARCHIVED",
      publishedAt: parsed.data.active ? undefined : null,
    },
    select: { id: true, status: true },
  });
  return NextResponse.json(site);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const { siteId } = await params;
  await prisma.weddingSite.delete({ where: { id: siteId } });
  return NextResponse.json({ ok: true });
}
