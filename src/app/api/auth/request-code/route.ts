import { randomInt } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { hashLoginCode } from "@/lib/auth/login-code";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  email: z.string().trim().optional(),
  identifier: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  const identifier = normalizeIdentifier(
    parsed.success ? parsed.data.identifier ?? parsed.data.email ?? "" : "",
  );
  if (!identifier) {
    return NextResponse.json(
      { error: "Укажите корректную почту или номер телефона." },
      { status: 400 },
    );
  }

  const isEmail = identifier.includes("@");
  const code = randomInt(100000, 1000000).toString();
  await prisma.$transaction([
    prisma.loginCode.deleteMany({
      where: isEmail ? { email: identifier } : { phone: identifier },
    }),
    prisma.loginCode.create({
      data: {
        ...(isEmail ? { email: identifier } : { phone: identifier }),
        codeHash: hashLoginCode(identifier, code),
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    }),
  ]);

  // TODO: передать code в почтовый провайдер перед production-запуском.
  return NextResponse.json({
    ok: true,
    ...(process.env.NODE_ENV !== "production" ||
    process.env.AUTH_SHOW_OTP === "true"
      ? { developmentCode: code }
      : {}),
  });
}

function normalizeIdentifier(value: string) {
  if (value.includes("@")) {
    const email = z.string().email().safeParse(value.toLowerCase());
    return email.success ? email.data : "";
  }
  const phone = value.replace(/[^\d+]/g, "");
  return /^\+?\d{10,15}$/.test(phone) ? phone : "";
}
