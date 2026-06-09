import { randomInt } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { hashLoginCode } from "@/lib/auth/login-code";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Укажите корректную почту." }, { status: 400 });
  }

  const email = parsed.data.email;
  const code = randomInt(100000, 1000000).toString();
  await prisma.$transaction([
    prisma.loginCode.deleteMany({ where: { email } }),
    prisma.loginCode.create({
      data: {
        email,
        codeHash: hashLoginCode(email, code),
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
