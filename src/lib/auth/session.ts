import { createHmac, timingSafeEqual } from "node:crypto";

import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const authCookieName = "vowly-session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function getAuthSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV !== "production") {
    return "vowly-local-development-secret-change-in-production";
  }
  throw new Error("AUTH_SECRET is required in production.");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readSessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    return payload.expiresAt > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: Response, userId: string) {
  const token = createSessionToken(userId);
  response.headers.append(
    "Set-Cookie",
    `${authCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}

export function clearSessionCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${authCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}

export function getRequestSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${authCookieName}=`))
    ?.slice(authCookieName.length + 1);
  return readSessionToken(token);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(authCookieName)?.value);
  const authJsSession = session ? null : await auth();
  const userId = session?.userId ?? authJsSession?.user?.id;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      provider: true,
    },
  });
}

export async function isSiteOwnerOrAdmin(
  user: { id: string; role: UserRole },
  siteId: string,
) {
  if (user.role === "ADMIN") return true;
  return Boolean(
    await prisma.weddingSite.findFirst({
      where: { id: siteId, userId: user.id },
      select: { id: true },
    }),
  );
}
