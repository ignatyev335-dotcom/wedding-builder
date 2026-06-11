import { createHash } from "node:crypto";

export function hashLoginCode(identifier: string, code: string) {
  return createHash("sha256")
    .update(`${identifier}:${code}:${process.env.AUTH_SECRET ?? "local"}`)
    .digest("hex");
}
