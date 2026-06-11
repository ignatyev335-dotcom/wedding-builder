import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { setAdminSessionCookie } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@vowly.ru";
const ADMIN_PASSWORD = "VowlyAdmin2026!";

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
});

function matches(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (
    !parsed.success ||
    !matches(parsed.data.email, ADMIN_EMAIL) ||
    !matches(parsed.data.password, ADMIN_PASSWORD)
  ) {
    return NextResponse.json(
      { error: "Неверный логин или пароль администратора." },
      { status: 401 },
    );
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: "ADMIN",
      provider: "EMAIL",
      passwordHash,
      name: "Vowly Admin",
    },
    create: {
      email: ADMIN_EMAIL,
      role: "ADMIN",
      provider: "EMAIL",
      passwordHash,
      name: "Vowly Admin",
    },
    select: { id: true, email: true, role: true },
  });

  const response = NextResponse.json({
    ok: true,
    role: user.role,
    redirectTo: "/admin/dashboard",
  });
  setAdminSessionCookie(response, { id: user.id, email: user.email! });
  return response;
}
