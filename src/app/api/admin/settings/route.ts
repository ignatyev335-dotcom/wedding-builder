import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { encryptSetting } from "@/lib/system-settings";

const settingSchema = z.object({
  key: z.string().trim().regex(/^[A-Z][A-Z0-9_]{2,80}$/),
  label: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(40),
  value: z.string().trim().min(1).max(10_000),
  isSecret: z.boolean().default(true),
});

export async function POST(request: Request) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const parsed = settingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте ключ, название и значение настройки." },
      { status: 400 },
    );
  }

  const { key, label, category, value, isSecret } = parsed.data;
  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: {
      label,
      category,
      value: isSecret ? encryptSetting(value) : value,
      isSecret,
      updatedById: user.id,
    },
    create: {
      key,
      label,
      category,
      value: isSecret ? encryptSetting(value) : value,
      isSecret,
      updatedById: user.id,
    },
    select: { id: true, key: true, label: true, category: true, updatedAt: true },
  });

  return NextResponse.json({ setting });
}

export async function DELETE(request: Request) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const key = new URL(request.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Ключ не указан." }, { status: 400 });
  }

  await prisma.systemSetting.deleteMany({ where: { key } });
  return NextResponse.json({ ok: true });
}
