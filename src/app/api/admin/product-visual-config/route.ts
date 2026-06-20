import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAdminAuditLog } from "@/features/admin/server/audit-log";
import {
  defaultProductVisualConfig,
  parseProductVisualConfig,
  productVisualSettingKey,
} from "@/features/platform-visual/config";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const sectionSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
  order: z.number().int().min(1).max(99),
  size: z.enum(["compact", "normal", "large"]),
  align: z.enum(["left", "center", "right"]),
  textAlign: z.enum(["left", "center", "right"]),
  density: z.enum(["tight", "normal", "airy"]),
  buttonSize: z.enum(["small", "normal", "large"]),
  blockWidth: z.enum(["narrow", "normal", "wide", "full"]),
  textScale: z.enum(["small", "normal", "large", "hero"]),
  offsetX: z.number().int().min(-240).max(240),
  offsetY: z.number().int().min(-240).max(240),
});

const fieldStyleSchema = z.object({
  color: z.string().trim().max(80),
  fontSize: z.number().int().min(60).max(220),
  fontWeight: z.enum(["regular", "medium", "bold"]),
  textAlign: z.enum(["left", "center", "right"]),
  letterSpacing: z.number().int().min(-8).max(32),
  offsetX: z.number().int().min(-240).max(240),
  offsetY: z.number().int().min(-240).max(240),
});

const productVisualSchema = z.object({
  appearance: z.object({
    backgroundColor: z.string().trim().min(4).max(80),
    surfaceColor: z.string().trim().min(4).max(80),
    textColor: z.string().trim().min(4).max(80),
    accentColor: z.string().trim().min(4).max(80),
    radius: z.enum(["soft", "rounded", "pill"]),
    fontScale: z.enum(["compact", "normal", "large"]),
  }),
  landing: z.object({
    badge: z.string().trim().max(120),
    title: z.string().trim().min(1).max(180),
    subtitle: z.string().trim().min(1).max(500),
    primaryCta: z.string().trim().min(1).max(80),
    secondaryCta: z.string().trim().min(1).max(80),
    mockupCouple: z.string().trim().min(1).max(120),
    mockupDate: z.string().trim().min(1).max(80),
    sections: z.array(sectionSchema),
  }),
  quiz: z.object({
    badge: z.string().trim().max(120),
    stepOneTitle: z.string().trim().min(1).max(160),
    stepOneDescription: z.string().trim().min(1).max(500),
    styleTitle: z.string().trim().min(1).max(160),
    styleDescription: z.string().trim().min(1).max(500),
    featuresTitle: z.string().trim().min(1).max(160),
    featuresDescription: z.string().trim().min(1).max(500),
    finalTitle: z.string().trim().min(1).max(160),
    finalDescription: z.string().trim().min(1).max(500),
    sections: z.array(sectionSchema),
  }),
  constructor: z.object({
    assistantTitle: z.string().trim().min(1).max(120),
    assistantDescription: z.string().trim().min(1).max(300),
    publishButtonText: z.string().trim().min(1).max(80),
    previewButtonText: z.string().trim().min(1).max(80),
    sections: z.array(sectionSchema),
  }),
  fieldStyles: z.record(z.string(), fieldStyleSchema),
});

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: productVisualSettingKey },
    select: { value: true },
  });

  return NextResponse.json({
    config: parseProductVisualConfig(setting?.value),
  });
}

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const parsed = productVisualSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте тексты, порядок блоков и размеры секций." },
      { status: 400 },
    );
  }

  const normalized = parseProductVisualConfig(JSON.stringify(parsed.data));

  const setting = await prisma.systemSetting.upsert({
    where: { key: productVisualSettingKey },
    update: {
      label: "Визуальные настройки продукта",
      category: "PRODUCT",
      value: JSON.stringify(normalized),
      isSecret: false,
      updatedById: admin.id,
    },
    create: {
      key: productVisualSettingKey,
      label: "Визуальные настройки продукта",
      category: "PRODUCT",
      value: JSON.stringify(normalized),
      isSecret: false,
      updatedById: admin.id,
    },
    select: { id: true },
  });

  await writeAdminAuditLog({
    actor: admin,
    action: "product_visual.update",
    targetType: "SystemSetting",
    targetId: setting.id,
    description: "Обновлены визуальные настройки главной, квиза и конструктора",
    metadata: { key: productVisualSettingKey },
  });

  return NextResponse.json({
    ok: true,
    config: normalized,
    fallback: defaultProductVisualConfig,
  });
}
