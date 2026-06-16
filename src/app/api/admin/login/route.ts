import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { setAdminSessionCookie } from "@/lib/auth/admin-session";

const fallbackAdminEmail = "admin@vowly.ru";
const fallbackAdminPassword = "VowlyAdmin2026!";

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
});

function secureEquals(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  const adminEmail = (process.env.ADMIN_EMAIL ?? fallbackAdminEmail)
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? fallbackAdminPassword;

  if (
    !parsed.success ||
    !secureEquals(parsed.data.email, adminEmail) ||
    !secureEquals(parsed.data.password, adminPassword)
  ) {
    return NextResponse.json(
      { error: "Неверный логин или пароль администратора." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    role: "ADMIN",
    redirectTo: "/admin/dashboard",
  });

  setAdminSessionCookie(response, {
    id: "vowly-admin",
    email: adminEmail,
  });

  return response;
}
