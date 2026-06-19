import { NextResponse } from "next/server";
import { z } from "zod";

import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/auth/admin-session";
import { parseLoginIdentity } from "@/lib/auth/identity";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getRequestSession, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const passwordSchema = z.object({
  identity: z.string().trim().min(3).max(200),
  password: z.string().min(8).max(200),
  mode: z.enum(["login", "register"]).default("login"),
});

export async function POST(request: Request) {
  const parsed = passwordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Введите почту или телефон и пароль не короче 8 символов." },
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

  const { password, mode } = parsed.data;
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
    identity.kind === "email" &&
    Boolean(adminEmail && adminPassword) &&
    identity.value === adminEmail &&
    password === adminPassword;

  let user = await prisma.user.findUnique({
    where:
      identity.kind === "email"
        ? { email: identity.value }
        : { phone: identity.value },
  });

  if (mode === "login") {
    if (!user?.passwordHash && !isAdminBootstrap) {
      return NextResponse.json(
        {
          error:
            "Аккаунт не найден или пароль еще не задан. Перейдите во вкладку регистрации.",
        },
        { status: 404 },
      );
    }

    if (user?.passwordHash) {
      const validPassword = await verifyPassword(password, user.passwordHash);
      if (!validPassword) {
        return NextResponse.json(
          { error: "Проверьте логин или пароль." },
          { status: 401 },
        );
      }
    }
  }

  if (mode === "register") {
    if (user?.passwordHash) {
      return NextResponse.json(
        { error: "Такой аккаунт уже есть. Войдите через вкладку входа." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    user = await prisma.user.upsert({
      where:
        identity.kind === "email"
          ? { email: identity.value }
          : { phone: identity.value },
      update: {
        passwordHash,
        provider: "EMAIL",
        ...(identity.kind === "email" ? { emailVerified: new Date() } : {}),
        ...(isAdminBootstrap ? { role: "ADMIN" as const } : {}),
      },
      create: {
        email: identity.kind === "email" ? identity.value : null,
        emailVerified: identity.kind === "email" ? new Date() : null,
        phone: identity.kind === "phone" ? identity.value : null,
        passwordHash,
        provider: "EMAIL",
        role: isAdminBootstrap ? "ADMIN" : "USER",
        name: identity.displayValue,
      },
    });
  }

  if (!user && isAdminBootstrap) {
    user = await prisma.user.create({
      data: {
        email: identity.value,
        passwordHash: await hashPassword(password),
        provider: "EMAIL",
        role: "ADMIN",
        name: "Администратор Vowly",
      },
    });
  }

  if (!user) {
    return NextResponse.json(
      { error: "Не удалось войти. Попробуйте еще раз." },
      { status: 500 },
    );
  }

  if (isAdminBootstrap && user.role !== "ADMIN") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
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
      ]);
    }
  }

  const isAdmin = user.role === "ADMIN" || isAdminBootstrap;
  const redirectTo = isAdmin ? "/admin/dashboard" : "/dashboard";
  const response = NextResponse.json({
    role: isAdmin ? "ADMIN" : user.role,
    redirectTo,
  });

  setSessionCookie(response, user.id);

  if (isAdmin) {
    setAdminSessionCookie(response, {
      id: user.id,
      email: user.email ?? adminEmail,
    });
  } else {
    clearAdminSessionCookie(response);
  }

  return response;
}
