import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type TelegramLoginPayload = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

export function verifyTelegramLogin(
  payload: TelegramLoginPayload,
  botToken: string,
) {
  const authDate = Number(payload.auth_date);
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86_400) {
    return false;
  }

  const dataCheckString = Object.entries(payload)
    .filter(([key, value]) => key !== "hash" && value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret)
    .update(dataCheckString)
    .digest();
  const actual = Buffer.from(payload.hash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
