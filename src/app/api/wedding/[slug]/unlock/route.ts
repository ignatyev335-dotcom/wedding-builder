import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createWeddingAccessToken,
  weddingAccessCookieName,
} from "@/features/wedding/server/private-access";
import { prisma } from "@/lib/prisma";

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const parsed = pinSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Введите четыре цифры." }, { status: 400 });
  }

  const site = await prisma.weddingSite.findUnique({
    where: { slug },
    select: { id: true, pinCode: true },
  });

  if (!site?.pinCode || site.pinCode !== parsed.data.pin) {
    return NextResponse.json({ error: "Неверный PIN-код." }, { status: 401 });
  }

  const response = NextResponse.json({ unlocked: true });
  response.cookies.set(
    weddingAccessCookieName(site.id),
    createWeddingAccessToken(site.id, site.pinCode),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: `/wedding/${slug}`,
    },
  );

  return response;
}
