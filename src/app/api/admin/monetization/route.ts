import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const featureSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[A-Z0-9_]+$/),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  plan: z.enum(["FREE", "PREMIUM", "VIP"]),
  isActive: z.boolean().default(true),
});

const updateSchema = z.object({
  id: z.string().cuid(),
  plan: z.enum(["FREE", "PREMIUM", "VIP"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return null;
  }
  return admin;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const parsed = featureSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте код, название и тариф функции." },
      { status: 400 },
    );
  }

  const lastFeature = await prisma.monetizationFeature.findFirst({
    where: { plan: parsed.data.plan },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const feature = await prisma.monetizationFeature.create({
    data: {
      ...parsed.data,
      sortOrder: (lastFeature?.sortOrder ?? -1) + 1,
    },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      plan: true,
      sortOrder: true,
      isActive: true,
    },
  });

  return NextResponse.json({ feature }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Не удалось обновить функцию тарифа." },
      { status: 400 },
    );
  }

  const { id, ...data } = parsed.data;
  const feature = await prisma.monetizationFeature.update({
    where: { id },
    data,
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      plan: true,
      sortOrder: true,
      isActive: true,
    },
  });

  return NextResponse.json({ feature });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Функция не указана." }, { status: 400 });
  }

  await prisma.monetizationFeature.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
