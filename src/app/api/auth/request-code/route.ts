import { NextResponse } from "next/server";
import { z } from "zod";

import { sendLoginCodeMessage } from "@/features/notifications/server/send-login-code";
import { generateLoginCode, parseLoginIdentity } from "@/lib/auth/identity";
import { hashLoginCode } from "@/lib/auth/login-code";
import { prisma } from "@/lib/prisma";

const requestCodeSchema = z.object({
  identity: z.string().trim().min(3).max(200),
});

export async function POST(request: Request) {
  const parsed = requestCodeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Введите почту или номер телефона." },
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

  const code = generateLoginCode();
  const codeHash = hashLoginCode(identity.value, code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.loginCode.deleteMany({
    where:
      identity.kind === "email"
        ? { email: identity.value }
        : { phone: identity.value },
  });

  await prisma.loginCode.create({
    data: {
      email: identity.kind === "email" ? identity.value : null,
      phone: identity.kind === "phone" ? identity.value : null,
      codeHash,
      expiresAt,
    },
  });

  await sendLoginCodeMessage({
    email: identity.kind === "email" ? identity.value : undefined,
    phone: identity.kind === "phone" ? identity.value : undefined,
    code,
  });

  return NextResponse.json({
    channel: identity.kind,
    displayValue: identity.displayValue,
    devCode: process.env.NODE_ENV === "production" ? undefined : code,
  });
}
