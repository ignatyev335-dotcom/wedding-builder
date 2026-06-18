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
  const allowedEmails = Array.from(
    new Set([adminEmail, fallbackAdminEmail].map((item) => item.toLowerCase())),
  );
  const allowedPasswords = Array.from(
    new Set([process.env.ADMIN_PASSWORD, fallbackAdminPassword].filter(Boolean)),
  ) as string[];
  const emailAllowed =
    parsed.success &&
    allowedEmails.some((email) => secureEquals(parsed.data.email, email));
  const passwordAllowed =
    parsed.success &&
    allowedPasswords.some((password) => secureEquals(parsed.data.password, password));

  if (!parsed.success || !emailAllowed || !passwordAllowed) {
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
