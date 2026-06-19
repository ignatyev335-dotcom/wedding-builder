import { createHash, randomBytes } from "node:crypto";

export function createTelegramLoginToken() {
  return randomBytes(24).toString("base64url");
}

export function hashTelegramLoginToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeTelegramBotUsername(value?: string | null) {
  return (value ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^t\.me\//i, "");
}
