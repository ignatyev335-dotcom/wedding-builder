import { NextResponse } from "next/server";
import { z } from "zod";

import { parseLoginIdentity } from "@/lib/auth/identity";
import { hashLoginCode } from "@/lib/auth/login-code";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/auth/admin-session";
import { getRequestSession, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const verifyCodeSchema = z.object({
  identity: z.string().trim().min(3).max(200),
  code: z.string().trim().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const parsed = verifyCodeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Введите почту или телефон и шестизначный код." },
      { status: 400 },
    );
  }

  const identity = parseLoginIdentity(parsed.data.identity);

  if (!identity) {
    return NextResponse.json(
      { error: "Введите корректную почту или российский номер телефона." },
      { status: 400 },
    );
  }

  const codeHash = hashLoginCode(identity.value, parsed.data.code);
  const loginCode = await prisma.loginCode.findFirst({
    where: {
      codeHash,
      expiresAt: { gt: new Date() },
      ...(identity.kind === "email"
        ? { email: identity.value }
        : { phone: identity.value }),
    },
  });

  if (!loginCode) {
    return NextResponse.json(
      { error: "Код неверный или уже истек. Запросите новый код." },
      { status: 401 },
    );
  }

  const previousSession = getRequestSession(request);
  const user = await prisma.$transaction(async (transaction) => {
    const nextUser = await transaction.user.upsert({
      where:
        identity.kind === "email"
          ? { email: identity.value }
          : { phone: identity.value },
      update: {
        provider: "EMAIL",
        ...(identity.kind === "email" ? { emailVerified: new Date() } : {}),
      },
      create: {
        email: identity.kind === "email" ? identity.value : null,
        emailVerified: identity.kind === "email" ? new Date() : null,
        phone: identity.kind === "phone" ? identity.value : null,
        provider: "EMAIL",
        name: identity.displayValue,
      },
    });

    await transaction.loginCode.deleteMany({
      where:
        identity.kind === "email"
          ? { email: identity.value }
          : { phone: identity.value },
    });

    if (previousSession && previousSession.userId !== nextUser.id) {
      const previousUser = await transaction.user.findUnique({
        where: { id: previousSession.userId },
        select: { provider: true },
      });

      if (previousUser?.provider === "ANONYMOUS") {
        await transaction.weddingSite.updateMany({
          where: { userId: previousSession.userId },
          data: { userId: nextUser.id },
        });
        await transaction.order.updateMany({
          where: { userId: previousSession.userId },
          data: { userId: nextUser.id },
        });
        await transaction.user.delete({ where: { id: previousSession.userId } });
      }
    }

    return nextUser;
  });

  const redirectTo = user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
  const response = NextResponse.json({
    displayValue: identity.displayValue,
    role: user.role,
    redirectTo,
  });

  setSessionCookie(response, user.id);

  if (user.role === "ADMIN") {
    setAdminSessionCookie(response, {
      id: user.id,
      email: user.email ?? identity.displayValue,
    });
  } else {
    clearAdminSessionCookie(response);
  }

  return response;
}
