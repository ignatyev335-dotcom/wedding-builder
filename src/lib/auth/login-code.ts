import { createHash } from "node:crypto";

export function hashLoginCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${email}:${code}:${process.env.AUTH_SECRET ?? "local"}`)
    .digest("hex");
}
