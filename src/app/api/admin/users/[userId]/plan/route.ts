import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAdminAuditLog } from "@/features/admin/server/audit-log";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const planSchema = z.object({
  plan: z.enum(["FREE", "PREMIUM", "VIP"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  try {
    const parsed = planSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Неизвестный тариф." }, { status: 400 });
    }

    const { userId } = await params;
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { subscriptionPlan: parsed.data.plan },
        select: { id: true, subscriptionPlan: true },
      }),
      prisma.weddingSite.updateMany({
        where: { userId },
        data: { isPremium: parsed.data.plan !== "FREE" },
      }),
    ]);

    await writeAdminAuditLog({
      actor: admin,
      action: "user.plan.update",
      targetType: "User",
      targetId: userId,
      description: `Тариф пользователя изменен на ${parsed.data.plan}`,
      metadata: { plan: parsed.data.plan },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User plan update failed", error);
    return NextResponse.json(
      { error: "Не удалось обновить тариф пользователя." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  try {
    const { userId } = await params;
    await prisma.$transaction([
      prisma.order.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    await writeAdminAuditLog({
      actor: admin,
      action: "user.delete",
      targetType: "User",
      targetId: userId,
      description: "Удален пользователь",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("User delete failed", error);
    return NextResponse.json(
      { error: "Не удалось удалить пользователя." },
      { status: 500 },
    );
  }
}
