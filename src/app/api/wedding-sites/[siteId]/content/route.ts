import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const contentSchema = z.object({
  coverPhoto: z.string().max(4_000_000).nullable(),
  galleryPhotos: z.array(z.string().max(4_000_000)).max(8),
  invitationText: z.string().max(1000),
  wishlistText: z.string().max(500),
  wishlistItems: z
    .array(
      z.object({
        id: z.string().max(100),
        title: z.string().max(100),
        url: z.string().max(500),
      }),
    )
    .max(3),
  postWeddingMode: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const parsed = contentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный контент сайта." }, { status: 400 });
  }

  const data = await prisma.weddingData.update({
    where: { weddingSiteId: siteId },
    data: { customContent: JSON.stringify(parsed.data) },
    select: { weddingSiteId: true },
  });

  return NextResponse.json({ id: data.weddingSiteId });
}
