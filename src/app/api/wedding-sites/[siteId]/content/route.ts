import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isSiteOwnerOrAdmin } from "@/lib/auth/session";
import {
  contentBlockCodes,
  countdownStyleCodes,
  cardStyleCodes,
  fontCodes,
  photoMaskCodes,
  languageCodes,
} from "@/entities/wedding/model";

const contentSchema = z.object({
  coverPhoto: z.string().max(4_000_000).nullable(),
  heroImageDesktop: z.string().max(4_000_000).nullable(),
  heroImageMobile: z.string().max(4_000_000).nullable(),
  galleryPhotos: z.array(z.string().max(4_000_000)).max(30),
  dressMoodboard: z.array(z.string().max(4_000_000)).max(4),
  faqItems: z
    .array(
      z.object({
        id: z.string().max(100),
        question: z.string().max(240),
        answer: z.string().max(1000),
      }),
    )
    .max(12),
  invitationText: z.string().max(1000),
  wishlistText: z.string().max(500),
  wishlistItems: z
    .array(
      z.object({
        id: z.string().max(100),
        title: z.string().max(100),
        url: z.string().max(500),
        type: z.enum(["ITEM", "EXPERIENCE"]),
      }),
    )
    .max(8),
  noFlowersEnabled: z.boolean(),
  noFlowersText: z.string().max(700),
  transferDescription: z.string().max(700),
  transferTime: z.string().regex(/^\d{2}:\d{2}$/),
  transferMeetingPoint: z.string().max(300),
  postWeddingMode: z.boolean(),
  postWeddingAutoEnabled: z.boolean(),
  postWeddingHeroImage: z.string().max(4_000_000).nullable(),
  postWeddingPhotoUrl: z.string().trim().max(1000),
  postWeddingThankYouText: z.string().trim().max(1200),
  customQuestions: z
    .array(
      z.object({
        id: z.string().max(100),
        title: z.string().trim().max(240),
        type: z.enum(["TEXT", "OPTIONS"]),
        options: z.array(z.string().trim().min(1).max(120)).max(6),
      }),
    )
    .max(5),
  rsvpQuestionSettings: z.object({
    plusOne: z.boolean(),
    food: z.boolean(),
    alcohol: z.boolean(),
    transport: z.boolean(),
    music: z.boolean(),
  }),
  fontCode: z.enum(fontCodes),
  blockOrder: z.array(z.enum(contentBlockCodes)).length(contentBlockCodes.length),
  ceremonyTime: z.string().regex(/^\d{2}:\d{2}$/),
  venueName: z.string().trim().max(160),
  venueAddress: z.string().trim().max(300),
  mapLatitude: z.number().min(-90).max(90).nullable(),
  mapLongitude: z.number().min(-180).max(180).nullable(),
  customMusicDataUrl: z
    .string()
    .max(7_100_000)
    .refine((value) => value.startsWith("data:audio/mpeg;base64,"))
    .nullable(),
  customMusicName: z.string().max(200).nullable(),
  musicTrack: z.string().max(500).nullable(),
  designThemeId: z.string().max(100).nullable(),
  decorativeAssetId: z.string().max(100).nullable(),
  countdownTitle: z.string().trim().min(1).max(160),
  countdownStyle: z.enum(countdownStyleCodes),
  colorPalette: z
    .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .min(3)
    .max(5),
  giftPaymentLink: z.string().trim().max(1000),
  giftQrCode: z.string().max(4_000_000).nullable(),
  coordinatorName: z.string().trim().max(160),
  coordinatorRole: z.string().trim().max(160),
  coordinatorPhoto: z.string().max(4_000_000).nullable(),
  coordinatorTelegram: z.string().trim().max(500),
  coordinatorWhatsapp: z.string().trim().max(500),
  coordinatorPhone: z.string().trim().max(80),
  coordinatorMapLink: z.string().trim().max(1000),
  photoMask: z.enum(photoMaskCodes),
  cardStyle: z.enum(cardStyleCodes),
  isPrivate: z.boolean(),
  pinCode: z.string().regex(/^\d{4}$/).or(z.literal("")),
  language: z.enum(languageCodes),
  crewTimings: z
    .array(
      z.object({
        id: z.string().max(100),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        description: z.string().max(500),
        contactPerson: z.string().max(200),
      }),
    )
    .max(60),
}).superRefine((data, context) => {
  if (data.isPrivate && !/^\d{4}$/.test(data.pinCode)) {
    context.addIssue({
      code: "custom",
      path: ["pinCode"],
      message: "Для приватного сайта нужен PIN из четырех цифр.",
    });
  }
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
    colorPalette,
    heroImageDesktop,
    heroImageMobile,
    dressMoodboard,
    faqItems,
    customQuestions,
    giftPaymentLink,
    giftQrCode,
    coordinatorName,
    coordinatorRole,
    coordinatorPhoto,
    coordinatorTelegram,
    coordinatorWhatsapp,
    coordinatorPhone,
    coordinatorMapLink,
    photoMask,
    isPrivate,
    pinCode,
    language,
    musicTrack,
    designThemeId,
    decorativeAssetId,
    crewTimings,
    ...customContent
  } = parsed.data;
  const [, data] = await prisma.$transaction([
    prisma.weddingSite.update({
      where: { id: siteId },
      data: {
        heroImageDesktop,
        heroImageMobile,
        giftPaymentLink,
        giftQrCode,
        pinCode: isPrivate ? pinCode : null,
        defaultLanguage: language,
        musicTrackId: musicTrack,
        designThemeId,
        decorativeAssetId,
        crewTimings: {
          deleteMany: {},
          create: crewTimings.map((item, sortOrder) => ({
            time: item.time,
            description: item.description,
            contactPerson: item.contactPerson,
            sortOrder,
          })),
        },
      },
    }),
    prisma.weddingData.update({
      where: { weddingSiteId: siteId },
      data: {
        ceremonyTime,
        venueName,
        venueAddress,
        mapLatitude,
        mapLongitude,
        colorPalette: JSON.stringify(colorPalette),
        dressMoodboard: JSON.stringify(dressMoodboard),
        faqItems: JSON.stringify(faqItems),
        customQuestions: JSON.stringify(customQuestions),
        coordinatorName,
        coordinatorRole,
        coordinatorPhoto,
        coordinatorTelegram,
        coordinatorWhatsapp,
        coordinatorPhone,
        coordinatorMapLink,
        photoMask,
        customContent: JSON.stringify(customContent),
      },
      select: { weddingSiteId: true },
    }),
  ]);

  return NextResponse.json({ id: data.weddingSiteId });
}
