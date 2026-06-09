import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getRequestOrigin,
  toGuestResponse,
} from "@/features/guests/server/guest-response";
import { prisma } from "@/lib/prisma";

const updateRsvpSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  dietaryRestrictions: z.string().trim().max(500).optional(),
  foodPreference: z.enum(["Мясо", "Рыба", "Веган"]).optional(),
  allergies: z.string().trim().max(500).optional(),
  drinks: z.string().trim().max(300).optional(),
  needsTransport: z.boolean().optional(),
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
    select: { id: true, weddingSite: { select: { slug: true } } },
  });

  if (!existingGuest) {
    return NextResponse.json({ error: "Ссылка гостя не найдена." }, { status: 404 });
  }

  const guest = await prisma.guest.update({
    where: { id: existingGuest.id },
    data: {
      status: parsed.data.status,
      dietaryRestrictions: parsed.data.dietaryRestrictions,
      foodPreference: parsed.data.foodPreference,
      allergies: parsed.data.allergies,
      alcoholPreferences: JSON.stringify(
        parsed.data.drinks ? [parsed.data.drinks] : [],
      ),
      needsTransport: parsed.data.needsTransport,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({
    guest: toGuestResponse(
      guest,
      existingGuest.weddingSite.slug,
      getRequestOrigin(request),
    ),
  });
}
