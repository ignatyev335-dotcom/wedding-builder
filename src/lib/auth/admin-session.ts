import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

export const adminCookieName = "vowly-admin-session";
const adminSessionLifetimeSeconds = 60 * 60 * 8;

type AdminSessionPayload = {
  userId: string;
  email: string;
  expiresAt: number;
};

function getAdminSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    "vowly-admin-local-secret-change-in-production"
  );
}

function sign(value: string) {
  return createHmac("sha256", getAdminSecret())
    .update(`admin:${value}`)
    .digest("base64url");
}

function createAdminToken(userId: string, email: string) {
  const payload: AdminSessionPayload = {
    userId,
    email,
    expiresAt: Math.floor(Date.now() / 1000) + adminSessionLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readAdminToken(
  token?: string | null,
): AdminSessionPayload | null {
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
    ) as AdminSessionPayload;
    return payload.expiresAt > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(
  response: Response,
  user: { id: string; email: string },
) {
  const token = createAdminToken(user.id, user.email);
  response.headers.append(
    "Set-Cookie",
    `${adminCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${adminSessionLifetimeSeconds}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}

export function clearAdminSessionCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${adminCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const session = readAdminToken(cookieStore.get(adminCookieName)?.value);
  if (!session) return null;

  return {
    id: session.userId,
    email: session.email,
    name: "Vowly Admin",
    role: "ADMIN" as const,
  };
}
