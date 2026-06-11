import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const algorithm = "aes-256-gcm";

function encryptionKey() {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("SETTINGS_ENCRYPTION_KEY or AUTH_SECRET is required.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSetting(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSetting(payload: string) {
  const [ivValue, tagValue, encryptedValue] = payload.split(".");
  if (!ivValue || !tagValue || !encryptedValue) return "";

  const decipher = createDecipheriv(
    algorithm,
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSetting(value: string) {
  if (!value) return "Не задан";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}
