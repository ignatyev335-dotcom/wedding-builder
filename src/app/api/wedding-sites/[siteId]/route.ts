import { NextResponse } from "next/server";
import { z } from "zod";

import { getWeddingBuilderData } from "@/features/constructor/server/get-wedding-builder-data";
import { getCurrentUser, isSiteOwnerOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const user = await getCurrentUser();

  if (!user || !(await isSiteOwnerOrAdmin(user, siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const site = await getWeddingBuilderData(siteId);

  if (!site) {
    return NextResponse.json({ error: "Сайт не найден." }, { status: 404 });
  }

  return NextResponse.json(site);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const user = await getCurrentUser();

  if (!user || !(await isSiteOwnerOrAdmin(user, siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный статус." }, { status: 400 });
  }

  if (parsed.data.status === "PUBLISHED" && user.provider === "ANONYMOUS") {
    return NextResponse.json(
      {
        code: "AUTH_REQUIRED",
        error: "Войдите по почте или телефону, чтобы сайт не потерялся.",
      },
      { status: 401 },
    );
  }

  const origin = new URL(request.url).origin;
  const site = await prisma.weddingSite.update({
    where: { id: siteId },
    data: {
      status: parsed.data.status,
      publishedAt:
        parsed.data.status === "PUBLISHED"
          ? new Date()
          : parsed.data.status === "ARCHIVED"
            ? null
            : undefined,
    },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });

  return NextResponse.json({
    ...site,
    publicUrl: `${origin}/wedding/${site.slug}`,
  });
}
