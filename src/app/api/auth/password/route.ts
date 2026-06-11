import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  getRequestSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
  adminOnly: z.boolean().default(false),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Укажите корректную почту и пароль не короче 8 символов." },
      { status: 400 },
    );
  }

  const { email, password, adminOnly } = parsed.data;
  const adminEmail = (
    process.env.ADMIN_EMAIL ??
    (process.env.NODE_ENV !== "production" ? "admin@vowly.ru" : "")
  )
    .trim()
    .toLowerCase();
  const adminPassword =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV !== "production" ? "VowlyAdmin2026!" : "");
  const isAdminBootstrap =
    Boolean(adminEmail && adminPassword) &&
    email === adminEmail &&
    password === adminPassword;

  let user = await prisma.user.findUnique({ where: { email } });

  if (adminOnly && !isAdminBootstrap && user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Неверный логин или пароль администратора." },
      { status: 401 },
    );
  }

  if (user?.passwordHash) {
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Неверная почта или пароль." },
        { status: 401 },
      );
    }
    if (isAdminBootstrap && user.role !== "ADMIN") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    }
  } else if (user && !isAdminBootstrap) {
    return NextResponse.json(
      {
        error:
          "Для этого аккаунта пароль еще не задан. Войдите по одноразовому коду.",
      },
      { status: 409 },
    );
  } else {
    const passwordHash = await hashPassword(password);
    user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        provider: "EMAIL",
        ...(isAdminBootstrap ? { role: "ADMIN" as const } : {}),
      },
      create: {
        email,
        passwordHash,
        provider: "EMAIL",
        role: isAdminBootstrap ? "ADMIN" : "USER",
        name: email.split("@")[0],
      },
    });
  }

  const previousSession = getRequestSession(request);
  if (previousSession && previousSession.userId !== user.id) {
    const previousUser = await prisma.user.findUnique({
      where: { id: previousSession.userId },
      select: { provider: true },
    });
    if (previousUser?.provider === "ANONYMOUS") {
      await prisma.$transaction([
        prisma.weddingSite.updateMany({
          where: { userId: previousSession.userId },
          data: { userId: user.id },
        }),
        prisma.order.updateMany({
          where: { userId: previousSession.userId },
          data: { userId: user.id },
        }),
        prisma.user.delete({ where: { id: previousSession.userId } }),
      ]);
    }
  }

  const response = NextResponse.json({
    role: user.role,
    redirectTo: user.role === "ADMIN" ? "/admin/dashboard" : "/account",
  });
  setSessionCookie(response, user.id);
  return response;
}
