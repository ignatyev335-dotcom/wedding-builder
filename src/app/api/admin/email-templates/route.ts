import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAdminAuditLog } from "@/features/admin/server/audit-log";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const templateSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_:-]{2,80}$/),
  title: z.string().trim().min(2).max(140),
  subject: z.string().trim().min(2).max(180),
  previewText: z.string().trim().max(240).default(""),
  bodyHtml: z.string().trim().min(10).max(60_000),
  bodyText: z.string().trim().max(20_000).default(""),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const parsed = templateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте ключ, тему письма и HTML-шаблон." },
      { status: 400 },
    );
  }

  const template = await prisma.emailTemplate.upsert({
    where: { key: parsed.data.key },
    update: parsed.data,
    create: parsed.data,
  });

  await writeAdminAuditLog({
    actor: admin,
    action: "email_template.upsert",
    targetType: "EmailTemplate",
    targetId: template.id,
    description: `Обновлен почтовый шаблон ${template.key}`,
  });

  return NextResponse.json({ template });
}

export async function DELETE(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Шаблон не указан." }, { status: 400 });
  }

  await prisma.emailTemplate.delete({ where: { id } });
  await writeAdminAuditLog({
    actor: admin,
    action: "email_template.delete",
    targetType: "EmailTemplate",
    targetId: id,
    description: "Удален почтовый шаблон",
  });

  return NextResponse.json({ ok: true });
}
