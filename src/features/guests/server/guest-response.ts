import type { GuestResponse, GuestStatus } from "@/entities/wedding/model";

type GuestRecord = {
  id: string;
  name: string;
  phone: string;
  status: GuestStatus;
  magicToken: string | null;
  dietaryRestrictions: string | null;
  foodPreference: string | null;
  allergies: string | null;
  alcoholPreferences: string;
  needsTransport: boolean;
  respondedAt: Date | null;
  createdAt: Date;
};

export function toGuestResponse(
  guest: GuestRecord,
  slug: string,
  origin: string,
): GuestResponse {
  let drinks = "";

  try {
    drinks = (JSON.parse(guest.alcoholPreferences) as string[]).join(", ");
  } catch {
    drinks = guest.alcoholPreferences;
  }

  return {
    id: guest.id,
    name: guest.name,
    phone: guest.phone,
    status: guest.status,
    magicToken: guest.magicToken,
    invitationUrl: guest.magicToken
      ? `${origin}/wedding/${encodeURIComponent(slug)}?guest=${encodeURIComponent(guest.magicToken)}`
      : null,
    dietaryRestrictions: guest.dietaryRestrictions ?? "",
    foodPreference: guest.foodPreference ?? "",
    allergies: guest.allergies ?? "",
    drinks,
    needsTransport: guest.needsTransport,
    respondedAt: (guest.respondedAt ?? guest.createdAt).toISOString(),
  };
}

export function getRequestOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin
  );
}
