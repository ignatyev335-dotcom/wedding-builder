import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const planSchema = z.object({
  plan: z.enum(["FREE", "PREMIUM", "VIP"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён." }, { status: 403 });
  }
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
  return NextResponse.json({ user });
}
