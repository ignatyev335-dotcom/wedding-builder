import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const promoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/),
  description: z.string().trim().max(300).default(""),
  discountPercent: z.number().int().min(1).max(95),
  targetPlan: z.enum(["FREE", "PREMIUM", "VIP"]).default("PREMIUM"),
  maxRedemptions: z.number().int().min(1).max(100000).nullable(),
  expiresAt: z.string().trim().nullable(),
});

const patchSchema = z.object({
  id: z.string().cuid(),
  isActive: z.boolean(),
});

async function requireAdmin() {
  return getCurrentAdmin();
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  try {
    const parsed = promoSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Проверьте код, скидку и срок действия промокода." },
        { status: 400 },
      );
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        ...parsed.data,
        code: parsed.data.code.toUpperCase(),
        expiresAt: parsed.data.expiresAt
          ? new Date(`${parsed.data.expiresAt}T23:59:59.000Z`)
          : null,
      },
      select: promoSelect,
    });

    return NextResponse.json({ promoCode }, { status: 201 });
  } catch (error) {
    console.error("Promo code create failed", error);
    return NextResponse.json(
      { error: "Не удалось создать промокод. Возможно, такой код уже есть." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Промокод не найден." }, { status: 400 });
  }

  const promoCode = await prisma.promoCode.update({
    where: { id: parsed.data.id },
    data: { isActive: parsed.data.isActive },
    select: promoSelect,
  });

  return NextResponse.json({ promoCode });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Промокод не указан." }, { status: 400 });
  }

  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

const promoSelect = {
  id: true,
  code: true,
  description: true,
  discountPercent: true,
  targetPlan: true,
  maxRedemptions: true,
  usedCount: true,
  expiresAt: true,
  isActive: true,
  createdAt: true,
} as const;
