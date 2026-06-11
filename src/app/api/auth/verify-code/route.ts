import { NextResponse } from "next/server";
import { z } from "zod";

import { hashLoginCode } from "@/lib/auth/login-code";
import {
  getRequestSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  email: z.string().trim().optional(),
  identifier: z.string().trim().optional(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json());
  const identifier = normalizeIdentifier(
    parsed.success ? parsed.data.identifier ?? parsed.data.email ?? "" : "",
  );
  if (!parsed.success || !identifier) {
    return NextResponse.json({ error: "Введите шестизначный код." }, { status: 400 });
  }

  const { code } = parsed.data;
  const isEmail = identifier.includes("@");
  const loginCode = await prisma.loginCode.findFirst({
    where: {
      ...(isEmail ? { email: identifier } : { phone: identifier }),
      codeHash: hashLoginCode(identifier, code),
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
    where: isEmail ? { email: identifier } : { phone: identifier },
    update: { provider: "EMAIL" },
    create: {
      ...(isEmail ? { email: identifier } : { phone: identifier }),
      provider: "EMAIL",
      name: isEmail ? identifier.split("@")[0] : identifier,
    },
  });

  const previousSession = getRequestSession(request);
  await prisma.$transaction(async (transaction) => {
    await transaction.loginCode.deleteMany({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });
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

function normalizeIdentifier(value: string) {
  if (value.includes("@")) {
    const email = z.string().email().safeParse(value.toLowerCase());
    return email.success ? email.data : "";
  }
  const phone = value.replace(/[^\d+]/g, "");
  return /^\+?\d{10,15}$/.test(phone) ? phone : "";
}
