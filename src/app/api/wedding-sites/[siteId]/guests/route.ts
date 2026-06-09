import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { guestTagCodes } from "@/entities/wedding/model";
import {
  getRequestOrigin,
  toGuestResponse,
} from "@/features/guests/server/guest-response";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isSiteOwnerOrAdmin } from "@/lib/auth/session";

async function canManageSite(siteId: string) {
  const user = await getCurrentUser();
  return user ? isSiteOwnerOrAdmin(user, siteId) : false;
}

const createGuestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  isCouple: z.boolean().default(false),
  partnerName: z.string().trim().max(120).optional(),
  tags: z.array(z.enum(guestTagCodes)).max(3).default([]),
}).superRefine((data, context) => {
  if (data.isCouple && !data.partnerName) {
    context.addIssue({
      code: "custom",
      path: ["partnerName"],
      message: "Укажите имя второго гостя.",
    });
  }
});

const updateGuestSchema = z.object({
  guestId: z.string().min(1),
  tags: z.array(z.enum(guestTagCodes)).max(3),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  if (!(await canManageSite(siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    select: {
      slug: true,
      guests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Сайт не найден." }, { status: 404 });
  }

  const origin = getRequestOrigin(request);
  return NextResponse.json({
    guests: site.guests.map((guest) =>
      toGuestResponse(guest, site.slug, origin),
    ),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  if (!(await canManageSite(siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const parsed = createGuestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Укажите имя и корректный номер телефона." },
      { status: 400 },
    );
  }

  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    select: { id: true, slug: true },
  });

  if (!site) {
    return NextResponse.json({ error: "Сайт не найден." }, { status: 404 });
  }

  const guest = await prisma.guest.create({
    data: {
      siteId: site.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      isCouple: parsed.data.isCouple,
      partnerName: parsed.data.isCouple ? parsed.data.partnerName : null,
      tags: JSON.stringify(parsed.data.tags),
      magicToken: randomBytes(24).toString("base64url"),
    },
  });

  return NextResponse.json(
    {
      guest: toGuestResponse(
        guest,
        site.slug,
        getRequestOrigin(request),
      ),
    },
    { status: 201 },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  if (!(await canManageSite(siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const parsed = updateGuestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные теги гостя." }, { status: 400 });
  }

  const existingGuest = await prisma.guest.findFirst({
    where: { id: parsed.data.guestId, siteId },
    select: { id: true },
  });

  if (!existingGuest) {
    return NextResponse.json({ error: "Гость не найден." }, { status: 404 });
  }

  const guest = await prisma.guest.update({
    where: { id: existingGuest.id },
    data: { tags: JSON.stringify(parsed.data.tags) },
    include: { weddingSite: { select: { slug: true } } },
  });

  return NextResponse.json({
    guest: toGuestResponse(
      guest,
      guest.weddingSite.slug,
      getRequestOrigin(request),
    ),
  });
}
