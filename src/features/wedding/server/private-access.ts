import { createHash, timingSafeEqual } from "node:crypto";

const accessSecret =
  process.env.WEDDING_ACCESS_SECRET ?? "vowly-local-private-access";

export function weddingAccessCookieName(siteId: string) {
  return `vowly_access_${siteId}`;
}

export function createWeddingAccessToken(siteId: string, pinCode: string) {
  return createHash("sha256")
    .update(`${siteId}:${pinCode}:${accessSecret}`)
    .digest("hex");
}

export function hasValidWeddingAccess(
  siteId: string,
  pinCode: string,
  value: string | undefined,
) {
  if (!value) return false;

  const expected = createWeddingAccessToken(siteId, pinCode);
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
