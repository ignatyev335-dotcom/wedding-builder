import { NextResponse } from "next/server";
import { z } from "zod";

import { hashLoginCode } from "@/lib/auth/login-code";
import {
  getRequestSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Введите шестизначный код." }, { status: 400 });
  }

  const { email, code } = parsed.data;
  const loginCode = await prisma.loginCode.findFirst({
    where: {
      email,
      codeHash: hashLoginCode(email, code),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!loginCode) {
    return NextResponse.json(
      { error: "Код неверный или уже истек." },
      { status: 401 },
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { provider: "EMAIL" },
    create: {
      email,
      provider: "EMAIL",
      name: email.split("@")[0],
    },
  });

  const previousSession = getRequestSession(request);
  await prisma.$transaction(async (transaction) => {
    await transaction.loginCode.deleteMany({ where: { email } });
    if (!previousSession || previousSession.userId === user.id) return;

    const previousUser = await transaction.user.findUnique({
      where: { id: previousSession.userId },
      select: { provider: true },
    });
    if (previousUser?.provider === "ANONYMOUS") {
      await transaction.weddingSite.updateMany({
        where: { userId: previousSession.userId },
        data: { userId: user.id },
      });
      await transaction.order.updateMany({
        where: { userId: previousSession.userId },
        data: { userId: user.id },
      });
      await transaction.user.delete({ where: { id: previousSession.userId } });
    }
  });

  const response = NextResponse.json({
    role: user.role,
    redirectTo: user.role === "ADMIN" ? "/admin/dashboard" : "/account",
  });
  setSessionCookie(response, user.id);
  return response;
}
