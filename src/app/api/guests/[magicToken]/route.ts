import { NextResponse } from "next/server";
import { z } from "zod";

import {
  alcoholPreferenceCodes,
  coupleAttendanceCodes,
  transportPreferenceCodes,
} from "@/entities/wedding/model";
import {
  getRequestOrigin,
  toGuestResponse,
} from "@/features/guests/server/guest-response";
import { sendRsvpTelegramNotification } from "@/features/notifications/server/send-rsvp-telegram";
import { prisma } from "@/lib/prisma";

const updateRsvpSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  dietaryRestrictions: z.string().trim().max(500).optional(),
  foodPreference: z.enum(["Мясо", "Рыба", "Веган"]).optional(),
  partnerFoodPreference: z.enum(["Мясо", "Рыба", "Веган"]).optional(),
  allergies: z.string().trim().max(500).optional(),
  partnerAllergies: z.string().trim().max(500).optional(),
  alcoholPreferences: z.array(z.enum(alcoholPreferenceCodes)).max(4),
  transportPreference: z.enum(transportPreferenceCodes),
  hasPlusOne: z.boolean(),
  plusOneName: z.string().trim().max(160).optional(),
  musicRequest: z.string().trim().max(300).optional(),
  attendanceChoice: z.enum(coupleAttendanceCodes).nullable().optional(),
  customAnswers: z.record(z.string(), z.string().trim().max(500)).default({}),
}).superRefine((data, context) => {
  if (data.hasPlusOne && !data.plusOneName) {
    context.addIssue({
      code: "custom",
      path: ["plusOneName"],
      message: "Укажите имя спутника или спутницы.",
    });
  }
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ magicToken: string }> },
) {
  const { magicToken } = await params;
  const guest = await prisma.guest.findUnique({
    where: { magicToken },
    include: { weddingSite: { select: { slug: true } } },
  });

  if (!guest) {
    return NextResponse.json({ error: "Ссылка гостя не найдена." }, { status: 404 });
  }

  return NextResponse.json({
    guest: toGuestResponse(
      guest,
      guest.weddingSite.slug,
      getRequestOrigin(request),
    ),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ magicToken: string }> },
) {
  const { magicToken } = await params;
  const parsed = updateRsvpSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный ответ гостя." }, { status: 400 });
  }

  const existingGuest = await prisma.guest.findUnique({
    where: { magicToken },
    select: {
      id: true,
      isCouple: true,
      weddingSite: {
        select: {
          slug: true,
          telegramAlerts: true,
          user: { select: { telegramChatId: true } },
        },
      },
    },
  });

  if (!existingGuest) {
    return NextResponse.json({ error: "Ссылка гостя не найдена." }, { status: 404 });
  }

  if (existingGuest.isCouple && !parsed.data.attendanceChoice) {
    return NextResponse.json(
      { error: "Укажите, кто из пары сможет прийти." },
      { status: 400 },
    );
  }

  const status = existingGuest.isCouple
    ? parsed.data.attendanceChoice === "NONE"
      ? "DECLINED"
      : "ACCEPTED"
    : parsed.data.status;

  const guest = await prisma.guest.update({
    where: { id: existingGuest.id },
    data: {
      status,
      dietaryRestrictions: parsed.data.dietaryRestrictions,
      foodPreference: parsed.data.foodPreference,
      partnerFoodPreference: existingGuest.isCouple
        ? parsed.data.partnerFoodPreference
        : null,
      allergies: parsed.data.allergies,
      partnerAllergies: existingGuest.isCouple
        ? parsed.data.partnerAllergies
        : null,
      alcoholPreferences: JSON.stringify(parsed.data.alcoholPreferences),
      needsTransport: parsed.data.transportPreference === "TRANSFER",
      transportPreference: parsed.data.transportPreference,
      hasPlusOne: existingGuest.isCouple ? false : parsed.data.hasPlusOne,
      plusOneName:
        !existingGuest.isCouple && parsed.data.hasPlusOne
          ? parsed.data.plusOneName
          : null,
      attendanceChoice: existingGuest.isCouple
        ? parsed.data.attendanceChoice
        : null,
      customAnswers: JSON.stringify(parsed.data.customAnswers),
      musicRequest: parsed.data.musicRequest,
      respondedAt: new Date(),
    },
  });

  await sendRsvpTelegramNotification(existingGuest.weddingSite, guest);

  return NextResponse.json({
    guest: toGuestResponse(
      guest,
      existingGuest.weddingSite.slug,
      getRequestOrigin(request),
    ),
  });
}
