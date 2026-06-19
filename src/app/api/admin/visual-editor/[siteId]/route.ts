import { NextResponse } from "next/server";
import { z } from "zod";

import {
  cardStyleCodes,
  contentBlockCodes,
  fontCodes,
  optionalModules,
} from "@/entities/wedding/model";
import { parseSiteExtras } from "@/features/constructor/lib/site-extras";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const visualEditorSchema = z.object({
  partnerOneName: z.string().trim().min(1).max(80),
  partnerTwoName: z.string().trim().min(1).max(80),
  ceremonyTime: z.string().regex(/^\d{2}:\d{2}$/),
  venueName: z.string().trim().max(160),
  venueAddress: z.string().trim().max(300),
  invitationText: z.string().trim().max(1000),
  countdownTitle: z.string().trim().min(1).max(160),
  transferDescription: z.string().trim().max(700),
  transferTime: z.string().regex(/^\d{2}:\d{2}$/),
  transferMeetingPoint: z.string().trim().max(300),
  wishlistText: z.string().trim().max(500),
  noFlowersEnabled: z.boolean(),
  noFlowersText: z.string().trim().max(700),
  postWeddingThankYouText: z.string().trim().max(1200),
  postWeddingPhotoUrl: z.string().trim().max(1000),
  coordinatorName: z.string().trim().max(160),
  coordinatorRole: z.string().trim().max(160),
  coordinatorPhone: z.string().trim().max(80),
  fontCode: z.enum(fontCodes),
  cardStyle: z.enum(cardStyleCodes),
  designThemeId: z.string().trim().max(100).nullable(),
  blockOrder: z.array(z.enum(contentBlockCodes)).length(contentBlockCodes.length),
  moduleVisibility: z.object({
    RSVP: z.boolean(),
    DRESS_CODE: z.boolean(),
    TIMELINE: z.boolean(),
    TRANSFER: z.boolean(),
    MAP: z.boolean(),
    COUNTDOWN: z.boolean(),
  }),
});

type VisualEditorRouteProps = {
  params: Promise<{ siteId: string }>;
};

export async function PATCH(request: Request, { params }: VisualEditorRouteProps) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }

  const { siteId } = await params;
  const parsed = visualEditorSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля редактора: часть данных заполнена некорректно." },
      { status: 400 },
    );
  }

  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    include: { data: true },
  });

  if (!site?.data) {
    return NextResponse.json({ error: "Сайт не найден." }, { status: 404 });
  }

  const draft = parsed.data;
  const extras = parseSiteExtras(site.data.customContent);
  const nextExtras = {
    ...extras,
    invitationText: draft.invitationText,
    countdownTitle: draft.countdownTitle,
    transferDescription: draft.transferDescription,
    transferTime: draft.transferTime,
    transferMeetingPoint: draft.transferMeetingPoint,
    wishlistText: draft.wishlistText,
    noFlowersEnabled: draft.noFlowersEnabled,
    noFlowersText: draft.noFlowersText,
    postWeddingThankYouText: draft.postWeddingThankYouText,
    postWeddingPhotoUrl: draft.postWeddingPhotoUrl,
    fontCode: draft.fontCode,
    cardStyle: draft.cardStyle,
    blockOrder: draft.blockOrder,
  };

  await prisma.$transaction([
    prisma.weddingSite.update({
      where: { id: siteId },
      data: {
        designThemeId: draft.designThemeId || null,
      },
    }),
    prisma.weddingData.update({
      where: { weddingSiteId: siteId },
      data: {
        partnerOneName: draft.partnerOneName,
        partnerTwoName: draft.partnerTwoName,
        ceremonyTime: draft.ceremonyTime,
        venueName: draft.venueName,
        venueAddress: draft.venueAddress,
        coordinatorName: draft.coordinatorName,
        coordinatorRole: draft.coordinatorRole,
        coordinatorPhone: draft.coordinatorPhone,
        customContent: JSON.stringify(nextExtras),
      },
    }),
    prisma.siteModule.deleteMany({
      where: {
        weddingSiteId: siteId,
        type: { in: [...optionalModules] },
      },
    }),
    prisma.siteModule.createMany({
      data: optionalModules.map((module, sortOrder) => ({
        weddingSiteId: siteId,
        type: module,
        isEnabled: draft.moduleVisibility[module],
        sortOrder: 100 + sortOrder,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
