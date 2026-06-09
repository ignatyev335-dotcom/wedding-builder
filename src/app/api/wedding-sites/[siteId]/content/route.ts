import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { contentBlockCodes, fontCodes } from "@/entities/wedding/model";

const contentSchema = z.object({
  coverPhoto: z.string().max(4_000_000).nullable(),
  galleryPhotos: z.array(z.string().max(4_000_000)).max(30),
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
    .max(8),
  noFlowersEnabled: z.boolean(),
  noFlowersText: z.string().max(700),
  transferDescription: z.string().max(700),
  transferTime: z.string().regex(/^\d{2}:\d{2}$/),
  transferMeetingPoint: z.string().max(300),
  postWeddingMode: z.boolean(),
  postWeddingPhotoUrl: z.string().trim().max(1000),
  fontCode: z.enum(fontCodes),
  blockOrder: z.array(z.enum(contentBlockCodes)).length(contentBlockCodes.length),
  ceremonyTime: z.string().regex(/^\d{2}:\d{2}$/),
  venueName: z.string().trim().max(160),
  venueAddress: z.string().trim().max(300),
  mapLatitude: z.number().min(-90).max(90).nullable(),
  mapLongitude: z.number().min(-180).max(180).nullable(),
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

  const {
    ceremonyTime,
    venueName,
    venueAddress,
    mapLatitude,
    mapLongitude,
    ...customContent
  } = parsed.data;
  const data = await prisma.weddingData.update({
    where: { weddingSiteId: siteId },
    data: {
      ceremonyTime,
      venueName,
      venueAddress,
      mapLatitude,
      mapLongitude,
      customContent: JSON.stringify(customContent),
    },
    select: { weddingSiteId: true },
  });

  return NextResponse.json({ id: data.weddingSiteId });
}
