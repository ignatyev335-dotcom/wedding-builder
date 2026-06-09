import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getRequestOrigin,
  toGuestResponse,
} from "@/features/guests/server/guest-response";
import { prisma } from "@/lib/prisma";

const createGuestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
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
